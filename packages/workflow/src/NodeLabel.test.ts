// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

vi.mock('mce', () => ({
  Icon: { render: () => null },
  nodeLabelStyle: (box: any) => ({ transform: `translate(${box.left}px, ${box.top}px)` }),
  useNode: () => ({ thumbnailIcon: ref(''), thumbnailName: ref('节点') }),
  useEditor: () => ({
    getAabb: (node: any) => node.worldBox,
    getObb: (node: any) => node.worldBox,
    drawboardAabb: ref({ width: 1000, height: 1000 }),
    renderEngine: ref({}),
    drawboardDom: ref(null),
    exec: vi.fn(),
    hoverElement: ref(null),
    selection: ref([]),
    state: ref(null),
    isLock: () => false,
    readonly: ref(false),
  }),
}))

const { default: NodeLabel } = await import('./NodeLabel.vue')

function node() {
  const listeners = new Set<() => void>()
  return {
    visible: true,
    style: { left: 10, top: 20 },
    worldBox: { left: 10, top: 20, width: 100, height: 100 },
    on: (_event: string, cb: () => void) => listeners.add(cb),
    off: (_event: string, cb: () => void) => listeners.delete(cb),
    moveGroup(left: number, top: number) {
      this.worldBox = { ...this.worldBox, left, top }
      listeners.forEach(cb => cb())
    },
    listeners,
  }
}

afterEach(() => document.body.replaceChildren())

describe('组合内节点标签', () => {
  it('局部坐标不变时仍跟随世界坐标更新，并重新计算视口可见性', async () => {
    const child = node()
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({ render: () => h(NodeLabel, { node: child as any }) })
    app.mount(host)
    try {
      expect(host.querySelector<HTMLElement>('.m-wf-label')?.style.transform).toBe('translate(10px, 20px)')
      child.moveGroup(200, 300)
      await nextTick()
      expect(child.style).toEqual({ left: 10, top: 20 })
      expect(host.querySelector<HTMLElement>('.m-wf-label')?.style.transform).toBe('translate(200px, 300px)')
      child.moveGroup(2000, 300)
      await nextTick()
      expect(host.querySelector('.m-wf-label')).toBeNull()
      child.moveGroup(400, 500)
      await nextTick()
      expect(host.querySelector<HTMLElement>('.m-wf-label')?.style.transform).toBe('translate(400px, 500px)')
    }
    finally {
      app.unmount()
    }
    expect(child.listeners.size).toBe(0)
  })
})
