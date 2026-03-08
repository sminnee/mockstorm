import { ActionIcon, AppShell, Container, TextInput, Textarea, Title } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconHome } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { WorkspaceProvider } from "../contexts/WorkspaceContext";
import { useConceptsWs } from "../hooks/useConceptsWs";
import { useWorkspaceWs } from "../hooks/useWorkspaceWs";
import { rememberWorkspace } from "../lib/remembered-workspaces";

export function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const { workspace, updateWorkspace, wsRef } = useWorkspaceWs(slug ?? "");
  const { concepts } = useConceptsWs(wsRef);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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

  return (
    <WorkspaceProvider value={{ workspace, concepts, wsRef, updateWorkspace }}>
      <AppShell navbar={{ width: 350, breakpoint: "sm" }} padding="md">
        <AppShell.Navbar>
          <ChatSidebar wsRef={wsRef} />
        </AppShell.Navbar>
        <AppShell.Main>
          <ActionIcon variant="subtle" component={Link} to="/" mb="xs" aria-label="Home">
            <IconHome size={20} />
          </ActionIcon>
          <TextInput
            size="xl"
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
              handleTitleChange(e.currentTarget.value);
            }}
            mb="md"
            styles={{ input: { fontWeight: 700, fontSize: "1.5rem" } }}
          />
          <Textarea
            placeholder="Add a description…"
            value={description}
            onChange={(e) => {
              setDescription(e.currentTarget.value);
              handleDescriptionChange(e.currentTarget.value);
            }}
            minRows={2}
            autosize
            mb="md"
          />
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </WorkspaceProvider>
  );
}
