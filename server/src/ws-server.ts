import crypto from "node:crypto";
import type http from "node:http";
import type { Duplex } from "node:stream";
import Anthropic from "@anthropic-ai/sdk";
import type { ClientMessage, ServerMessage } from "@mockstorm/shared";
import { type WebSocket, WebSocketServer } from "ws";
import type { ChatStore } from "./chat-store";
import type { ConceptStore } from "./concept-store";
import type { Renderer } from "./renderer";
import { SYSTEM_PROMPT } from "./system-prompt";
import { type RenderJob, handleToolCall } from "./tool-handler";
import { TOOLS } from "./tools";
import { WorkspaceHub } from "./workspace-hub";
import type { WorkspaceStore } from "./workspace-store";

interface UpgradeEmitter {
  on(
    event: "upgrade",
    listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): void;
}

const anthropic = new Anthropic();

export function attachWsServer(
  httpServer: UpgradeEmitter,
  store: WorkspaceStore,
  chatStore: ChatStore,
  conceptStore: ConceptStore,
  renderer: Renderer,
  dataDir: string,
): WorkspaceHub {
  const wss = new WebSocketServer({ noServer: true });
  const hub = new WorkspaceHub();
  const activeStreams = new Map<string, AbortController>();

  httpServer.on("upgrade", (req, socket, head) => {
    const url = req.url ?? "";
    const match = url.match(/^\/ws\/([^/?]+)/);
    if (!match) {
      socket.destroy();
      return;
    }
    const slug = match[1] ?? "";
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, slug);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, slug: string) => {
    const workspace = store.get(slug);
    if (!workspace) {
      ws.close(4004, "Workspace not found");
      return;
    }

    console.log(`[ws] connection – slug=${slug}`);
    hub.subscribe(slug, ws);

    const initMsg: ServerMessage = { type: "init", workspace };
    ws.send(JSON.stringify(initMsg));

    const historyMsg: ServerMessage = {
      type: "chatHistory",
      messages: chatStore.getMessages(slug),
    };
    ws.send(JSON.stringify(historyMsg));

    const conceptsMsg: ServerMessage = {
      type: "conceptsInit",
      concepts: conceptStore.getConcepts(slug),
    };
    ws.send(JSON.stringify(conceptsMsg));

    ws.on("message", (data) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(data.toString()) as ClientMessage;
      } catch {
        return;
      }

      if (msg.type === "workspaceUpdate") {
        const fields: Partial<{ title: string; description: string }> = {};
        if (msg.title !== undefined) fields.title = msg.title;
        if (msg.description !== undefined) fields.description = msg.description;

        console.log(`[ws] workspaceUpdate – slug=${slug} fields=${Object.keys(fields).join(",")}`);
        store.update(slug, fields);

        const updateMsg: ServerMessage = {
          type: "workspaceUpdated",
          ...fields,
        };
        hub.broadcast(slug, updateMsg, ws);
      } else if (msg.type === "chatSend") {
        console.log(`[ws] chatSend – slug=${slug} contentLength=${msg.content.length}`);
        void handleChatSend(
          slug,
          msg.content,
          hub,
          chatStore,
          conceptStore,
          renderer,
          activeStreams,
          dataDir,
          msg.conceptId,
          msg.screenId,
          msg.imageBase64,
        );
      } else if (msg.type === "chatStop") {
        console.log(`[ws] chatStop – slug=${slug}`);
        const controller = activeStreams.get(slug);
        if (controller) {
          controller.abort();
        }
      }
    });

    ws.on("close", () => {
      console.log(`[ws] closed – slug=${slug}`);
      hub.unsubscribe(slug, ws);
    });
  });

  return hub;
}

async function handleChatSend(
  slug: string,
  content: string,
  hub: WorkspaceHub,
  chatStore: ChatStore,
  conceptStore: ConceptStore,
  renderer: Renderer,
  activeStreams: Map<string, AbortController>,
  dataDir: string,
  conceptId?: string,
  screenId?: string,
  imageBase64?: string,
): Promise<void> {
  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content,
    createdAt: new Date().toISOString(),
    ...(conceptId ? { conceptId } : {}),
    ...(screenId ? { screenId } : {}),
    ...(imageBase64 ? { imageBase64 } : {}),
  };
  chatStore.addMessage(slug, userMessage);
  hub.broadcast(slug, { type: "chatUserMessage", message: userMessage });

  // Build context-aware API message content
  const apiContent: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } }
  > = [];

  if (conceptId) {
    const concepts = conceptStore.getConcepts(slug);
    const concept = concepts.find((c) => c.id === conceptId);
    if (concept) {
      const screen = screenId ? concept.screens.find((s) => s.id === screenId) : undefined;
      let contextText = `[User is viewing concept "${concept.title}" (id: ${concept.id})`;
      if (screen) {
        contextText += `, screen "${screen.title}" (id: ${screen.id})`;
      }
      contextText += "]";
      apiContent.push({ type: "text", text: contextText });
    }
  }

  if (imageBase64) {
    apiContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: imageBase64 },
    });
  }

  apiContent.push({ type: "text", text: content });

  // Add user message to raw history
  chatStore.addRawMessages(slug, [{ role: "user", content: apiContent }]);

  const messageId = crypto.randomUUID();
  const controller = new AbortController();
  activeStreams.set(slug, controller);

  console.log(`[ws] chatStreamStart – slug=${slug} messageId=${messageId}`);
  hub.broadcast(slug, { type: "chatStreamStart", messageId });

  let fullContent = "";

  try {
    await runToolLoop(
      slug,
      messageId,
      hub,
      chatStore,
      conceptStore,
      renderer,
      controller,
      dataDir,
      (delta) => {
        fullContent += delta;
        hub.broadcast(slug, {
          type: "chatStreamChunk",
          messageId,
          delta,
        });
      },
    );

    console.log(
      `[ws] chatStreamEnd – slug=${slug} messageId=${messageId} length=${fullContent.length} aborted=false`,
    );
    hub.broadcast(slug, {
      type: "chatStreamEnd",
      messageId,
      content: fullContent,
    });

    const assistantMessage = {
      id: messageId,
      role: "assistant" as const,
      content: fullContent,
      createdAt: new Date().toISOString(),
    };
    chatStore.addMessage(slug, assistantMessage);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(
        `[ws] chatStreamEnd – slug=${slug} messageId=${messageId} length=${fullContent.length} aborted=true`,
      );
      hub.broadcast(slug, {
        type: "chatStreamEnd",
        messageId,
        content: fullContent,
      });

      if (fullContent) {
        const assistantMessage = {
          id: messageId,
          role: "assistant" as const,
          content: fullContent,
          createdAt: new Date().toISOString(),
        };
        chatStore.addMessage(slug, assistantMessage);
      }
    } else {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ws] chatError – slug=${slug} error=${errorMsg}`);
      hub.broadcast(slug, { type: "chatError", error: errorMsg });
    }
  } finally {
    activeStreams.delete(slug);
  }
}

async function runToolLoop(
  slug: string,
  messageId: string,
  hub: WorkspaceHub,
  chatStore: ChatStore,
  conceptStore: ConceptStore,
  renderer: Renderer,
  controller: AbortController,
  dataDir: string,
  onTextDelta: (delta: string) => void,
): Promise<void> {
  const rawHistory = chatStore.getRawHistory(slug);

  // Apply cache_control to second-to-last message for prompt caching
  const apiMessages = rawHistory.map((m, i) => {
    if (i === rawHistory.length - 2 && typeof m.content === "string") {
      return {
        ...m,
        content: [
          {
            type: "text" as const,
            text: m.content,
            cache_control: { type: "ephemeral" as const },
          },
        ],
      };
    }
    return m;
  });

  let loopMessages: Anthropic.Messages.MessageParam[] = apiMessages;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const stream = anthropic.messages.stream(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: loopMessages,
        tools: TOOLS,
      },
      { signal: controller.signal },
    );

    // Collect the full response to inspect tool_use blocks
    const textParts: string[] = [];
    const toolUseBlocks: Array<{
      id: string;
      name: string;
      input: Record<string, unknown>;
    }> = [];
    let currentToolInput = "";
    let currentToolId = "";
    let currentToolName = "";

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        textParts.push(event.delta.text);
        onTextDelta(event.delta.text);
      } else if (event.type === "content_block_delta" && event.delta.type === "input_json_delta") {
        currentToolInput += event.delta.partial_json;
      } else if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          currentToolId = event.content_block.id;
          currentToolName = event.content_block.name;
          currentToolInput = "";
        }
      } else if (event.type === "content_block_stop") {
        if (currentToolId && currentToolName) {
          let parsedInput: Record<string, unknown> = {};
          try {
            parsedInput = JSON.parse(currentToolInput || "{}") as Record<string, unknown>;
          } catch {
            // empty input
          }
          toolUseBlocks.push({
            id: currentToolId,
            name: currentToolName,
            input: parsedInput,
          });
          currentToolId = "";
          currentToolName = "";
          currentToolInput = "";
        }
      }
    }

    // Build the assistant message content blocks for raw history
    const assistantContentBlocks: Anthropic.Messages.ContentBlockParam[] = [];
    if (textParts.join("")) {
      assistantContentBlocks.push({
        type: "text",
        text: textParts.join(""),
      });
    }
    for (const tool of toolUseBlocks) {
      assistantContentBlocks.push({
        type: "tool_use",
        id: tool.id,
        name: tool.name,
        input: tool.input,
      });
    }

    if (toolUseBlocks.length === 0) {
      // No tool calls — we're done
      chatStore.addRawMessages(slug, [{ role: "assistant", content: assistantContentBlocks }]);
      break;
    }

    // Execute tool calls and collect results
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const tool of toolUseBlocks) {
      const enqueue = (job: RenderJob) => renderer.enqueue(job);
      const result = await handleToolCall(
        tool.name,
        tool.input,
        slug,
        conceptStore,
        hub,
        enqueue,
        dataDir,
      );

      // Broadcast tool call to chat UI
      const toolCallMsg: ServerMessage = {
        type: "chatToolCall",
        messageId,
        toolName: tool.name,
        args: tool.input,
        result: result.description,
        ...(result.conceptId ? { conceptId: result.conceptId } : {}),
        ...(result.screenId ? { screenId: result.screenId } : {}),
      };
      hub.broadcast(slug, toolCallMsg);

      toolResults.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: result.content ?? "",
      });
    }

    // Save assistant + tool_result messages to raw history
    chatStore.addRawMessages(slug, [
      { role: "assistant", content: assistantContentBlocks },
      { role: "user", content: toolResults },
    ]);

    // Continue the loop with updated messages
    loopMessages = chatStore.getRawHistory(slug);
  }
}
