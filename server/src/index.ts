import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import type { Concept } from "@mockstorm/shared";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { ChatStore } from "./chat-store";
import { ConceptStore } from "./concept-store";
import { slugify, streamConceptZip, wrapHtmlWithInlineCss } from "./download";
import { Renderer } from "./renderer";
import { wireframeCss } from "./wireframe-css";
import type { WorkspaceHub } from "./workspace-hub";
import { WorkspaceStore } from "./workspace-store";
import { attachWsServer } from "./ws-server";

export function createApp(store: WorkspaceStore, dataDir: string, conceptStore?: ConceptStore) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ status: "ok" });
  });

  app.post("/api/workspaces", async (c) => {
    const body = await c.req.json<{ name: string }>();
    const workspace = store.create(body.name);
    return c.json({ slug: workspace.slug, workspace }, 201);
  });

  app.post("/api/workspaces/info", async (c) => {
    const body = await c.req.json<{ slugs: string[] }>();
    const workspaces = store.getMany(body.slugs);
    return c.json(
      workspaces.map((w) => {
        const concepts = conceptStore?.getConcepts(w.slug) ?? [];
        const screenCount = concepts.reduce((sum, co) => sum + co.screens.length, 0);
        let thumbnailUrl: string | null = null;
        for (const co of concepts) {
          for (const s of co.screens) {
            if (s.thumbnailUrl) {
              thumbnailUrl = `/api/workspaces/${w.slug}/screens/${s.id}/thumbnail.png`;
              break;
            }
          }
          if (thumbnailUrl) break;
        }
        return {
          slug: w.slug,
          title: w.title,
          description: w.description,
          conceptCount: concepts.length,
          screenCount,
          thumbnailUrl,
          createdAt: w.createdAt,
        };
      }),
    );
  });

  app.get("/api/workspaces/:slug", (c) => {
    const slug = c.req.param("slug");
    const workspace = store.get(slug);
    if (!workspace) return c.json({ error: "Not found" }, 404);
    return c.json(workspace);
  });

  app.get("/api/wireframe.css", (c) => {
    return c.text(wireframeCss, 200, { "Content-Type": "text/css" });
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
          return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/api/wireframe.css">
</head>
<body>
${screen.html}
</body>
</html>`);
        }
      }
      return c.json({ error: "Screen not found" }, 404);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });

  // Download: concept ZIP bundle
  app.get("/api/workspaces/:slug/concepts/:conceptId/download.zip", async (c) => {
    const slug = c.req.param("slug");
    const conceptId = c.req.param("conceptId");
    const conceptsPath = join(dataDir, "workspaces", slug, "concepts.json");
    try {
      const content = await readFile(conceptsPath, "utf-8");
      const concepts = JSON.parse(content) as Concept[];
      const concept = concepts.find((co) => co.id === conceptId);
      if (!concept) return c.json({ error: "Concept not found" }, 404);

      const zipStream = await streamConceptZip(concept, slug, dataDir, wireframeCss);
      const filename = `${slugify(concept.title) || concept.id}.zip`;
      c.header("Content-Type", "application/zip");
      c.header("Content-Disposition", `attachment; filename="${filename}"`);
      return stream(c, async (s) => {
        const readable = Readable.from(zipStream);
        for await (const chunk of readable) {
          await s.write(chunk as Uint8Array);
        }
      });
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });

  // Download: single screen HTML with inlined CSS
  app.get("/api/workspaces/:slug/screens/:screenId/download.html", async (c) => {
    const slug = c.req.param("slug");
    const screenId = c.req.param("screenId");
    const conceptsPath = join(dataDir, "workspaces", slug, "concepts.json");
    try {
      const content = await readFile(conceptsPath, "utf-8");
      const concepts = JSON.parse(content) as Concept[];
      for (const concept of concepts) {
        const screen = concept.screens.find((s) => s.id === screenId);
        if (screen) {
          const filename = `${slugify(screen.title) || screen.id}.html`;
          const html = wrapHtmlWithInlineCss(screen.html, wireframeCss);
          c.header("Content-Disposition", `attachment; filename="${filename}"`);
          return c.html(html);
        }
      }
      return c.json({ error: "Screen not found" }, 404);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });

  // Download: screen thumbnail with Content-Disposition when ?download=true
  app.get("/api/workspaces/:slug/screens/:screenId/thumbnail.png", async (c) => {
    const slug = c.req.param("slug");
    const screenId = c.req.param("screenId");
    const thumbnailPath = join(dataDir, "workspaces", slug, "thumbnails", `${screenId}.png`);
    try {
      const data = await readFile(thumbnailPath);
      const headers: Record<string, string> = { "Content-Type": "image/png" };
      if (c.req.query("download") === "true") {
        headers["Content-Disposition"] = `attachment; filename="${screenId}.png"`;
      }
      return c.body(data, 200, headers);
    } catch {
      return c.json({ error: "Thumbnail not found" }, 404);
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

  const app = createApp(store, dataDir, conceptStore);

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
