import { Alert, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

export function ChatSidebar() {
  const {
    messages,
    toolCalls,
    sendMessage,
    stop,
    isStreaming,
    chatError,
    getAnnotationImage,
    hasAnnotations,
    setHasAnnotations,
    setGetAnnotationImage,
  } = useWorkspaceContext();
  const { cid, sid } = useParams<{ cid?: string; sid?: string }>();

  const sendWithContext = useCallback(
    async (content: string) => {
      let imageBase64: string | undefined;
      if (hasAnnotations && getAnnotationImage) {
        imageBase64 = await getAnnotationImage();
        setHasAnnotations(false);
        setGetAnnotationImage(null);
      }
      sendMessage(content, {
        ...(cid ? { conceptId: cid } : {}),
        ...(sid ? { screenId: sid } : {}),
        ...(imageBase64 ? { imageBase64 } : {}),
      });
    },
    [
      sendMessage,
      cid,
      sid,
      hasAnnotations,
      getAnnotationImage,
      setHasAnnotations,
      setGetAnnotationImage,
    ],
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
      <ChatMessageList messages={messages} toolCalls={toolCalls} isStreaming={isStreaming} />
      {chatError && (
        <Alert color="red" mx="sm" mb="xs" title="Error" radius="md">
          {chatError}
        </Alert>
      )}
      <ChatInput
        onSend={sendWithContext}
        onStop={stop}
        isStreaming={isStreaming}
        hasAnnotation={hasAnnotations}
      />
    </Stack>
  );
}
