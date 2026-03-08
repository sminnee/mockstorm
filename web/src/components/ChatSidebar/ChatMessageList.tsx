import { Box, Paper, ScrollArea, Text } from "@mantine/core";
import type { ChatMessage } from "@mockstorm/shared";
import { useRef } from "react";

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  // Scroll to bottom when messages change (on every render where length/content changed)
  const lastMessage = messages[messages.length - 1];
  const currentTrigger = lastMessage ? messages.length + lastMessage.content.length : 0;
  if (currentTrigger !== prevLenRef.current) {
    prevLenRef.current = currentTrigger;
    // Use queueMicrotask so the DOM has updated
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
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}
        >
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
