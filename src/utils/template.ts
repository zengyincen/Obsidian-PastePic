export type TemplateVariables = Record<string, string | number | undefined>;

export function applyTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{([a-zA-Z][\w]*)\}/g, (match, key: string) => {
    const value = variables[key];
    return value === undefined ? match : String(value);
  });
}

export function encodePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function joinPath(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split("/"))
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

export function filenameExtension(filename: string, mimeType: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (match) return `.${match[1]}`;

  const mimeExtensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/avif": ".avif",
  };

  return mimeExtensions[mimeType.toLowerCase()] ?? ".png";
}

export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#%{}\[\]]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return sanitized || "image";
}

export function formatDateVariables(date: Date): Record<string, string> {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return {
    year: String(date.getFullYear()),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
    second: pad(date.getSeconds()),
    timestamp: String(date.getTime()),
  };
}

export function createRemoteFilename(
  originalName: string,
  mimeType: string,
  strategy: "timestamp" | "timestamp-original" | "original",
  date = new Date(),
  random = Math.random().toString(36).slice(2, 8),
): string {
  const ext = filenameExtension(originalName, mimeType);
  const baseWithExt = sanitizeFilename(originalName || `image${ext}`);
  const base = baseWithExt.toLowerCase().endsWith(ext) ? baseWithExt.slice(0, -ext.length) : baseWithExt;
  const prefix = `${date.getTime()}-${random}`;

  if (strategy === "original") return `${base}${ext}`;
  if (strategy === "timestamp") return `${prefix}${ext}`;
  return `${prefix}-${base}${ext}`;
}

export function escapeMarkdownAlt(value: string): string {
  return value.replace(/[\]\\]/g, "\\$&").replace(/[\r\n]+/g, " ");
}
