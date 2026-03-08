import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Concept, Screen } from "@mockstorm/shared";

export class ConceptStore {
  private concepts = new Map<string, Concept[]>();
  private dataDir = "";

  async load(dataDir: string): Promise<void> {
    this.dataDir = dataDir;
    const { readdir } = await import("node:fs/promises");
    const workspacesDir = join(dataDir, "workspaces");
    try {
      const slugs = await readdir(workspacesDir);
      for (const slug of slugs) {
        const filePath = join(workspacesDir, slug, "concepts.json");
        try {
          const content = await readFile(filePath, "utf-8");
          const concepts = JSON.parse(content) as Concept[];
          this.concepts.set(slug, concepts);
        } catch {
          // no concepts yet
        }
      }
    } catch {
      // data dir doesn't exist yet
    }
  }

  getConcepts(slug: string): Concept[] {
    return this.concepts.get(slug) ?? [];
  }

  addConcept(slug: string, concept: Concept): void {
    if (!this.concepts.has(slug)) this.concepts.set(slug, []);
    this.concepts.get(slug)?.push(concept);
    void this.persist(slug);
  }

  addScreen(slug: string, conceptId: string, screen: Screen): boolean {
    const concepts = this.concepts.get(slug);
    if (!concepts) return false;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return false;
    concept.screens.push(screen);
    void this.persist(slug);
    return true;
  }

  updateScreenThumbnail(
    slug: string,
    conceptId: string,
    screenId: string,
    thumbnailUrl: string,
  ): void {
    const concepts = this.concepts.get(slug);
    if (!concepts) return;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;
    const screen = concept.screens.find((s) => s.id === screenId);
    if (!screen) return;
    screen.thumbnailUrl = thumbnailUrl;
    void this.persist(slug);
  }

  getScreen(slug: string, conceptId: string, screenId: string): Screen | undefined {
    const concepts = this.concepts.get(slug);
    if (!concepts) return undefined;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return undefined;
    return concept.screens.find((s) => s.id === screenId);
  }

  private async persist(slug: string): Promise<void> {
    if (!this.dataDir) return;
    const concepts = this.concepts.get(slug);
    if (!concepts) return;
    const dir = join(this.dataDir, "workspaces", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "concepts.json"), `${JSON.stringify(concepts, null, 2)}\n`);
  }
}
