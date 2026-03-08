import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ChatStore } from "./chat-store";
import { ConceptStore } from "./concept-store";
import { Renderer } from "./renderer";
import type { WorkspaceHub } from "./workspace-hub";
import { WorkspaceStore } from "./workspace-store";
import { attachWsServer } from "./ws-server";

export function createApp(store: WorkspaceStore, dataDir: string) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ status: "ok" });
  });

  app.post("/api/workspaces", async (c) => {
    const body = await c.req.json<{ name: string }>();
    const workspace = store.create(body.name);
    return c.json({ slug: workspace.slug, workspace }, 201);
  });

  app.get("/api/workspaces/:slug", (c) => {
    const slug = c.req.param("slug");
    const workspace = store.get(slug);
    if (!workspace) return c.json({ error: "Not found" }, 404);
    return c.json(workspace);
  });

  app.get("/api/workspaces/:slug/screens/:screenId/thumbnail.png", async (c) => {
    const slug = c.req.param("slug");
    const screenId = c.req.param("screenId");
    const thumbnailPath = join(dataDir, "workspaces", slug, "thumbnails", `${screenId}.png`);
    try {
      const data = await readFile(thumbnailPath);
      return c.body(data, 200, { "Content-Type": "image/png" });
    } catch {
      return c.json({ error: "Thumbnail not found" }, 404);
    }
  });

  app.get("/api/workspaces/:slug/screens/:screenId/html", async (c) => {
    const slug = c.req.param("slug");
    const screenId = c.req.param("screenId");
    const conceptsPath = join(dataDir, "workspaces", slug, "concepts.json");
    try {
      const content = await readFile(conceptsPath, "utf-8");
      const concepts = JSON.parse(content) as Array<{
        screens: Array<{ id: string; html: string }>;
      }>;
      for (const concept of concepts) {
        const screen = concept.screens.find((s) => s.id === screenId);
        if (screen) {
          return c.html(screen.html);
        }
      }
      return c.json({ error: "Screen not found" }, 404);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });

  return app;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const dataDir = "./data";
  const store = new WorkspaceStore();
  const chatStore = new ChatStore();
  const conceptStore = new ConceptStore();
  await store.load(dataDir);
  await chatStore.load(dataDir);
  await conceptStore.load(dataDir);

  // Hub reference set after attachWsServer returns it
  let hub: WorkspaceHub | null = null;

  const renderer = new Renderer(dataDir, (slug, conceptId, screenId, thumbnailUrl) => {
    conceptStore.updateScreenThumbnail(slug, conceptId, screenId, thumbnailUrl);
    hub?.broadcast(slug, {
      type: "screenThumbnailReady",
      conceptId,
      screenId,
      thumbnailUrl,
    });
  });

  const app = createApp(store, dataDir);

  const httpServer = serve(
    {
      fetch: app.fetch,
      port: Number(process.env.SERVER_PORT) || 3001,
    },
    (info) => {
      console.log(`Server running on http://localhost:${info.port}`);
    },
  );

  hub = attachWsServer(httpServer, store, chatStore, conceptStore, renderer, dataDir);
}
