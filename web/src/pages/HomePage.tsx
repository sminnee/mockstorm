import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  Modal,
  Paper,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDiamond, IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../lib/format-time";
import {
  forgetWorkspace,
  getRememberedSlugs,
  rememberWorkspace,
} from "../lib/remembered-workspaces";

interface WorkspaceInfo {
  slug: string;
  title: string;
  description: string;
  conceptCount: number;
  screenCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export function HomePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
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

  const handleCreate = async () => {
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
      closeModal();
      void navigate(`/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForget = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to forget this workspace?")) return;
    forgetWorkspace(slug);
    setWorkspaces((prev) => prev.filter((w) => w.slug !== slug));
  };

  return (
    <Box bg="gray.0" mih="100vh">
      <Paper shadow="xs" px="xl" py="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <IconDiamond size={24} />
            <Text fw={700} size="lg">
              Mockstorm
            </Text>
          </Group>
          <Group gap="xs">
            <Avatar size="sm" color="navy" />
            <Text size="sm">User</Text>
          </Group>
        </Group>
      </Paper>

      <Container size="lg" py="xl">
        <Group justify="space-between" mb="xl">
          <Title order={1}>Workspaces</Title>
          <Button color="navy" leftSection={<IconPlus size={16} />} onClick={openModal}>
            New Workspace
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {workspaces.map((w) => (
            <Card
              key={w.slug}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: "pointer" }}
              onClick={() => void navigate(`/${w.slug}`)}
            >
              {w.thumbnailUrl ? (
                <Card.Section>
                  <Image src={w.thumbnailUrl} height={120} alt={w.title} />
                </Card.Section>
              ) : (
                <Card.Section>
                  <Box bg="gray.2" h={120} />
                </Card.Section>
              )}
              <Group justify="space-between" mt="md" mb={4}>
                <Text fw={600} lineClamp={1}>
                  {w.title || w.slug}
                </Text>
                <IconTrash
                  size={16}
                  style={{ cursor: "pointer", color: "var(--mantine-color-gray-5)", flexShrink: 0 }}
                  onClick={(e: React.MouseEvent) => handleForget(e, w.slug)}
                />
              </Group>
              <Text size="sm" c="dimmed">
                {w.conceptCount} concepts · {w.screenCount} screens
              </Text>
              {w.createdAt && (
                <Text size="xs" c="dimmed" mt={4}>
                  {formatRelativeTime(w.createdAt)}
                </Text>
              )}
            </Card>
          ))}

          <Card
            shadow="none"
            padding="lg"
            radius="md"
            withBorder
            style={{
              cursor: "pointer",
              borderStyle: "dashed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
            onClick={openModal}
          >
            <Box ta="center">
              <IconPlus size={32} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" mt="xs">
                New Workspace
              </Text>
            </Box>
          </Card>
        </SimpleGrid>
      </Container>

      <Modal opened={modalOpened} onClose={closeModal} title="Create Workspace" centered>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <TextInput
            label="Workspace name"
            placeholder="My workspace"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            mb="md"
            data-autofocus
          />
          <Group justify="flex-end">
            <Button type="submit" loading={loading} disabled={!name.trim()}>
              Create
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}
