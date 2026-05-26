import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import Workflow from '../components/Workflow.vue'
import { definePlugin } from '../plugin'
import { getWorkflowPorts, toConnectionPoints } from '../utils/workflow'

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
    }

    interface Options {
      /** Override/extend the workflow node content templates, keyed by node type. */
      workflowNodes?: Record<string, WorkflowNodeTemplate>
    }

    interface Commands {
      addWorkflowNode: (type: string, position?: AddElementPosition) => Element2D
      addWorkflowConnection: (
        startId: string,
        startIdx: number,
        endId: string,
        endIdx: number,
      ) => Element2D
    }
  }
}

// 图片/视频节点的默认占位图：内联 SVG（浅灰圆角底 + 居中图标），无需外部资源。
function placeholderImage(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const IMAGE_PLACEHOLDER = placeholderImage(
  `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="280" viewBox="0 0 380 280" fill="none">`
  + `<rect width="380" height="280" rx="20" fill="#f3f4f6"/>`
  + `<rect x="124" y="92" width="132" height="96" rx="12" stroke="#c8ccd4" stroke-width="6" stroke-linejoin="round"/>`
  + `<circle cx="156" cy="124" r="12" fill="#c8ccd4"/>`
  + `<path d="M132 184l40-40 26 26 22-22 36 36" stroke="#c8ccd4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
  + `</svg>`,
)

const VIDEO_PLACEHOLDER = placeholderImage(
  `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="280" viewBox="0 0 380 280" fill="none">`
  + `<rect width="380" height="280" rx="20" fill="#f3f4f6"/>`
  + `<circle cx="190" cy="140" r="48" stroke="#c8ccd4" stroke-width="6"/>`
  + `<path d="M178 116l40 24-40 24z" fill="#c8ccd4"/>`
  + `</svg>`,
)

// Built-in templates; overridable per type via the `workflowNodes` editor option.
// 文字节点显示标题 + 提示文案；图片/视频节点只显示一张默认占位图（image 字段），不放文字。
const DEFAULT_NODES: Record<string, Mce.WorkflowNodeTemplate> = {
  text: {
    title: '✍️ Double-click to add text',
    body: ['Or describe it below and let AI write for you.'],
  },
  image: {
    image: IMAGE_PLACEHOLDER,
  },
  video: {
    image: VIDEO_PLACEHOLDER,
  },
}

export default definePlugin((editor, options) => {
  const { addElement, renderEngine } = editor

  // Per-field merge: user templates override the defaults, missing fields fall back.
  function getTemplate(type: string): Mce.WorkflowNodeTemplate {
    return { ...DEFAULT_NODES[type], ...options.workflowNodes?.[type] }
  }

  function buildContent(t: Mce.WorkflowNodeTemplate): any {
    return [
      ...(t.title ? [{ fragments: [{ content: t.title, color: '#1f2937', fontWeight: 700 }] }] : []),
      ...(t.body ?? []).map(line => ({ fragments: [{ content: line, color: '#9ca3af' }] })),
    ]
  }

  function createWorkflowNode(type: string): Element {
    const t = getTemplate(type)
    // 用 style 渲染圆角卡片（背景/占位图 + 边框），不提供 shape——shape 的 outline 会与
    // style.border 冲突。连接点由 materializePorts 在首次连线时懒挂到节点 shape 上。
    const node: Element = {
      name: t.label,
      style: {
        width: 380,
        height: 280,
        borderRadius: 20,
        borderColor: '#ececf0',
        borderWidth: 1,
      },
      // workflow 节点是 graph 节点，用 inEditorIs 标记为 Workflow<Type>（如 WorkflowText），
      // autoNest 据此让它始终独立于画板（Frame）
      meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: `Workflow${type.charAt(0).toUpperCase()}${type.slice(1)}` },
    }
    if (t.image) {
      // 图片/视频节点：整块默认占位图，不放文字。
      node.foreground = { image: t.image }
    }
    else {
      Object.assign(node.style!, {
        padding: 28,
        fontSize: 16,
        lineHeight: 1.6,
        backgroundColor: '#ffffff',
      })
      node.text = { content: buildContent(t) }
    }
    return node
  }

  function addWorkflowNode(type: string, position?: Mce.AddElementPosition): Element2D {
    return addElement(createWorkflowNode(type), { position, active: true })
  }

  // Write the element's default ports onto its shape so the connection routing
  // anchors at the edge port (without them it falls back to the box center).
  function materializePorts(id: string): void {
    const el = (renderEngine.value as any).nodeMap.get(id) as Element2D | undefined
    if (el && !(el.shape?.connectionPoints?.length))
      el.shape.connectionPoints = toConnectionPoints(getWorkflowPorts(el))
  }

  function addWorkflowConnection(
    startId: string,
    startIdx: number,
    endId: string,
    endIdx: number,
  ): Element2D {
    materializePorts(startId)
    materializePorts(endId)
    return addElement({
      style: { pointerEvents: 'none' },
      outline: { color: '#94a3b8', width: 2, lineCap: 'round', lineJoin: 'round' },
      connection: {
        start: { id: startId, idx: startIdx },
        end: { id: endId, idx: endIdx },
        mode: 'curved',
      },
      meta: { inCanvasIs: 'Element2D' },
    })
  }

  return {
    name: 'mce:workflow',
    commands: [
      { command: 'addWorkflowNode', handle: addWorkflowNode },
      { command: 'addWorkflowConnection', handle: addWorkflowConnection },
    ],
    components: [
      { type: 'overlay', component: Workflow },
    ],
  }
})
