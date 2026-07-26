import { Notice, PluginSettingTab, requestUrl, Setting } from "obsidian";
import type { App } from "obsidian";
import type PastepicPlugin from "./main";
import { DEFAULT_COMMIT_MESSAGE } from "./settings";
import { isAppLanguage, LANGUAGE_OPTIONS, t } from "./i18n";
import type { MessageKey } from "./i18n";
import { githubHeaders, buildGitHubPublicUrl, validateGitHubSettings } from "./uploaders/github";
import { validateCustomApiSettings } from "./uploaders/custom-api";

export class PastepicSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: PastepicPlugin) {
    super(app, plugin);
    this.icon = "image-up";
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.renderRows(containerEl, this.generalDefinitions());
    new Setting(containerEl)
      .setName(this.tr(this.plugin.settings.provider === "github" ? "githubHeading" : "customHeading"))
      .setHeading();
    if (this.plugin.settings.provider === "github") {
      this.renderRows(containerEl, this.githubQuickDefinitions());
      new Setting(containerEl).setName(this.tr("advancedHeading")).setHeading();
      this.renderRows(containerEl, this.githubAdvancedDefinitions());
    } else {
      this.renderRows(containerEl, this.customApiDefinitions());
    }
  }

  /**
   * Obsidian 1.13+ uses these definitions for rendering and settings search.
   * Obsidian 1.12.x ignores this method and calls display() instead.
   */
  getSettingDefinitions(): CompatibleSettingDefinitionItem[] {
    const definitions: CompatibleSettingDefinitionItem[] = [
      {
        type: "group",
        items: this.toSettingDefinitions(this.generalDefinitions()),
      },
      {
        type: "group",
        heading: this.tr(
          this.plugin.settings.provider === "github" ? "githubHeading" : "customHeading",
        ),
        items: this.toSettingDefinitions(
          this.plugin.settings.provider === "github"
            ? this.githubQuickDefinitions()
            : this.customApiDefinitions(),
        ),
      },
    ];
    if (this.plugin.settings.provider === "github") {
      definitions.push({
        type: "group",
        heading: this.tr("advancedHeading"),
        items: this.toSettingDefinitions(this.githubAdvancedDefinitions()),
      });
    }
    return definitions;
  }

  private generalDefinitions(): SettingRow[] {
    return [
      this.row(this.tr("language"), this.tr("languageDesc"), (setting) => {
        setting.addDropdown((dropdown) => {
          Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
            dropdown.addOption(value, label);
          });
          dropdown.setValue(this.plugin.settings.language).onChange(async (value) => {
            if (!isAppLanguage(value)) return;
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.refreshSettings();
          });
        });
      }),
      this.row(this.tr("autoUpload"), this.tr("autoUploadDesc"), (setting) => {
        setting.addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.autoUpload).onChange(async (value) => {
            this.plugin.settings.autoUpload = value;
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("dropUpload"), this.tr("dropUploadDesc"), (setting) => {
        setting.addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.uploadOnDrop).onChange(async (value) => {
            this.plugin.settings.uploadOnDrop = value;
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("insertedUpload"), this.tr("insertedUploadDesc"), (setting) => {
        setting.addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.uploadInsertedLocalImages)
            .onChange(async (value) => {
              this.plugin.settings.uploadInsertedLocalImages = value;
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("mixedClipboard"), this.tr("mixedClipboardDesc"), (setting) => {
        setting.addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.uploadWhenClipboardHasText)
            .onChange(async (value) => {
              this.plugin.settings.uploadWhenClipboardHasText = value;
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("extensions"), this.tr("extensionsDesc"), (setting) => {
        setting.addText((text) =>
          text
            .setPlaceholder("png, jpg, jpeg, gif, webp")
            .setValue(this.plugin.settings.imageExtensions)
            .onChange(async (value) => {
              this.plugin.settings.imageExtensions = value;
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("target"), this.tr("targetDesc"), (setting) => {
        setting.addDropdown((dropdown) =>
          dropdown
            .addOption("github", this.tr("githubOption"))
            .addOption("custom", this.tr("customOption"))
            .setValue(this.plugin.settings.provider)
            .onChange(async (value) => {
              this.plugin.settings.provider = value === "custom" ? "custom" : "github";
              await this.plugin.saveSettings();
              this.refreshSettings();
            }),
        );
      }),
    ];
  }

  private githubQuickDefinitions(): SettingRow[] {
    const settings = this.plugin.settings.github;
    return [
      this.row(this.tr("quickSetup"), this.tr("quickSetupDesc"), (setting) => {
        setting.settingEl.addClass("obsipastepic-quick-setup");
        setting
          .addButton((button) =>
            button.setButtonText(this.tr("createRepo")).onClick(() => {
              window.open("https://github.com/new?name=pastepic-images&visibility=public", "_blank");
            }),
          )
          .addButton((button) =>
            button.setButtonText(this.tr("createToken")).onClick(() => {
              window.open("https://github.com/settings/personal-access-tokens/new", "_blank");
            }),
          );
      }),
      this.row(this.tr("owner"), this.tr("ownerDesc"), (setting) => {
        setting.addText((text) =>
          text.setPlaceholder("octocat").setValue(settings.owner).onChange(async (value) => {
            settings.owner = value.trim();
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("repo"), this.tr("repoDesc"), (setting) => {
        setting.addText((text) =>
          text.setPlaceholder("image-bed").setValue(settings.repo).onChange(async (value) => {
            settings.repo = value.trim();
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row("GitHub Token", `${this.tr("tokenDesc")} ${this.tr("tokenWarning")}`, (setting) => {
        setting.addText((text) =>
          text
            .setPlaceholder("github_pat_…")
            .setValue(settings.token)
            .onChange(async (value) => {
              settings.token = value.trim();
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("connectionTest"), this.tr("connectionTestDesc"), (setting) => {
        setting.addButton((button) =>
          button.setButtonText(this.tr("testGithub")).setCta().onClick(async () => {
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
      }),
    ];
  }

  private githubAdvancedDefinitions(): SettingRow[] {
    const settings = this.plugin.settings.github;
    return [
      this.row(this.tr("branch"), this.tr("branchDesc"), (setting) => {
        setting.addText((text) =>
          text.setPlaceholder("main").setValue(settings.branch).onChange(async (value) => {
            settings.branch = value.trim() || "main";
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("uploadPath"), this.tr("uploadPathDesc"), (setting) => {
        setting.addText((text) =>
          text
            .setPlaceholder("images")
            .setValue(settings.uploadPath)
            .onChange(async (value) => {
              settings.uploadPath = value;
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("filename"), this.tr("filenameDesc"), (setting) => {
        setting.addDropdown((dropdown) =>
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
      }),
      this.row(this.tr("commitMessage"), this.tr("commitMessageDesc"), (setting) => {
        setting.addText((text) =>
          text.setValue(settings.commitMessage).onChange(async (value) => {
            settings.commitMessage = value || DEFAULT_COMMIT_MESSAGE;
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("cdnBase"), this.tr("cdnBaseDesc"), (setting) => {
        setting.settingEl.addClass("obsipastepic-cdn-setting");
        const preview = setting.settingEl.createDiv({ cls: "obsipastepic-preview" });
        const updatePreview = (): void => {
          const examplePath = [settings.uploadPath.trim(), "example image.png"]
            .filter(Boolean)
            .join("/");
          preview.setText(buildGitHubPublicUrl(settings, examplePath));
        };
        setting
          .addText((text) =>
            text
              .setPlaceholder("https://cdn.example.com/xx/xx/")
              .setValue(settings.cdnBaseUrl)
              .onChange(async (value) => {
                settings.cdnBaseUrl = value.trim();
                updatePreview();
                await this.plugin.saveSettings();
              }),
          )
          .addButton((button) =>
            button.setButtonText(this.tr("useRaw")).onClick(async () => {
              settings.cdnBaseUrl = "";
              await this.plugin.saveSettings();
              this.refreshSettings();
            }),
          )
          .addButton((button) =>
            button.setButtonText(this.tr("useJsDelivr")).onClick(async () => {
              const owner = settings.owner.trim() || "OWNER";
              const repo = settings.repo.trim() || "REPOSITORY";
              const branch = settings.branch.trim() || "main";
              const path = settings.uploadPath.trim().replace(/^\/+|\/+$/g, "");
              settings.cdnBaseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path ? `${path}/` : ""}`;
              await this.plugin.saveSettings();
              this.refreshSettings();
            }),
          );
        updatePreview();
        setting.settingEl.createDiv({
          cls: "setting-item-description",
          text: this.tr("cdnExample"),
        });
      }),
    ];
  }

  private customApiDefinitions(): SettingRow[] {
    const settings = this.plugin.settings.custom;
    return [
      this.row(this.tr("endpoint"), this.tr("endpointDesc"), (setting) => {
        setting.addText((text) =>
          text
            .setPlaceholder("https://img.example.com/upload")
            .setValue(settings.endpoint)
            .onChange(async (value) => {
              settings.endpoint = value.trim();
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("fileField"), this.tr("fileFieldDesc"), (setting) => {
        setting.addText((text) =>
          text.setPlaceholder("file").setValue(settings.fileField).onChange(async (value) => {
            settings.fileField = value;
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("headers"), this.tr("headersDesc"), (setting) => {
        setting.addTextArea((text) => {
          text.inputEl.rows = 4;
          text.setValue(settings.headersJson).onChange(async (value) => {
            settings.headersJson = value;
            await this.plugin.saveSettings();
          });
        });
      }),
      this.row(this.tr("extraFields"), this.tr("extraFieldsDesc"), (setting) => {
        setting.addTextArea((text) => {
          text.inputEl.rows = 4;
          text.setValue(settings.extraFieldsJson).onChange(async (value) => {
            settings.extraFieldsJson = value;
            await this.plugin.saveSettings();
          });
        });
      }),
      this.row(this.tr("responsePath"), this.tr("responsePathDesc"), (setting) => {
        setting.addText((text) =>
          text.setPlaceholder("data.url").setValue(settings.responseUrlPath).onChange(async (value) => {
            settings.responseUrlPath = value.trim();
            await this.plugin.saveSettings();
          }),
        );
      }),
      this.row(this.tr("cdnBase"), this.tr("customCdnDesc"), (setting) => {
        setting.addText((text) =>
          text
            .setPlaceholder("https://cdn.example.com/xx/xx/")
            .setValue(settings.cdnBaseUrl)
            .onChange(async (value) => {
              settings.cdnBaseUrl = value.trim();
              await this.plugin.saveSettings();
            }),
        );
      }),
      this.row(this.tr("validate"), this.tr("validateDesc"), (setting) => {
        setting.addButton((button) =>
          button.setButtonText(this.tr("validateButton")).onClick(() => {
            try {
              validateCustomApiSettings(settings);
              new Notice(this.tr("customReady"));
            } catch (error) {
              new Notice(this.errorMessage(error));
            }
          }),
        );
      }),
    ];
  }

  private row(
    name: string,
    desc: string | undefined,
    configure: (setting: Setting) => void,
  ): SettingRow {
    return {
      name,
      desc,
      configure,
    };
  }

  private renderRows(containerEl: HTMLElement, rows: SettingRow[]): void {
    for (const row of rows) {
      const setting = new Setting(containerEl).setName(row.name);
      if (row.desc) setting.setDesc(row.desc);
      row.configure(setting);
    }
  }

  private toSettingDefinitions(rows: SettingRow[]): CompatibleSettingDefinitionRender[] {
    return rows.map((row) => ({
      name: row.name,
      desc: row.desc,
      render: row.configure,
    }));
  }

  private refreshSettings(): void {
    const update = Reflect.get(this, "update") as unknown;
    if (typeof update === "function") {
      update.call(this);
    } else {
      this.display();
    }
  }

  private tr(key: MessageKey, variables?: Record<string, string | number>): string {
    return t(this.plugin.settings.language, key, variables);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

interface SettingRow {
  name: string;
  desc?: string;
  configure: (setting: Setting) => void;
}

interface CompatibleSettingDefinitionRender {
  name: string;
  desc?: string;
  render: (setting: Setting) => void;
}

interface CompatibleSettingDefinitionGroup {
  type: "group";
  heading?: string;
  items: CompatibleSettingDefinitionRender[];
}

type CompatibleSettingDefinitionItem =
  | CompatibleSettingDefinitionRender
  | CompatibleSettingDefinitionGroup;
