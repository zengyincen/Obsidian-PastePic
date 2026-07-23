
<p align="center">
  <img src="./assets/icon.svg" alt="ObsiPastePic App Icon" width="128" height="128" />
</p>

<p align="center">
  <a href="https://github.com/zengyincen/ObsiPastePic/releases/latest"><img alt="最新版本" src="https://img.shields.io/github/v/release/zengyincen/ObsiPastePic?display_name=tag&sort=semver&style=flat-square&color=0A84FF" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/releases"><img alt="下载量" src="https://img.shields.io/github/downloads/zengyincen/ObsiPastePic/total?style=flat-square&color=5E5CE6" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/zengyincen/ObsiPastePic?style=flat-square&color=FFB340" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/commits/main"><img alt="最后提交" src="https://img.shields.io/github/last-commit/zengyincen/ObsiPastePic?style=flat-square&color=30D158" /></a>
  <a href="https://github.com/zengyincen/ObsiPastePic/issues"><img alt="Issues" src="https://img.shields.io/github/issues/zengyincen/ObsiPastePic?style=flat-square&color=FF9F0A" /></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/zengyincen/ObsiPastePic?style=flat-square&color=8E8E93" /></a>
</p>

<p align="center">
  <strong>粘贴一次，自动上传，立即引用。</strong><br />
  ObsiPastePic 把粘贴到 Obsidian 的图片上传到 GitHub 仓库或你的图床，并写入可自定义的 CDN / 代理链接。
</p>

<p align="center">
  <a href="https://github.com/zengyincen/ObsiPastePic/releases/latest"><strong>下载最新版本</strong></a>
  ·
  <a href="#30-秒配置-github"><strong>快速开始</strong></a>
  ·
  <a href="#cdn--代理基础路径"><strong>CDN 路径</strong></a>
  ·
  <ins><strong>简体中文</strong></ins> · <a href="./README_EN.md"><strong>English</strong></a>
</p>

<p align="center">
  <img src="./assets/banner.svg" alt="ObsiPastePic Banner" width="100%" />
</p>


## 为什么是 ObsiPastePic？

截图、网页图片和设计稿经常让 Obsidian 仓库迅速膨胀。手动打开图床、上传、复制链接、再返回笔记，又会打断写作节奏。

<p align="center">
  <img src="./assets/hero.svg" alt="ObsiPastePic — Paste. Upload. Done." width="100%" />
</p>

ObsiPastePic 只做一件事：**接住你粘贴、拖入或由 Obsidian 新插入的本地图片，上传，然后在原位置放回远程 Markdown 图片链接。** 上传过程有独立占位符；失败时恢复本地图片链接，不会留下无效的错误链接。

## 功能一览

| 能力 | 说明 |
| --- | --- |
| 自动粘贴上传 | 支持一次粘贴多张图片，并在各自占位位置异步替换链接 |
| 拖放上传 | 可选择在图片拖入 Markdown 编辑器时自动上传 |
| 插入图片检测 | 自动识别 Obsidian 或其他插件新插入的本地图片链接并上传 |
| GitHub 图床 | 使用 GitHub Contents API，支持日期目录、分支和提交信息模板 |
| 通用图床 API | 支持 `POST multipart/form-data`、自定义请求头、文件字段和附加字段 |
| CDN / 代理加速 | 只填写图片目录基础路径，插件自动追加图片名和后缀 |
| 多语言设置 | 设置页支持简体中文、英语、日语、韩语、意大利语、西班牙语、德语和法语 |
| 安全的原生回退 | 没有图片、混入非图片文件或配置缺失时，不接管 Obsidian 原生行为 |
| 桌面与移动端 | 不依赖本地可执行文件，插件清单未限制为桌面端 |

## 安装

### 从 Release 安装

1. 打开 [Latest Release](https://github.com/zengyincen/ObsiPastePic/releases/latest)。
2. 下载 `obsipastepic-*.zip`。
3. 解压到你的 Obsidian 仓库：

   ```text
   <你的仓库>/.obsidian/plugins/obsipastepic/
   ```

4. 确认文件夹中包含 `main.js`、`manifest.json`、`styles.css` 和 `assets/icon.svg`。
5. 重启 Obsidian，在「设置 → 第三方插件」中启用 **ObsiPastePic**。

> 当前尚未提交到 Obsidian 官方社区插件列表，因此请以 GitHub Release 为准。

### 从源码构建

```bash
git clone https://github.com/zengyincen/ObsiPastePic.git
cd ObsiPastePic
npm install
npm test
npm run build
```

## 30 秒配置 GitHub

1. 创建或选择一个用于存图的 GitHub 仓库。公开仓库更适合直接配合公共 CDN。
2. 创建 **Fine-grained personal access token**：
   - Repository access：只选择图床仓库；
   - Repository permissions → Contents：选择 **Read and write**；
   - 不授予无关权限。
3. 打开 ObsiPastePic 设置，选择「GitHub 仓库」。
4. 填写仓库所有者、仓库名、分支和 Token。
5. 点击「测试 GitHub 配置」，再粘贴一张图片。

### 路径与文件名

仓库内路径默认为空，图片会直接上传到仓库根目录。也可填写 `images` 等固定目录；使用自定义 CDN 时，让基础路径指向同一目录即可。

设置页语言默认为简体中文，可随时切换为英语、日语、韩语、意大利语、西班牙语、德语或法语。

文件命名支持：

- 时间戳 + 原文件名（默认，最不容易冲突）；
- 仅时间戳；
- 保留原文件名。

提交信息还可使用 `{filename}` 和 `{path}`。

## CDN / 代理基础路径

这里不再使用模板变量。用户只需填写到**图片所在目录**，ObsiPastePic 会自动追加上传后的图片名和后缀。

例如仓库内路径为 `images`，上传后的文件名是 `1730000000-note.png`：

| 场景 | 设置中填写的基础路径 | 最终生成链接 |
| --- | --- | --- |
| GitHub Raw | 留空 | 自动生成完整 Raw 链接 |
| jsDelivr | `https://cdn.jsdelivr.net/gh/zengyincen/image-bed@main/` | `…/1730000000-note.png` |
| Statically | `https://cdn.statically.io/gh/zengyincen/image-bed/main/` | `…/1730000000-note.png` |
| 自建代理/CDN | `https://cdn.example.com/xx/xx/` | `https://cdn.example.com/xx/xx/1730000000-note.png` |

设置页会显示完整链接预览。自定义路径应与 GitHub 的“仓库内路径”指向同一目录。

> 私有 GitHub 仓库的 Raw/CDN 链接通常无法匿名读取。上传可以成功，但图片不一定能显示；请使用能够为私有仓库鉴权的自建代理，或改用公开图床仓库。

## 自定义图床 API

自定义模式会通过 `POST multipart/form-data` 发送图片：

```http
POST /upload
Content-Type: multipart/form-data

file=<图片二进制>
album=obsidian
```

| 设置 | 示例 |
| --- | --- |
| 上传接口 | `https://img.example.com/upload` |
| 文件字段名 | `file`、`image` 或 `source` |
| 请求头 JSON | `{"Authorization":"Bearer token"}` |
| 附加字段 JSON | `{"album":"obsidian"}` |
| 响应链接路径 | `data.url` 或 `data.images[0].url` |
| CDN / 代理基础路径 | `https://cdn.example.com/xx/xx/`；留空使用图床返回链接 |

插件不适配需要专用签名算法、分块上传或浏览器交互登录的特殊接口；这类服务需要单独实现上传器。

## 粘贴行为与失败处理

- 剪贴板没有图片时，插件不干预 Obsidian。
- 剪贴板文件不全是图片时，插件不接管，避免丢失附件。
- 配置缺失时保留 Obsidian 原生粘贴行为。
- 上传开始后插入唯一占位符，成功后替换为标准 `![文件名](远程地址)`，链接两侧不会出现 `< >`。
- 上传失败时恢复本地图片链接，不再生成 `[Github upload error]()` 或 HTML 错误注释。
- 已存在的旧式 `[Github upload error]()` 标记会在编辑器变更时自动清理。
- 可决定剪贴板同时含图片与文字时是否仍上传图片。

## 安全说明

- GitHub Token 会明文保存在插件目录的 `data.json` 中；请务必使用**单仓库、最小权限、可随时撤销**的 Token。
- 不要在截图、Issue、日志或公开笔记中暴露 Token 和自定义图床请求头。
- GitHub 与公共 CDN 都有服务条款和流量限制。个人笔记图片通常没有问题，但不应把它们当作无限制对象存储。

## 开发与验证

```bash
npm run typecheck   # TypeScript 类型检查
npm test            # Vitest 单元测试
npm run build       # 生成 main.js
```

当前测试覆盖基础路径拼接、无尖括号 Markdown、路径编码、文件命名、本地图片插入检测、旧错误标记清理、JSON 响应路径和配置迁移。

## 品牌素材

| 素材 | 文件 | 用途 |
| --- | --- | --- |
| App Icon | [`assets/icon.svg`](./assets/icon.svg) | 头像、应用图标、小尺寸标识 |
| Banner | [`assets/banner.svg`](./assets/banner.svg) | GitHub 头图、社交分享横幅 |
| Hero | [`assets/hero.svg`](./assets/hero.svg) | README 与产品介绍主视觉 |

视觉采用克制渐变、玻璃层次与大留白的现代系统设计语言；不包含 Apple 商标或官方素材。

## 致谢

ObsiPastePic 是独立实现的 MIT 开源项目。以下项目为事件处理、上传、GitHub 图床与用户体验提供了重要参考：

- [gavvvr/obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin) — 图片粘贴事件、上传与失败回退思路。
- [yaleiyale/obsidian-emo-uploader](https://github.com/yaleiyale/obsidian-emo-uploader) — GitHub Contents API、多图床配置与 CDN 链接组织方式。
- [renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin) — 粘贴占位、拖放上传与图床工作流。
- [jordanhandy/obsidian-cloudinary-uploader](https://github.com/jordanhandy/obsidian-cloudinary-uploader) — 被 Emo Uploader 明确列为 Cloudinary 实现资料。
- [PicGo](https://github.com/Molunerfinn/PicGo) 与 [PicGo-Core](https://github.com/PicGo/PicGo-Core) — Image Auto Upload Plugin 的核心图床生态与文档来源。
- [GitHub REST API](https://docs.github.com/rest) 与 [jsDelivr](https://www.jsdelivr.com/) — Emo Uploader 致谢并采用的上传/CDN 基础设施。
- [AList](https://github.com/AlistGo/alist)、[EasyImages2.0](https://github.com/icret/EasyImages2.0)、[Chevereto](https://github.com/chevereto/chevereto) — Emo Uploader 支持并在文档中致谢的自托管图床生态。
- [Cloudinary](https://cloudinary.com/)、[SM.MS](https://smms.app/)、[ImgURL](https://www.imgurl.org/)、[Imgur](https://imgur.com/)、[imgbb](https://imgbb.com/) 与 [Catbox](https://catbox.moe/) — 上述参考项目覆盖和记录的托管服务。

其中，`obsidian-image-auto-upload-plugin` 是 `obsidian-imgur-plugin` 的 fork；感谢两边作者持续演进这条插件路线。

感谢 [Obsidian](https://obsidian.md/) 提供插件 API，也感谢所有维护者公开代码与文档。

## License

[MIT](./LICENSE) © 2026 曾胤岑
