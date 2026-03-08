import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkspaceStore } from "./workspace-store";

describe("WorkspaceStore", () => {
  it("creates a workspace with a unique slug", () => {
    const store = new WorkspaceStore();
    const ws = store.create("My Workspace");
    expect(ws.slug).toBeTruthy();
    expect(ws.name).toBe("My Workspace");
    expect(ws.title).toBe("My Workspace");
    expect(ws.description).toBe("");
    expect(ws.createdAt).toBeTruthy();
  });

  it("gets a workspace by slug", () => {
    const store = new WorkspaceStore();
    const ws = store.create("Test");
    const found = store.get(ws.slug);
    expect(found).toEqual(ws);
  });

  it("returns undefined for unknown slug", () => {
    const store = new WorkspaceStore();
    expect(store.get("unknown")).toBeUndefined();
  });

  it("updates workspace fields", () => {
    const store = new WorkspaceStore();
    const ws = store.create("Original");
    const updated = store.update(ws.slug, { title: "New Title", description: "New desc" });
    expect(updated?.title).toBe("New Title");
    expect(updated?.description).toBe("New desc");
    expect(store.get(ws.slug)?.title).toBe("New Title");
  });

  it("returns undefined when updating unknown slug", () => {
    const store = new WorkspaceStore();
    expect(store.update("nope", { title: "X" })).toBeUndefined();
  });

  it("persists and loads workspaces", async () => {
    const dataDir = join(tmpdir(), `ws-test-${Date.now()}`);
    const store1 = new WorkspaceStore();
    await store1.load(dataDir);
    const ws = store1.create("Persisted");
    // wait for persist to complete
    await new Promise((r) => setTimeout(r, 50));

    const store2 = new WorkspaceStore();
    await store2.load(dataDir);
    expect(store2.get(ws.slug)).toEqual(ws);
  });
});
