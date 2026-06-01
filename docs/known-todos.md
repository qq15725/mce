# 已知 TODO / 待决策清单（v0.24.0）

> 对应 `docs/roadmap.md` P1.6。本会话清理了 11 处"裸 / 过时 / 注释代码"型 TODO，剩下 10 处都需要**业务或架构决策**才能动手——本文档把它们集中留档。

## 1. SmartSelection 旋转 5 处（components/SmartSelection.vue:363-427）

**位置**：横向 `prev` / `next` 各 1 处 + 纵向 `prev` / `next` 各 1 处 + `end()` 1 处。

**含义**：多元素拖拽时的"插入指示器"重排算法——计算被拖元素将插入到 `prev` 之前还是 `next` 之后的目标 left/top。**当前实现假设元素无旋转**（直接用 axis-aligned bbox 算插入位）。

**决策点**：
- 拖一个**已旋转**的元素到一组元素之间，期望行为？
  - (A) 旋转元素继续按 aabb 计算（当前行为）→ 视觉上插入位置可能偏；
  - (B) 临时取消旋转计算插入位、应用后还原；
  - (C) 真正按 obb 几何重算（最复杂）。
- 一组里有旋转的相邻元素（`prev`/`next` 旋转），怎么算它们的"插入空隙"？

需要先描述清楚预期再动手。代码涉及 5 处对称几何修改，工作量约 1-2 天 + 大量手测。

## 2. arrange.ts:101 — 对齐不支持非中心 pivot

**位置**：`function align(direction)` 上方。

**含义**：当前 `align` / `distribute` 一律以元素 aabb center 作基准。如果元素有 `pivot` 偏移（旋转中心非几何中心），结果会偏。

**决策点**：是否需要支持自定义 pivot 的对齐？业界（Figma/Sketch）多数也只支持 center—优先级低。

## 3. arrange.ts:202 — tidyUp 占位

**位置**：
```ts
function tidyUp() {
  // TODO
  distributeSpacing('vertical')
}
```

**含义**：`tidyUp` 应该"整理"选中元素到规则栅格（Figma 的 Tidy Up），现在只是垂直等距分布的别名。

**决策点**：tidyUp 的语义你想怎么定义？
- (A) 自动识别行列结构，行内水平等距 + 列间垂直等距（Figma 风格）
- (B) 网格对齐（snap 到最近 8px grid）
- (C) 保持当前简单实现，只是改个更准确的名字。

## 4. formatPaint.ts:30 — 获取文本选区所有样式值

**位置**：`getStyles` 函数。

**含义**：格式刷复制源样式时，当前只对**非文本字段**做了样式聚合。文本选区内**多种样式混合时**（如部分粗体部分斜体）应该返回 partial style 表示"不一致"，目前只取首段值。

**决策点**：partial style 用什么表示？`undefined` / `null` / `Symbol('mixed')`？需要 typography 插件配合识别"不一致"状态。

## 5. typography.ts:331 — split 后 textSelection 未关联更新

**位置**：`function setTextStyle` 内部。

**含义**：修改文本样式时会触发 fragment split（如 "abc" 中间选 "b" 改色 → 切成 3 个 fragment）。**新生成的 fragment 索引和原 textSelection 的 [start, end] 不再对应**，下次操作会落到错的位置。

**这是一个真 bug**，复现：
1. 选中 "abc" 中间的 "b"
2. 改加粗 → "b" 变粗，selection 视觉上还是 "b"
3. 再次操作（如改颜色）→ 实际作用范围可能漂

**决策点**：修复策略
- (A) split 时手动重算 textSelection 索引（侵入性大）
- (B) 用稳定 ID 锚定 selection 而非位置索引（需要给 fragment 加 ID）
- (C) 操作完强制重新选中刚才的视觉范围

## 6. Cropper.vue:11 — 撤回无法重渲

**位置**：组件顶部 JSDoc。

**含义**：图片裁剪后撤回（undo），cropper 内部 view 状态不会跟着回退，需要重新打开 cropper 才能正确显示。

**这是真 bug**。

**决策点**：修复策略
- (A) 监听 history 事件，重置 cropper 内部 view
- (B) cropper 改为受控组件，view 派生自 props，撤回自然刷新
- (C) 简单粗暴：撤回时关闭 cropper

---

## 类别小结

| 类别 | 数量 | 行动 |
|---|---|---|
| 真 bug 待修 | 2 | typography split + Cropper 撤回 |
| 功能/UX 决策 | 2 | tidyUp 语义、formatPaint partial style 表示 |
| 几何复杂度 | 5 | SmartSelection 旋转 5 处 |
| 优先级低 | 1 | arrange 非中心 pivot |

**总评**：剩余 TODO 都不是注释垃圾——是真问题或真功能缺口，但都需要先对齐预期或权衡设计才能下手。建议按这个顺序：

1. **Cropper.vue:11** — 修复手感差但路径清晰
2. **typography.ts:331** — 真 bug，需要先选 fix 策略
3. **SmartSelection 旋转** — 需要先定旋转元素期望行为
4. tidyUp / formatPaint / pivot — 排到产品需求后再说
