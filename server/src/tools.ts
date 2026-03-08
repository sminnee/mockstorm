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
    name: "render_screen",
    description:
      "Create or edit a screen mockup. A specialist renderer generates HTML wireframes from your layout instructions and visually verifies the result.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept_id: {
          type: "string",
          description: "ID of the concept to add/update the screen in",
        },
        screen_title: {
          type: "string",
          description: "Title for the screen",
        },
        screen_description: {
          type: "string",
          description: "Brief description of what the screen shows",
        },
        layout_instructions: {
          type: "string",
          description:
            "Detailed layout description for the renderer: page structure, sections, content, navigation, and specific requirements. Be as descriptive as possible.",
        },
        viewport: {
          type: "string",
          enum: ["mobile", "tablet", "laptop", "large"],
          description:
            "Target viewport size. Defaults to 'laptop'. Use 'mobile' (375px), 'tablet' (768px), 'laptop' (1280px), or 'large' (1920px).",
        },
        existing_screen_id: {
          type: "string",
          description:
            "If editing an existing screen, provide its ID. The renderer will modify the existing HTML based on the instructions.",
        },
      },
      required: ["concept_id", "screen_title", "screen_description", "layout_instructions"],
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
];
