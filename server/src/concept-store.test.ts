import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Concept, Screen } from "@mockstorm/shared";
import { describe, expect, it } from "vitest";
import { ConceptStore } from "./concept-store";

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: overrides.id ?? "concept-1",
    title: overrides.title ?? "Test Concept",
    description: overrides.description ?? "A test concept",
    screens: overrides.screens ?? [],
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00.000Z",
  };
}

function makeScreen(overrides: Partial<Screen> = {}): Screen {
  return {
    id: overrides.id ?? "screen-1",
    title: overrides.title ?? "Test Screen",
    description: overrides.description ?? "A test screen",
    html: overrides.html ?? "<div>Hello</div>",
    thumbnailUrl: overrides.thumbnailUrl ?? null,
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00.000Z",
  };
}

describe("ConceptStore", () => {
  it("returns empty array for unknown slug", () => {
    const store = new ConceptStore();
    expect(store.getConcepts("unknown")).toEqual([]);
  });

  it("adds and retrieves concepts", () => {
    const store = new ConceptStore();
    const concept = makeConcept();
    store.addConcept("test-slug", concept);
    expect(store.getConcepts("test-slug")).toEqual([concept]);
  });

  it("adds screen to concept", () => {
    const store = new ConceptStore();
    const concept = makeConcept();
    store.addConcept("test-slug", concept);

    const screen = makeScreen();
    const result = store.addScreen("test-slug", "concept-1", screen);
    expect(result).toBe(true);
    expect(store.getConcepts("test-slug")[0]?.screens).toEqual([screen]);
  });

  it("returns false when adding screen to non-existent concept", () => {
    const store = new ConceptStore();
    const screen = makeScreen();
    expect(store.addScreen("test-slug", "no-concept", screen)).toBe(false);
  });

  it("updates screen thumbnail", () => {
    const store = new ConceptStore();
    const concept = makeConcept({ screens: [makeScreen()] });
    store.addConcept("test-slug", concept);

    store.updateScreenThumbnail("test-slug", "concept-1", "screen-1", "/thumbnails/screen-1.png");
    expect(store.getConcepts("test-slug")[0]?.screens[0]?.thumbnailUrl).toBe(
      "/thumbnails/screen-1.png",
    );
  });

  it("gets a specific screen", () => {
    const store = new ConceptStore();
    const screen = makeScreen();
    const concept = makeConcept({ screens: [screen] });
    store.addConcept("test-slug", concept);

    expect(store.getScreen("test-slug", "concept-1", "screen-1")).toEqual(screen);
    expect(store.getScreen("test-slug", "concept-1", "no-screen")).toBeUndefined();
  });

  it("persists and loads concepts", async () => {
    const dataDir = join(tmpdir(), `concept-test-${Date.now()}`);
    const slug = "persist-test";
    await mkdir(join(dataDir, "workspaces", slug), { recursive: true });

    const store1 = new ConceptStore();
    await store1.load(dataDir);
    const concept = makeConcept({ screens: [makeScreen()] });
    store1.addConcept(slug, concept);

    await new Promise((r) => setTimeout(r, 50));

    const store2 = new ConceptStore();
    await store2.load(dataDir);
    expect(store2.getConcepts(slug)).toEqual([concept]);
  });

  it("loads from existing concepts.json", async () => {
    const dataDir = join(tmpdir(), `concept-load-${Date.now()}`);
    const slug = "existing";
    const dir = join(dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });

    const concepts = [makeConcept({ id: "pre-existing" })];
    await writeFile(join(dir, "concepts.json"), JSON.stringify(concepts));

    const store = new ConceptStore();
    await store.load(dataDir);
    expect(store.getConcepts(slug)).toEqual(concepts);
  });
});
