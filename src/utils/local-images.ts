export interface EmbeddedImageReference {
  source: string;
  linkPath: string;
}

const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"'\n]*["'])?\s*\)/g;
const WIKI_IMAGE = /!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]*)?\]\]/g;

function normalizeLocalPath(value: string): string | null {
  const trimmed = value.trim();
  if (/^(?:https?:|data:|blob:|app:|obsidian:)/i.test(trimmed)) return null;
  const withoutSubpath = trimmed.split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(withoutSubpath);
  } catch {
    return withoutSubpath;
  }
}

export function extractLocalImageReferences(content: string): EmbeddedImageReference[] {
  const references: EmbeddedImageReference[] = [];

  for (const match of content.matchAll(MARKDOWN_IMAGE)) {
    const linkPath = normalizeLocalPath(match[1] ?? match[2] ?? "");
    if (linkPath) references.push({ source: match[0], linkPath });
  }
  for (const match of content.matchAll(WIKI_IMAGE)) {
    const linkPath = normalizeLocalPath(match[1] ?? "");
    if (linkPath) references.push({ source: match[0], linkPath });
  }

  return references;
}

export function countReferenceSources(
  references: EmbeddedImageReference[],
): Map<string, number> {
  const counts = new Map<string, number>();
  references.forEach(({ source }) => counts.set(source, (counts.get(source) ?? 0) + 1));
  return counts;
}

export function newlyAddedReferences(
  references: EmbeddedImageReference[],
  previousCounts: Map<string, number>,
): EmbeddedImageReference[] {
  const currentCounts = countReferenceSources(references);
  const remaining = new Map<string, number>();
  currentCounts.forEach((count, source) => {
    remaining.set(source, Math.max(0, count - (previousCounts.get(source) ?? 0)));
  });

  const result: EmbeddedImageReference[] = [];
  const needed = new Map(remaining);
  for (let index = references.length - 1; index >= 0; index -= 1) {
    const reference = references[index];
    const count = needed.get(reference.source) ?? 0;
    if (count > 0) {
      result.push(reference);
      needed.set(reference.source, count - 1);
    }
  }
  return result.reverse();
}

export const LEGACY_GITHUB_ERROR_MARKER = /\[(?:GitHub|Github) upload error\]\(\)\s*\n?/gi;
