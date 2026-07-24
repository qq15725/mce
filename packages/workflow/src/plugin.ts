import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { WorkflowGraph } from './graph'
import { definePlugin, outlineIcon } from 'mce'
import { flowStreakEffect } from 'modern-canvas'
import { reactive, watch } from 'vue'
import { flowArrowEffect, flowDashEffect, flowGrowEffect } from './flowEffects'
import { buildWorkflowGraph } from './graph'
import { getWorkflowPorts, toConnectionPoints } from './workflow'
import Workflow from './Workflow.vue'
import WorkflowGenerating from './WorkflowGenerating.vue'

declare global {
  namespace Mce {
    interface WorkflowNodeTemplate {
      /**
       * 覆盖节点名（写入 node.name）。不设时图层名走 i18n（key：workflow:<type>），
       * 切换语言即时生效；菜单项始终走 i18n。
       */
      label?: string
      /** Bold first line shown inside the node. */
      title?: string
      /** Gray hint paragraphs under the title. */
      body?: string[]
      /**
       * 默认占位图。设置后节点渲染这张图片而非 title/body 文字
       * （图片/视频生成节点用它呈现一张默认图）。
       */
      image?: string
      /** 节点默认宽高（缺省 2048×2048）。 */
      width?: number
      height?: number
      /**
       * 文字节点的内边距 / 字号 / 行高（仅无 image 的文字类节点生效，缺省 80 / 88 / 1.6）。
       * 随 2k 尺寸等比设定；接入方觉得留白过多/过少时可在此微调，无需改内核。
       */
      padding?: number
      fontSize?: number
      lineHeight?: number
      /**
       * 该类型节点暴露的连线端口开关（缺省 input+output 皆开）。
       * 设 `{ output: false }` 即「此类型不能作为其他节点的输入源」——不显示输出「+」手柄、
       * 从它拉线/以它作连线起点都被拒；但仍可作下游接收上游。见 WorkflowPortConfig。
       */
      ports?: import('./workflow').WorkflowPortConfig
    }

    interface Options {
      /** Override/extend the workflow node content templates, keyed by node type. */
      workflowNodes?: Record<string, WorkflowNodeTemplate>
    }

    interface Commands {
      addWorkflowNode: (type: string, position?: AddElementPosition) => Element2D
      /** 校验不过（端点不存在 / 自环 / 重复 / 成环 / 端口方向错）时返回 undefined。 */
      addWorkflowConnection: (
        startId: string,
        startIdx: number,
        endId: string,
        endIdx: number,
      ) => Element2D | undefined
      /** 标记 / 取消节点「生成中」态：显示流动 shimmer 覆盖层（运行时 UI 态，不落文档）。 */
      setWorkflowGenerating: (id: string, generating?: boolean) => void
      /** 运行时切换连线流动预设（streak / arrow / grow / dash）。 */
      setConnectionFlowEffect: (effect: WorkflowFlowEffect) => void
    }

    interface Editor {
      /** 按 workflowNodes 配置解析某元素在工作流模式下暴露的端口（input/output）。 */
      workflowPortsOf: (el: import('modern-canvas').Element2D) => import('./workflow').WorkflowPort[]
      /** 「生成中」节点 id 集合（响应式，运行时态）。用 setWorkflowGenerating 增删。 */
      workflowGenerating: Set<string>
      /** 连线流动配置（响应式）：effect 预设 + 是否常显。 */
      workflowConnectionFlow: { effect: WorkflowFlowEffect, always: boolean }
    }

    interface Options {
      /** 连线「能量流动」配置。 */
      connectionFlow?: {
        /** 流动预设：'streak'(默认流光) / 'arrow'(行进箭头) / 'grow'(生长线) / 'dash'(数据流虚线)。 */
        effect?: WorkflowFlowEffect
        /** 'hover'(默认，悬停/选中相关连线) / 'always'(所有连线常显)。 */
        trigger?: 'hover' | 'always'
      }
    }

    /** 连线流动预设名。 */
    type WorkflowFlowEffect = 'streak' | 'arrow' | 'grow' | 'dash'
  }
}

const FLOW_PRESETS = {
  streak: flowStreakEffect,
  arrow: flowArrowEffect,
  grow: flowGrowEffect,
  dash: flowDashEffect,
} as const

// 图片/视频节点的默认占位图：内联 SVG（主题 surface 圆角底 + on-surface 反色图标）。
// 颜色在「插入节点时」从主题 CSS 变量解析后烤进 data URI——SVG data URI 是独立文档，
// 无法直接 var(--m-theme-*)，只能运行时注入（已插入节点不随后续主题切换更新）。
function placeholderImage(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 图标用主题反色（on-surface）配较低透明度，在 surface 底色上呈现为浅灰。
const PLACEHOLDER_ICON_OPACITY = 0.18

// 四角星（sparkle）路径：以 (cx,cy) 为心、r 为半径，四条内凹贝塞尔边——AI 生成占位图标。
function sparklePath(cx: number, cy: number, r: number): string {
  const k = r / 2
  return `M${cx} ${cy - r}`
    + `C${cx} ${cy - k} ${cx - k} ${cy} ${cx - r} ${cy}`
    + `C${cx - k} ${cy} ${cx} ${cy + k} ${cx} ${cy + r}`
    + `C${cx} ${cy + k} ${cx + k} ${cy} ${cx + r} ${cy}`
    + `C${cx + k} ${cy} ${cx} ${cy - k} ${cx} ${cy - r}Z`
}

// 统一的「AI 生成」占位图：大 + 小两颗闪烁星，居中偏上。方形 viewBox 随方形节点等比缩放。
// 透明底：节点底色由 `@surface` token 在画布层绘制并随主题自适应，占位图只叠图标（中性灰，明暗皆可辨）。
function sparklePlaceholder(icon: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">`
    + `<path d="${sparklePath(288, 236, 96)}" fill="${icon}" fill-opacity="${PLACEHOLDER_ICON_OPACITY}"/>`
    + `<path d="${sparklePath(196, 320, 46)}" fill="${icon}" fill-opacity="${PLACEHOLDER_ICON_OPACITY}"/>`
    + `</svg>`
}

const PLACEHOLDER_BUILDERS: Record<string, (icon: string) => string> = {
  image: sparklePlaceholder,
  video: sparklePlaceholder,
}

// Built-in templates; overridable per type via the `workflowNodes` editor option.
const DEFAULT_NODES: Record<string, Mce.WorkflowNodeTemplate> = {
  text: {
    title: '✍️ Double-click to add text',
    body: ['Or describe it below and let AI write for you.'],
  },
  image: {},
  video: {},
}

export function plugin() {
  return definePlugin((editor, options) => {
    const { addElement, exec, waitUntilFontLoad, renderEngine, registerMode, registerToolbeltItem, registerIcon } = editor

    // 「生成中」节点集合：运行时 UI 态（不落 style/文档/CRDT）。WorkflowGenerating 覆盖层据此渲染 shimmer。
    const generating = reactive(new Set<string>())
    editor.workflowGenerating = generating
    function setWorkflowGenerating(id: string, on = true): void {
      if (on) {
        generating.add(id)
      }
      else {
        generating.delete(id)
      }
    }

    // 连线流动配置：effect 预设切换（引擎 flowEffect 槽，registerEffect 重编译）+ always 常显开关。
    const connectionFlow = reactive({
      effect: (options.connectionFlow?.effect ?? 'streak') as Mce.WorkflowFlowEffect,
      always: options.connectionFlow?.trigger === 'always',
    })
    editor.workflowConnectionFlow = connectionFlow
    watch(
      () => connectionFlow.effect,
      (name) => { (renderEngine.value as any).flowEffect = FLOW_PRESETS[name] ?? flowStreakEffect },
      { immediate: true },
    )
    function setConnectionFlowEffect(effect: Mce.WorkflowFlowEffect): void {
      connectionFlow.effect = effect
    }

    // 注册「工作流」模式，菜单 / 工具腰带的模式切换项会自动包含它（图标 `$workflow` 由核心图标集提供）。
    registerMode('workflow')

    // 三种工作流节点各自的独立图标（Lucide type / image / video，outline）。
    // 供图层图标、工具腰带「+」菜单、节点标题标签共用（`$workflow<Type>`）。
    registerIcon('workflowText', outlineIcon('M12 4v16', 'M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2', 'M9 20h6'))
    registerIcon('workflowImage', outlineIcon('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z', 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'))
    registerIcon('workflowVideo', outlineIcon('m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5', 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'))

    // 向工具腰带「+」菜单贡献新增节点项（文字 / 图片 / 视频生成）。
    // 不限模式：只要加载了本插件，「+」在任何模式下都添加工作流节点。
    const NODE_TYPES = [
      { type: 'text', icon: '$workflowText', kbd: '⇧T' },
      { type: 'image', icon: '$workflowImage', kbd: '⇧I' },
      { type: 'video', icon: '$workflowVideo', kbd: '⇧V' },
    ]
    for (const n of NODE_TYPES) {
      registerToolbeltItem({
        slot: 'create',
        key: `workflow:${n.type}`,
        icon: n.icon,
        kbd: n.kbd,
        handle: () => addWorkflowNode(n.type),
      })
    }

    // Per-field merge: user templates override the defaults, missing fields fall back.
    function getTemplate(type: string): Mce.WorkflowNodeTemplate {
      return { ...DEFAULT_NODES[type], ...options.workflowNodes?.[type] }
    }

    // 端口配置按类型预解析（DEFAULT_NODES ∪ 接入方 workflowNodes 的并集）：交给 getWorkflowPorts，
    // 令渲染「+」手柄、连线校验、拖拽落点三处口径一致；未配置的类型走默认 input+output。
    const portsByType: Record<string, import('./workflow').WorkflowPortConfig> = {}
    for (const type of new Set([...Object.keys(DEFAULT_NODES), ...Object.keys(options.workflowNodes ?? {})])) {
      const ports = getTemplate(type).ports
      if (ports)
        portsByType[type] = ports
    }
    editor.workflowPortsOf = el => getWorkflowPorts(el, portsByType)

    // 占位图图标用中性灰（明暗底皆可辨）；底色交给节点 `@surface` token 在画布层随主题绘制。
    function buildPlaceholder(type: string): string {
      return placeholderImage(PLACEHOLDER_BUILDERS[type]('#9ca3af'))
    }

    // 标题 `@on-surface` + 加粗；正文用弱化前景 `@on-surface-muted`，与标题拉开层次
    // （二者同色时整块灰度一致、只靠字重区分，观感偏"糊"）。两个 token 都随主题自适应。
    function buildContent(t: Mce.WorkflowNodeTemplate): any {
      return [
        ...(t.title ? [{ fragments: [{ content: t.title, color: '@on-surface', fontWeight: 700 }] }] : []),
        ...(t.body ?? []).map(line => ({ fragments: [{ content: line, color: '@on-surface-muted' }] })),
      ]
    }

    function createWorkflowNode(type: string): Element {
      const t = getTemplate(type)
      const image = t.image ?? (type in PLACEHOLDER_BUILDERS ? buildPlaceholder(type) : undefined)
      const node: Element = {
        name: t.label,
        style: {
          // 图片/视频/文字节点默认 2048×2048（可经 workflowNodes 覆盖）。
          width: t.width ?? 2048,
          height: t.height ?? 2048,
          borderRadius: 32,
          // 语义色 token：底 / 边框随 editor.theme 自适应（画布层解析，见核心 themeTokens）。
          // 图片/视频节点(image)用抬升亮面，与文字节点区分、暗色下更醒目。
          backgroundColor: image ? '@surface-bright' : '@surface',
          borderColor: '@border-color',
          borderWidth: 2,
        },
        // 视频节点从创建即 Video2D：宿主生成后只需设顶层 src，视频纹理便渲染（Video2D._drawContent
        // 在 foreground 之后画，直接盖住占位图）。节点类由 modern-canvas 在创建时按 inCanvasIs 定死，
        // 运行时改不了——若建成 Element2D，之后再设 src 也永远渲染不出视频。
        // lockAspectRatio：图片/视频节点（有占位图者）锁定宽高比——选中后只出四角手柄、拖动等比缩放，
        // 不会把图/视频拉变形。Selection 读此 meta 决定 resizeStrategy。文字节点自适应高度，不锁。
        meta: { inPptIs: 'Shape', inCanvasIs: type === 'video' ? 'Video2D' : 'Element2D', inEditorIs: `Workflow${type.charAt(0).toUpperCase()}${type.slice(1)}`, lockAspectRatio: Boolean(image) },
      }
      if (image) {
        // 占位图作 foreground：无 src 时 Video2D 无纹理，只显示占位图；设 src 后视频画在其上。
        node.foreground = { image }
      }
      else {
        // 字号 / 内边距随 2k 尺寸等比放大，保持与图片/视频节点观感一致。
        // padding 取约 0.9 倍字号（2048 宽下每边 ≈3.9%）：更早的 150 是 1.7 倍字号，
        // 左右留白过宽、正文可用宽度被压掉一成半，观感偏空。
        Object.assign(node.style!, {
          padding: t.padding ?? 80,
          fontSize: t.fontSize ?? 88,
          lineHeight: t.lineHeight ?? 1.6,
        })
        node.text = { content: buildContent(t) }
      }
      return node
    }

    function addWorkflowNode(type: string, position?: Mce.AddElementPosition): Element2D {
      // 无显式位置（如从工具腰带「+」添加）则放在现有内容右侧（顶对齐），符合工作流从左到右的流向。
      const el = addElement(createWorkflowNode(type), { position: position ?? 'right', active: true, intoView: true })
      // 文字节点按内容自适应高度（typography autoHeight）：占位/正文文案高度不定，固定 2048 会
      // 拖出一大截空白框。图片/视频节点是定框撑图，不动。字体异步加载完成后再 fit，避免字形宽度为 0
      // 时算错高度（fire-and-forget，不阻塞返回）。
      if (type === 'text') {
        void waitUntilFontLoad().then(() => exec('textToFit', el))
      }
      return el
    }

    // Write the element's default ports onto its shape so connection routing anchors
    // at the edge port (without them it falls back to the box center).
    function materializePorts(id: string): void {
      const el = (renderEngine.value as any).nodeMap.get(id) as Element2D | undefined
      if (el && !(el.shape?.connectionPoints?.length))
        el.shape.connectionPoints = toConnectionPoints(getWorkflowPorts(el, portsByType))
    }

    /**
     * 建边前的全部校验。任一条不过就拒绝——脏边一旦落进文档就很难发现：
     * 悬空连线的 `isValid()` 只看 id 字符串，永远为 true，于是既不被视口剔除、
     * 又每帧参与路由计算；自环 / 环则会让下游的图遍历失去拓扑序。
     */
    function validateConnection(
      graph: WorkflowGraph,
      startId: string,
      startIdx: number,
      endId: string,
      endIdx: number,
    ): string | undefined {
      const startEl = graph.nodes.get(startId)
      const endEl = graph.nodes.get(endId)
      if (!startEl || !endEl) {
        return `端点不存在：${!startEl ? startId : endId}`
      }
      if (startId === endId) {
        return `不能连接到自身：${startId}`
      }
      const startPort = getWorkflowPorts(startEl, portsByType).find(p => p.idx === startIdx)
      const endPort = getWorkflowPorts(endEl, portsByType).find(p => p.idx === endIdx)
      if (startPort?.kind !== 'output') {
        return `起点 ${startId}:${startIdx} 不是输出端口`
      }
      if (endPort?.kind !== 'input') {
        return `终点 ${endId}:${endIdx} 不是输入端口`
      }
      const duplicated = graph.out.get(startId)?.some(
        e => e.start.idx === startIdx && e.end.id === endId && e.end.idx === endIdx,
      )
      if (duplicated) {
        return `连线已存在：${startId}:${startIdx} → ${endId}:${endIdx}`
      }
      if (graph.hasPath(endId, startId)) {
        return `会形成环：${endId} 已可达 ${startId}`
      }
      return undefined
    }

    function addWorkflowConnection(
      startId: string,
      startIdx: number,
      endId: string,
      endIdx: number,
    ): Element2D | undefined {
      const graph = buildWorkflowGraph(editor.root.value?.children ?? [])
      const invalid = validateConnection(graph, startId, startIdx, endId, endIdx)
      if (invalid) {
        console.warn(`[workflow] 拒绝建立连线，${invalid}`)
        return undefined
      }
      materializePorts(startId)
      materializePorts(endId)
      return addElement({
        // 连线可单选 / 悬停（拖拽已在选择层禁用），故不设 pointerEvents:none。
        outline: {
          // 线体柔和浅灰（画布点阵同源），端点用深色强调（随主题翻转始终显眼）。
          color: '@background-dot',
          // 匹配 2k 节点尺寸的默认线宽（细线在 2k 卡片间几乎看不见）。
          width: 20,
          // 平头端：端点已有竖线标记，圆头会从竖线探出一点凸尖。
          lineCap: 'butt',
          lineJoin: 'round',
          // 两端画一条垂直短线作连接点标记（引擎 canvas 绘制，随连线一起导出）。
          headEnd: { type: 'bar', color: '@on-surface', width: 'sm' } as any,
          tailEnd: { type: 'bar', color: '@on-surface', width: 'sm' } as any,
        },
        connection: {
          start: { id: startId, idx: startIdx },
          end: { id: endId, idx: endIdx },
          mode: 'curved',
        },
        meta: { inCanvasIs: 'Element2D' },
        // index:0 → 连线插到 children 最前（modern-canvas 按顺序渲染，0=最底层），
        // 连线永远在节点/文字之下、不遮挡内容（原先 append 到顶层会盖住节点）。
      }, { index: 0 })
    }

    return {
      name: 'mce:workflow',
      commands: [
        { command: 'addWorkflowNode', handle: addWorkflowNode },
        { command: 'addWorkflowConnection', handle: addWorkflowConnection },
        { command: 'setWorkflowGenerating', handle: setWorkflowGenerating },
        { command: 'setConnectionFlowEffect', handle: setConnectionFlowEffect },
      ],
      // 新增节点快捷键（与「+」菜单一致）：⇧T / ⇧I / ⇧V。内容编辑态下由核心自动抑制。
      hotkeys: [
        { command: 'addWorkflowNode:text', key: 'Shift+T' },
        { command: 'addWorkflowNode:image', key: 'Shift+I' },
        { command: 'addWorkflowNode:video', key: 'Shift+V' },
      ],
      components: [
        { type: 'overlay', component: Workflow },
        // 「生成中」覆盖层：任意模式下都渲染（生成是异步流程，不限于工作流模式）。
        // slot 'workflow-generating' 供宿主完全覆盖默认 shimmer（作用域收 node / box）。
        { type: 'overlay', component: WorkflowGenerating, slot: 'workflow-generating' },
      ],
      messages: {
        en: {
          'mode:workflow': 'Workflow mode',
          'workflow:text': 'Text Generation',
          'workflow:image': 'Image Generation',
          'workflow:video': 'Video Generation',
        },
        zhHans: {
          'mode:workflow': '工作流模式',
          'workflow:text': '文字生成',
          'workflow:image': '图片生成',
          'workflow:video': '视频生成',
        },
      },
    }
  })
}
