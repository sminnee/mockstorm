import type Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "add_concept",
    description: "Create a new design concept. A concept groups related screen mockups together.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Title for the concept" },
        description: {
          type: "string",
          description: "Brief description of the concept",
        },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "add_screen",
    description:
      "Add an HTML mockup screen to a concept. The HTML fragment will be rendered to a thumbnail image.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept to add the screen to",
        },
        title: { type: "string", description: "Title for the screen" },
        description: {
          type: "string",
          description: "Brief description of what the screen shows",
        },
        html: {
          type: "string",
          description:
            "HTML fragment using wireframe utility classes. Wrap content in a div with class 'screen'.",
        },
        viewport: {
          type: "string",
          enum: ["mobile", "tablet", "laptop", "large"],
          description:
            "Target viewport size for the screen. Defaults to 'laptop'. Use 'mobile' (375px), 'tablet' (768px), 'laptop' (1280px), or 'large' (1920px).",
        },
      },
      required: ["concept_id", "title", "description", "html"],
    },
  },
  {
    name: "list_concepts",
    description: "List all existing concepts and their screens in the current workspace.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "view_screen",
    description:
      "View a rendered screen thumbnail to review the design. Returns the screenshot image.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept containing the screen",
        },
        screen_id: {
          type: "string",
          description: "ID of the screen to view",
        },
      },
      required: ["concept_id", "screen_id"],
    },
  },
  {
    name: "delete_concept",
    description: "Delete a design concept and all its screens.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept to delete",
        },
      },
      required: ["concept_id"],
    },
  },
  {
    name: "delete_screen",
    description: "Delete a single screen from a concept.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept containing the screen",
        },
        screen_id: {
          type: "string",
          description: "ID of the screen to delete",
        },
      },
      required: ["concept_id", "screen_id"],
    },
  },
  {
    name: "edit_concept",
    description: "Update the title and/or description of an existing concept.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept to edit",
        },
        title: {
          type: "string",
          description: "New title for the concept",
        },
        description: {
          type: "string",
          description: "New description for the concept",
        },
      },
      required: ["concept_id"],
    },
  },
  {
    name: "edit_screen_meta",
    description: "Update the title and/or description of an existing screen.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept containing the screen",
        },
        screen_id: {
          type: "string",
          description: "ID of the screen to edit",
        },
        title: {
          type: "string",
          description: "New title for the screen",
        },
        description: {
          type: "string",
          description: "New description for the screen",
        },
        viewport: {
          type: "string",
          enum: ["mobile", "tablet", "laptop", "large"],
          description:
            "New viewport size for the screen: 'mobile' (375px), 'tablet' (768px), 'laptop' (1280px), or 'large' (1920px).",
        },
      },
      required: ["concept_id", "screen_id"],
    },
  },
  {
    name: "edit_screen",
    description:
      "Edit a screen's HTML by performing a text search-and-replace. Finds the first occurrence of old_text in the screen's HTML and replaces it with new_text. Use list_concepts or view_screen to see the current HTML before editing.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept containing the screen",
        },
        screen_id: {
          type: "string",
          description: "ID of the screen to edit",
        },
        old_text: {
          type: "string",
          description: "Text to find in the screen's HTML",
        },
        new_text: {
          type: "string",
          description: "Text to replace old_text with",
        },
      },
      required: ["concept_id", "screen_id", "old_text", "new_text"],
    },
  },
];
