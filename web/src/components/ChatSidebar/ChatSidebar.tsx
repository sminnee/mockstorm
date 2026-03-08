import { Stack, Text } from "@mantine/core";
import type { RefObject } from "react";
import { useChatWs } from "../../hooks/useChatWs";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

interface ChatSidebarProps {
  wsRef: RefObject<WebSocket | null>;
}

export function ChatSidebar({ wsRef }: ChatSidebarProps) {
  const { messages, sendMessage, stop, isStreaming } = useChatWs(wsRef);

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
      <ChatMessageList messages={messages} />
      <ChatInput onSend={sendMessage} onStop={stop} isStreaming={isStreaming} />
    </Stack>
  );
}
