import type { Editor } from 'mce'
import type { Node } from 'modern-canvas'
import { definePlugin } from 'mce'
import { onBeforeMount, onScopeDispose } from 'vue'
import { useFonts } from './composables'
import { bidTidLoader, bigeLoader, clipboardLoader } from './loaders'
import { imageEffectPipeline } from './pipelines'

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
    // 注册内置「图片效果」管线：还原 bige 图片样式（描边/阴影/重上色）。
    editor.registerImagePipeline(imageEffectPipeline)
    return {
      name: 'bigesj',
      loaders: [
        bigeLoader(),
        bidTidLoader(editor, _api),
        clipboardLoader(),
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
    assets,
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

  // 只负责把用到的字体灌进 editor.fonts；字体就绪后的重排由引擎自动完成
  // （modern-canvas SceneTree 订阅 fonts 'load' → 重排树内全部文字），无需手动 text.update()。
  function preloadNode(node: Node) {
    if (isElement(node)) {
      if (node.style.fontFamily) {
        loadFont(node.style.fontFamily)
      }

      node.text.content.forEach((p) => {
        p.fragments.forEach((f) => {
          if (f.fontFamily) {
            loadFont(f.fontFamily)
          }
        })
        if (p.fontFamily) {
          loadFont(p.fontFamily)
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

  onBeforeMount(() => {
    on('docSet', preload)
    renderEngine.value.on('nodeEnter', preloadNode)
  })

  onScopeDispose(() => {
    off('docSet', preload)
    renderEngine.value.off('nodeEnter', preloadNode)
  })

  assets.awaitBy(async () => {
    await loadBigeFonts(api.fonts, true)
  })
}
