import { App, Notice, PluginSettingTab, Setting, requestUrl } from "obsidian";
import type ObsiPastePicPlugin from "./main";
import { isAppLanguage, LANGUAGE_OPTIONS, t } from "./i18n";
import type { MessageKey } from "./i18n";
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

    const language = this.plugin.settings.language;
    new Setting(containerEl)
      .setName(t(language, "language"))
      .setDesc(t(language, "languageDesc"))
      .addDropdown((dropdown) => {
        Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
          dropdown.addOption(value, label);
        });
        dropdown.setValue(language).onChange(async (value) => {
          if (!isAppLanguage(value)) return;
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
          this.display();
        });
      });

    new Setting(containerEl)
      .setName(this.tr("autoUpload"))
      .setDesc(this.tr("autoUploadDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoUpload).onChange(async (value) => {
          this.plugin.settings.autoUpload = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("dropUpload"))
      .setDesc(this.tr("dropUploadDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.uploadOnDrop).onChange(async (value) => {
          this.plugin.settings.uploadOnDrop = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("insertedUpload"))
      .setDesc(this.tr("insertedUploadDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.uploadInsertedLocalImages)
          .onChange(async (value) => {
            this.plugin.settings.uploadInsertedLocalImages = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(this.tr("mixedClipboard"))
      .setDesc(this.tr("mixedClipboardDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.uploadWhenClipboardHasText)
          .onChange(async (value) => {
            this.plugin.settings.uploadWhenClipboardHasText = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(this.tr("extensions"))
      .setDesc(this.tr("extensionsDesc"))
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
      .setName(this.tr("target"))
      .setDesc(this.tr("targetDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("github", this.tr("githubOption"))
          .addOption("custom", this.tr("customOption"))
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
    containerEl.createEl("h2", { text: this.tr("githubHeading") });

    new Setting(containerEl)
      .setName(this.tr("owner"))
      .setDesc(this.tr("ownerDesc"))
      .addText((text) =>
        text.setPlaceholder("octocat").setValue(settings.owner).onChange(async (value) => {
          settings.owner = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("repo"))
      .addText((text) =>
        text.setPlaceholder("image-bed").setValue(settings.repo).onChange(async (value) => {
          settings.repo = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("branch"))
      .addText((text) =>
        text.setPlaceholder("main").setValue(settings.branch).onChange(async (value) => {
          settings.branch = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("GitHub Token")
      .setDesc(this.tr("tokenDesc"))
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
      text: this.tr("tokenWarning"),
    });

    new Setting(containerEl)
      .setName(this.tr("uploadPath"))
      .setDesc(this.tr("uploadPathDesc"))
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
      .setName(this.tr("filename"))
      .setDesc(this.tr("filenameDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("timestamp-original", this.tr("timestampOriginal"))
          .addOption("timestamp", this.tr("timestamp"))
          .addOption("original", this.tr("original"))
          .setValue(settings.filenameStrategy)
          .onChange(async (value) => {
            if (value === "timestamp" || value === "original" || value === "timestamp-original") {
              settings.filenameStrategy = value;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName(this.tr("commitMessage"))
      .setDesc(this.tr("commitMessageDesc"))
      .addText((text) =>
        text.setValue(settings.commitMessage).onChange(async (value) => {
          settings.commitMessage = value || "Upload {filename} from Obsidian";
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h2", { text: this.tr("cdnHeading") });
    const preview = containerEl.createDiv({ cls: "obsipastepic-preview" });
    const updatePreview = (): void => {
      const examplePath = [settings.uploadPath.trim(), "example image.png"]
        .filter(Boolean)
        .join("/");
      preview.setText(buildGitHubPublicUrl(settings, examplePath));
    };

    new Setting(containerEl)
      .setName(this.tr("cdnBase"))
      .setDesc(this.tr("cdnBaseDesc"))
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
        button.setButtonText(this.tr("useRaw")).onClick(async () => {
          settings.cdnBaseUrl = "";
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    updatePreview();
    containerEl.createEl("p", { text: this.tr("cdnExample") });

    new Setting(containerEl)
      .setName(this.tr("connectionTest"))
      .setDesc(this.tr("connectionTestDesc"))
      .addButton((button) =>
        button.setButtonText(this.tr("testGithub")).onClick(async () => {
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
              throw new Error(this.tr("githubHttpError", { status: response.status }));
            }
            new Notice(this.tr("githubReady"));
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
    containerEl.createEl("h2", { text: this.tr("customHeading") });

    new Setting(containerEl)
      .setName(this.tr("endpoint"))
      .setDesc(this.tr("endpointDesc"))
      .addText((text) =>
        text.setPlaceholder("https://img.example.com/upload").setValue(settings.endpoint).onChange(async (value) => {
          settings.endpoint = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("fileField"))
      .setDesc(this.tr("fileFieldDesc"))
      .addText((text) =>
        text.setPlaceholder("file").setValue(settings.fileField).onChange(async (value) => {
          settings.fileField = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("headers"))
      .setDesc(this.tr("headersDesc"))
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(settings.headersJson).onChange(async (value) => {
          settings.headersJson = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(this.tr("extraFields"))
      .setDesc(this.tr("extraFieldsDesc"))
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(settings.extraFieldsJson).onChange(async (value) => {
          settings.extraFieldsJson = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(this.tr("responsePath"))
      .setDesc(this.tr("responsePathDesc"))
      .addText((text) =>
        text.setPlaceholder("data.url").setValue(settings.responseUrlPath).onChange(async (value) => {
          settings.responseUrlPath = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(this.tr("cdnBase"))
      .setDesc(this.tr("customCdnDesc"))
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
      .setName(this.tr("validate"))
      .setDesc(this.tr("validateDesc"))
      .addButton((button) =>
        button.setButtonText(this.tr("validateButton")).onClick(() => {
          try {
            validateCustomApiSettings(settings);
            new Notice(this.tr("customReady"));
          } catch (error) {
            new Notice(this.errorMessage(error));
          }
        }),
      );
  }

  private tr(key: MessageKey, variables?: Record<string, string | number>): string {
    return t(this.plugin.settings.language, key, variables);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
