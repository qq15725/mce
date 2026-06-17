import type { Element } from 'modern-idoc'
import type * as Y from 'yjs'
import { Element2D } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { Doc } from '../scene'
import { eachElement } from '../utils'

declare global {
  namespace Mce {
    interface Options {
      doc?: DocumentSource
    }

    interface InternalDocument extends Document {
      id: string
      meta: {
        [key: string]: any
        inEditorIs: 'Doc'
      }
    }

    type DocumentSource
      = | Doc
        | InternalDocument
        | Element[]
        | string

    interface Editor {
      getDoc: () => JsonData
      setDoc: (doc: DocumentSource) => Doc
      loadDoc: (source: any) => Promise<Doc>
      clearDoc: () => void
      newDoc: () => void
      openDoc: () => Promise<void>
    }

    interface Commands {
      getDoc: () => JsonData
      setDoc: (doc: DocumentSource) => Doc
      loadDoc: (source: any) => Promise<Doc>
      clearDoc: () => void
      newDoc: () => void
      openDoc: () => Promise<void>
    }

    interface Hotkeys {
      newDoc: [event: KeyboardEvent]
      openDoc: [event: KeyboardEvent]
    }

    interface Events {
      docSet: [doc: Doc, oldDoc: Doc]
      docLoadStart: [source: any]
      docLoaded: [source: any, root: Doc | Error]
      docCleared: []
      docUpdated: [update: Uint8Array, origin: any]
      historyChanged: [arg0: Y.UndoManager]
    }
  }
}

export default definePlugin((editor, options) => {
  const {
    root,
    load,
    emit,
    docLoading,
    renderEngine,
    config,
    to,
    waitUntilFontLoad,
    fonts,
    openFileDialog,
  } = editor

  const getDoc: Mce.Editor['getDoc'] = () => {
    return to('json')
  }

  function onDocUpdated(update: Uint8Array, origin: any) {
    emit('docUpdated', update, origin)
  }

  function onHistoryChanged(arg0: Y.UndoManager) {
    emit('historyChanged', arg0)
  }

  // setDoc 不像 loadDoc 那样等字体；字体就绪前创建的文字会按 0 宽 glyph 测量挤成一坨。
  // 字体到位后需重排全部文字——eachElement 走 getChildren(true)，覆盖表格 back 层单元格。
  // 同一 tick 内多次触发合并为一次。
  let remeasureScheduled = false
  function scheduleTextRemeasure() {
    if (remeasureScheduled) {
      return
    }
    remeasureScheduled = true
    queueMicrotask(() => {
      remeasureScheduled = false
      eachElement(root.value, (node: any) => {
        node.text?.update?.()
        node.requestRender?.()
      })
    })
  }

  // fontLoaded 事件不可靠（默认字体常在 doc 插件订阅前就已加载完、或经第三方字体插件加载而不 emit），
  // 唯一可靠的「就绪」信号是 fonts.fallbackFont。切文档后先重排一次（热路径即生效），未就绪则轮询到位再补排。
  let fontPollId: any = null
  function remeasureWhenFontReady() {
    scheduleTextRemeasure()
    if ((fonts as any).fallbackFont) {
      return
    }
    if (fontPollId) {
      clearInterval(fontPollId)
    }
    let tries = 0
    fontPollId = setInterval(() => {
      if ((fonts as any).fallbackFont || ++tries > 50) {
        clearInterval(fontPollId)
        fontPollId = null
        scheduleTextRemeasure()
      }
    }, 100)
  }

  const setDoc: Mce.Editor['setDoc'] = (source) => {
    fonts.clear()
    const oldDoc = root.value
    const doc = source instanceof Doc ? source : new Doc(source)
    // 释放旧文档的纹理 / 动画纹理（GC），避免切换文档时显存泄漏。
    // 注：fillStyle / strokeStyle 是否需要 destroy 取决于 modern-canvas 实现——
    // 等其暴露统一 dispose 接口后在此处补上。
    oldDoc.findOne((node) => {
      if (node instanceof Element2D) {
        node.foreground.texture?.destroy()
        node.foreground.animatedTexture?.destroy()
        node.fill.texture?.destroy()
        node.fill.animatedTexture?.destroy()
        node.background.texture?.destroy()
        node.background.animatedTexture?.destroy()
      }
      return false
    })
    doc.init()
    root.value = doc
    oldDoc.remove()
    renderEngine.value.root.append(doc)
    oldDoc.off('update', onDocUpdated)
    oldDoc.off('history', onHistoryChanged)
    doc.on('update', onDocUpdated)
    doc.on('history', onHistoryChanged)
    emit('docSet', doc, oldDoc)
    oldDoc.destroy()
    return doc
  }

  const loadDoc: Mce.Editor['loadDoc'] = async (source) => {
    docLoading.value = true
    emit('docLoadStart', source)
    try {
      await waitUntilFontLoad()
      const data = await load(source)
      const doc = new Doc(data)
      if (config.value.db.local) {
        await doc.loadIndexeddb()
      }
      setDoc(doc)
      emit('docLoaded', source, doc)
      docLoading.value = false
      return doc
    }
    catch (err: any) {
      emit('docLoaded', source, err)
      docLoading.value = false
      throw err
    }
  }

  const clearDoc: Mce.Editor['clearDoc'] = async () => {
    setDoc([])
    emit('docCleared')
  }

  const newDoc: Mce.Editor['newDoc'] = async () => {
    setDoc([])
  }

  const openDoc: Mce.Editor['openDoc'] = async () => {
    const [file] = await openFileDialog()
    if (file) {
      await loadDoc(file)
    }
  }

  Object.assign(editor, {
    getDoc,
    setDoc,
    loadDoc,
    clearDoc,
    newDoc,
    openDoc,
  })

  return {
    name: 'mce:doc',
    commands: [
      { command: 'getDoc', handle: getDoc },
      { command: 'setDoc', handle: setDoc },
      { command: 'loadDoc', handle: loadDoc },
      { command: 'clearDoc', handle: clearDoc },
      { command: 'newDoc', handle: newDoc },
      { command: 'openDoc', handle: openDoc },
    ],
    hotkeys: [
      { command: 'newDoc', key: 'Alt+CmdOrCtrl+Dead' },
      { command: 'openDoc', key: 'CmdOrCtrl+O' },
    ],
    events: {
      fontLoaded: scheduleTextRemeasure,
      docSet: remeasureWhenFontReady,
    },
    setup: async () => {
      const {
        doc: source,
      } = options

      if (source) {
        await setDoc(source)
      }
      else {
        if (options.db?.local) {
          await root.value.loadIndexeddb()
        }
      }
    },
  }
})
