import type { ChatMessage, ServerMessage, ToolCallInfo } from "@mockstorm/shared";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useChatWs(wsRef: RefObject<WebSocket | null>): {
  messages: ChatMessage[];
  toolCalls: Map<string, ToolCallInfo[]>;
  sendMessage: (
    content: string,
    context?: { conceptId?: string; screenId?: string; imageBase64?: string },
  ) => void;
  stop: () => void;
  isStreaming: boolean;
  error: string | null;
} {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<Map<string, ToolCallInfo[]>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamContentRef = useRef("");

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    function handleMessage(event: MessageEvent<string>) {
      const msg = JSON.parse(event.data) as ServerMessage;

      switch (msg.type) {
        case "chatHistory":
          setMessages(msg.messages);
          break;
        case "chatUserMessage":
          setMessages((prev) => [...prev, msg.message]);
          break;
        case "chatStreamStart":
          streamContentRef.current = "";
          setIsStreaming(true);
          setMessages((prev) => [
            ...prev,
            {
              id: msg.messageId,
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ]);
          break;
        case "chatStreamChunk":
          streamContentRef.current += msg.delta;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.id === msg.messageId) {
              updated[updated.length - 1] = {
                ...last,
                content: streamContentRef.current,
              };
            }
            return updated;
          });
          break;
        case "chatStreamEnd":
          setIsStreaming(false);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.id === msg.messageId) {
              updated[updated.length - 1] = { ...last, content: msg.content };
            }
            return updated;
          });
          break;
        case "chatError":
          setIsStreaming(false);
          setError(msg.error);
          break;
        case "chatToolCall":
          setToolCalls((prev) => {
            const next = new Map(prev);
            const existing = next.get(msg.messageId) ?? [];
            next.set(msg.messageId, [
              ...existing,
              {
                messageId: msg.messageId,
                toolName: msg.toolName,
                args: msg.args,
                result: msg.result,
                ...(msg.conceptId ? { conceptId: msg.conceptId } : {}),
                ...(msg.screenId ? { screenId: msg.screenId } : {}),
              },
            ]);
            return next;
          });
          break;
      }
    }

    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [wsRef]);

  const sendMessage = useCallback(
    (
      content: string,
      context?: { conceptId?: string; screenId?: string; imageBase64?: string },
    ) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        setError(null);
        ws.send(
          JSON.stringify({
            type: "chatSend",
            content,
            ...(context?.conceptId ? { conceptId: context.conceptId } : {}),
            ...(context?.screenId ? { screenId: context.screenId } : {}),
            ...(context?.imageBase64 ? { imageBase64: context.imageBase64 } : {}),
          }),
        );
      }
    },
    [wsRef],
  );

  const stop = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chatStop" }));
    }
  }, [wsRef]);

  return { messages, toolCalls, sendMessage, stop, isStreaming, error };
}
