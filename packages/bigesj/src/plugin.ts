import type { Editor } from 'mce'
import type { Node } from 'modern-canvas'
import { definePlugin } from 'mce'
import { onScopeDispose } from 'vue'
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
    fonts,
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

  // 按需加载：内核字体库 get(family) 查到未加载的 family 时抛 'missing'（协同远端改字/粘贴/加载等
  // 任何字体「出现」场景都覆盖，无需上层轮询/扫描 docUpdated）。加载完 fonts 'load' 会自动触发重排。
  function onMissingFont(family: string): void {
    loadFont(family)
  }

  // 直接注册，不要包 onBeforeMount：setupFonts 跑在 editor 的 effectScope 里，
  // 那个钩子只在「恰好处于某个尚未挂载的组件的 setup 同步阶段」才会触发。
  // editor.setup() 被二次调用时（宿主组件重建）会先 stop 旧 scope —— onScopeDispose 把监听器摘掉，
  // 而新 scope 注册的 onBeforeMount 因为组件早已挂载再也不会执行，三条加载路径就此全断：
  // 文档里的字体一个都不会被请求，整篇回退到后备字体，行宽随之变化、文字掉行错位。
  on('docSet', preload)
  renderEngine.value.on('nodeEnter', preloadNode)
  fonts.on('missing', onMissingFont)

  onScopeDispose(() => {
    off('docSet', preload)
    renderEngine.value.off('nodeEnter', preloadNode)
    fonts.off('missing', onMissingFont)
  })

  assets.awaitBy(async () => {
    await loadBigeFonts(api.fonts, true)
    // 清单就绪前发生的 docSet / missing 查的是空表，会被静默丢弃（missing 每个 family 只抛一次），
    // 故补扫一遍当前文档，把漏掉的字体请回来。
    await preload()
  })
}
