import { describe, expect, it, vi } from "vitest";
import { getClipboardFiles } from "../src/utils/clipboard";

function clipboardWith({ files = [], items = [] }: {
  files?: File[];
  items?: DataTransferItem[];
}): DataTransfer {
  return { files, items } as unknown as DataTransfer;
}

describe("clipboard file extraction", () => {
  it("prefers the standard files collection", () => {
    const file = new File(["image"], "desktop.png", { type: "image/png" });
    const fallback = new File(["fallback"], "mobile.png", { type: "image/png" });
    const item = { kind: "file", getAsFile: () => fallback } as unknown as DataTransferItem;

    expect(getClipboardFiles(clipboardWith({ files: [file], items: [item] }))).toEqual([file]);
  });

  it("falls back to files exposed by mobile clipboard items", () => {
    const file = new File(["image"], "mobile.png", { type: "image/png" });
    const getAsFile = vi.fn(() => file);
    const textItem = { kind: "string", getAsFile: vi.fn(() => null) } as unknown as DataTransferItem;
    const imageItem = { kind: "file", getAsFile } as unknown as DataTransferItem;

    expect(getClipboardFiles(clipboardWith({ items: [textItem, imageItem] }))).toEqual([file]);
    expect(getAsFile).toHaveBeenCalledOnce();
  });

  it("ignores clipboard items that do not provide a file", () => {
    const item = { kind: "file", getAsFile: () => null } as unknown as DataTransferItem;
    expect(getClipboardFiles(clipboardWith({ items: [item] }))).toEqual([]);
  });
});
