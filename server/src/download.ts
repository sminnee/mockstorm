import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import type { Readable } from "node:stream";
import type { Concept } from "@mockstorm/shared";
import archiver from "archiver";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function wrapHtmlWithInlineCss(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;
}

function wrapHtmlWithCssLink(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../wireframe.css">
</head>
<body>
${html}
</body>
</html>`;
}

function deduplicateFilename(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let i = 2;
  while (used.has(`${name}-${i}`)) i++;
  const deduplicated = `${name}-${i}`;
  used.add(deduplicated);
  return deduplicated;
}

function generateReadme(concept: Concept): string {
  const lines: string[] = [`# ${concept.title}`, ""];
  if (concept.description) {
    lines.push(concept.description, "");
  }
  if (concept.screens.length > 0) {
    lines.push("## Screens", "", "| Screen | Description |", "|--------|-------------|");
    for (const screen of concept.screens) {
      lines.push(`| ${screen.title} | ${screen.description || "-"} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function streamConceptZip(
  concept: Concept,
  slug: string,
  dataDir: string,
  wireframeCss: string,
): Promise<Readable> {
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.append(wireframeCss, { name: "wireframe.css" });
  archive.append(generateReadme(concept), { name: "README.md" });

  const usedNames = new Set<string>();
  for (const screen of concept.screens) {
    const baseName = slugify(screen.title) || screen.id;
    const fileName = deduplicateFilename(baseName, usedNames);

    archive.append(wrapHtmlWithCssLink(screen.html), {
      name: `screens/${fileName}.html`,
    });

    const thumbnailPath = join(dataDir, "workspaces", slug, "thumbnails", `${screen.id}.png`);
    try {
      await access(thumbnailPath);
      archive.append(createReadStream(thumbnailPath), {
        name: `images/${fileName}.png`,
      });
    } catch {
      // Skip missing thumbnails
    }
  }

  archive.finalize();
  return archive as unknown as Readable;
}
