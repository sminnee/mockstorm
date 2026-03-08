import { SimpleGrid } from "@mantine/core";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { ConceptCard } from "./ConceptCard";

export function ConceptGrid() {
  const { concepts } = useWorkspaceContext();

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} />
      ))}
    </SimpleGrid>
  );
}
