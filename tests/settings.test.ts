import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, mergeSettings } from "../src/settings";
import type { ObsiPastePicSettings } from "../src/types";

describe("settings migration", () => {
  it("defaults to Simplified Chinese and an empty repository path", () => {
    const merged = mergeSettings(undefined);
    expect(merged.language).toBe("zh-CN");
    expect(DEFAULT_SETTINGS.github.uploadPath).toBe("");
    expect(merged.github.uploadPath).toBe("");
  });

  it("preserves a saved settings language", () => {
    const merged = mergeSettings({ language: "ja" });
    expect(merged.language).toBe("ja");
  });

  it("falls back to Simplified Chinese for an unknown saved language", () => {
    const merged = mergeSettings({ language: "unknown" as "en" });
    expect(merged.language).toBe("zh-CN");
  });

  it("deep-merges partial provider settings with defaults", () => {
    const merged = mergeSettings({ github: { ...DEFAULT_SETTINGS.github, owner: "alice" } });
    expect(merged.github.owner).toBe("alice");
    expect(merged.github.branch).toBe("main");
    expect(merged.custom.fileField).toBe("file");
  });

  it("does not mutate defaults", () => {
    const merged = mergeSettings(undefined);
    merged.github.owner = "changed";
    expect(DEFAULT_SETTINGS.github.owner).toBe("");
  });

  it("drops legacy brace-based CDN templates", () => {
    const legacySettings = {
      github: {
        ...DEFAULT_SETTINGS.github,
        cdnBaseUrl: "",
        cdnTemplate: "https://cdn.example.com/{path}",
      },
      custom: {
        ...DEFAULT_SETTINGS.custom,
        cdnBaseUrl: "",
        cdnTemplate: "{url}",
      },
    } as unknown as Partial<ObsiPastePicSettings>;
    const merged = mergeSettings(legacySettings);
    expect(merged.github.cdnBaseUrl).toBe("");
    expect("cdnTemplate" in merged.github).toBe(false);
    expect(merged.custom.cdnBaseUrl).toBe("");
    expect("cdnTemplate" in merged.custom).toBe(false);
  });
});
