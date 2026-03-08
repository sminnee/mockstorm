import { Badge, Card, Group, Image, Text } from "@mantine/core";
import type { Concept } from "@mockstorm/shared";
import { useNavigate, useParams } from "react-router-dom";

interface ConceptCardProps {
  concept: Concept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const firstScreen = concept.screens[0];
  const thumbnailUrl = firstScreen?.thumbnailUrl;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/${slug}/concepts/${concept.id}`)}
    >
      {thumbnailUrl ? (
        <Card.Section>
          <Image src={thumbnailUrl} height={160} alt={concept.title} />
        </Card.Section>
      ) : (
        <Card.Section
          bg="gray.1"
          h={160}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Text c="dimmed" size="sm">
            No screens yet
          </Text>
        </Card.Section>
      )}
      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500} lineClamp={1}>
          {concept.title}
        </Text>
        <Badge variant="light">
          {concept.screens.length} screen{concept.screens.length !== 1 ? "s" : ""}
        </Badge>
      </Group>
      <Text size="sm" c="dimmed" lineClamp={2}>
        {concept.description}
      </Text>
    </Card>
  );
}
