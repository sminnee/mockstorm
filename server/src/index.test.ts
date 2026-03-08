import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./index";
import { WorkspaceStore } from "./workspace-store";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(new WorkspaceStore(), "./data");
});

describe("GET /", () => {
  it("returns status ok", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});

describe("POST /api/workspaces", () => {
  it("creates a workspace and returns 201", async () => {
    const res = await app.request("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Workspace" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { slug: string; workspace: { name: string } };
    expect(body.slug).toBeTruthy();
    expect(body.workspace.name).toBe("My Workspace");
  });
});

describe("GET /api/workspaces/:slug", () => {
  it("returns workspace when found", async () => {
    const createRes = await app.request("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test WS" }),
    });
    const { slug } = (await createRes.json()) as { slug: string };

    const res = await app.request(`/api/workspaces/${slug}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slug: string };
    expect(body.slug).toBe(slug);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await app.request("/api/workspaces/doesnotexist");
    expect(res.status).toBe(404);
  });
});
