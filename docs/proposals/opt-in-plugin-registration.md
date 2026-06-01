# 提案：插件 / Mixin 按需注册

> 对应 `docs/roadmap.md` P1.5。**这是设计稿，未实施。** 落地前请评审本文。

## 问题

`packages/mce/src/{mixins,plugins}/index.ts` 由 `scripts/preset.ts` 自动生成，**全量注册** 23 mixin + 42 plugin，作为 `presetMixins` / `presetPlugins` 由 `editor.ts` `_setupOptions` 默认装入。

后果：
1. **Tree-shake 失效**：任何 `import mce` 都拉全套，bundler 不知道哪些 plugin 实际未使用。
2. **二次开发缺粒度**：下游应用想"只要 selection + transform，不要 timeline / workflow / smartGuides"做不到。
3. **影响 P0.3 chunk 设计**：单 bundle 里所有 plugin 永远共存，按 plugin 切 chunk 拿不到收益。

## 目标

- ✅ 完全向后兼容：现有 `new Editor(options)` 行为不变。
- ✅ 暴露按需入口：用户可以 `import { Editor, selection, transform } from 'mce/core'` 等。
- ✅ 让 tree-shake 真正生效。
- ❌ 不破坏 plugin 的自动注册便利（绝大多数用户还是要全套）。

## 设计

### A. 暴露三层入口

```ts
// 1. 默认（向后兼容，全套）：现有用法
import { Editor } from 'mce'
new Editor({ /* options */ })

// 2. 核心 + 选择性（tree-shake 友好）
import { Editor } from 'mce/core'  // 不带任何 plugin/mixin
import selection from 'mce/plugins/selection'
import transform from 'mce/plugins/transform'
new Editor({ plugins: [selection, transform] })

// 3. 预设组合（中间档）
import { Editor, presetMinimal } from 'mce/core'
new Editor({ plugins: presetMinimal })  // 比如 selection + transform + edit + clipboard
```

### B. package.json exports map

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core.d.ts",
      "import": "./dist/core.js"
    },
    "./styles": "./dist/index.css",
    "./plugins/*": {
      "types": "./dist/plugins/*.d.ts",
      "import": "./dist/plugins/*.js"
    },
    "./mixins/*": {
      "types": "./dist/mixins/*.d.ts",
      "import": "./dist/mixins/*.js"
    }
  }
}
```

### C. Vite 多 entry

```ts
// vite.config.ts
lib: {
  entry: {
    'index': 'src/index.ts',
    'core': 'src/core.ts',
    ...Object.fromEntries(
      pluginFiles.map(f => [`plugins/${name(f)}`, f])
    ),
    ...Object.fromEntries(
      mixinFiles.map(f => [`mixins/${name(f)}`, f])
    ),
  },
  formats: ['es'],
}
```

每个 plugin/mixin 独立 chunk，按需加载，自然 tree-shake。

### D. src/core.ts 内容

```ts
// 不导入任何 plugin / mixin，只导出 Editor + 必要的类型 + 预设组合
export { Editor } from './editor'
export type * from './types'
export { definePlugin } from './plugin'
export { defineMixin } from './mixin'
// 预设组合（导出引用，不导出实例，让用户选择）
import _selection from './plugins/selection'
import _transform from './plugins/transform'
// ...
export const presetMinimal = [_selection, _transform /* , ... */]
export const presetEditing  = [...presetMinimal, /* clipboard, edit, history */]
export const presetFull     = [...presetEditing, /* timeline, workflow, ... */]
```

### E. src/index.ts 保持现状（向后兼容）

```ts
// 现有完整导出，全套 plugin/mixin 自动注册
export * from './core'
export { presetMixins, presetPlugins } from './presets'
// Editor 默认行为不变
```

## 迁移与兼容

- **现有用户零代码改动**：`import { Editor } from 'mce'` 仍拿到全套，行为完全一致。
- **进阶用户**新增三种 import 方式可选。
- **bundler tree-shake**：用 `mce/core` + 单个 plugin import 时，未导入的 plugin 不进入 bundle，预计核心 + selection + transform 组合 < 100 KB（vs 当前 476 KB 全套）。

## 风险与争议

1. **dist 文件激增**：从 1 个 JS → 80+ 个（每个 plugin/mixin 一个）。bundle size badge 数据形态变化。
2. **`scripts/preset.ts` 改造**：需要同时生成全量 index + 核心 core + 各按需入口。复杂度上升。
3. **types 一致性**：`Mce.Options` 用 `declare global namespace Mce` 扩展，需要确保按需 import 时类型增量被正确合并（应该没问题，TS namespace merging 是声明侧）。
4. **plugin 间隐式依赖**：如果 plugin A 依赖 plugin B 但只通过 editor 实例耦合（无显式 import），用户漏选会运行时报错。需要文档化每个 plugin 的依赖 + 用 `dependsOn` 字段或 runtime 守卫。
5. **CI 矩阵**：要增加"只装核心 + 单插件"的构建/测试，防止 plugin 跨依赖回归。

## 落地步骤建议

按风险倒序，每步可单独发版验证：

1. **新增 `mce/core` 入口**（不动 plugins 单独 exports）：保留 src/index.ts 全套，新加 src/core.ts + exports map 多一项 `./core`。最低风险。
2. **添加 preset 组合（minimal / editing / full）**：在 core 里 export 三个数组，方便用户半选。
3. **暴露 plugins 子路径** `mce/plugins/*`：需要 vite 多 entry + preset.ts 改造。
4. **暴露 mixins 子路径** `mce/mixins/*`：同上。
5. **文档化 plugin 依赖关系**：补 plugin 元数据 `dependsOn?: string[]`，运行时校验。
6. **优化构建产物**（P0.3 后续）：核心 chunk + 按需 chunk + assetFileNames 分类。

## 开放问题

- 是否提供"删除某 plugin"的简化 API？比如 `presetExcept(['timeline', 'workflow'])`。
- 预设命名（minimal / editing / full）是否合适？还是 design / canvas / workflow 三场景命名？
- 是否要把 `mixins/` 也按需化？mixins 是 editor 内部分层，多数用户不会直接挑——可能只暴露 plugins 即可。

回答这几个问题后才能定具体落地范围。
