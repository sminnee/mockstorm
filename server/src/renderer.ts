import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { RenderJob } from "./tool-handler";

interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface Page {
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
  screenshot(options: { path: string }): Promise<Buffer>;
  close(): Promise<void>;
}

function wrapHtml(fragment: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; }
  </style>
</head>
<body>
${fragment}
</body>
</html>`;
}

export class Renderer {
  private browser: Browser | null = null;
  private queue: Array<{
    job: RenderJob;
    resolve: (thumbnailPath: string) => void;
    reject: (err: Error) => void;
  }> = [];
  private processing = false;
  private dataDir: string;
  private onComplete: (
    slug: string,
    conceptId: string,
    screenId: string,
    thumbnailUrl: string,
  ) => void;

  constructor(
    dataDir: string,
    onComplete: (slug: string, conceptId: string, screenId: string, thumbnailUrl: string) => void,
  ) {
    this.dataDir = dataDir;
    this.onComplete = onComplete;
  }

  enqueue(job: RenderJob): void {
    this.queue.push({
      job,
      resolve: () => {},
      reject: () => {},
    });
    if (!this.processing) {
      void this.processQueue();
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        const { chromium } = await import("playwright");
        this.browser = (await chromium.launch()) as unknown as Browser;
      } catch (err) {
        console.error("[renderer] Failed to launch browser:", err);
        throw err;
      }
    }
    return this.browser;
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      const { job } = item;
      try {
        const browser = await this.ensureBrowser();
        const page = await browser.newPage();

        await page.setViewportSize({ width: 800, height: 600 });
        await page.setContent(wrapHtml(job.html), {
          waitUntil: "networkidle",
        });

        const thumbnailDir = join(this.dataDir, "workspaces", job.slug, "thumbnails");
        await mkdir(thumbnailDir, { recursive: true });

        const thumbnailPath = join(thumbnailDir, `${job.screenId}.png`);
        await page.screenshot({ path: thumbnailPath });
        await page.close();

        const thumbnailUrl = `/api/workspaces/${job.slug}/screens/${job.screenId}/thumbnail.png`;
        this.onComplete(job.slug, job.conceptId, job.screenId, thumbnailUrl);
        item.resolve(thumbnailPath);
      } catch (err) {
        console.error(`[renderer] Failed to render screen ${job.screenId}:`, err);
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }

    this.processing = false;
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
