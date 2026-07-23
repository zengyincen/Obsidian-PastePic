import type { ObsiPastePicSettings, ImageUploader } from "../types";
import { CustomApiUploader } from "./custom-api";
import { GitHubUploader } from "./github";

export function createUploader(settings: ObsiPastePicSettings): ImageUploader {
  if (settings.provider === "github") return new GitHubUploader(settings.github);
  return new CustomApiUploader(settings.custom);
}
