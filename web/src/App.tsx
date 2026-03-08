import { Badge, Button, Container, Group, Title } from "@mantine/core";

export function App() {
  return (
    <Container>
      <Group justify="space-between" mt="xl">
        <Title order={1}>Mockstorm</Title>
        <Badge color="teal" size="lg">
          Preview
        </Badge>
      </Group>
      <Button mt="md">Get started</Button>
    </Container>
  );
}
