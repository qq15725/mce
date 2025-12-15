import type { Editor } from 'mce'
import type { Node } from 'modern-canvas'
import { definePlugin } from 'mce'
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
    isElement,
    renderEngine,
  } = editor

  const {
    loadBigeFonts,
    loadFont,
  } = useFonts()

  function preloadNode(node: Node) {
    if (isElement(node)) {
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

    node.findOne((descendant) => {
      preloadNode(descendant)
      return false
    })
  }

  async function preload() {
    root.value && preloadNode(root.value)
  }

  onBeforeUnmount(() => {
    off('setDoc', preload)
    renderEngine.value.off('nodeEnter', preloadNode)
  })

  on('setDoc', preload)
  renderEngine.value.on('nodeEnter', preloadNode)

  await loadBigeFonts(api.fonts)
}
