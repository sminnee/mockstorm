import { Alert, Stack, Text } from "@mantine/core";
import { type RefObject, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { useChatWs } from "../../hooks/useChatWs";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

interface ChatSidebarProps {
  wsRef: RefObject<WebSocket | null>;
}

export function ChatSidebar({ wsRef }: ChatSidebarProps) {
  const { messages, toolCalls, sendMessage, stop, isStreaming, error } = useChatWs(wsRef);
  const { cid, sid } = useParams<{ cid?: string; sid?: string }>();
  const { getAnnotationImage, hasAnnotations, setHasAnnotations, setGetAnnotationImage } =
    useWorkspaceContext();

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
      {error && (
        <Alert color="red" mx="sm" mb="xs" title="Error" radius="md">
          {error}
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
