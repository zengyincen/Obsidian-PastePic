import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, mergeSettings } from "../src/settings";

describe("settings migration", () => {
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
});
