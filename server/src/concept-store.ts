import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Concept, Screen, ViewportPreset } from "@mockstorm/shared";

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

  deleteConcept(slug: string, conceptId: string): boolean {
    const concepts = this.concepts.get(slug);
    if (!concepts) return false;
    const idx = concepts.findIndex((c) => c.id === conceptId);
    if (idx === -1) return false;
    concepts.splice(idx, 1);
    void this.persist(slug);
    return true;
  }

  deleteScreen(slug: string, conceptId: string, screenId: string): boolean {
    const concepts = this.concepts.get(slug);
    if (!concepts) return false;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return false;
    const idx = concept.screens.findIndex((s) => s.id === screenId);
    if (idx === -1) return false;
    concept.screens.splice(idx, 1);
    void this.persist(slug);
    return true;
  }

  updateConcept(
    slug: string,
    conceptId: string,
    fields: { title?: string; description?: string },
  ): boolean {
    const concepts = this.concepts.get(slug);
    if (!concepts) return false;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return false;
    if (fields.title !== undefined) concept.title = fields.title;
    if (fields.description !== undefined) concept.description = fields.description;
    void this.persist(slug);
    return true;
  }

  updateScreen(
    slug: string,
    conceptId: string,
    screenId: string,
    fields: { title?: string; description?: string; viewport?: ViewportPreset },
  ): Screen | undefined {
    const concepts = this.concepts.get(slug);
    if (!concepts) return undefined;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return undefined;
    const screen = concept.screens.find((s) => s.id === screenId);
    if (!screen) return undefined;
    if (fields.title !== undefined) screen.title = fields.title;
    if (fields.description !== undefined) screen.description = fields.description;
    if (fields.viewport !== undefined) screen.viewport = fields.viewport;
    void this.persist(slug);
    return screen;
  }

  replaceScreenHtml(
    slug: string,
    conceptId: string,
    screenId: string,
    oldText: string,
    newText: string,
  ): Screen | false {
    const concepts = this.concepts.get(slug);
    if (!concepts) return false;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return false;
    const screen = concept.screens.find((s) => s.id === screenId);
    if (!screen) return false;
    if (!screen.html.includes(oldText)) return false;
    screen.html = screen.html.replace(oldText, newText);
    void this.persist(slug);
    return screen;
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
