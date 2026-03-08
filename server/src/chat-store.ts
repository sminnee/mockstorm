import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@mockstorm/shared";

export class ChatStore {
  private messages = new Map<string, ChatMessage[]>();
  private rawHistory = new Map<string, Anthropic.Messages.MessageParam[]>();
  private dataDir = "";

  async load(dataDir: string): Promise<void> {
    this.dataDir = dataDir;
    const { readdir } = await import("node:fs/promises");
    const workspacesDir = join(dataDir, "workspaces");
    try {
      const slugs = await readdir(workspacesDir);
      for (const slug of slugs) {
        // Load display messages
        try {
          const content = await readFile(join(workspacesDir, slug, "chat.json"), "utf-8");
          this.messages.set(slug, JSON.parse(content) as ChatMessage[]);
        } catch {
          // no chat history yet
        }
        // Load raw API history
        try {
          const content = await readFile(join(workspacesDir, slug, "chat-raw.json"), "utf-8");
          this.rawHistory.set(slug, JSON.parse(content) as Anthropic.Messages.MessageParam[]);
        } catch {
          // no raw history yet
        }
      }
    } catch {
      // data dir doesn't exist yet
    }
  }

  getMessages(slug: string): ChatMessage[] {
    return this.messages.get(slug) ?? [];
  }

  getRawHistory(slug: string): Anthropic.Messages.MessageParam[] {
    return this.rawHistory.get(slug) ?? [];
  }

  addMessage(slug: string, message: ChatMessage): void {
    if (!this.messages.has(slug)) this.messages.set(slug, []);
    this.messages.get(slug)?.push(message);
    void this.persist(slug);
  }

  addRawMessages(slug: string, messages: Anthropic.Messages.MessageParam[]): void {
    if (!this.rawHistory.has(slug)) this.rawHistory.set(slug, []);
    const history = this.rawHistory.get(slug);
    if (history) {
      history.push(...messages);
    }
    void this.persistRaw(slug);
  }

  private async persist(slug: string): Promise<void> {
    if (!this.dataDir) return;
    const msgs = this.messages.get(slug);
    if (!msgs) return;
    const dir = join(this.dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "chat.json"), `${JSON.stringify(msgs, null, 2)}\n`);
  }

  private async persistRaw(slug: string): Promise<void> {
    if (!this.dataDir) return;
    const raw = this.rawHistory.get(slug);
    if (!raw) return;
    const dir = join(this.dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "chat-raw.json"), `${JSON.stringify(raw, null, 2)}\n`);
  }
}
