export function parseObjectJson(value: string, fieldName: string): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || "{}");
  } catch {
    throw new Error(`${fieldName}不是有效的 JSON`);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${fieldName}必须是 JSON 对象`);
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.some(([, entry]) => typeof entry !== "string" && typeof entry !== "number" && typeof entry !== "boolean")) {
    throw new Error(`${fieldName}中的值只能是字符串、数字或布尔值`);
  }

  return Object.fromEntries(entries.map(([key, entry]) => [key, String(entry)]));
}

export function getJsonPath(value: unknown, path: string): unknown {
  if (!path.trim()) return value;

  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((current, key) => {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      return (current as Record<string, unknown>)[key];
    }, value);
}
