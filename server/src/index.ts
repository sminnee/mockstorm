import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { WorkspaceStore } from "./workspace-store";
import { attachWsServer } from "./ws-server";

export function createApp(store: WorkspaceStore) {
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

  return app;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const store = new WorkspaceStore();
  await store.load("./data");

  const app = createApp(store);

  const httpServer = serve(
    { fetch: app.fetch, port: Number(process.env.SERVER_PORT) || 3001 },
    (info) => {
      console.log(`Server running on http://localhost:${info.port}`);
    },
  );

  attachWsServer(httpServer, store);
}
