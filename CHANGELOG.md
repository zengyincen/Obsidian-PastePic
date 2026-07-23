# Changelog

## 0.4.1 — 2026-07-23

- Register a custom ObsiPastePic ribbon icon that opens the plugin settings.
- Display the full-color brand icon in the settings header.
- Include `assets/icon.svg` in the release installation package.

## 0.4.0 — 2026-07-23

- Add a settings-page language selector with Simplified Chinese, English, Japanese, Korean, Italian, Spanish, German, and French.
- Default new installations to Simplified Chinese.
- Leave the GitHub repository upload path empty by default so images upload to the repository root.

## 0.3.0 — 2026-07-23

- Standardize the project, repository, package, plugin ID, install directory, and internal names as **ObsiPastePic**.
- Keep redirects from the former GitHub repository URL for existing links.

## 0.2.0 — 2026-07-23

- Upload images pasted, dropped, or newly inserted as local Obsidian links.
- Replace brace-based CDN templates with a simple image-directory base URL.
- Append the uploaded filename and extension to the CDN/proxy base URL automatically.
- Show the GitHub token as editable visible text in settings.
- Generate standard Markdown image links without angle brackets around URLs.
- Restore a local attachment link when an upload fails.
- Remove legacy `[Github upload error]()` markers created by conflicting uploader plugins.

## 0.1.0 — 2026-07-23

- Initial release with GitHub and generic multipart image-host uploaders.
