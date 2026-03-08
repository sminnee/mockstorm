import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconPaperclip, IconPhoto } from "@tabler/icons-react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { ChatInput } from "../ChatSidebar/ChatInput";
import { ChatMessageList } from "../ChatSidebar/ChatMessageList";

const SUGGESTIONS = [
  "Onboarding flow for a fintech app",
  "E-commerce product detail page",
  "Admin analytics dashboard",
];

export function ConversationView() {
  const {
    workspace,
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

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <Center mih="80vh">
      <Stack w="100%" maw={640} h="70vh" gap={0} justify="center">
        <Title order={1} ta="center" mb="xs">
          {workspace.title}
        </Title>
        <Text c="dimmed" ta="center" size="lg" mb="md">
          Describe what you want to design and the AI will generate concept mockups for you.
        </Text>

        {hasMessages && (
          <Box style={{ flex: 1, minHeight: 0 }}>
            <ChatMessageList messages={messages} toolCalls={toolCalls} isStreaming={isStreaming} />
          </Box>
        )}

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

        <Group gap="md" justify="center" mt="xs">
          <UnstyledButton style={{ cursor: "default", opacity: 0.5 }}>
            <Group gap={4}>
              <IconPaperclip size={16} />
              <Text size="sm">Attach reference</Text>
            </Group>
          </UnstyledButton>
          <UnstyledButton style={{ cursor: "default", opacity: 0.5 }}>
            <Group gap={4}>
              <IconPhoto size={16} />
              <Text size="sm">Upload image</Text>
            </Group>
          </UnstyledButton>
        </Group>

        {!hasMessages && (
          <Box mt="md">
            <Text size="sm" c="dimmed" ta="center" mb="xs">
              Try one of these:
            </Text>
            <Group gap="xs" justify="center">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="light"
                  size="xs"
                  radius="xl"
                  onClick={() => sendWithContext(s)}
                >
                  {s}
                </Button>
              ))}
            </Group>
          </Box>
        )}

        {hasMessages && (
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            Concepts will appear on the canvas once ready
          </Text>
        )}
      </Stack>
    </Center>
  );
}
