# Image Bed Uploader

一个用于 Obsidian 的图片自动上传插件：粘贴或拖入图片后，将图片上传到 GitHub 仓库或自定义图床 API，再把 Markdown 中的占位内容替换成远程图片链接。

## 功能

- 粘贴图片自动上传，支持一次粘贴多张图片
- 可选拖放图片自动上传
- GitHub Contents API 上传，桌面端与移动端均可使用
- 通用 `multipart/form-data` 图床接口
- 自定义 CDN / 反向代理加速链接模板
- 日期目录、文件名策略、提交信息模板
- 上传中占位符与失败注释，避免异步上传时替换错位置
- GitHub 配置只读连接测试

## 安装

### 直接安装构建产物

1. 在 Obsidian 仓库的 `.obsidian/plugins/` 下创建 `image-bed-uploader` 文件夹。
2. 把 `main.js`、`manifest.json`、`styles.css` 复制进去。
3. 重启 Obsidian，进入“设置 → 第三方插件”，启用 **Image Bed Uploader**。

### 从源码构建

```bash
npm install
npm test
npm run build
```

构建后安装所需文件是 `main.js`、`manifest.json` 和 `styles.css`。

## GitHub 配置

1. 新建或选择一个用于存图的 GitHub 仓库。公开仓库最适合直接配合公共 CDN。
2. 创建 Fine-grained personal access token：
   - Repository access 只选择该图床仓库；
   - Repository permissions → Contents 设置为 **Read and write**；
   - 不要授予无关权限。
3. 在插件设置中填写仓库所有者、仓库名、分支和 Token。
4. 点击“测试 GitHub 配置”。
5. 粘贴一张图片验证上传。

Token 会以明文保存在 Obsidian 插件目录的 `data.json`。请使用只绑定一个仓库、权限最小且可随时撤销的 Token，不要复用高权限 Token。

### 仓库路径变量

“仓库内路径”支持：

- `{year}`、`{month}`、`{day}`
- `{hour}`、`{minute}`、`{second}`
- `{timestamp}`

默认值 `images/{year}/{month}` 会生成类似 `images/2026/07/文件名.png` 的路径。

### CDN / 代理模板

GitHub 模式支持以下变量：

- `{owner}`：仓库所有者
- `{repo}`：仓库名
- `{branch}`：分支
- `{path}`：逐段 URL 编码后的文件路径
- `{encodedPath}`：整条路径编码后的值
- `{rawUrl}`：完整 GitHub Raw URL
- `{encodedRawUrl}`：编码后的完整 Raw URL

常用模板：

```text
# GitHub Raw（默认）
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}

# jsDelivr
https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}

# Statically
https://cdn.statically.io/gh/{owner}/{repo}/{branch}/{path}

# 自建代理，在 Raw URL 前加前缀
https://image-proxy.example.com/{rawUrl}

# 需要把源 URL 当作查询参数的代理
https://image-proxy.example.com/fetch?url={encodedRawUrl}
```

设置页会实时显示示例预览。自建代理的路由格式不同，按代理服务实际要求调整模板即可。

> 私有 GitHub 仓库的 Raw/CDN 链接通常无法匿名访问。上传可以成功，但 Obsidian 或网页端未必能显示图片；这种场景需要能为私有仓库鉴权的自建代理，或改用公开图床仓库。

## 自定义图床 API

该模式会发送如下请求：

```http
POST /upload
Content-Type: multipart/form-data

file=<图片二进制>
album=obsidian
```

设置项说明：

- **上传接口**：完整 HTTPS URL；
- **文件字段名**：默认 `file`，按图床 API 改为 `image`、`source` 等；
- **请求头 JSON**：适合填写 Authorization 或 API Key；
- **附加表单字段 JSON**：相册、过期时间等普通字段；
- **响应链接路径**：例如响应 `{ "data": { "url": "..." } }` 时填 `data.url`；数组支持 `data.images[0].url`；
- **CDN / 代理链接模板**：支持 `{url}`、`{encodedUrl}`、`{filename}`。

如果 API 直接返回 JSON 字符串 URL，可把“响应链接路径”留空。插件不适配签名算法、分块上传或必须由浏览器表单执行的特殊接口，这类服务需要增加专用上传器。

## 粘贴行为

- 剪贴板没有图片时，插件不干预 Obsidian。
- 剪贴板里的文件不全是图片时，插件不干预，避免丢失附件。
- 配置缺失时不会阻止原生粘贴。
- 上传开始后会插入唯一占位符；成功后替换为 `![文件名](<远程地址>)`。
- 上传失败时占位符会替换成 HTML 注释，并显示通知；图片仍保留在系统剪贴板时可再次粘贴。

如果从 Excel、浏览器等应用复制内容时同时出现图片和文字，可用“图片与文字共存时仍上传”开关决定由插件还是 Obsidian 处理。

## 参考项目

本插件在事件处理、上传抽象和 GitHub/CDN 配置方面参考了：

- [gavvvr/obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
- [yaleiyale/obsidian-emo-uploader](https://github.com/yaleiyale/obsidian-emo-uploader)
- [renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin)

实现代码为独立编写，采用 MIT License。
