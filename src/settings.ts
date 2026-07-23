import type { ObsiPastePicSettings } from "./types";
import { isAppLanguage } from "./i18n";

export const DEFAULT_SETTINGS: ObsiPastePicSettings = {
  language: "zh-CN",
  provider: "github",
  autoUpload: true,
  uploadOnDrop: true,
  uploadInsertedLocalImages: true,
  uploadWhenClipboardHasText: true,
  imageExtensions: "png, jpg, jpeg, gif, webp, svg, bmp, avif",
  github: {
    owner: "",
    repo: "",
    branch: "main",
    token: "",
    uploadPath: "",
    commitMessage: "Upload {filename} from Obsidian",
    filenameStrategy: "timestamp-original",
    cdnBaseUrl: "",
  },
  custom: {
    endpoint: "",
    fileField: "file",
    headersJson: "{}",
    extraFieldsJson: "{}",
    responseUrlPath: "data.url",
    cdnBaseUrl: "",
  },
};

export function mergeSettings(
  saved: Partial<ObsiPastePicSettings> | null | undefined,
): ObsiPastePicSettings {
  type LegacyCdnSettings = { cdnTemplate?: string };
  const { cdnTemplate: legacyGitHubCdn, ...savedGitHub } = (saved?.github ?? {}) as
    Partial<ObsiPastePicSettings["github"]> & LegacyCdnSettings;
  const { cdnTemplate: legacyCustomCdn, ...savedCustom } = (saved?.custom ?? {}) as
    Partial<ObsiPastePicSettings["custom"]> & LegacyCdnSettings;
  const github = {
    ...DEFAULT_SETTINGS.github,
    ...savedGitHub,
  };
  const custom = {
    ...DEFAULT_SETTINGS.custom,
    ...savedCustom,
  };

  // Old releases stored brace-based templates. They cannot be mapped safely
  // to a directory URL, so an empty base falls back to GitHub Raw/the API URL.
  if (!github.cdnBaseUrl && legacyGitHubCdn && !legacyGitHubCdn.includes("{")) {
    github.cdnBaseUrl = legacyGitHubCdn;
  }
  if (!custom.cdnBaseUrl && legacyCustomCdn && !legacyCustomCdn.includes("{")) {
    custom.cdnBaseUrl = legacyCustomCdn;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    language:
      typeof saved?.language === "string" && isAppLanguage(saved.language)
        ? saved.language
        : DEFAULT_SETTINGS.language,
    github,
    custom,
  };
}
