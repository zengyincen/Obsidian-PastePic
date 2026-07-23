import type { ImageBedUploaderSettings, ImageUploader } from "../types";
import { CustomApiUploader } from "./custom-api";
import { GitHubUploader } from "./github";

export function createUploader(settings: ImageBedUploaderSettings): ImageUploader {
  if (settings.provider === "github") return new GitHubUploader(settings.github);
  return new CustomApiUploader(settings.custom);
}
