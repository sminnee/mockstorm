import { readFile, unlink } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import type { ViewportPreset } from "@mockstorm/shared";
import type { Renderer } from "./renderer";

const WIREFRAME_REFERENCE = `
## Wireframe Class Reference

### Screen Wrapper
Always wrap content in: <div class="screen">

### Page Shells (outermost layout inside .screen)
shell-single         Single column, full width
shell-topbar         Top bar + content below
shell-sidebar-left   Left sidebar + main
shell-sidebar-right  Main + right sidebar
shell-topbar-sidebar Top bar + left sidebar + main (L-shaped)
shell-centered       Narrow centered column (~480px) for login/settings
shell-split          Two equal panes side by side

Shells use <nav class="navbar-horizontal">, <nav class="navbar-vertical">, and <main> as children.

### Layout Utilities
stack           Vertical stack (default gap-md)
grid-2/3/4      Equal-width column grid
split-50-50, split-30-70, split-70-30, split-25-75, split-75-25  Two-column ratio
cluster         Horizontal wrapping row (tags, buttons)
pinned-bottom   Push to bottom of container

### Gap & Padding Modifiers
gap-xs/sm/md/lg/xl        4/8/16/24/32px
padding-none/sm/md/lg/xl  0/8/16/24/32px

### Typography
text-xs/sm/md/lg/xl/display   12/14/16/20/24/36px
text-bold                      font-weight 700
text-left/center/right         alignment

### Colors
bg-white/light/muted/medium/dark/black
text-primary/secondary/muted/inverse

### Components
card / card-interactive          Bordered box with padding
navbar-horizontal / navbar-vertical  Navigation bars
nav-item / nav-item.active       Navigation link (active = highlighted)
breadcrumbs                      Auto-separated path links
tabs > .tab / .tab.active        Tab bar
table (with thead/tbody)         Styled data table
form-group (label + input)       Form field pair
form-actions                     Right-aligned button row
btn / btn-primary / btn-ghost    Button variants
modal > .card                    Overlay with centered card
toast                            Notification bar
toolbar                          Horizontal action bar
stat > .stat-value + .stat-label Dashboard KPI
avatar / avatar-sm / avatar-lg  Grey circle (24/32/48px)
badge / badge-outline            Small pill label
stepper > .step / .step.active / .step.completed  Multi-step indicator
empty-state                      Centered empty/zero-data block
divider                          Horizontal separator
list > .list-item                Bordered row list

### Placeholders (grey boxes suggesting content type)
placeholder-image/video/audio/gallery/avatar/logo/icon/3d  Media
placeholder-chart-bar/chart-line/chart-pie/chart-donut/table  Data
placeholder-text/code/file/chat/signature  Content
placeholder-map/calendar/timeline/kanban/tree/diagram/carousel  Spatial
placeholder-qr/rating/progress  Status

Size: placeholder-xs/sm/md/lg/xl (48-480px height)
placeholder-square (1:1) / placeholder-video-ratio (16:9)

### Annotations
annotation          Dashed-border note box
annotation-inline   Small inline margin note
`;

const RENDER_AGENT_SYSTEM = `You are a specialist HTML wireframe renderer. Your job is to generate clean HTML mockups using the wireframe utility classes provided.

Instructions:
1. Generate HTML using the wireframe classes below. Always wrap content in a <div class="screen">.
2. Use the render_preview tool to see the rendered result as a screenshot.
3. Review the screenshot carefully. If it doesn't match what was requested, use edit_html to fix issues.
4. You may iterate up to 3 times (render → review → edit).
5. When you are satisfied with the result, respond with a brief text summary of what the screen shows.

Keep mockups clean and minimal. Use placeholder classes for images, charts, and media. Use shell classes for page-level layout, and layout utilities (stack, grid, split, cluster) for content arrangement.
${WIREFRAME_REFERENCE}`;

const anthropic = new Anthropic();

const RENDER_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "render_preview",
    description:
      "Render the current HTML to a screenshot image. Use this to see what the wireframe looks like.",
    input_schema: {
      type: "object" as const,
      properties: {
        html: {
          type: "string",
          description: "HTML fragment to render (wrapped in a .screen div)",
        },
      },
      required: ["html"],
    },
  },
  {
    name: "edit_html",
    description:
      "Edit the current HTML by search-and-replace, then automatically render a preview. Returns the updated screenshot.",
    input_schema: {
      type: "object" as const,
      properties: {
        old_text: {
          type: "string",
          description: "Text to find in the current HTML",
        },
        new_text: {
          type: "string",
          description: "Text to replace it with",
        },
      },
      required: ["old_text", "new_text"],
    },
  },
];

export async function runRenderAgent(params: {
  slug: string;
  conceptId: string;
  instructions: string;
  viewport: ViewportPreset;
  renderer: Renderer;
  existingHtml?: string;
}): Promise<{ html: string; summary: string }> {
  const { slug, conceptId, instructions, viewport, renderer, existingHtml } = params;

  let currentHtml = existingHtml ?? "";
  const tempScreenId = `temp-render-${Date.now()}`;

  async function renderPreview(html: string): Promise<Anthropic.Messages.ImageBlockParam[]> {
    currentHtml = html;
    const thumbnailPath = await renderer.enqueue({
      slug,
      conceptId,
      screenId: tempScreenId,
      html,
      viewport,
    });

    try {
      const data = await readFile(thumbnailPath);
      const base64 = data.toString("base64");
      return [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/png" as const,
            data: base64,
          },
        },
      ];
    } finally {
      // Clean up temp thumbnail
      unlink(thumbnailPath).catch(() => {});
    }
  }

  // Build the initial user message
  let userPrompt = `Create a wireframe screen with the following layout:\n\n${instructions}\n\nViewport: ${viewport}`;
  if (existingHtml) {
    userPrompt = `Edit the following wireframe screen based on these instructions:\n\n${instructions}\n\nViewport: ${viewport}\n\nCurrent HTML:\n\`\`\`html\n${existingHtml}\n\`\`\``;
  }

  const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: userPrompt }];

  // Tool loop — run until model responds with just text (no tool calls)
  for (let iteration = 0; iteration < 6; iteration++) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: RENDER_AGENT_SYSTEM,
      messages,
      tools: RENDER_TOOLS,
    });

    // Collect text and tool_use blocks
    const textParts: string[] = [];
    const toolUseBlocks: Array<{
      id: string;
      name: string;
      input: Record<string, unknown>;
    }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "tool_use") {
        toolUseBlocks.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    if (toolUseBlocks.length === 0) {
      // Done — return final HTML and summary
      return {
        html: currentHtml,
        summary: textParts.join("") || "Screen rendered successfully.",
      };
    }

    // Add assistant message to history
    messages.push({ role: "assistant", content: response.content });

    // Execute tool calls
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const tool of toolUseBlocks) {
      if (tool.name === "render_preview") {
        const input = tool.input as { html: string };
        try {
          const content = await renderPreview(input.html);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content,
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: `Error rendering preview: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          });
        }
      } else if (tool.name === "edit_html") {
        const input = tool.input as { old_text: string; new_text: string };
        if (!currentHtml.includes(input.old_text)) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: "Error: old_text not found in current HTML.",
            is_error: true,
          });
        } else {
          const newHtml = currentHtml.replace(input.old_text, input.new_text);
          try {
            const content = await renderPreview(newHtml);
            toolResults.push({
              type: "tool_result",
              tool_use_id: tool.id,
              content,
            });
          } catch (err) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: tool.id,
              content: `Error rendering preview after edit: ${err instanceof Error ? err.message : String(err)}`,
              is_error: true,
            });
          }
        }
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  // If we exhausted iterations, return whatever we have
  return {
    html: currentHtml,
    summary: "Screen rendered (iteration limit reached).",
  };
}
