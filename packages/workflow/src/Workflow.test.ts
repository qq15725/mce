// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'
import { buildWorkflowGraph } from './graph'

const { editor } = vi.hoisted(() => ({ editor: {} as any }))
vi.mock('mce', () => ({ Icon: { render: () => null }, useEditor: () => editor }))
vi.mock('./useConnectionFlow', () => ({ useConnectionFlow: () => {} }))
vi.mock('./NodeLabel.vue', () => ({ default: { props: ['node'], template: '<span :data-node="node.id" />' } }))
const { default: Workflow } = await import('./Workflow.vue')

it('默认显示组合内名称，关闭后只隐藏名称；取消组合恢复且图关系不变', async () => {
  const root: any = reactive({ id: 'root', children: [] })
  const group: any = reactive({ id: 'group', children: [], parent: root })
  const child: any = reactive({ id: 'child', meta: { inEditorIs: 'WorkflowImage' }, parent: group })
  const target: any = reactive({ id: 'target', meta: { inEditorIs: 'WorkflowImage' }, parent: root })
  const connection = { id: 'edge', connection: { isValid: () => true, start: { id: 'child' }, end: { id: 'target' } } }
  group.children = [child]
  root.children = [group, target, connection]
  Object.assign(editor, {
    root: ref(root), mode: ref('workflow'), elementSelection: ref([]), workflowLabels: reactive({ showGrouped: true }),
    isElement: () => true, camera: ref({}), drawboardAabb: ref({}), exec: vi.fn(), t: (key: string) => key,
  })
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({ render: () => h(Workflow) })
  app.mount(host)
  const labels = () => [...host.querySelectorAll('[data-node]')].map(el => el.getAttribute('data-node'))
  try {
    expect(labels()).toEqual(['group', 'child', 'target'])
    editor.workflowLabels.showGrouped = false
    await nextTick()
    expect(labels()).toEqual(['group', 'target'])
    expect(buildWorkflowGraph(root.children).downstream('child').map(n => n.id)).toEqual(['target'])
    child.parent = root
    group.children = []
    root.children = [child, target, connection]
    await nextTick()
    expect(labels()).toEqual(['child', 'target'])
  }
  finally {
    app.unmount()
    host.remove()
  }
})
