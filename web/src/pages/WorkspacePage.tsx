import { ActionIcon, AppShell, Container, Title } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconHome } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { ConversationView } from "../components/ConversationView/ConversationView";
import { EditableHeader } from "../components/EditableHeader/EditableHeader";
import { WorkspaceProvider } from "../contexts/WorkspaceContext";
import { useChatWs } from "../hooks/useChatWs";
import { useConceptsWs } from "../hooks/useConceptsWs";
import { useWorkspaceWs } from "../hooks/useWorkspaceWs";
import { rememberWorkspace } from "../lib/remembered-workspaces";

export function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const { workspace, updateWorkspace, wsRef } = useWorkspaceWs(slug ?? "");
  const { concepts } = useConceptsWs(wsRef);
  const { messages, toolCalls, sendMessage, stop, isStreaming, error } = useChatWs(wsRef);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [annotationDataUrl, setAnnotationDataUrl] = useState<string | null>(null);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const getAnnotationImageRef = useRef<(() => Promise<string>) | null>(null);

  const setGetAnnotationImage = useCallback((fn: (() => Promise<string>) | null) => {
    getAnnotationImageRef.current = fn;
  }, []);

  useEffect(() => {
    if (workspace) {
      setTitle(workspace.title);
      setDescription(workspace.description);
      rememberWorkspace(workspace.slug);
    }
  }, [workspace]);

  const handleTitleChange = useDebouncedCallback((value: string) => {
    updateWorkspace({ title: value });
  }, 300);

  const handleDescriptionChange = useDebouncedCallback((value: string) => {
    updateWorkspace({ description: value });
  }, 300);

  if (!workspace) {
    return (
      <Container mt="xl">
        <Title order={2}>Loading…</Title>
      </Container>
    );
  }

  const ctxValue = {
    workspace,
    concepts,
    wsRef,
    updateWorkspace,
    annotationDataUrl,
    setAnnotationDataUrl,
    getAnnotationImage: getAnnotationImageRef.current,
    setGetAnnotationImage,
    hasAnnotations,
    setHasAnnotations,
    messages,
    toolCalls,
    sendMessage,
    stop,
    isStreaming,
    chatError: error,
  };

  const hasScreens = concepts.some((c) => c.screens.length > 0);

  // Conversation state: no concept with screens yet
  if (!hasScreens) {
    return (
      <WorkspaceProvider value={ctxValue}>
        <AppShell padding="md">
          <AppShell.Main>
            <ActionIcon variant="subtle" component={Link} to="/" mb="xs" aria-label="Home">
              <IconHome size={20} />
            </ActionIcon>
            <ConversationView />
          </AppShell.Main>
        </AppShell>
      </WorkspaceProvider>
    );
  }

  // Normal state: has concepts — sidebar + grid
  return (
    <WorkspaceProvider value={ctxValue}>
      <AppShell navbar={{ width: 350, breakpoint: "sm" }} padding="md">
        <AppShell.Navbar>
          <ChatSidebar />
        </AppShell.Navbar>
        <AppShell.Main>
          <ActionIcon variant="subtle" component={Link} to="/" mb="xs" aria-label="Home">
            <IconHome size={20} />
          </ActionIcon>
          <EditableHeader
            title={title}
            description={description}
            onTitleChange={(value) => {
              setTitle(value);
              handleTitleChange(value);
            }}
            onDescriptionChange={(value) => {
              setDescription(value);
              handleDescriptionChange(value);
            }}
          />
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </WorkspaceProvider>
  );
}
