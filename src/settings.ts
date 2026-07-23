import type { ImageBedUploaderSettings } from "./types";

export const DEFAULT_CDN_TEMPLATE =
  "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}";

export const DEFAULT_SETTINGS: ImageBedUploaderSettings = {
  provider: "github",
  autoUpload: true,
  uploadOnDrop: true,
  uploadWhenClipboardHasText: true,
  imageExtensions: "png, jpg, jpeg, gif, webp, svg, bmp, avif",
  github: {
    owner: "",
    repo: "",
    branch: "main",
    token: "",
    uploadPath: "images/{year}/{month}",
    commitMessage: "Upload {filename} from Obsidian",
    filenameStrategy: "timestamp-original",
    cdnTemplate: DEFAULT_CDN_TEMPLATE,
  },
  custom: {
    endpoint: "",
    fileField: "file",
    headersJson: "{}",
    extraFieldsJson: "{}",
    responseUrlPath: "data.url",
    cdnTemplate: "{url}",
  },
};

export function mergeSettings(
  saved: Partial<ImageBedUploaderSettings> | null | undefined,
): ImageBedUploaderSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    github: {
      ...DEFAULT_SETTINGS.github,
      ...saved?.github,
    },
    custom: {
      ...DEFAULT_SETTINGS.custom,
      ...saved?.custom,
    },
  };
}
