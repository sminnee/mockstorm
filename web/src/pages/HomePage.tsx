import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  forgetWorkspace,
  getRememberedSlugs,
  rememberWorkspace,
} from "../lib/remembered-workspaces";

interface WorkspaceInfo {
  slug: string;
  title: string;
  description: string;
}

export function HomePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const navigate = useNavigate();

  const loadWorkspaces = useCallback(async () => {
    const slugs = getRememberedSlugs();
    if (slugs.length === 0) {
      setWorkspaces([]);
      return;
    }
    try {
      const res = await fetch("/api/workspaces/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs }),
      });
      const data = (await res.json()) as WorkspaceInfo[];
      setWorkspaces(data);
    } catch {
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const { slug } = (await res.json()) as { slug: string };
      rememberWorkspace(slug);
      void navigate(`/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForget = (slug: string) => {
    if (!window.confirm("Are you sure you want to forget this workspace?")) return;
    forgetWorkspace(slug);
    setWorkspaces((prev) => prev.filter((w) => w.slug !== slug));
  };

  return (
    <Container mt="xl">
      <Title order={1} mb="lg">
        Mockstorm
      </Title>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <TextInput
          label="Workspace name"
          placeholder="My workspace"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          mb="md"
        />
        <Button type="submit" loading={loading} disabled={!name.trim()}>
          Create workspace
        </Button>
      </form>

      {workspaces.length > 0 && (
        <>
          <Title order={3} mt="xl" mb="md">
            Your workspaces
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {workspaces.map((w) => (
              <Card key={w.slug} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text
                    fw={500}
                    component={Link}
                    to={`/${w.slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {w.title || w.slug}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => handleForget(w.slug)}
                    aria-label="Forget workspace"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                {w.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {w.description}
                  </Text>
                )}
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
}
