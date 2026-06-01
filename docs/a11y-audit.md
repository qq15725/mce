# a11y 审计（v0.24.0）

> 对应 `docs/roadmap.md` P2.10。**本文档只盘点现状 + 给改造建议，不动代码。** 决定要做到什么合规等级（无要求 / WCAG 2.1 A / AA / AAA）后再立项执行。

## TL;DR

- 全 `packages/mce/src` 仅 **6 处** `aria-*`（icon hide / Transform handle label），无系统性可访问性设计。
- 编辑器是 canvas-based，**没有为屏幕阅读器暴露内容结构**——文档/选区/元素属性都拿不到。
- 工具栏、菜单、对话框靠鼠标驱动，**没有键盘焦点管理 / Tab order / ESC 关闭** 等基本无障碍交互。
- 颜色对比度未审；动效缺 `prefers-reduced-motion` 尊重。

如果目标用户群（政企、海外、教育、SaaS B 端面向终端用户）**有合规要求**，这是潜在大坑；如果是开发者/设计师工具，**暂时低优**。

## 现状盘点

### 1. ARIA 使用

仅 6 处（搜 `aria-`）：
- 几个图标组件加 `aria-hidden="true"`（装饰性，正确）
- `shared/Transform.vue` 几个 handle 加 `aria-label`（基本标识）

**结论**：覆盖率 < 1%，远不足以让屏幕阅读器理解 UI。

### 2. 键盘可达性

`mixins/hotkey.ts`（372 行）只处理**全局命令快捷键**（撤销/复制/移动等），**不**包括：
- Tab 在工具栏/侧栏/画布间循环
- 方向键在菜单项间移动
- Enter/Space 触发当前焦点按钮
- ESC 关闭 modal / 取消选区

`Selection.vue`、`Transform.vue` 等鼠标驱动，**焦点状态不可见、不可控**。

### 3. Canvas 内容对屏幕阅读器不可见

文档元素全部画在 `<canvas>` 上，DOM 里只有空白。屏幕阅读器只能看到外层工具栏。**编辑内容、画板、节点、文本字段对 AT (assistive tech) 不存在**。

工业方案有两种：
- **Off-screen DOM mirror**：保留一份隐藏 DOM 树同步 canvas 内容，AT 读 DOM（Figma、Google Docs 早期做法）
- **Accessibility tree API**（Chromium 实验）：成本高且兼容性差

目前**完全没有**做任何一种。

### 4. 颜色对比度

主题色 token（`packages/mce/src/components/EditorLayout.vue:678-697`）：
- `--m-theme-on-surface: 30, 30, 30` on `--m-theme-surface: 255, 255, 255` → 对比度 ~14:1 ✅（满足 AAA 7:1）
- `--m-theme-primary: 69, 151, 248` on `--m-theme-on-primary: 255, 255, 255` → 对比度 ~2.6:1 ❌（小字不达 AA 4.5:1）
- 各级 emphasis opacity 用 alpha 叠色，未对实际渲染色做对比测试

**结论**：未系统审，部分组合（primary 上小字、辅助线 label）实际可能不达 AA。

### 5. 动效偏好

未见 `@media (prefers-reduced-motion)` 用法。Transition、参考线动画、缩放过渡不会因用户偏好弱化或关闭。

### 6. 表单/输入

`web-components/TextEditor.ts`（609 行）是富文本核心，**无 ARIA role/属性**（如 `role="textbox"`、`aria-multiline`、`aria-label`）。对 AT 而言是一团不可解的 div + canvas。

## 建议（按价值/工作量）

### 入门（半天 - 1 天，达到 A 级最低水位）

1. **运营态键盘逃生**：modal / 浮层支持 ESC 关闭；菜单支持方向键 + Enter；保证 Tab order 不跳乱。
2. **prefers-reduced-motion 尊重**：把过渡动画用 `@media` 包一层。
3. **颜色对比度自检**：把上面提到的 primary 上小字组合改成更深主题色或加描边；小字（label/数值）的 alpha 至少 0.6。

### 中等（1 周，AA 级别 + UI 部分可用）

4. **工具栏/侧栏完全可键盘**：所有 button 加 `aria-label`、`role`、焦点环可见；命令面板（如有）支持 ARIA combobox 模式。
5. **状态变化广播**：选区改变、撤销/重做、文档加载等用 `aria-live` 区域宣告。
6. **TextEditor ARIA**：富文本根节点加 `role="textbox"` + `contenteditable=true`（实际不可编辑外层，但欺骗 AT 让它读取）+ `aria-label`。

### 重头戏（2-4 周，AAA 级别需要）

7. **Canvas DOM mirror**：维护一份隐藏 DOM 树，节点结构、层级、文本内容、选区状态都同步过去；屏幕阅读器读这份；用户操作（如 Tab 到某节点）映射回 canvas 选区。这是 Figma/Miro 都做了的事，工作量大。

## 决策点（请回答）

- 目标合规等级？（无 / A / AA / AAA）
- 优先服务谁？（设计师/开发者：暂时不投入；终端用户/政企/海外/教育：必须做）
- 预算窗口？（半天 / 1 周 / 2-4 周）

回答这三个问题后才能定 P2.10 的具体打法。
