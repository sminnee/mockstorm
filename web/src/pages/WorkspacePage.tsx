import { Container, TextInput, Textarea, Title } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useWorkspaceWs } from "../hooks/useWorkspaceWs";

export function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const { workspace, updateWorkspace } = useWorkspaceWs(slug ?? "");

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
    <Container mt="xl">
      <TextInput
        size="xl"
        defaultValue={workspace.title}
        onChange={(e) => handleTitleChange(e.currentTarget.value)}
        mb="md"
        styles={{ input: { fontWeight: 700, fontSize: "1.5rem" } }}
      />
      <Textarea
        placeholder="Add a description…"
        defaultValue={workspace.description}
        onChange={(e) => handleDescriptionChange(e.currentTarget.value)}
        minRows={4}
        autosize
      />
    </Container>
  );
}
