import crypto from "node:crypto";
import type http from "node:http";
import type { Duplex } from "node:stream";
import Anthropic from "@anthropic-ai/sdk";
import type { ClientMessage, ServerMessage } from "@mockstorm/shared";
import { type WebSocket, WebSocketServer } from "ws";
import type { ChatStore } from "./chat-store";
import { SYSTEM_PROMPT } from "./system-prompt";
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
): void {
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

        const updateMsg: ServerMessage = { type: "workspaceUpdated", ...fields };
        hub.broadcast(slug, updateMsg, ws);
      } else if (msg.type === "chatSend") {
        console.log(`[ws] chatSend – slug=${slug} contentLength=${msg.content.length}`);
        void handleChatSend(slug, msg.content, hub, chatStore, activeStreams);
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
}

async function handleChatSend(
  slug: string,
  content: string,
  hub: WorkspaceHub,
  chatStore: ChatStore,
  activeStreams: Map<string, AbortController>,
): Promise<void> {
  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content,
    createdAt: new Date().toISOString(),
  };
  chatStore.addMessage(slug, userMessage);
  hub.broadcast(slug, { type: "chatUserMessage", message: userMessage });

  const messageId = crypto.randomUUID();
  const controller = new AbortController();
  activeStreams.set(slug, controller);

  console.log(`[ws] chatStreamStart – slug=${slug} messageId=${messageId}`);
  hub.broadcast(slug, { type: "chatStreamStart", messageId });

  let fullContent = "";

  try {
    const history = chatStore.getMessages(slug);
    const apiMessages = history.map((m, i) => ({
      role: m.role,
      content:
        i === history.length - 2
          ? [
              {
                type: "text" as const,
                text: m.content,
                cache_control: { type: "ephemeral" as const },
              },
            ]
          : m.content,
    }));

    const stream = anthropic.messages.stream(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: apiMessages,
      },
      { signal: controller.signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullContent += event.delta.text;
        hub.broadcast(slug, {
          type: "chatStreamChunk",
          messageId,
          delta: event.delta.text,
        });
      }
    }

    console.log(
      `[ws] chatStreamEnd – slug=${slug} messageId=${messageId} length=${fullContent.length} aborted=false`,
    );
    hub.broadcast(slug, { type: "chatStreamEnd", messageId, content: fullContent });

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
      hub.broadcast(slug, { type: "chatStreamEnd", messageId, content: fullContent });

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
