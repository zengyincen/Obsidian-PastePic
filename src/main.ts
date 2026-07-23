import { Editor, Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings";
import { ImageBedUploaderSettingTab } from "./settings-tab";
import type { ImageBedUploaderSettings, ImageUploader } from "./types";
import { createUploader } from "./uploaders";
import { escapeMarkdownAlt } from "./utils/template";

interface PendingUpload {
  file: File;
  placeholder: string;
}

export default class ImageBedUploaderPlugin extends Plugin {
  settings: ImageBedUploaderSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    this.settings = mergeSettings(await this.loadData() as Partial<ImageBedUploaderSettings> | null);
    this.addSettingTab(new ImageBedUploaderSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor) => {
        if (!this.settings.autoUpload) return;
        const clipboard = event.clipboardData;
        if (!clipboard) return;
        if (!this.settings.uploadWhenClipboardHasText && clipboard.getData("text/plain").trim()) {
          return;
        }
        this.handleFiles(Array.from(clipboard.files), event, editor);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("editor-drop", (event, editor) => {
        if (!this.settings.uploadOnDrop || !event.dataTransfer) return;
        this.handleFiles(Array.from(event.dataTransfer.files), event, editor);
      }),
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private handleFiles(
    files: File[],
    event: ClipboardEvent | DragEvent,
    editor: Editor,
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
    const pending = files.map((file) => this.createPendingUpload(file));
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
        const markdown = `![${escapeMarkdownAlt(file.name || "image")}](<${result.url}>)`;
        this.replacePlaceholder(editor, placeholder, markdown);
        return result;
      }),
    );

    let failed = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") return;
      failed += 1;
      const { file, placeholder } = pending[index];
      const safeError = this.errorMessage(result.reason).replace(/--/g, "—").replace(/[\r\n]+/g, " ");
      this.replacePlaceholder(
        editor,
        placeholder,
        `<!-- 图片上传失败：${escapeMarkdownAlt(file.name || "image")}；${safeError} -->`,
      );
      console.error("Image Bed Uploader upload failed", result.reason);
    });

    if (failed === 0) {
      new Notice(`已上传 ${pending.length} 张图片`);
    } else {
      new Notice(`${failed}/${pending.length} 张图片上传失败，请查看占位注释或开发者控制台`);
    }
  }

  private createPendingUpload(file: File): PendingUpload {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return {
      file,
      placeholder: `![正在上传 ${escapeMarkdownAlt(file.name || "image")}](image-bed-uploader://${id})`,
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

  private isSupportedImage(file: File): boolean {
    if (file.type.toLowerCase().startsWith("image/")) return true;
    const allowed = new Set(
      this.settings.imageExtensions
        .split(",")
        .map((extension) => extension.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean),
    );
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    return allowed.has(extension);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
