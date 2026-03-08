import { Box, Paper, ScrollArea, Text } from "@mantine/core";
import type { ChatMessage, ToolCallInfo } from "@mockstorm/shared";
import { useRef } from "react";
import { ToolCallIndicator } from "./ToolCallIndicator";

const dotStyle = (delay: number): React.CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--mantine-color-gray-5)",
  animation: "thinking-pulse 1.4s infinite ease-in-out",
  animationDelay: `${delay}s`,
});

function ThinkingIndicator() {
  return (
    <Box mb="xs" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <style>
        {`@keyframes thinking-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }`}
      </style>
      <Paper
        p="xs"
        px="md"
        radius="md"
        bg="gray.1"
        style={{ display: "flex", gap: 4, alignItems: "center", minHeight: 32 }}
      >
        <span style={dotStyle(0)} />
        <span style={dotStyle(0.16)} />
        <span style={dotStyle(0.32)} />
      </Paper>
    </Box>
  );
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  toolCalls: Map<string, ToolCallInfo[]>;
  isStreaming?: boolean;
}

export function ChatMessageList({ messages, toolCalls, isStreaming }: ChatMessageListProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  const lastMessage = messages[messages.length - 1];
  const currentTrigger = lastMessage ? messages.length + lastMessage.content.length : 0;
  if (currentTrigger !== prevLenRef.current) {
    prevLenRef.current = currentTrigger;
    queueMicrotask(() => {
      viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
    });
  }

  return (
    <ScrollArea viewportRef={viewport} style={{ flex: 1 }} px="sm" py="xs">
      {messages.map((msg) => (
        <Box
          key={msg.id}
          mb="xs"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
          }}
        >
          {msg.role === "assistant" &&
            toolCalls
              .get(msg.id)
              ?.map((tc, i) => <ToolCallIndicator key={`${tc.toolName}-${i}`} toolCall={tc} />)}
          <Paper
            p="xs"
            radius="md"
            bg={msg.role === "user" ? "blue.6" : "gray.1"}
            {...(msg.role === "user" ? { c: "white" } : {})}
            maw="85%"
          >
            {msg.imageBase64 && msg.role === "user" && (
              <Text size="xs" c="blue.2" mb={4}>
                📎 Screenshot attached
              </Text>
            )}
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {msg.content}
            </Text>
          </Paper>
        </Box>
      ))}
      {isStreaming && <ThinkingIndicator />}
    </ScrollArea>
  );
}
