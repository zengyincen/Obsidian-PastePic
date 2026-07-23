import type { AppLanguage } from "./i18n";

export type UploadProvider = "github" | "custom";

export interface GitHubSettings {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  uploadPath: string;
  commitMessage: string;
  filenameStrategy: "timestamp" | "timestamp-original" | "original";
  cdnBaseUrl: string;
}

export interface CustomApiSettings {
  endpoint: string;
  fileField: string;
  headersJson: string;
  extraFieldsJson: string;
  responseUrlPath: string;
  cdnBaseUrl: string;
}

export interface ObsiPastePicSettings {
  language: AppLanguage;
  provider: UploadProvider;
  autoUpload: boolean;
  uploadOnDrop: boolean;
  uploadInsertedLocalImages: boolean;
  uploadWhenClipboardHasText: boolean;
  imageExtensions: string;
  github: GitHubSettings;
  custom: CustomApiSettings;
}

export interface UploadResult {
  url: string;
  remotePath?: string;
}

export interface ImageUploader {
  upload(file: File): Promise<UploadResult>;
}
