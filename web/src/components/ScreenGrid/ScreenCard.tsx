import { Card, Image, Loader, Text } from "@mantine/core";
import type { Screen } from "@mockstorm/shared";
import { useNavigate, useParams } from "react-router-dom";

interface ScreenCardProps {
  screen: Screen;
}

export function ScreenCard({ screen }: ScreenCardProps) {
  const { slug, cid } = useParams<{ slug: string; cid: string }>();
  const navigate = useNavigate();

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/${slug}/concepts/${cid}/screens/${screen.id}`)}
    >
      <Card.Section>
        {screen.thumbnailUrl ? (
          <Image src={screen.thumbnailUrl} height={160} alt={screen.title} />
        ) : (
          <div
            style={{
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-gray-1)",
            }}
          >
            <Loader size="sm" />
          </div>
        )}
      </Card.Section>
      <Text fw={500} mt="md" lineClamp={1}>
        {screen.title}
      </Text>
      <Text size="sm" c="dimmed" lineClamp={2}>
        {screen.description}
      </Text>
    </Card>
  );
}
