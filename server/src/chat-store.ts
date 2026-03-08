import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChatMessage } from "@mockstorm/shared";

export class ChatStore {
  private messages = new Map<string, ChatMessage[]>();
  private dataDir = "";

  async load(dataDir: string): Promise<void> {
    this.dataDir = dataDir;
    const { readdir } = await import("node:fs/promises");
    const workspacesDir = join(dataDir, "workspaces");
    try {
      const slugs = await readdir(workspacesDir);
      for (const slug of slugs) {
        const filePath = join(workspacesDir, slug, "chat.json");
        try {
          const content = await readFile(filePath, "utf-8");
          const msgs = JSON.parse(content) as ChatMessage[];
          this.messages.set(slug, msgs);
        } catch {
          // no chat history yet — that's fine
        }
      }
    } catch {
      // data dir doesn't exist yet
    }
  }

  getMessages(slug: string): ChatMessage[] {
    return this.messages.get(slug) ?? [];
  }

  addMessage(slug: string, message: ChatMessage): void {
    if (!this.messages.has(slug)) this.messages.set(slug, []);
    this.messages.get(slug)?.push(message);
    void this.persist(slug);
  }

  private async persist(slug: string): Promise<void> {
    if (!this.dataDir) return;
    const msgs = this.messages.get(slug);
    if (!msgs) return;
    const dir = join(this.dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "chat.json"), `${JSON.stringify(msgs, null, 2)}\n`);
  }
}
