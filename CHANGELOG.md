# Changelog

## 0.4.7 — 2026-07-23

- Replace runtime `btoa` usage with an explicit RFC 4648 byte encoder required by the GitHub Contents API.
- Add binary encoding test vectors so image uploads remain verifiable without hidden runtime decoding behavior.

## 0.4.6 — 2026-07-23

- Make the complete English documentation the default `README.md` for the Obsidian community directory.
- Move the complete Simplified Chinese documentation to `README_ZH.md` and add language-switch links.

## 0.4.5 — 2026-07-23

- Adopt Obsidian 1.13's declarative settings API and searchable setting definitions.
- Use standard setting headings and correct paste/drop event handling.
- Bundle the settings icon into `main.js` and limit GitHub Release assets to supported plugin files.
- Add GitHub build-provenance attestations for published assets.
- Remove the deprecated `builtin-modules` dependency and clean up legacy settings migration types.
- Add an English overview to the default Chinese README.

## 0.4.4 — 2026-07-23

- Publish a fresh release under the exact bare version tag required by the Obsidian community directory.
- Add a release workflow that rejects `v`-prefixed or mismatched tags and uploads the required plugin assets automatically.

## 0.4.3 — 2026-07-23

- Change the manifest display name to **PastePic** to comply with the Obsidian community-directory rule that prohibits variations such as `Obsi-`.
- Keep the plugin ID `obsipastepic`, installation directory, GitHub repository, and saved settings compatible with previous releases.

## 0.4.2 — 2026-07-23

- Clip all icon artwork to the rounded app-icon boundary, removing the bottom-right color spill.
- Use the same full brand-icon artwork in the standalone icon, banner, and hero assets.

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
