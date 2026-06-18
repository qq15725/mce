# CRDT 模块

基于 [Yjs](https://github.com/yjs/yjs) 的协作编辑层。负责把文档的结构与属性以 CRDT 形式存放，让多端可同时编辑而不冲突，并提供撤销/重做与本地持久化。

## 数据模型

`YDoc` 包装一个 `Y.Doc`，把文档结构拆成三个顶层 yjs 类型：

| key | yjs 类型 | 用途 |
|---|---|---|
| `props` | `Y.Map` | 文档级属性（标题、画板尺寸、版本等） |
| `children` | `Y.Map<YNode>` | 所有节点（按 id 索引，扁平存放，不嵌套） |
| `childrenIds` | `Y.Array<string>` | 顶层节点的 id 顺序 |

子父关系通过节点上的 `parentId` 字段 + `childrenIds: Y.Array<string>` 维护，节点本身扁平存于 `children`。**结构是引用图，不是嵌套树**——避免深层 yjs 嵌套带来的 observe 噪声与合并复杂度。

`YNode` = `Y.Map<unknown>`，带强类型 `get` 重载（见 `YDoc.ts` 顶部），常见字段：`id / name / parentId / style / background / shape / fill / outline / text / foreground / shadow / meta / childrenIds`。每个字段值本身也是 `Y.Map`/`Y.Array`，保证可被 Yjs 增量同步。

## 同步流程

1. 本地编辑触发 `Y.Doc` 'update' → `YDoc` 转发为自己的 `update` 事件（载荷 = `[updateBytes, origin, doc, transaction]`）。
2. 上层（Provider 或自定义传输）订阅 `update` 事件，把 `updateBytes` 发到对端。
3. 对端调用 `Y.applyUpdate(doc, updateBytes, origin)` 应用增量，触发本地视图刷新。

注意：**`origin` 用 `clientID` 区分本地/远端**，配合 `_isSelfTransaction` 判断当前回调来源，避免回环。

## 撤销 / 重做

`undoManager: Y.UndoManager` 在构造时初始化，跟踪 `props + children + childrenIds`，`trackedOrigins = new Set([clientID])` 只追踪本端操作（远端不入栈）。

`stack-item-added / -updated / -popped / -cleared` 统一 emit 为 `history` 事件，供 history 插件订阅刷新工具栏状态。

## Provider

可插拔的副作用层，目前内置：

- **`IndexeddbProvider`** (`providers/indexeddb/`)：把 `Y.Doc` 增量写入 IndexedDB；启动时回放历史增量重建状态。`YDoc.indexeddb` 字段挂载。

新 Provider 需要做：
1. 订阅 `Y.Doc` 'update' 把增量送出（WebSocket / WebRTC / 自定义传输）。
2. 收到对端增量时 `Y.applyUpdate`。
3. 启动同步策略（如握手、checkpoint、过期清理）由 Provider 决定，`YDoc` 不参与。

## 已知边界 / 注意事项

- **transaction origin 易错**：自定义事务务必通过 `Y.transact(doc, fn, origin)` 显式传 origin；不传时 origin 是 `null`，`_isSelfTransaction` 会判错。
- **`_transacting` 标志**：内部批量更新用 `_transacting = true` 抑制中间事件，结束后才统一通知，避免半完成状态泄露。修改 `_yChildrenChange` 等同步逻辑时注意保持这个不变量。
- **GC / 历史压缩**：`Y.Doc` 显式开启 `gc: true`，已删除内容结构会被垃圾回收，文档不会随删除单调膨胀；离线增量日志由 `IndexeddbProvider` 按 `trimSize`（默认 500 条）做全量快照压实（见 `providers/indexeddb`）。`UndoManager` 的撤销栈长度可按需自行裁剪。
- **节点删除**：从 `childrenIds` 移除 + 从 `children` 删 key + 递归处理子节点。`Y.UndoManager` 会把删除当作可恢复操作。
- **`markRaw`**：所有 yjs 对象都做 `markRaw`，防止 Vue 响应式系统包装内部 Y.* 结构（会导致 yjs observer 接收响应式代理产生错乱）。

## 文件索引

```
crdt/
├── YDoc.ts                                # 主类：Y.Doc 包装 + UndoManager + 事件
├── index.ts                               # 仅 re-export YDoc
└── providers/
    ├── index.ts
    └── indexeddb/
        ├── IndexeddbProvider.ts           # Y.Doc ↔ IndexedDB 同步
        ├── indexeddb.ts                   # IndexedDB 底层封装
        └── index.ts
```

## 测试

> ⚠️ 目前 CRDT 模块**无单元测试**。多人协作回归在客户现场最难复现——建议优先补 `YDoc` 的 children 增删 / move 操作的同步测试（两个 YDoc 互相 applyUpdate 验证最终一致性）。见根 `docs/roadmap.md` P0.1。
