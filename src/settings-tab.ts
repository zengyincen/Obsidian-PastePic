import { App, Notice, PluginSettingTab, Setting, requestUrl } from "obsidian";
import type ObsiPastePicPlugin from "./main";
import { githubHeaders, buildGitHubPublicUrl, validateGitHubSettings } from "./uploaders/github";
import { validateCustomApiSettings } from "./uploaders/custom-api";

export class ObsiPastePicSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: ObsiPastePicPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h1", { text: "ObsiPastePic" });

    new Setting(containerEl)
      .setName("粘贴图片时自动上传")
      .setDesc("仅当剪贴板里包含受支持的图片文件时接管粘贴。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoUpload).onChange(async (value) => {
          this.plugin.settings.autoUpload = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("拖入图片时自动上传")
      .setDesc("把图片文件拖进 Markdown 编辑器时直接上传，不先保存为本地附件。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.uploadOnDrop).onChange(async (value) => {
          this.plugin.settings.uploadOnDrop = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("插入本地图片时自动上传")
      .setDesc("检测 Obsidian 或其他插件新插入的本地图片链接，上传后自动替换为远程链接。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.uploadInsertedLocalImages)
          .onChange(async (value) => {
            this.plugin.settings.uploadInsertedLocalImages = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("图片与文字共存时仍上传")
      .setDesc("某些浏览器或表格应用会同时写入图片和文字；关闭后将交给 Obsidian 原生粘贴。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.uploadWhenClipboardHasText)
          .onChange(async (value) => {
            this.plugin.settings.uploadWhenClipboardHasText = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("允许的图片扩展名")
      .setDesc("用英文逗号分隔；同时也会识别 image/* MIME 类型。")
      .addText((text) =>
        text
          .setPlaceholder("png, jpg, jpeg, gif, webp")
          .setValue(this.plugin.settings.imageExtensions)
          .onChange(async (value) => {
            this.plugin.settings.imageExtensions = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("上传目标")
      .setDesc("GitHub 仓库或支持 multipart/form-data 的通用图床接口。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("github", "GitHub 仓库")
          .addOption("custom", "自定义图床 API")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value === "custom" ? "custom" : "github";
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    if (this.plugin.settings.provider === "github") {
      this.displayGitHubSettings(containerEl);
    } else {
      this.displayCustomApiSettings(containerEl);
    }
  }

  private displayGitHubSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.settings.github;
    containerEl.createEl("h2", { text: "GitHub 上传" });

    new Setting(containerEl)
      .setName("仓库所有者")
      .setDesc("GitHub 用户名或组织名。")
      .addText((text) =>
        text.setPlaceholder("octocat").setValue(settings.owner).onChange(async (value) => {
          settings.owner = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("仓库名")
      .addText((text) =>
        text.setPlaceholder("image-bed").setValue(settings.repo).onChange(async (value) => {
          settings.repo = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("分支")
      .addText((text) =>
        text.setPlaceholder("main").setValue(settings.branch).onChange(async (value) => {
          settings.branch = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("GitHub Token")
      .setDesc("Fine-grained PAT 需授予目标仓库 Contents: Read and write。Token 会保存在插件 data.json 中。")
      .addText((text) => {
        text
          .setPlaceholder("github_pat_…")
          .setValue(settings.token)
          .onChange(async (value) => {
            settings.token = value.trim();
            await this.plugin.saveSettings();
          });
      });

    containerEl.createDiv({
      cls: "obsipastepic-warning",
      text: "安全提示：Obsidian 插件配置不是密钥保险箱，请只授予该 Token 单一仓库的最小权限。",
    });

    new Setting(containerEl)
      .setName("仓库内路径")
      .setDesc("图片在仓库中的目录。建议使用固定目录（如 images）；自定义 CDN 基础路径必须指向这个目录。")
      .addText((text) =>
        text
          .setPlaceholder("images")
          .setValue(settings.uploadPath)
          .onChange(async (value) => {
            settings.uploadPath = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("文件命名")
      .setDesc("使用原文件名可能遇到同名冲突，默认在前面添加时间戳和随机串。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("timestamp-original", "时间戳 + 原文件名")
          .addOption("timestamp", "仅时间戳")
          .addOption("original", "保留原文件名")
          .setValue(settings.filenameStrategy)
          .onChange(async (value) => {
            if (value === "timestamp" || value === "original" || value === "timestamp-original") {
              settings.filenameStrategy = value;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("提交信息")
      .setDesc("支持路径日期变量，以及 {filename}、{path}。")
      .addText((text) =>
        text.setValue(settings.commitMessage).onChange(async (value) => {
          settings.commitMessage = value || "Upload {filename} from Obsidian";
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h2", { text: "CDN / 代理加速" });
    const preview = containerEl.createDiv({ cls: "obsipastepic-preview" });
    const updatePreview = (): void => {
      preview.setText(
        buildGitHubPublicUrl(settings, "images/example image.png"),
      );
    };

    new Setting(containerEl)
      .setName("CDN / 代理基础路径")
      .setDesc(
        "填写到图片所在目录，例如 https://cdn.example.com/xx/xx/。插件会自动追加上传后的图片名和后缀；留空则自动使用 GitHub Raw。",
      )
      .addText((text) => {
        text
          .setPlaceholder("https://cdn.example.com/xx/xx/")
          .setValue(settings.cdnBaseUrl)
          .onChange(async (value) => {
            settings.cdnBaseUrl = value.trim();
            updatePreview();
            await this.plugin.saveSettings();
          });
      })
      .addButton((button) =>
        button.setButtonText("使用 Raw").onClick(async () => {
          settings.cdnBaseUrl = "";
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    updatePreview();
    containerEl.createEl("p", {
      text: "示例：仓库目录是 images 时，可填 https://cdn.jsdelivr.net/gh/octocat/image-bed@main/images/；最终链接会自动变成 …/上传后的图片名.png。",
    });

    new Setting(containerEl)
      .setName("连接测试")
      .setDesc("只读取仓库和分支信息，不会上传文件。")
      .addButton((button) =>
        button.setButtonText("测试 GitHub 配置").onClick(async () => {
          button.setDisabled(true);
          try {
            validateGitHubSettings(settings);
            const owner = encodeURIComponent(settings.owner.trim());
            const repo = encodeURIComponent(settings.repo.trim());
            const branch = encodeURIComponent(settings.branch.trim());
            const response = await requestUrl({
              url: `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
              headers: githubHeaders(settings.token),
              throw: false,
            });
            if (response.status < 200 || response.status >= 300) {
              throw new Error(`GitHub 返回 HTTP ${response.status}`);
            }
            new Notice("GitHub 配置可用");
          } catch (error) {
            new Notice(this.errorMessage(error));
          } finally {
            button.setDisabled(false);
          }
        }),
      );
  }

  private displayCustomApiSettings(containerEl: HTMLElement): void {
    const settings = this.plugin.settings.custom;
    containerEl.createEl("h2", { text: "自定义图床 API" });

    new Setting(containerEl)
      .setName("上传接口")
      .setDesc("使用 POST multipart/form-data 发送图片。")
      .addText((text) =>
        text.setPlaceholder("https://img.example.com/upload").setValue(settings.endpoint).onChange(async (value) => {
          settings.endpoint = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("文件字段名")
      .setDesc("常见值为 file、image 或 source。")
      .addText((text) =>
        text.setPlaceholder("file").setValue(settings.fileField).onChange(async (value) => {
          settings.fileField = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("请求头 JSON")
      .setDesc('例如 {"Authorization":"Bearer xxx"}。无需填写 Content-Type。')
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(settings.headersJson).onChange(async (value) => {
          settings.headersJson = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("附加表单字段 JSON")
      .setDesc('例如 {"album":"obsidian"}。')
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(settings.extraFieldsJson).onChange(async (value) => {
          settings.extraFieldsJson = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("响应链接路径")
      .setDesc("从 JSON 响应提取 URL，支持 data.url、data.images[0].url；留空表示响应本身就是 URL。")
      .addText((text) =>
        text.setPlaceholder("data.url").setValue(settings.responseUrlPath).onChange(async (value) => {
          settings.responseUrlPath = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("CDN / 代理基础路径")
      .setDesc("选填。填写到图片目录，插件会自动追加图床返回的图片名和后缀；留空使用图床原始链接。")
      .addText((text) => {
        text
          .setPlaceholder("https://cdn.example.com/xx/xx/")
          .setValue(settings.cdnBaseUrl)
          .onChange(async (value) => {
            settings.cdnBaseUrl = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("校验配置")
      .setDesc("检查必填项和 JSON 格式，不会发起上传。")
      .addButton((button) =>
        button.setButtonText("校验").onClick(() => {
          try {
            validateCustomApiSettings(settings);
            new Notice("自定义图床配置格式正确");
          } catch (error) {
            new Notice(this.errorMessage(error));
          }
        }),
      );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
