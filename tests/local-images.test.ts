import { describe, expect, it } from "vitest";
import {
  countReferenceSources,
  extractLocalImageReferences,
  LEGACY_GITHUB_ERROR_MARKER,
  newlyAddedReferences,
} from "../src/utils/local-images";

describe("local image insertion detection", () => {
  it("finds Markdown and wiki image links but ignores remote images", () => {
    const content = [
      "![local](attachments/a%20b.png)",
      "![[attachments/c.jpg|preview]]",
      "![remote](https://example.com/d.png)",
    ].join("\n");
    expect(extractLocalImageReferences(content)).toEqual([
      { source: "![local](attachments/a%20b.png)", linkPath: "attachments/a b.png" },
      { source: "![[attachments/c.jpg|preview]]", linkPath: "attachments/c.jpg" },
    ]);
  });

  it("returns only references added since the previous snapshot", () => {
    const oldReferences = extractLocalImageReferences("![[a.png]]");
    const current = extractLocalImageReferences("![[a.png]]\n![[a.png]]\n![[b.png]]");
    expect(newlyAddedReferences(current, countReferenceSources(oldReferences)))
      .toEqual([
        { source: "![[a.png]]", linkPath: "a.png" },
        { source: "![[b.png]]", linkPath: "b.png" },
      ]);
  });

  it("removes the legacy Github upload error marker", () => {
    expect("before\n[Github upload error]()\nafter".replace(LEGACY_GITHUB_ERROR_MARKER, ""))
      .toBe("before\nafter");
  });
});
