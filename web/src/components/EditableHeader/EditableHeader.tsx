import { ActionIcon, Box, Text, TextInput, Textarea } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { IconPencil } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface EditableHeaderProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function EditableHeader({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: EditableHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const ref = useClickOutside(() => setEditing(false));

  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus();
    }
  }, [editing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditing(false);
    }
  }, []);

  if (editing) {
    return (
      <Box ref={ref} mb="md" onKeyDown={handleKeyDown}>
        <TextInput
          ref={titleInputRef}
          size="xl"
          value={title}
          onChange={(e) => onTitleChange(e.currentTarget.value)}
          mb="xs"
          styles={{ input: { fontWeight: 700, fontSize: "1.5rem" } }}
        />
        <Textarea
          placeholder="Add a description…"
          value={description}
          onChange={(e) => onDescriptionChange(e.currentTarget.value)}
          minRows={2}
          autosize
        />
      </Box>
    );
  }

  return (
    <Box
      pos="relative"
      style={{ cursor: "pointer" }}
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      mb="md"
    >
      <Text fw={700} fz="1.5rem">
        {title || <span style={{ opacity: 0.5 }}>Untitled</span>}
      </Text>
      <Text c="dimmed">{description || "Add a description…"}</Text>
      {hovered && (
        <ActionIcon variant="subtle" pos="absolute" top={4} right={4} aria-label="Edit">
          <IconPencil size={16} />
        </ActionIcon>
      )}
    </Box>
  );
}
