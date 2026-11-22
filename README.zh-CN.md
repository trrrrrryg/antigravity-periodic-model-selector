<div align="center">

<img src="docs/banner.png" alt="Periodic Model Selector Banner" width="100%" />

<br /><br />

# Antigravity Periodic Model Selector

**非官方社区开源 · 可扩展 118 号元素周期表模型选择器 · 实色悬停放大 · 三档订阅分级 · 粒子消散拼字选模 · 启动自动查新与一键更新**

[![Version](https://img.shields.io/badge/version-1.1.0-FB923C?style=flat-square)](https://github.com/trrrrrryg/antigravity-periodic-model-selector/releases)
[![Elements](https://img.shields.io/badge/Periodic_Table-118_Elements-38BDF8?style=flat-square)](#核心特性)
[![Effects](https://img.shields.io/badge/Canvas_FX-Particle_Morph-A78BFA?style=flat-square)](#实机演示)
[![Unofficial](https://img.shields.io/badge/Community_Mod-Unofficial-64748B?style=flat-square)](#安全隐私与非官方声明)

[English](./README.md) | **简体中文**

[实机演示](#实机演示) · [界面一览](#界面一览) · [核心特性](#核心特性) · [快速安装](#快速安装) · [安全与免责声明](#安全隐私与非官方声明)

---

### 实机演示

<img src="docs/demo.gif" alt="Periodic Model Selector Live Demo" width="880" />

<sub>悬停激活元素（H / C / Ne / Ar）放大展示思考强度并实时校验订阅权限；点击选定后菜单先行收回、元素停留滞空并瞬间粒子化飞向左下角触发器，汇聚排列成新选中的模型名称。</sub>

</div>

<br />

## 界面一览

<table>
  <tr>
    <td align="center" width="34%">
      <img src="docs/shot_table.png" alt="118号元素周期表主面板" /><br />
      <strong>① 顶部元素周期表 + 下方其余模型</strong><br />
      <sub>动态点亮 H / C / Ne / Ar，其余 114 个位置保持清晰灰阶；Orchestrator / Claude / GPT 等保留原样位于下方</sub>
    </td>
    <td align="center" width="33%">
      <img src="docs/shot_hover.png" alt="实色元素悬停放大与思考强度浮层" /><br />
      <strong>② 实色放大与思考强度浮层</strong><br />
      <sub>悬停可用元素平滑放大 1.28&times; 并弹出实色思考强度菜单；直接点击元素格则使用默认思考强度</sub>
    </td>
    <td align="center" width="33%">
      <img src="docs/shot_particles.png" alt="粒子汇聚成左下角模型名称" /><br />
      <strong>③ 粒子消散并重排为左下角文字</strong><br />
      <sub>选定后原菜单收起、卡片滞空爆裂为发光粒子，精准飞抵触发器并汇聚成新模型名称</sub>
    </td>
  </tr>
</table>

## 核心特性

- **118 号全元素动态识别（绝不写死）**：每次弹窗挂载时自动扫描 Antigravity 模型选择上下文中的 `modelSorts` 与 `groups`，将元素命名模型自动映射到 1～118 号标准周期表坐标；日后官方新增 `He`、`B`、`Si` 等新元素模型会自动点亮对应格子，也可通过 `window.__AGY_PTABLE.registerAlias(alias, symbol)` 扩展自定义别名。
- **三档订阅权限策略（Free / Pro / Ultra）**：
  - **Free 免费订阅**：Gemini 4 系列元素全部锁定并提示升级；
  - **Pro 订阅**：开放 `H`、`Ne`、`Ar`，锁定 `6 C (Carbon)` 并在悬停与点击时给出 Ultra 专属提示；
  - **Ultra 订阅**：全系元素无限制使用。（右侧 **Periodic Model Selector** 辅助面板支持一键模拟切换三档订阅预览效果）
- **100% 不透明实色卡片**：灰阶元素格、高光激活格与思考强度浮层全部采用实色混色，悬停放大时不透底、字迹清晰。
- **启动自动查新与一键更新**：每次启动自动查询 GitHub 最新 Release（支持 jsDelivr / Raw 备用源）；发现新版本时在周期表右上角展示无干扰提示按钮，点击后可选择**直接更新**（下载校验、原地替换、保留用户配置并自动重载）或**后续再更新**。

## 快速安装

1. 确保 Antigravity 启动参数包含 `--remote-debugging-port=9222`。
2. 从 [Releases](https://github.com/trrrrrryg/antigravity-periodic-model-selector/releases) 下载最新 `antigravity-periodic-model-selector-v1.1.0.zip` 并解压，或克隆本仓库：
   ```bash
   git clone https://github.com/trrrrrryg/antigravity-periodic-model-selector.git ~/.gemini/config/plugins/antigravity-periodic-model-selector
   agy plugin validate ~/.gemini/config/plugins/antigravity-periodic-model-selector
   agy plugin enable antigravity-periodic-model-selector
   ```
3. 打开对话框左下角模型选择器，即可体验元素周期表选模与粒子重排动效。

### 卸载方式

```bash
agy plugin disable antigravity-periodic-model-selector
rm -rf ~/.gemini/config/plugins/antigravity-periodic-model-selector
```

## 安全、隐私与非官方声明

> **非官方社区开源声明（Unofficial Community Mod）**  
> 本项目为社区开发者独立制作的**非官方开源 UI 交互实验插件**，与 Google 或 Antigravity 官方团队无任何隶属、合作或官方背书关系。

- **仅做纯本地前端界面增强**：
  - 插件通过本地 sidecar 连接 `127.0.0.1` 的 Chrome DevTools Protocol（`--remote-debugging-port=9222`），使用隔离的 Shadow DOM 增强模型选择器界面。
  - **不修改任何客户端安装包或二进制文件（不改 `app.asar`）**，禁用或删除插件目录即可完全恢复默认界面。
- **严格遵守官方订阅与配额限制**：
  - 本插件仅作用于前端交互呈现，**绝不绕过**任何 Free / Pro / Ultra 后端鉴权、模型访问权限或配额校验（例如 Pro 账户无法通过本插件调用 Ultra 专属模型）。
- **零第三方依赖、零遥测上报**：
  - 全部代码为原生 JavaScript / Node.js ESM，**零 npm 外部依赖**，源码简洁透明，随时可全文审计。
  - 不读取、不记录、不上传任何对话内容、账号凭据或设备信息。
- **显式确认更新，绝不静默执行远端代码**：
  - 启动查新仅向 `api.github.com`（及 `cdn.jsdelivr.net` / `raw.githubusercontent.com` 备源）发起只读 `GET` 请求比对版本号。
  - 不会在后台静默下载或自动执行远端代码；只有在你主动点击弹窗中的 **「直接更新」** 后才会执行文件替换。
- **关于 `--remote-debugging-port=9222` 的安全提示**：
  - 开启 Electron 本地远程调试端口后，本机 `127.0.0.1` 上的其他本地进程理论上也可连接该调试端口。请在受信任的个人开发环境中使用；如果公司或系统安全策略禁止开启调试端口，请勿使用本插件。
- **版本兼容性说明**：
  - 由于 CDP 前端增强依赖 Antigravity 现有页面 DOM 与 React 结构而非官方稳定 UI 扩展接口，客户端后续升级可能导致插件暂时失效，届时需等待仓库适配更新。

<details>
<summary><strong>仓库结构与技术说明</strong></summary>

- `plugin.json`：插件清单与版本号
- `assets/logo.svg`：元素周期表网格图标
- `sidecars/periodic_selector/sidecar.json`：Sidecar 进程与辅助面板注册配置
- `sidecars/periodic_selector/main.mjs`：本地 CDP 目标发现与自动切换、热更新注入器、GitHub 启动查新与一键更新引擎、辅助面板服务
- `sidecars/periodic_selector/inject.js`：118 号元素注册表、动态模型匹配、Shadow DOM 周期表 UI、思考强度浮层、右上角更新弹窗及 Canvas 像素级粒子拼字引擎

</details>
