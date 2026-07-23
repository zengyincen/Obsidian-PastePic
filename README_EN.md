<p align="right">
  <a href="./README.md">简体中文</a> · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <img src="./assets/icon.svg" alt="ObsiPastePic App Icon" width="128" height="128" />
</p>

<p align="center">
  <img src="./assets/banner.svg" alt="ObsiPastePic Banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/zengyincen/ObsiPastePic/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/zengyincen/ObsiPastePic?display_name=tag&sort=semver&style=flat-square&color=0A84FF" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/zengyincen/ObsiPastePic/total?style=flat-square&color=5E5CE6" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/zengyincen/ObsiPastePic?style=flat-square&color=FFB340" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/zengyincen/ObsiPastePic?style=flat-square&color=30D158" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/issues"><img alt="Issues" src="https://img.shields.io/github/issues/zengyincen/ObsiPastePic?style=flat-square&color=FF9F0A" /></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/zengyincen/ObsiPastePic?style=flat-square&color=8E8E93" /></a>
</p>

<p align="center">
  <strong>Paste once. Upload automatically. Link instantly.</strong><br />
  ObsiPastePic uploads images pasted into Obsidian to GitHub or your image host, then inserts a customizable CDN or proxy URL.
</p>

<p align="center">
  <a href="https://github.com/zengyincen/ObsiPastePic/releases/latest"><strong>Download</strong></a>
  ·
  <a href="#github-setup-in-30-seconds"><strong>Quick start</strong></a>
  ·
  <a href="#cdn--proxy-base-directory"><strong>CDN path</strong></a>
</p>

<p align="center">
  <img src="./assets/hero.svg" alt="ObsiPastePic — Paste. Upload. Done." width="100%" />
</p>

## Why ObsiPastePic?

Screenshots, web images, and design exports can make an Obsidian vault grow quickly. Manually opening an image host, uploading, copying a URL, and returning to the note also breaks the writing flow.

ObsiPastePic does one thing well: **it catches an image that is pasted, dropped, or newly inserted as a local Obsidian link, uploads it, and puts the remote Markdown image link back in the same place.** Every upload gets a unique placeholder. A failed upload restores the local image link instead of leaving a broken error link.

## Features

| Capability | Details |
| --- | --- |
| Automatic paste upload | Paste multiple images and replace each independent placeholder asynchronously |
| Drag-and-drop upload | Optionally upload images dropped into the Markdown editor |
| Inserted-image detection | Upload local image links newly inserted by Obsidian or another plugin |
| GitHub image hosting | GitHub Contents API with branches, date paths, and commit-message templates |
| Generic image-host API | `POST multipart/form-data` with custom headers, file field, and extra form fields |
| CDN / proxy acceleration | Enter an image-directory base URL; the plugin appends the filename and extension |
| Multilingual settings | Simplified Chinese, English, Japanese, Korean, Italian, Spanish, German, and French |
| Native fallback | Leaves Obsidian untouched when there is no image, mixed file types, or missing configuration |
| Desktop and mobile | No local executable dependency and no desktop-only manifest restriction |

## Installation

### Install from a Release

1. Open the [latest Release](https://github.com/zengyincen/ObsiPastePic/releases/latest).
2. Download `obsipastepic-*.zip`.
3. Extract it to:

   ```text
   <your-vault>/.obsidian/plugins/obsipastepic/
   ```

4. Make sure the folder contains `main.js`, `manifest.json`, `styles.css`, and `assets/icon.svg`.
5. Restart Obsidian and enable **ObsiPastePic** under Settings → Community plugins.

> ObsiPastePic has not yet been submitted to the official Obsidian community-plugin directory. GitHub Releases are currently the canonical distribution channel.

### Build from source

```bash
git clone https://github.com/zengyincen/ObsiPastePic.git
cd ObsiPastePic
npm install
npm test
npm run build
```

## GitHub setup in 30 seconds

1. Create or select a GitHub repository for your images. A public repository works best with public CDNs.
2. Create a **fine-grained personal access token**:
   - Limit repository access to the image repository;
   - Set Repository permissions → Contents to **Read and write**;
   - Grant no unrelated permissions.
3. Open ObsiPastePic settings and choose “GitHub repository.”
4. Enter the owner, repository, branch, and token.
5. Run “Test GitHub configuration,” then paste an image.

### Paths and filenames

The repository path is empty by default, so images are uploaded to the repository root. You can instead enter a fixed directory such as `images`; when using a custom CDN, point its base URL to the same directory.

The settings page defaults to Simplified Chinese and can be switched to English, Japanese, Korean, Italian, Spanish, German, or French at any time.

Filename strategies:

- Timestamp + original filename — default and least likely to collide;
- Timestamp only;
- Original filename.

Commit messages can also use `{filename}` and `{path}`.

## CDN / proxy base directory

There are no template variables. Enter the URL of the **final image directory** and ObsiPastePic appends the uploaded filename and extension automatically.

For a repository directory named `images` and an uploaded filename `1730000000-note.png`:

| Use case | Base directory in settings | Final URL |
| --- | --- | --- |
| GitHub Raw | Leave empty | A complete Raw URL is generated automatically |
| jsDelivr | `https://cdn.jsdelivr.net/gh/zengyincen/image-bed@main/images/` | `…/images/1730000000-note.png` |
| Statically | `https://cdn.statically.io/gh/zengyincen/image-bed/main/images/` | `…/images/1730000000-note.png` |
| Custom proxy/CDN | `https://cdn.example.com/xx/xx/` | `https://cdn.example.com/xx/xx/1730000000-note.png` |

The settings screen displays the complete URL preview. A custom base must point to the same directory as “Repository path.”

> Raw and public CDN links generally cannot read private GitHub repositories anonymously. Uploads may succeed while images remain unavailable. Use an authenticated proxy or a public image repository.

## Custom image-host API

Custom mode sends images as `POST multipart/form-data`:

```http
POST /upload
Content-Type: multipart/form-data

file=<image bytes>
album=obsidian
```

| Setting | Example |
| --- | --- |
| Endpoint | `https://img.example.com/upload` |
| File field | `file`, `image`, or `source` |
| Header JSON | `{"Authorization":"Bearer token"}` |
| Extra field JSON | `{"album":"obsidian"}` |
| Response URL path | `data.url` or `data.images[0].url` |
| CDN / proxy base directory | `https://cdn.example.com/xx/xx/`; leave empty to use the host response URL |

Services that require custom signatures, chunked uploads, or an interactive browser login need a dedicated uploader implementation.

## Paste behavior and failures

- The plugin does nothing when the clipboard contains no image.
- It does not intercept a mixed list of image and non-image files.
- Missing configuration preserves Obsidian's native paste behavior.
- Uploads start with a unique placeholder and finish as standard `![filename](remote-url)` Markdown, without `< >` around the URL.
- Failed uploads restore the local image link instead of creating `[Github upload error]()` or an HTML error comment.
- Existing legacy `[Github upload error]()` markers are removed automatically on editor changes.
- A setting controls whether images are uploaded when clipboard text is present too.

## Security

- The GitHub token is stored as plain text in the plugin's `data.json`. Use a **single-repository, least-privilege, revocable** token.
- Never expose tokens or custom authorization headers in screenshots, Issues, logs, or public notes.
- GitHub and public CDNs have terms and traffic limits. Normal personal-note images are usually fine; they are not unlimited object storage.

## Development and verification

```bash
npm run typecheck   # TypeScript type checking
npm test            # Vitest unit tests
npm run build       # Build main.js
```

Tests cover base-directory joining, angle-bracket-free Markdown, path encoding, file naming, local image insertion detection, legacy error-marker cleanup, JSON response paths, and settings migration.

## Brand assets

| Asset | File | Intended use |
| --- | --- | --- |
| App Icon | [`assets/icon.svg`](./assets/icon.svg) | Avatar, app icon, compact identity |
| Banner | [`assets/banner.svg`](./assets/banner.svg) | Repository header and social banner |
| Hero | [`assets/hero.svg`](./assets/hero.svg) | README and product overview |

The visual system uses restrained gradients, layered glass, and generous spacing. It contains no Apple trademark or official Apple artwork.

## Acknowledgements

ObsiPastePic is an independently implemented MIT-licensed project. The following projects provided valuable references for events, uploader abstractions, GitHub image hosting, and UX:

### Direct references

- [gavvvr/obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin) — image-paste events, uploader abstraction, and failure fallback.
- [yaleiyale/obsidian-emo-uploader](https://github.com/yaleiyale/obsidian-emo-uploader) — GitHub Contents API, multi-host settings, and CDN URL organization.
- [renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin) — paste placeholders, drag-and-drop uploads, and image-host workflows.

`obsidian-image-auto-upload-plugin` is a fork of `obsidian-imgur-plugin`; thanks to both maintainers for advancing this plugin family.

### Upstream projects and ecosystem credited by those references

- [jordanhandy/obsidian-cloudinary-uploader](https://github.com/jordanhandy/obsidian-cloudinary-uploader) — explicitly credited by Emo Uploader as a Cloudinary reference.
- [PicGo](https://github.com/Molunerfinn/PicGo) and [PicGo-Core](https://github.com/PicGo/PicGo-Core) — the image-host ecosystem and documentation used by Image Auto Upload Plugin.
- [GitHub REST API](https://docs.github.com/rest) and [jsDelivr](https://www.jsdelivr.com/) — upload and CDN infrastructure credited by Emo Uploader.
- [AList](https://github.com/AlistGo/alist), [EasyImages2.0](https://github.com/icret/EasyImages2.0), and [Chevereto](https://github.com/chevereto/chevereto) — self-hosted image ecosystems supported and credited by Emo Uploader.
- [Cloudinary](https://cloudinary.com/), [SM.MS](https://smms.app/), [ImgURL](https://www.imgurl.org/), [Imgur](https://imgur.com/), [imgbb](https://imgbb.com/), and [Catbox](https://catbox.moe/) — hosting services documented by the reference projects.
- Thanks also to [anxinJ](https://github.com/anxinJ) and [Linnnkkk](https://github.com/Linnnkkk), contributors explicitly named by Emo Uploader.

Thank you to [Obsidian](https://obsidian.md/) for the plugin API, and to every maintainer who publishes code and documentation openly.

## License

[MIT](./LICENSE) © 2026 曾胤岑
