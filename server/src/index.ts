import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

export const app = new Hono();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  serve({ fetch: app.fetch, port: Number(process.env.SERVER_PORT) || 3001 }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });
}
