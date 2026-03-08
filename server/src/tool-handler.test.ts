import type { ServerMessage } from "@mockstorm/shared";
import { describe, expect, it, vi } from "vitest";
import { ConceptStore } from "./concept-store";
import { handleToolCall } from "./tool-handler";

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
  it("add_concept creates a concept and broadcasts", async () => {
    const store = new ConceptStore();
    const hub = makeHub();
    const enqueue = vi.fn().mockResolvedValue("/tmp/test.png");

    const result = await handleToolCall(
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

  it("list_concepts returns markdown summary", async () => {
    const store = new ConceptStore();
    const hub = makeHub();
    const enqueue = vi.fn().mockResolvedValue("/tmp/test.png");

    await handleToolCall(
      "add_concept",
      { title: "Concept A", description: "First" },
      "test-slug",
      store,
      hub as never,
      enqueue,
      "./data",
    );

    const result = await handleToolCall(
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

  it("list_concepts returns empty message when none exist", async () => {
    const store = new ConceptStore();
    const hub = makeHub();

    const result = await handleToolCall(
      "list_concepts",
      {},
      "test-slug",
      store,
      hub as never,
      vi.fn().mockResolvedValue("/tmp/test.png"),
      "./data",
    );

    expect(result.content).toContain("No concepts");
  });
});
