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
        <Text component={Link} to={link} size="xs" c="azure" style={{ textDecoration: "none" }}>
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
  const { toolName, conceptId, screenId } = toolCall;
  if (!conceptId) return null;

  switch (toolName) {
    case "add_concept":
    case "edit_concept":
      return `/${slug}/concepts/${conceptId}`;
    case "add_screen":
    case "edit_screen":
    case "edit_screen_meta":
      return screenId ? `/${slug}/concepts/${conceptId}/screens/${screenId}` : null;
    case "delete_screen":
      return `/${slug}/concepts/${conceptId}`;
    case "delete_concept":
      return null;
    default:
      return null;
  }
}
