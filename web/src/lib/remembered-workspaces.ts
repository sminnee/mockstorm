const STORAGE_KEY = "mockstorm:workspaces";

export function getRememberedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function rememberWorkspace(slug: string): void {
  const slugs = getRememberedSlugs().filter((s) => s !== slug);
  slugs.unshift(slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
}

export function forgetWorkspace(slug: string): void {
  const slugs = getRememberedSlugs().filter((s) => s !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
}
