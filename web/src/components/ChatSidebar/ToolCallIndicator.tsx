import { Group, Text, ThemeIcon } from "@mantine/core";
import type { ToolCallInfo } from "@mockstorm/shared";
import { IconTool } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";

interface ToolCallIndicatorProps {
  toolCall: ToolCallInfo;
}

export function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const { slug } = useParams<{ slug: string }>();
  const link = getToolLink(toolCall, slug ?? "");

  return (
    <Group gap="xs" py={4}>
      <ThemeIcon size="xs" variant="light" color="gray">
        <IconTool size={12} />
      </ThemeIcon>
      {link ? (
        <Text component={Link} to={link} size="xs" c="blue" style={{ textDecoration: "none" }}>
          {toolCall.result}
        </Text>
      ) : (
        <Text size="xs" c="dimmed">
          {toolCall.result}
        </Text>
      )}
    </Group>
  );
}

function getToolLink(toolCall: ToolCallInfo, slug: string): string | null {
  if (toolCall.toolName === "add_concept" && toolCall.conceptId) {
    return `/${slug}/concepts/${toolCall.conceptId}`;
  }
  if (toolCall.toolName === "add_screen" && toolCall.conceptId && toolCall.screenId) {
    return `/${slug}/concepts/${toolCall.conceptId}/screens/${toolCall.screenId}`;
  }
  return null;
}
