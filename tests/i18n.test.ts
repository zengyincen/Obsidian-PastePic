import { describe, expect, it } from "vitest";
import { isAppLanguage, LANGUAGE_OPTIONS, t } from "../src/i18n";

describe("settings translations", () => {
  it("provides all eight supported languages", () => {
    expect(Object.keys(LANGUAGE_OPTIONS)).toEqual([
      "zh-CN",
      "en",
      "ja",
      "ko",
      "it",
      "es",
      "de",
      "fr",
    ]);
  });

  it("recognizes only supported language values", () => {
    expect(isAppLanguage("zh-CN")).toBe(true);
    expect(isAppLanguage("it")).toBe(true);
    expect(isAppLanguage("pt")).toBe(false);
    expect(isAppLanguage("")).toBe(false);
  });

  it("interpolates translated message variables", () => {
    expect(t("en", "githubHttpError", { status: 404 })).toBe(
      "GitHub returned HTTP 404",
    );
  });
});
