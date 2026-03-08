import type { ServerMessage } from "@mockstorm/shared";
import { describe, expect, it, vi } from "vitest";
import { ConceptStore } from "./concept-store";
import { type RenderJob, handleToolCall } from "./tool-handler";

function makeHub() {
  const messages: ServerMessage[] = [];
  return {
    broadcast(_slug: string, msg: ServerMessage) {
      messages.push(msg);
    },
    subscribe() {},
    unsubscribe() {},
    messages,
  };
}

describe("handleToolCall", () => {
  it("add_concept creates a concept and broadcasts", () => {
    const store = new ConceptStore();
    const hub = makeHub();
    const enqueue = vi.fn();

    const result = handleToolCall(
      "add_concept",
      { title: "Login Page", description: "A login form" },
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    expect(result.content).toContain("Login Page");
    expect(store.getConcepts("test-slug")).toHaveLength(1);
    expect(hub.messages).toHaveLength(1);
    expect(hub.messages[0]?.type).toBe("conceptAdded");
  });

  it("add_screen creates a screen and enqueues render", () => {
    const store = new ConceptStore();
    const hub = makeHub();
    const jobs: RenderJob[] = [];
    const enqueue = (job: RenderJob) => jobs.push(job);

    // First create a concept
    handleToolCall(
      "add_concept",
      { title: "Test", description: "Test" },
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    const conceptId = store.getConcepts("test-slug")[0]?.id;

    const result = handleToolCall(
      "add_screen",
      {
        concept_id: conceptId,
        title: "Home Screen",
        description: "Main page",
        html: "<h1>Home</h1>",
      },
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    expect(result.content).toContain("Home Screen");
    expect(store.getConcepts("test-slug")[0]?.screens).toHaveLength(1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.html).toBe("<h1>Home</h1>");
  });

  it("add_screen returns error for missing concept", () => {
    const store = new ConceptStore();
    const hub = makeHub();

    const result = handleToolCall(
      "add_screen",
      {
        concept_id: "nonexistent",
        title: "X",
        description: "X",
        html: "<div/>",
      },
      "test-slug",
      store,
      hub as never,
      vi.fn(),
      "./data",
    );

    expect(result.content).toContain("not found");
  });

  it("list_concepts returns markdown summary", () => {
    const store = new ConceptStore();
    const hub = makeHub();
    const enqueue = vi.fn();

    handleToolCall(
      "add_concept",
      { title: "Concept A", description: "First" },
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    const result = handleToolCall(
      "list_concepts",
      {},
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    expect(result.content).toContain("Concept A");
  });

  it("list_concepts returns empty message when none exist", () => {
    const store = new ConceptStore();
    const hub = makeHub();

    const result = handleToolCall(
      "list_concepts",
      {},
      "test-slug",
      store,
      hub as never,
      vi.fn(),
      "./data",
    );

    expect(result.content).toContain("No concepts");
  });
});
