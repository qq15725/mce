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

注意：**事务 `origin` 区分变更来源**，配合 `_isSelfTransaction` 判断当前回调来源，避免回环。三类 origin：

- `LOCAL_ORIGIN`：用户编辑。进 UndoManager，向对端广播。
- `INTERNAL_ORIGIN`：把远端 / 撤销变更「回放到视图」时产生的内部写入（如 `_yChildrenChange` 初始化远端节点、`_proxyNode` 补 `parentId`、`_proxyProps` 对账 meta、`_proxyChildren` 重排）。**不进 UndoManager，也不广播**——源变更已由其 origin 端各自广播过，再发即回声。
- Provider 实例：远端 apply 进来的增量（`Y.applyUpdate(doc, update, provider)`）。observe 据此跳过回写，Provider 据 `origin === this` 跳过再广播。

**广播规则**（`AbstractProvider._onUpdate`）：`origin === this`（远端回来的）或 `origin === INTERNAL_ORIGIN`（视图回放）一律不广播；其余（`LOCAL_ORIGIN` 用户编辑、UndoManager 的撤销/重做）照常广播。

> ⚠️ **核心不变量：远端 apply / 内部回放路径绝不能产生 yjs 结构。** 这比「包进 `INTERNAL_ORIGIN` 事务」更强：
>
> 1. 裸写（`_transacting === undefined`）会按 `LOCAL` 处理被 Provider 当本地编辑回传——异步是回声，**同步传输直接无限递归栈溢出**。
> 2. **即便包成 `INTERNAL`，`Y.Map.set` 仍生成真实结构、推进本端 clock，而 `INTERNAL` 不广播** → 本端 clock 领先对端 → 本端后续 `LOCAL` 编辑依赖对端永远收不到的 clock → 对端整段挂进 `store.pendingStructs` **同步永久卡死**（典型症状：同一 map 两端 yjs id 相同却键不同；全量 `applyUpdate` 能修复）。
>
> 所以回放路径的回写要用 `if (this._isSelfTransaction()) return` **直接跳过**（Y.Doc 里本就有正确值），只有本地真实变更才写并广播；嵌套 map（style/meta/...）只在缺失时创建，已存在就复用、绝不 `yNode.set` 替换。回归测试见 `providers/AbstractProvider.test.ts`「对端在整合新建节点后继续编辑」用例（断言 `pendingStructs` 为空）。

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
    ├── AbstractProvider.ts                # 可插拔传输层基类：sync / awareness 协议编解码
    ├── index.ts
    ├── indexeddb/
    │   ├── IndexeddbProvider.ts           # Y.Doc ↔ IndexedDB 同步
    │   ├── indexeddb.ts                   # IndexedDB 底层封装
    │   └── index.ts
    └── websocket/
        ├── WebsocketProvider.ts           # WebSocket 传输（y-websocket 兼容，指数退避重连）
        └── index.ts
```

会话接入与在场感知在应用层插件：`plugins/collaboration.ts`（Provider 生命周期、连接 / 同步状态）、`plugins/presence.ts`（awareness：本端 user/光标/选区广播 + 远端 `peers` + `Presence.vue` 渲染）。

## 测试

- `YDoc.test.ts`：两端最终一致性（增 / 嵌套 / 重排 / 删）、并发收敛、mergeUpdates 无丢失、undo 来源隔离、全量快照恢复。
- `providers/AbstractProvider.test.ts`：内存链路对端互联，覆盖握手 synced、结构增量单向同步（验证远端回放不回环）、undo 经 provider 传播、awareness setLocalStateField / change 事件 / 离场清除。
