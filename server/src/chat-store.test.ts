import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ChatStore } from "./chat-store";

function makeMessage(
  overrides: Partial<{ id: string; role: "user" | "assistant"; content: string }> = {},
) {
  return {
    id: overrides.id ?? "msg-1",
    role: overrides.role ?? "user",
    content: overrides.content ?? "hello",
    createdAt: "2025-01-01T00:00:00.000Z",
  };
}

describe("ChatStore", () => {
  it("returns empty array for unknown slug", () => {
    const store = new ChatStore();
    expect(store.getMessages("unknown")).toEqual([]);
  });

  it("adds and retrieves messages", () => {
    const store = new ChatStore();
    const msg = makeMessage();
    store.addMessage("test-slug", msg);
    expect(store.getMessages("test-slug")).toEqual([msg]);
  });

  it("appends multiple messages", () => {
    const store = new ChatStore();
    const msg1 = makeMessage({ id: "msg-1", content: "first" });
    const msg2 = makeMessage({ id: "msg-2", role: "assistant", content: "second" });
    store.addMessage("test-slug", msg1);
    store.addMessage("test-slug", msg2);
    expect(store.getMessages("test-slug")).toHaveLength(2);
    expect(store.getMessages("test-slug")[1]?.content).toBe("second");
  });

  it("persists and loads messages", async () => {
    const dataDir = join(tmpdir(), `chat-test-${Date.now()}`);
    const slug = "persist-test";

    // create workspace dir so load can find it
    await mkdir(join(dataDir, "workspaces", slug), { recursive: true });

    const store1 = new ChatStore();
    await store1.load(dataDir);
    const msg = makeMessage({ content: "persisted message" });
    store1.addMessage(slug, msg);

    // wait for async persist
    await new Promise((r) => setTimeout(r, 50));

    const store2 = new ChatStore();
    await store2.load(dataDir);
    expect(store2.getMessages(slug)).toEqual([msg]);
  });

  it("loads from existing chat.json files", async () => {
    const dataDir = join(tmpdir(), `chat-load-${Date.now()}`);
    const slug = "existing";
    const dir = join(dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });

    const messages = [makeMessage({ id: "pre-existing", content: "already here" })];
    await writeFile(join(dir, "chat.json"), JSON.stringify(messages));

    const store = new ChatStore();
    await store.load(dataDir);
    expect(store.getMessages(slug)).toEqual(messages);
  });
});
