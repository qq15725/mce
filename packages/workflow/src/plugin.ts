import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { definePlugin } from 'mce'
import { getWorkflowPorts, toConnectionPoints } from './workflow'
import Workflow from './Workflow.vue'

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

// 图片/视频节点的默认占位图：内联 SVG（主题 surface 圆角底 + on-surface 反色图标）。
// 颜色在「插入节点时」从主题 CSS 变量解析后烤进 data URI——SVG data URI 是独立文档，
// 无法直接 var(--m-theme-*)，只能运行时注入（已插入节点不随后续主题切换更新）。
function placeholderImage(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 图标用主题反色（on-surface）配中等强调透明度，在 surface 底色上呈现为中灰。
const PLACEHOLDER_ICON_OPACITY = 0.4

const PLACEHOLDER_BUILDERS: Record<string, (bg: string, icon: string) => string> = {
  image: (bg, icon) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="280" viewBox="0 0 380 280" fill="none">`
    + `<rect width="380" height="280" rx="20" fill="${bg}"/>`
    + `<rect x="124" y="92" width="132" height="96" rx="12" stroke="${icon}" stroke-opacity="${PLACEHOLDER_ICON_OPACITY}" stroke-width="6" stroke-linejoin="round"/>`
    + `<circle cx="156" cy="124" r="12" fill="${icon}" fill-opacity="${PLACEHOLDER_ICON_OPACITY}"/>`
    + `<path d="M132 184l40-40 26 26 22-22 36 36" stroke="${icon}" stroke-opacity="${PLACEHOLDER_ICON_OPACITY}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `</svg>`,
  video: (bg, icon) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="280" viewBox="0 0 380 280" fill="none">`
    + `<rect width="380" height="280" rx="20" fill="${bg}"/>`
    + `<circle cx="190" cy="140" r="48" stroke="${icon}" stroke-opacity="${PLACEHOLDER_ICON_OPACITY}" stroke-width="6"/>`
    + `<path d="M178 116l40 24-40 24z" fill="${icon}" fill-opacity="${PLACEHOLDER_ICON_OPACITY}"/>`
    + `</svg>`,
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
    const { addElement, renderEngine, registerMode } = editor

    // 注册「工作流」模式，菜单的模式切换项会自动包含它。
    registerMode('workflow')

    // Per-field merge: user templates override the defaults, missing fields fall back.
    function getTemplate(type: string): Mce.WorkflowNodeTemplate {
      return { ...DEFAULT_NODES[type], ...options.workflowNodes?.[type] }
    }

    // 读主题 CSS 变量（RGB 三元组）拼成 rgb(...)；读不到时用 fallback。
    function themeRgb(name: string, fallback: string): string {
      const el = editor.drawboardDom.value
      const raw = el && getComputedStyle(el).getPropertyValue(name).trim()
      return `rgb(${raw || fallback})`
    }

    function buildPlaceholder(type: string): string {
      return placeholderImage(PLACEHOLDER_BUILDERS[type](
        themeRgb('--m-theme-surface', '255, 255, 255'),
        themeRgb('--m-theme-on-surface', '30, 30, 30'),
      ))
    }

    function buildContent(t: Mce.WorkflowNodeTemplate): any {
      return [
        ...(t.title ? [{ fragments: [{ content: t.title, color: '#1f2937', fontWeight: 700 }] }] : []),
        ...(t.body ?? []).map(line => ({ fragments: [{ content: line, color: '#9ca3af' }] })),
      ]
    }

    function createWorkflowNode(type: string): Element {
      const t = getTemplate(type)
      const image = t.image ?? (type in PLACEHOLDER_BUILDERS ? buildPlaceholder(type) : undefined)
      const node: Element = {
        name: t.label,
        style: {
          width: 380,
          height: 280,
          borderRadius: 20,
          borderColor: '#ececf0',
          borderWidth: 1,
        },
        meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: `Workflow${type.charAt(0).toUpperCase()}${type.slice(1)}` },
      }
      if (image) {
        node.foreground = { image }
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

    // Write the element's default ports onto its shape so connection routing anchors
    // at the edge port (without them it falls back to the box center).
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
      messages: {
        en: {
          'mode:workflow': 'Workflow mode',
          'workflow:text': 'Text',
          'workflow:image': 'Image',
          'workflow:video': 'Video',
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
