import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import Workflow from '../components/Workflow.vue'
import { definePlugin } from '../plugin'
import { getWorkflowPorts, toConnectionPoints } from '../utils/workflow'

declare global {
  namespace Mce {
    interface WorkflowNodeTemplate {
      /** Layer-panel name (and header label). */
      label?: string
      /** Bold first line shown inside the node. */
      title?: string
      /** Gray hint paragraphs under the title. */
      body?: string[]
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

// Built-in templates; overridable per type via the `workflowNodes` editor option.
const DEFAULT_NODES: Record<string, Mce.WorkflowNodeTemplate> = {
  text: {
    label: '文字生成',
    title: '✍️ 双击此处输入文字..',
    body: [
      '可以在此输入提示词，比如画面描述、产品卖点、活动主题、场景描述、品牌 slogan 等内容。若暂时没有明确内容，也可先输入关键词或草稿，后续随时修改优化哦！',
      '也可以在底部输入框输入需求，让 AI 自动完成文字生成。',
    ],
  },
  image: {
    label: '图片生成',
    title: '🖼️ 双击此处描述画面..',
    body: ['输入画面描述、风格、主体等内容，让 AI 自动完成图片生成。'],
  },
  video: {
    label: '视频生成',
    title: '🎬 双击此处描述视频..',
    body: ['输入分镜、动作、风格等内容，让 AI 自动完成视频生成。'],
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
    return {
      name: t.label ?? type,
      // 用 style 渲染圆角卡片（背景 + 边框），不提供 shape——shape 的 outline 会与
      // style.border 冲突。连接点由 materializePorts 在首次连线时懒挂到节点 shape 上。
      style: {
        width: 380,
        height: 280,
        borderRadius: 20,
        padding: 28,
        fontSize: 16,
        lineHeight: 1.6,
        backgroundColor: '#ffffff',
        borderColor: '#ececf0',
        borderWidth: 1,
      },
      text: { content: buildContent(t) },
      // workflow 节点是 graph 节点，用 inEditorIs 标记为 Workflow<Type>（如 WorkflowText），
      // autoNest 据此让它始终独立于画板（Frame）
      meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: `Workflow${type.charAt(0).toUpperCase()}${type.slice(1)}` },
    }
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
