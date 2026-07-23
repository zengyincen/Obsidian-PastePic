import { requestUrl } from "obsidian";
import type { CustomApiSettings, ImageUploader, UploadResult } from "../types";
import { getJsonPath, parseObjectJson } from "../utils/json";
import { createMultipartBody } from "../utils/multipart";
import { applyTemplate } from "../utils/template";

export function validateCustomApiSettings(settings: CustomApiSettings): void {
  if (!settings.endpoint.trim()) throw new Error("请填写图床上传接口地址");
  if (!settings.fileField.trim()) throw new Error("请填写文件字段名");
  parseObjectJson(settings.headersJson, "请求头");
  parseObjectJson(settings.extraFieldsJson, "附加表单字段");
  if (!settings.cdnTemplate.trim()) throw new Error("请填写返回链接模板");
}

export class CustomApiUploader implements ImageUploader {
  constructor(private readonly settings: CustomApiSettings) {
    validateCustomApiSettings(settings);
  }

  async upload(file: File): Promise<UploadResult> {
    const headers = parseObjectJson(this.settings.headersJson, "请求头");
    const fields = parseObjectJson(this.settings.extraFieldsJson, "附加表单字段");
    const { body, contentType } = await createMultipartBody(
      file,
      this.settings.fileField.trim(),
      fields,
    );
    const response = await requestUrl({
      url: this.settings.endpoint.trim(),
      method: "POST",
      headers,
      contentType,
      body,
      throw: false,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`图床上传失败（HTTP ${response.status}）`);
    }

    let responseValue: unknown;
    try {
      responseValue = response.json;
    } catch {
      responseValue = response.text;
    }
    const extracted = getJsonPath(responseValue, this.settings.responseUrlPath);
    if (typeof extracted !== "string" || !extracted.trim()) {
      throw new Error(`响应中找不到图片链接：${this.settings.responseUrlPath || "响应正文"}`);
    }

    const originalUrl = extracted.trim();
    return {
      url: applyTemplate(this.settings.cdnTemplate.trim(), {
        url: originalUrl,
        encodedUrl: encodeURIComponent(originalUrl),
        filename: encodeURIComponent(file.name),
      }),
    };
  }
}
