import { Button, Container, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      void navigate(`/${slug}`);
    } finally {
      setLoading(false);
    }
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
    </Container>
  );
}
