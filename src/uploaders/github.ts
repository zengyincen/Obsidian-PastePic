import { requestUrl } from "obsidian";
import type { GitHubSettings, ImageUploader, UploadResult } from "../types";
import { arrayBufferToBase64 } from "../utils/base64";
import {
  applyTemplate,
  appendToUrlDirectory,
  createRemoteFilename,
  encodePath,
  formatDateVariables,
  joinPath,
} from "../utils/template";

const GITHUB_API_VERSION = "2022-11-28";

export function validateGitHubSettings(settings: GitHubSettings): void {
  if (!settings.owner.trim()) throw new Error("请填写 GitHub 用户名/组织名");
  if (!settings.repo.trim()) throw new Error("请填写 GitHub 仓库名");
  if (!settings.branch.trim()) throw new Error("请填写 GitHub 分支名");
  if (!settings.token.trim()) throw new Error("请填写 GitHub Token");
}

export function githubHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token.trim()}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

export function buildGitHubPublicUrl(
  settings: GitHubSettings,
  remotePath: string,
): string {
  const path = encodePath(remotePath);
  const owner = encodeURIComponent(settings.owner.trim());
  const repo = encodeURIComponent(settings.repo.trim());
  const branch = encodeURIComponent(settings.branch.trim());
  const filename = remotePath.split("/").filter(Boolean).pop() ?? remotePath;

  if (settings.cdnBaseUrl.trim()) {
    return appendToUrlDirectory(settings.cdnBaseUrl, filename);
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

export class GitHubUploader implements ImageUploader {
  constructor(private readonly settings: GitHubSettings) {
    validateGitHubSettings(settings);
  }

  async upload(file: File): Promise<UploadResult> {
    const now = new Date();
    const filename = createRemoteFilename(
      file.name,
      file.type,
      this.settings.filenameStrategy,
      now,
    );
    const dateVariables = formatDateVariables(now);
    const directory = applyTemplate(this.settings.uploadPath, {
      ...dateVariables,
      filename,
    });
    const remotePath = joinPath(directory, filename);
    const apiPath = encodePath(remotePath);
    const owner = encodeURIComponent(this.settings.owner.trim());
    const repo = encodeURIComponent(this.settings.repo.trim());
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}`;
    const message = applyTemplate(this.settings.commitMessage, {
      ...dateVariables,
      filename,
      path: remotePath,
    });

    const response = await requestUrl({
      url,
      method: "PUT",
      headers: {
        ...githubHeaders(this.settings.token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: arrayBufferToBase64(await file.arrayBuffer()),
        branch: this.settings.branch.trim(),
      }),
      throw: false,
    });

    if (response.status < 200 || response.status >= 300) {
      const messageFromApi = (response.json as { message?: unknown } | undefined)?.message;
      const detail = typeof messageFromApi === "string" ? `：${messageFromApi}` : "";
      throw new Error(`GitHub 上传失败（HTTP ${response.status}）${detail}`);
    }

    return {
      url: buildGitHubPublicUrl(this.settings, remotePath),
      remotePath,
    };
  }
}
