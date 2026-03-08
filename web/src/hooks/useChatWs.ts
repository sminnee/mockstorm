import type { ChatMessage, ServerMessage } from "@mockstorm/shared";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useChatWs(wsRef: RefObject<WebSocket | null>): {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  stop: () => void;
  isStreaming: boolean;
  error: string | null;
} {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      }
    }

    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [wsRef]);

  const sendMessage = useCallback(
    (content: string) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        setError(null);
        ws.send(JSON.stringify({ type: "chatSend", content }));
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

  return { messages, sendMessage, stop, isStreaming, error };
}
