import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import type { MarkdownFileInfo } from "obsidian";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings";
import { ImageBedUploaderSettingTab } from "./settings-tab";
import type { ImageBedUploaderSettings, ImageUploader } from "./types";
import { createUploader } from "./uploaders";
import {
  countReferenceSources,
  extractLocalImageReferences,
  LEGACY_GITHUB_ERROR_MARKER,
  newlyAddedReferences,
} from "./utils/local-images";
import type { EmbeddedImageReference } from "./utils/local-images";
import { createMarkdownImage, escapeMarkdownAlt } from "./utils/template";

interface PendingUpload {
  file: File;
  placeholder: string;
  fallbackMarkdown?: string;
  sourcePath: string;
}

export default class ImageBedUploaderPlugin extends Plugin {
  settings: ImageBedUploaderSettings = DEFAULT_SETTINGS;
  private readonly knownReferences = new WeakMap<Editor, Map<string, number>>();
  private readonly scanTimers = new WeakMap<Editor, number>();

  async onload(): Promise<void> {
    this.settings = mergeSettings(await this.loadData() as Partial<ImageBedUploaderSettings> | null);
    this.addSettingTab(new ImageBedUploaderSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor, info) => {
        if (!this.settings.autoUpload) return;
        const clipboard = event.clipboardData;
        if (!clipboard) return;
        if (!this.settings.uploadWhenClipboardHasText && clipboard.getData("text/plain").trim()) {
          return;
        }
        this.handleFiles(Array.from(clipboard.files), event, editor, info.file?.path ?? "");
      }),
    );

    this.registerEvent(
      this.app.workspace.on("editor-drop", (event, editor, info) => {
        if (!this.settings.uploadOnDrop || !event.dataTransfer) return;
        this.handleFiles(Array.from(event.dataTransfer.files), event, editor, info.file?.path ?? "");
      }),
    );

    this.registerEvent(
      this.app.workspace.on("editor-change", (editor, info) => {
        this.removeLegacyGitHubErrorMarkers(editor);
        if (this.settings.uploadInsertedLocalImages) this.queueLocalImageScan(editor, info);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof MarkdownView) this.captureExistingReferences(leaf.view.editor);
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        if (leaf.view instanceof MarkdownView) this.captureExistingReferences(leaf.view.editor);
      });
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private handleFiles(
    files: File[],
    event: ClipboardEvent | DragEvent,
    editor: Editor,
    sourcePath: string,
  ): void {
    if (files.length === 0) return;
    if (!files.every((file) => this.isSupportedImage(file))) return;

    let uploader: ImageUploader;
    try {
      uploader = createUploader(this.settings);
    } catch (error) {
      new Notice(`${this.errorMessage(error)}；已保留 Obsidian 原生粘贴行为`);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const pending = files.map((file) => this.createPendingUpload(file, sourcePath));
    editor.replaceSelection(pending.map(({ placeholder }) => placeholder).join("\n"));
    void this.uploadAll(pending, uploader, editor);
  }

  private async uploadAll(
    pending: PendingUpload[],
    uploader: ImageUploader,
    editor: Editor,
  ): Promise<void> {
    const results = await Promise.allSettled(
      pending.map(async ({ file, placeholder }) => {
        const result = await uploader.upload(file);
        const markdown = createMarkdownImage(file.name || "image", result.url);
        this.replacePlaceholder(editor, placeholder, markdown);
        return result;
      }),
    );

    let failed = 0;
    const failureMessages: string[] = [];
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      if (result.status === "fulfilled") continue;
      failed += 1;
      failureMessages.push(this.errorMessage(result.reason));
      const { file, placeholder } = pending[index];
      let fallback = pending[index].fallbackMarkdown;
      if (!fallback) {
        try {
          fallback = await this.saveAsLocalAttachment(file, pending[index].sourcePath);
        } catch (fallbackError) {
          console.error("ObsiPastePic local fallback failed", fallbackError);
          fallback = "";
        }
      }
      this.replacePlaceholder(
        editor,
        placeholder,
        fallback,
      );
      console.error("ObsiPastePic upload failed", result.reason);
    }

    // Treat restored fallback links as already known so a failed upload does
    // not immediately trigger the inserted-image watcher again.
    this.captureExistingReferences(editor);

    if (failed === 0) {
      new Notice(`已上传 ${pending.length} 张图片`);
    } else {
      const detail = failureMessages[0]?.slice(0, 180) ?? "未知错误";
      new Notice(`${failed}/${pending.length} 张图片上传失败，已恢复本地链接：${detail}`, 8000);
    }
  }

  private createPendingUpload(
    file: File,
    sourcePath: string,
    fallbackMarkdown?: string,
  ): PendingUpload {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return {
      file,
      placeholder: `![正在上传 ${escapeMarkdownAlt(file.name || "image")}](image-bed-uploader://${id})`,
      fallbackMarkdown,
      sourcePath,
    };
  }

  private replacePlaceholder(editor: Editor, placeholder: string, replacement: string): void {
    const content = editor.getValue();
    const offset = content.indexOf(placeholder);
    if (offset < 0) return;
    editor.replaceRange(
      replacement,
      editor.offsetToPos(offset),
      editor.offsetToPos(offset + placeholder.length),
    );
  }

  private replaceLastOccurrence(editor: Editor, source: string, replacement: string): boolean {
    const content = editor.getValue();
    const offset = content.lastIndexOf(source);
    if (offset < 0) return false;
    editor.replaceRange(
      replacement,
      editor.offsetToPos(offset),
      editor.offsetToPos(offset + source.length),
    );
    return true;
  }

  private captureExistingReferences(editor: Editor): void {
    this.knownReferences.set(
      editor,
      countReferenceSources(extractLocalImageReferences(editor.getValue())),
    );
  }

  private queueLocalImageScan(editor: Editor, info: MarkdownFileInfo): void {
    const existingTimer = this.scanTimers.get(editor);
    if (existingTimer !== undefined) window.clearTimeout(existingTimer);
    const timer = window.setTimeout(() => {
      this.scanTimers.delete(editor);
      void this.uploadNewLocalImageLinks(editor, info.file?.path ?? "");
    }, 250);
    this.scanTimers.set(editor, timer);
  }

  private async uploadNewLocalImageLinks(editor: Editor, sourcePath: string): Promise<void> {
    const references = extractLocalImageReferences(editor.getValue());
    const previousCounts = this.knownReferences.get(editor) ?? new Map<string, number>();
    const added = newlyAddedReferences(references, previousCounts);
    this.knownReferences.set(editor, countReferenceSources(references));
    if (added.length === 0) return;

    let uploader: ImageUploader;
    try {
      uploader = createUploader(this.settings);
    } catch (error) {
      new Notice(this.errorMessage(error));
      return;
    }

    const pending: PendingUpload[] = [];
    for (const reference of added) {
      const file = this.resolveLocalImage(reference, sourcePath);
      if (!file) continue;
      const browserFile = new File(
        [await this.app.vault.readBinary(file)],
        file.name,
        { type: this.mimeTypeFor(file.extension) },
      );
      const item = this.createPendingUpload(browserFile, sourcePath, reference.source);
      if (this.replaceLastOccurrence(editor, reference.source, item.placeholder)) {
        pending.push(item);
      }
    }

    if (pending.length > 0) await this.uploadAll(pending, uploader, editor);
  }

  private resolveLocalImage(reference: EmbeddedImageReference, sourcePath: string): TFile | null {
    const file = this.app.metadataCache.getFirstLinkpathDest(reference.linkPath, sourcePath);
    if (!(file instanceof TFile)) return null;
    return this.isSupportedImageName(file.name) ? file : null;
  }

  private removeLegacyGitHubErrorMarkers(editor: Editor): void {
    const content = editor.getValue();
    const matches = Array.from(content.matchAll(LEGACY_GITHUB_ERROR_MARKER));
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const match = matches[index];
      if (match.index === undefined) continue;
      editor.replaceRange(
        "",
        editor.offsetToPos(match.index),
        editor.offsetToPos(match.index + match[0].length),
      );
    }
  }

  private async saveAsLocalAttachment(file: File, sourcePath: string): Promise<string> {
    const filename = file.name || `image-${Date.now()}.png`;
    const attachmentPath = await this.app.fileManager.getAvailablePathForAttachment(
      filename,
      sourcePath,
    );
    const attachment = await this.app.vault.createBinary(attachmentPath, await file.arrayBuffer());
    const link = this.app.fileManager.generateMarkdownLink(attachment, sourcePath, undefined, filename);
    return link.startsWith("!") ? link : `!${link}`;
  }

  private isSupportedImage(file: File): boolean {
    if (file.type.toLowerCase().startsWith("image/")) return true;
    return this.isSupportedImageName(file.name);
  }

  private isSupportedImageName(filename: string): boolean {
    const allowed = new Set(
      this.settings.imageExtensions
        .split(",")
        .map((extension) => extension.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean),
    );
    const extension = filename.toLowerCase().split(".").pop() ?? "";
    return allowed.has(extension);
  }

  private mimeTypeFor(extension: string): string {
    const types: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      avif: "image/avif",
    };
    return types[extension.toLowerCase()] ?? "application/octet-stream";
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
