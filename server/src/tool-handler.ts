import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import type { Concept, Screen, ServerMessage } from "@mockstorm/shared";
import type { ConceptStore } from "./concept-store";
import type { WorkspaceHub } from "./workspace-hub";

export interface RenderJob {
  slug: string;
  conceptId: string;
  screenId: string;
  html: string;
}

type ToolResult = Anthropic.Messages.ToolResultBlockParam["content"];

export async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
  enqueueRender: (job: RenderJob) => void,
  dataDir: string,
): Promise<{ content: ToolResult; description: string; conceptId?: string; screenId?: string }> {
  switch (toolName) {
    case "add_concept":
      return handleAddConcept(
        toolInput as { title: string; description: string },
        slug,
        conceptStore,
        hub,
      );
    case "add_screen":
      return handleAddScreen(
        toolInput as {
          concept_id: string;
          title: string;
          description: string;
          html: string;
        },
        slug,
        conceptStore,
        hub,
        enqueueRender,
      );
    case "list_concepts":
      return handleListConcepts(slug, conceptStore);
    case "view_screen":
      return await handleViewScreen(
        toolInput as { concept_id: string; screen_id: string },
        slug,
        conceptStore,
        dataDir,
      );
    case "delete_concept":
      return handleDeleteConcept(toolInput as { concept_id: string }, slug, conceptStore, hub);
    case "delete_screen":
      return handleDeleteScreen(
        toolInput as { concept_id: string; screen_id: string },
        slug,
        conceptStore,
        hub,
      );
    case "edit_concept":
      return handleEditConcept(
        toolInput as { concept_id: string; title?: string; description?: string },
        slug,
        conceptStore,
        hub,
      );
    case "edit_screen_meta":
      return handleEditScreenMeta(
        toolInput as {
          concept_id: string;
          screen_id: string;
          title?: string;
          description?: string;
        },
        slug,
        conceptStore,
        hub,
      );
    case "edit_screen":
      return handleEditScreen(
        toolInput as { concept_id: string; screen_id: string; old_text: string; new_text: string },
        slug,
        conceptStore,
        hub,
        enqueueRender,
      );
    default:
      return {
        content: `Unknown tool: ${toolName}`,
        description: `Unknown tool: ${toolName}`,
      };
  }
}

function handleAddConcept(
  input: { title: string; description: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
): { content: string; description: string; conceptId: string } {
  const concept: Concept = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    screens: [],
    createdAt: new Date().toISOString(),
  };
  conceptStore.addConcept(slug, concept);

  const msg: ServerMessage = { type: "conceptAdded", concept };
  hub.broadcast(slug, msg);

  return {
    content: `Created concept "${concept.title}" with id ${concept.id}`,
    description: `Created concept: ${concept.title}`,
    conceptId: concept.id,
  };
}

function handleAddScreen(
  input: {
    concept_id: string;
    title: string;
    description: string;
    html: string;
  },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
  enqueueRender: (job: RenderJob) => void,
): { content: string; description: string; conceptId?: string; screenId?: string } {
  const screen: Screen = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    html: input.html,
    thumbnailUrl: null,
    createdAt: new Date().toISOString(),
  };

  const added = conceptStore.addScreen(slug, input.concept_id, screen);
  if (!added) {
    return {
      content: `Error: concept ${input.concept_id} not found`,
      description: "Failed to add screen: concept not found",
    };
  }

  const msg: ServerMessage = {
    type: "screenAdded",
    conceptId: input.concept_id,
    screen,
  };
  hub.broadcast(slug, msg);

  enqueueRender({
    slug,
    conceptId: input.concept_id,
    screenId: screen.id,
    html: input.html,
  });

  return {
    content: `Added screen "${screen.title}" (id: ${screen.id}) to concept ${input.concept_id}. Thumbnail is rendering.`,
    description: `Added screen: ${screen.title}`,
    conceptId: input.concept_id,
    screenId: screen.id,
  };
}

function handleListConcepts(
  slug: string,
  conceptStore: ConceptStore,
): { content: string; description: string } {
  const concepts = conceptStore.getConcepts(slug);
  if (concepts.length === 0) {
    return {
      content: "No concepts exist yet.",
      description: "Listed concepts (none)",
    };
  }

  const lines: string[] = [];
  for (const concept of concepts) {
    lines.push(`## ${concept.title} (id: ${concept.id})`);
    lines.push(concept.description);
    if (concept.screens.length === 0) {
      lines.push("  No screens yet.");
    } else {
      for (const screen of concept.screens) {
        const status = screen.thumbnailUrl ? "rendered" : "pending";
        lines.push(`  - ${screen.title} (id: ${screen.id}) [${status}]`);
      }
    }
    lines.push("");
  }

  return {
    content: lines.join("\n"),
    description: `Listed ${concepts.length} concept(s)`,
  };
}

function handleDeleteConcept(
  input: { concept_id: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
): { content: string; description: string; conceptId: string } {
  const deleted = conceptStore.deleteConcept(slug, input.concept_id);
  if (!deleted) {
    return {
      content: `Error: concept ${input.concept_id} not found`,
      description: "Failed to delete concept: not found",
      conceptId: input.concept_id,
    };
  }
  const msg: ServerMessage = { type: "conceptDeleted", conceptId: input.concept_id };
  hub.broadcast(slug, msg);
  return {
    content: `Deleted concept ${input.concept_id}`,
    description: "Deleted concept",
    conceptId: input.concept_id,
  };
}

function handleDeleteScreen(
  input: { concept_id: string; screen_id: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
): { content: string; description: string; conceptId: string; screenId: string } {
  const deleted = conceptStore.deleteScreen(slug, input.concept_id, input.screen_id);
  if (!deleted) {
    return {
      content: `Error: screen ${input.screen_id} not found in concept ${input.concept_id}`,
      description: "Failed to delete screen: not found",
      conceptId: input.concept_id,
      screenId: input.screen_id,
    };
  }
  const msg: ServerMessage = {
    type: "screenDeleted",
    conceptId: input.concept_id,
    screenId: input.screen_id,
  };
  hub.broadcast(slug, msg);
  return {
    content: `Deleted screen ${input.screen_id} from concept ${input.concept_id}`,
    description: "Deleted screen",
    conceptId: input.concept_id,
    screenId: input.screen_id,
  };
}

function handleEditConcept(
  input: { concept_id: string; title?: string; description?: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
): { content: string; description: string; conceptId: string } {
  const fields: { title?: string; description?: string } = {};
  if (input.title !== undefined) fields.title = input.title;
  if (input.description !== undefined) fields.description = input.description;
  const updated = conceptStore.updateConcept(slug, input.concept_id, fields);
  if (!updated) {
    return {
      content: `Error: concept ${input.concept_id} not found`,
      description: "Failed to edit concept: not found",
      conceptId: input.concept_id,
    };
  }
  const msg: ServerMessage = {
    type: "conceptUpdated",
    conceptId: input.concept_id,
    ...fields,
  };
  hub.broadcast(slug, msg);
  return {
    content: `Updated concept ${input.concept_id}`,
    description: "Updated concept",
    conceptId: input.concept_id,
  };
}

function handleEditScreenMeta(
  input: { concept_id: string; screen_id: string; title?: string; description?: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
): { content: string; description: string; conceptId: string; screenId: string } {
  const fields: { title?: string; description?: string } = {};
  if (input.title !== undefined) fields.title = input.title;
  if (input.description !== undefined) fields.description = input.description;
  const screen = conceptStore.updateScreen(slug, input.concept_id, input.screen_id, fields);
  if (!screen) {
    return {
      content: `Error: screen ${input.screen_id} not found in concept ${input.concept_id}`,
      description: "Failed to edit screen: not found",
      conceptId: input.concept_id,
      screenId: input.screen_id,
    };
  }
  const msg: ServerMessage = {
    type: "screenUpdated",
    conceptId: input.concept_id,
    screen,
  };
  hub.broadcast(slug, msg);
  return {
    content: `Updated screen ${input.screen_id}`,
    description: "Updated screen metadata",
    conceptId: input.concept_id,
    screenId: input.screen_id,
  };
}

function handleEditScreen(
  input: { concept_id: string; screen_id: string; old_text: string; new_text: string },
  slug: string,
  conceptStore: ConceptStore,
  hub: WorkspaceHub,
  enqueueRender: (job: RenderJob) => void,
): { content: string; description: string; conceptId: string; screenId: string } {
  const screen = conceptStore.replaceScreenHtml(
    slug,
    input.concept_id,
    input.screen_id,
    input.old_text,
    input.new_text,
  );
  if (screen === false) {
    return {
      content: `Error: could not find old_text in screen ${input.screen_id} HTML. Use list_concepts or view_screen to check the current HTML.`,
      description: "Failed to edit screen HTML: text not found",
      conceptId: input.concept_id,
      screenId: input.screen_id,
    };
  }
  const msg: ServerMessage = {
    type: "screenUpdated",
    conceptId: input.concept_id,
    screen,
  };
  hub.broadcast(slug, msg);
  enqueueRender({
    slug,
    conceptId: input.concept_id,
    screenId: screen.id,
    html: screen.html,
  });
  return {
    content: "Updated screen HTML and re-rendering thumbnail.",
    description: "Edited screen HTML",
    conceptId: input.concept_id,
    screenId: screen.id,
  };
}

async function handleViewScreen(
  input: { concept_id: string; screen_id: string },
  slug: string,
  conceptStore: ConceptStore,
  dataDir: string,
): Promise<{ content: ToolResult; description: string }> {
  const screen = conceptStore.getScreen(slug, input.concept_id, input.screen_id);
  if (!screen) {
    return {
      content: "Error: screen not found",
      description: "View screen: not found",
    };
  }

  if (!screen.thumbnailUrl) {
    return {
      content: "Screen thumbnail is still rendering. Try again in a moment.",
      description: `View screen: ${screen.title} (pending)`,
    };
  }

  const thumbnailPath = join(dataDir, "workspaces", slug, "thumbnails", `${input.screen_id}.png`);

  try {
    const data = await readFile(thumbnailPath);
    const base64 = data.toString("base64");
    return {
      content: [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/png" as const,
            data: base64,
          },
        },
      ],
      description: `Viewed screen: ${screen.title}`,
    };
  } catch {
    return {
      content: `Screen "${screen.title}" has a thumbnail URL but the file could not be read. It may still be rendering.`,
      description: `View screen: ${screen.title} (file not ready)`,
    };
  }
}
