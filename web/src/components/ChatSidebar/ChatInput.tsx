import { ActionIcon, Group, Text, Textarea } from "@mantine/core";
import { IconMicrophone, IconPlayerStop, IconSend } from "@tabler/icons-react";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useVoiceInput } from "../../hooks/useVoiceInput";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  hasAnnotation?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, hasAnnotation }: ChatInputProps) {
  const [value, setValue] = useState("");
  const prefixRef = useRef("");

  const handleVoiceSubmit = useCallback(
    (text: string) => {
      const prefix = prefixRef.current;
      const full = prefix ? `${prefix} ${text}` : text;
      const trimmed = full.trim();
      if (trimmed) onSend(trimmed);
      prefixRef.current = "";
    },
    [onSend],
  );

  const {
    isSupported,
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceInput({ onSubmit: handleVoiceSubmit });

  // Sync transcript into textarea while listening
  useEffect(() => {
    if (isListening) {
      const prefix = prefixRef.current;
      setValue(prefix ? `${prefix} ${transcript}` : transcript);
    }
  }, [isListening, transcript]);

  function handleSend() {
    if (isListening) {
      stopListening();
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isStreaming) onStop();
    onSend(trimmed);
    setValue("");
    prefixRef.current = "";
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMicToggle() {
    if (isListening) {
      stopListening();
      setValue("");
      prefixRef.current = "";
    } else {
      // Save any typed text as prefix
      prefixRef.current = value.trim();
      startListening();
    }
  }

  return (
    <Group px="sm" pb="sm" pt="xs" gap="xs" align="flex-end" wrap="wrap">
      {voiceError && (
        <Text size="xs" c="crimson" w="100%">
          {voiceError}
        </Text>
      )}
      {hasAnnotation && (
        <Text size="xs" c="crimson" w="100%">
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
        readOnly={isListening}
      />
      {isSupported && (
        <ActionIcon
          variant={isListening ? "filled" : "default"}
          {...(isListening ? { color: "red" } : {})}
          size="lg"
          onClick={handleMicToggle}
          disabled={isStreaming}
        >
          <IconMicrophone size={18} />
        </ActionIcon>
      )}
      {isStreaming ? (
        <ActionIcon variant="filled" color="crimson" size="lg" onClick={onStop}>
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
