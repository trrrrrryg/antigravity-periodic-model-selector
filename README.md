# Antigravity Periodic Model Selector

适用于 Antigravity 桌面端的**可扩展元素周期表模型选择器**插件：点击对话栏模型触发器打开选择器时，将顶部元素命名系列模型升级为一整块 **1～118 号全元素周期表交互区**，保留其余非元素模型默认列表，并配备元素悬停缩放、思考强度子浮层、订阅权限校验与粒子消散拼字选模动效。

## 核心特性

- **可扩展 118 号全元素映射引擎（非写死）**：
  - 内置 1～118 号元素坐标与中英文名称，每次打开选择器自动读取 Antigravity React Context 中的 `modelSorts` 与 `groups`。
  - 当前自动点亮 `1 H (氢)`、`6 C (碳)`、`10 Ne (氖)`、`18 Ar (氩)`，其余位置呈高对比灰阶参考格；未来官方新增任何元素命名模型（如 `He`、`B`、`Si` 等），无需修改接口即可自动点亮对应周期表格子（亦支持通过 `window.__AGY_PTABLE.registerAlias(alias, symbol)` 注册自定义别名）。
- **实色卡片 + 悬停放大与思考强度选择**：
  - 全元素格与强度浮层采用纯不透明实色配色，字迹清晰、悬停放大 `1.28x` 时完全不透底。
  - 悬停可用元素格自动在旁弹出思考强度浮层（`Low / Medium / High / XHigh`，标注`默认`、当前选中 `✓` 与最新配额余量）；直接点击元素格则直接按默认思考强度完成切换。
- **其余模型原生保留**：`Orchestrator (Neon)`、`编排器 (Argon)`、`Gemini 3.8 Flash`、`Claude Opus / Sonnet 5.5`、`GPT-OSS 120B` 及 `查看用量` 等保持原样展示在周期表下方。
- **订阅分级策略（Free / Pro / Ultra）**：
  - 自动识别当前账户订阅档位（并可在右侧辅助面板手动切换 `Free / Pro / Ultra` 模拟预览）：
    - **Free 免费版**：4 系列元素模型全部锁定并提示升级；
    - **Pro 版**：开放 `H`、`Ne`、`Ar` 等可用元素，锁定 `6 C (Carbon)` 并提示仅限 Ultra 订阅；
    - **Ultra 版**：全系元素无订阅限制。
- **粒子消散重排选模动效**：点击选定可用元素模型后，对应元素卡片原地悬浮滞留、原模型菜单先行收回，随后卡片溶解为高帧率 `<canvas>` 粒子飞向对话栏左下角模型触发器，最终汇聚排列成新选中的模型文字。

## 安装与启用

1. 确保 Antigravity 启动时开启本地 CDP 调试端口（`--remote-debugging-port=9222`）。
2. 从 [Releases](../../releases) 下载 `.zip` 安装包或克隆本仓库到 `~/.gemini/config/plugins/antigravity-periodic-model-selector`：
   ```bash
   agy plugin validate ~/.gemini/config/plugins/antigravity-periodic-model-selector
   agy plugin enable antigravity-periodic-model-selector
   ```
3. 打开或切换至右侧 **Periodic Model Selector** 辅助面板可随时查看匹配元素状态与切换订阅模拟模式。
