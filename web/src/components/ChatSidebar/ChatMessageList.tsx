import { Box, Paper, ScrollArea, Text } from "@mantine/core";
import type { ChatMessage, ToolCallInfo } from "@mockstorm/shared";
import { useRef } from "react";
import { ToolCallIndicator } from "./ToolCallIndicator";

interface ChatMessageListProps {
  messages: ChatMessage[];
  toolCalls: Map<string, ToolCallInfo[]>;
}

export function ChatMessageList({ messages, toolCalls }: ChatMessageListProps) {
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
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {msg.content}
            </Text>
          </Paper>
        </Box>
      ))}
    </ScrollArea>
  );
}
