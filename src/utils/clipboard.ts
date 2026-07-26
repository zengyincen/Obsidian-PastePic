/**
 * Return image files exposed by a paste event.
 *
 * On desktop browsers `DataTransfer.files` is normally populated. Some
 * mobile WebViews expose pasted images only through `DataTransfer.items`, so
 * use `getAsFile()` as a fallback when the files collection is empty.
 */
export function getClipboardFiles(clipboard: DataTransfer): File[] {
  const files = Array.from(clipboard.files);
  if (files.length > 0) return files;

  return Array.from(clipboard.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}
