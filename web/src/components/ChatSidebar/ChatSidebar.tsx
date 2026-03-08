import { Alert, Stack, Text } from "@mantine/core";
import { type RefObject, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useChatWs } from "../../hooks/useChatWs";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

interface ChatSidebarProps {
  wsRef: RefObject<WebSocket | null>;
}

export function ChatSidebar({ wsRef }: ChatSidebarProps) {
  const { messages, toolCalls, sendMessage, stop, isStreaming, error } = useChatWs(wsRef);
  const { cid, sid } = useParams<{ cid?: string; sid?: string }>();

  const sendWithContext = useCallback(
    (content: string) => {
      sendMessage(content, {
        ...(cid ? { conceptId: cid } : {}),
        ...(sid ? { screenId: sid } : {}),
      });
    },
    [sendMessage, cid, sid],
  );

  return (
    <Stack h="100%" gap={0}>
      <Text
        fw={600}
        size="sm"
        px="sm"
        py="xs"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
      >
        Chat
      </Text>
      <ChatMessageList messages={messages} toolCalls={toolCalls} />
      {error && (
        <Alert color="red" mx="sm" mb="xs" title="Error" radius="md">
          {error}
        </Alert>
      )}
      <ChatInput onSend={sendWithContext} onStop={stop} isStreaming={isStreaming} />
    </Stack>
  );
}
