import type { Editor } from 'mce'
import type { Node } from 'modern-canvas'
import { definePlugin } from 'mce'
import { Element2D } from 'modern-canvas'
import { onBeforeUnmount } from 'vue'
import { useFonts } from './composables'
import { bidTidLoader, bigeLoader } from './loaders'

export interface PluginOptions {
  font?: boolean
  api?: {
    fonts?: string
    bid?: string
    tid?: string
  }
}

export function plugin(options: PluginOptions = {}) {
  const {
    font,
    api,
  } = options

  const _api = {
    fonts: '/new/design/fonts',
    bid: '/new/udesign/info/%d',
    tid: '/new/design/info/%d',
    ...api,
  }

  return definePlugin((editor) => {
    return {
      name: 'bigesj',
      loaders: [
        bigeLoader(),
        bidTidLoader(editor, _api),
      ],
      setup: async () => {
        if (font) {
          await setupFonts(editor, _api)
        }
      },
    }
  })
}

async function setupFonts(editor: Editor, api: Record<string, any>): Promise<void> {
  const {
    on,
    off,
    root,
  } = editor

  const {
    loadBigeFonts,
    loadFont,
  } = useFonts()

  function preloadNode(node: Node) {
    if (node instanceof Element2D) {
      if (node.style.fontFamily) {
        loadFont(node.style.fontFamily).then(() => node.text.update())
      }

      node.text.content.forEach((p) => {
        p.fragments.forEach((f) => {
          if (f.fontFamily) {
            loadFont(f.fontFamily).then(() => node.text.update())
          }
        })
        if (p.fontFamily) {
          loadFont(p.fontFamily).then(() => node.text.update())
        }
      })
    }
  }

  function preloadNodes(node: Node[]) {
    node.forEach((child) => {
      preloadNode(child)
      child.findOne((descendant) => {
        preloadNode(descendant)
        return false
      })
    })
  }

  async function preload() {
    root.value && preloadNodes([root.value])
  }

  onBeforeUnmount(() => {
    off('setDoc', preload)
    off('addElement', preloadNodes)
  })

  on('setDoc', preload)
  on('addElement', preloadNodes)

  await loadBigeFonts(api.fonts)
}
