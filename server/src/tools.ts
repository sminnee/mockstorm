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
          description: "HTML fragment for the screen mockup",
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
];
