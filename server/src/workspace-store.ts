import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Workspace } from "@mockstorm/shared";
import { generateSlug } from "./slug";

export class WorkspaceStore {
  private workspaces = new Map<string, Workspace>();
  private dataDir = "";

  async load(dataDir: string): Promise<void> {
    this.dataDir = dataDir;
    const { readdir } = await import("node:fs/promises");
    const workspacesDir = join(dataDir, "workspaces");
    try {
      const slugs = await readdir(workspacesDir);
      for (const slug of slugs) {
        const filePath = join(workspacesDir, slug, "workspace.json");
        try {
          const content = await readFile(filePath, "utf-8");
          const workspace = JSON.parse(content) as Workspace;
          this.workspaces.set(slug, workspace);
        } catch {
          // skip unreadable files
        }
      }
    } catch {
      // data dir doesn't exist yet — that's fine
    }
  }

  create(name: string): Workspace {
    let slug = generateSlug();
    while (this.workspaces.has(slug)) {
      slug = generateSlug();
    }
    const workspace: Workspace = {
      slug,
      name,
      title: name,
      description: "",
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(slug, workspace);
    void this.persist(slug);
    return workspace;
  }

  get(slug: string): Workspace | undefined {
    return this.workspaces.get(slug);
  }

  update(
    slug: string,
    fields: Partial<Pick<Workspace, "title" | "description">>,
  ): Workspace | undefined {
    const workspace = this.workspaces.get(slug);
    if (!workspace) return undefined;
    if (fields.title !== undefined) workspace.title = fields.title;
    if (fields.description !== undefined) workspace.description = fields.description;
    void this.persist(slug);
    return workspace;
  }

  private async persist(slug: string): Promise<void> {
    if (!this.dataDir) return;
    const workspace = this.workspaces.get(slug);
    if (!workspace) return;
    const dir = join(this.dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "workspace.json"), `${JSON.stringify(workspace, null, 2)}\n`);
  }
}
