# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**ModernCanvasEditor (mce)** 是一个基于 Vue 3 + TypeScript 的无限画布编辑器框架，采用 pnpm monorepo 结构，包含核心库和多个导出格式插件。

## 常用命令

```bash
# 开发
pnpm dev                    # 启动 playground 开发服务器

# 构建
pnpm build                  # 构建核心库和所有插件
pnpm build:preset           # 构建预设
pnpm -F mce build           # 单独构建核心库
pnpm -F @mce/gif build      # 单独构建某个插件

# 测试
pnpm test                   # 运行所有测试
pnpm -F mce test            # 只运行核心库测试
pnpm -F mce test -- --run src/path/to/test.ts  # 运行单个测试文件

# 代码检查
pnpm lint                   # 全局 lint
pnpm -F mce lint            # 只检查核心库

# 类型检查
pnpm -F mce typecheck

# 发版
pnpm release                # bumpp 版本号并打 tag（交互式）
```

## 架构

### Monorepo 结构

```
packages/
  mce/        # 核心编辑器库（主包，npm: mce）
  gif/        # GIF 导出插件（@mce/gif）
  mp4/        # MP4 导出插件（@mce/mp4）
  pdf/        # PDF 导出插件（@mce/pdf）
  svg/        # SVG 导出插件（@mce/svg）
  openxml/    # PPTX 导出插件（@mce/openxml）
  gaoding/    # Gaoding 集成插件（@mce/gaoding）
  bigesj/     # Bigesj 集成插件（@mce/bigesj）
  chart/      # 图表元素插件（@mce/chart）
  table/      # 表格元素插件（@mce/table，含 TableEditor 组件）
  ai/         # AI action 插件（@mce/ai）
  html/       # HTML 导入 loader 插件（@mce/html）
  workflow/   # 节点图模式插件（@mce/workflow，含 Workflow 组件）
  collaboration/ # 实时协同插件（@mce/collaboration：传输 provider + 在场感知；CRDT 文档模型 YDoc 仍在核心）
  comments/   # Figma 式评论插件（@mce/comments：画布 / 元素锚定 pin + 线程弹窗；评论存 Y.Doc 独立顶层 Map，不进元素树/导出/undo）
playground/   # 演示与测试应用
```

所有插件以 `mce: ^0` 为 peer dependency。

插件通过核心 `mixins/extensions.ts` 的扩展点解耦，避免在核心硬编码元素/特性专属逻辑：
- `registerSelectionRedirect`（命中重定向，如单元格→表格）
- `registerResizeOverride`（自定义缩放，如表格按网格）
- `registerEnterHandler`（双击/Enter 进入编辑）
- `registerEditingState` + `isContentEditing`（内容编辑态下隐藏选择框/浮动条、抑制快捷键）
- `registerToolbeltShapeItem`（向工具栏形状菜单追加工具）
- `registerIcon`（随插件携带图标，合并进图标集）
- `registerMode`（注册编辑模式，如 workflow；`Mode` 类型为 `'canvas' | (string & {})`）
- `registerStatusbarItem`（向状态栏追加组件，如协同状态/在场头像）

`State` 同样放开为接纳插件字符串。CRDT 文档模型（`crdt/YDoc` + IndexeddbProvider）是核心；
网络传输与在场感知（AbstractProvider/WebsocketProvider/presence）在 `@mce/collaboration`。

### 核心层次（packages/mce/src/）

**Editor 类** (`editor.ts`)：继承自 `Observable`，作为整个编辑器的核心，通过 `Symbol.for('EditorKey')` 注入到 Vue 组件树。

**Mixin 系统** (`mixins/`）：按数字前缀分层组合到 Editor：
- `0.xxx`：基础层（命令、配置、上下文、字体、国际化）
- `1.xxx`：核心功能（帧、屏幕、时间轴、上传）
- `2.xxx`：高级功能（边界框）
- `4.x.xxx`：元素操作（节点、帧、元素）
- 无前缀：导出器、快捷键、HTTP、加载器、吸附等横切关注点

**插件系统** (`plugin.ts`)：插件为对象或工厂函数，可声明 `events`、`commands`、`hotkeys`、`loaders`、`exporters`、`tools`、`components`、`setup`。

**Composables** (`composables/`)：Vue 3 组合式 API，核心为 `useEditor()` —— 从注入获取当前 Editor 实例。

**CRDT 协作编辑** (`crdt/`)：基于 Yjs 实现多人协作。

### 关键依赖

底层渲染依赖 `modern-canvas`、`modern-text`、`modern-font`、`modern-idoc`（均为内部生态包）。

## 技术约定

- **ESM only**：根 `package.json` 设置 `"type": "module"`，所有包均为 ESM 输出。
- **TypeScript 严格模式**：启用 `strict: true` 及装饰器支持。
- **ESLint**：使用 `@antfu/eslint-config`，通过 `eslint.config.js` 配置。
- **提交规范**：遵循 `.github/commit-convention.md`，格式为 `type: message`（如 `feat:`、`fix:`、`release:`）。**提交信息一律使用英文**，message 尽量精简。
