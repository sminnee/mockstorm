import { ActionIcon, Group, Text, Textarea } from "@mantine/core";
import { IconPlayerStop, IconSend } from "@tabler/icons-react";
import { type KeyboardEvent, useState } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  hasAnnotation?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, hasAnnotation }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isStreaming) onStop();
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Group px="sm" pb="sm" pt="xs" gap="xs" align="flex-end" wrap="wrap">
      {hasAnnotation && (
        <Text size="xs" c="red" w="100%">
          Screenshot will be attached
        </Text>
      )}
      <Textarea
        placeholder="Send a message…"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        autosize
        minRows={1}
        maxRows={4}
        style={{ flex: 1 }}
      />
      {isStreaming ? (
        <ActionIcon variant="filled" color="red" size="lg" onClick={onStop}>
          <IconPlayerStop size={18} />
        </ActionIcon>
      ) : (
        <ActionIcon variant="filled" size="lg" onClick={handleSend} disabled={!value.trim()}>
          <IconSend size={18} />
        </ActionIcon>
      )}
    </Group>
  );
}
