import { SimpleGrid, Text } from "@mantine/core";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { ConceptCard } from "./ConceptCard";

export function ConceptGrid() {
  const { concepts } = useWorkspaceContext();

  if (concepts.length === 0) {
    return (
      <Text c="dimmed" ta="center" mt="xl">
        No concepts yet. Use the chat to create design mockups.
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} />
      ))}
    </SimpleGrid>
  );
}
