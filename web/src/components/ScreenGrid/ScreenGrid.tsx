import { ActionIcon, Anchor, Group, SimpleGrid, Text, Title } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { ScreenCard } from "./ScreenCard";

export function ScreenGrid() {
  const { slug, cid } = useParams<{ slug: string; cid: string }>();
  const { concepts } = useWorkspaceContext();
  const concept = concepts.find((c) => c.id === cid);

  if (!concept) {
    return <Text c="dimmed">Concept not found.</Text>;
  }

  return (
    <>
      <Group mb="md">
        <Anchor component={Link} to={`/${slug}`} size="sm">
          &larr; All concepts
        </Anchor>
      </Group>
      <Group justify="space-between" mb="xs">
        <Title order={3}>{concept.title}</Title>
        {concept.screens.length > 0 && (
          <ActionIcon
            component="a"
            href={`/api/workspaces/${slug}/concepts/${cid}/download.zip`}
            variant="subtle"
            color="gray"
            title="Download concept as ZIP"
          >
            <IconDownload size={16} />
          </ActionIcon>
        )}
      </Group>
      <Text c="dimmed" mb="md">
        {concept.description}
      </Text>
      {concept.screens.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">
          No screens yet. Use the chat to add screens to this concept.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {concept.screens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </SimpleGrid>
      )}
    </>
  );
}
