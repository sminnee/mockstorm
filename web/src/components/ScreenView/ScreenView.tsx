import { ActionIcon, Anchor, Group, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";

export function ScreenView() {
  const { slug, cid, sid } = useParams<{ slug: string; cid: string; sid: string }>();
  const { concepts } = useWorkspaceContext();
  const navigate = useNavigate();

  const concept = concepts.find((c) => c.id === cid);
  if (!concept) return <Text c="dimmed">Concept not found.</Text>;

  const screenIndex = concept.screens.findIndex((s) => s.id === sid);
  const screen = concept.screens[screenIndex];
  if (!screen) return <Text c="dimmed">Screen not found.</Text>;

  const prevScreen = screenIndex > 0 ? concept.screens[screenIndex - 1] : null;
  const nextScreen =
    screenIndex < concept.screens.length - 1 ? concept.screens[screenIndex + 1] : null;

  return (
    <>
      <Group mb="md" justify="space-between">
        <Group>
          <Anchor component={Link} to={`/${slug}/concepts/${cid}`} size="sm">
            &larr; {concept.title}
          </Anchor>
        </Group>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            disabled={!prevScreen}
            onClick={() =>
              prevScreen && navigate(`/${slug}/concepts/${cid}/screens/${prevScreen.id}`)
            }
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed">
            {screenIndex + 1} / {concept.screens.length}
          </Text>
          <ActionIcon
            variant="subtle"
            disabled={!nextScreen}
            onClick={() =>
              nextScreen && navigate(`/${slug}/concepts/${cid}/screens/${nextScreen.id}`)
            }
          >
            <IconArrowRight size={16} />
          </ActionIcon>
        </Group>
      </Group>
      <Title order={4} mb="md">
        {screen.title}
      </Title>
      <iframe
        srcDoc={screen.html}
        sandbox="allow-same-origin"
        title={screen.title}
        style={{
          width: "100%",
          height: "calc(100vh - 300px)",
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: 8,
          background: "white",
        }}
      />
    </>
  );
}
