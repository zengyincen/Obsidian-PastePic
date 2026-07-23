import { describe, expect, it } from "vitest";
import {
  applyTemplate,
  createRemoteFilename,
  encodePath,
  formatDateVariables,
  joinPath,
  sanitizeFilename,
} from "../src/utils/template";

describe("template helpers", () => {
  it("replaces known variables and preserves unknown variables", () => {
    expect(applyTemplate("/{owner}/{missing}/{path}", { owner: "alice", path: "a.png" }))
      .toBe("/alice/{missing}/a.png");
  });

  it("encodes every path segment without encoding slashes", () => {
    expect(encodePath("图片/hello world.png")).toBe("%E5%9B%BE%E7%89%87/hello%20world.png");
  });

  it("joins paths without duplicate separators", () => {
    expect(joinPath("/images/", "/2026/", "a.png")).toBe("images/2026/a.png");
  });

  it("sanitizes characters that are unsafe in file names", () => {
    expect(sanitizeFilename(' screen:shot [1] #.png ')).toBe("screen-shot-1-.png");
  });

  it("creates a deterministic timestamp-original filename", () => {
    const date = new Date("2026-07-23T09:08:07.000Z");
    expect(createRemoteFilename("My Image.PNG", "image/png", "timestamp-original", date, "abc123"))
      .toBe(`${date.getTime()}-abc123-My-Image.png`);
  });

  it("formats local date variables with zero padding", () => {
    const date = new Date(2026, 6, 3, 4, 5, 6);
    expect(formatDateVariables(date)).toMatchObject({
      year: "2026",
      month: "07",
      day: "03",
      hour: "04",
      minute: "05",
      second: "06",
    });
  });
});
