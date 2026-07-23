import type { ImageBedUploaderSettings } from "./types";

export const DEFAULT_SETTINGS: ImageBedUploaderSettings = {
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
    uploadPath: "images",
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
  saved: Partial<ImageBedUploaderSettings> | null | undefined,
): ImageBedUploaderSettings {
  const github = {
    ...DEFAULT_SETTINGS.github,
    ...saved?.github,
  };
  const custom = {
    ...DEFAULT_SETTINGS.custom,
    ...saved?.custom,
  };

  // Old releases stored brace-based templates. They cannot be mapped safely
  // to a directory URL, so an empty base falls back to GitHub Raw/the API URL.
  if (!github.cdnBaseUrl && github.cdnTemplate && !github.cdnTemplate.includes("{")) {
    github.cdnBaseUrl = github.cdnTemplate;
  }
  if (!custom.cdnBaseUrl && custom.cdnTemplate && !custom.cdnTemplate.includes("{")) {
    custom.cdnBaseUrl = custom.cdnTemplate;
  }
  delete github.cdnTemplate;
  delete custom.cdnTemplate;

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    github,
    custom,
  };
}
