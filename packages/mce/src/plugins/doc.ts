import type { Element } from 'modern-idoc'
import type * as Y from 'yjs'
import { Element2D } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { Doc } from '../scene'

declare global {
  namespace Mce {
    interface Options {
      doc?: DocumentSource
      /** 新建空白文档时的默认名字，缺省为 'Doc'。有内容 source 时以 source 自身 name 为准。 */
      docName?: string
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

  // 字体就绪后的文字重排已下沉到底层（modern-font 的 Fonts emit 'load' → modern-canvas SceneTree
  // 自动重排树内全部文字，含表格 back 层单元格），故此处不再需要应用层的轮询兜底。见 modern-canvas@0.23.11。

  // 释放文档内所有元素的纹理 / 动画纹理（GC），避免切换文档时显存泄漏。
  // 注：fillStyle / strokeStyle 是否需要 destroy 取决于 modern-canvas 实现——
  // 等其暴露统一 dispose 接口后在此处补上。
  function releaseTextures(doc: Doc): void {
    doc.findOne((node) => {
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
  }

  // 把任意 DocumentSource 归一化成元素数组（复用 Doc 的归一化逻辑，临时 Doc 用后即弃）。
  function toChildren(source: Mce.DocumentSource): any[] {
    if (Array.isArray(source)) {
      return source
    }
    const incoming = source instanceof Doc ? source : new Doc(source)
    incoming.init()
    const children = (incoming.toJSON() as any).children ?? []
    incoming.destroy()
    return children
  }

  const setDoc: Mce.Editor['setDoc'] = (source) => {
    fonts.clear()
    const oldDoc = root.value

    // 协同进行中切换文档：复用当前共享 YDoc，原地 reset + 重填（删除旧元素、写入新元素都以 CRDT
    // 增量经现有 Provider 广播给对端 → 两端收敛到同一新文档）。若走下方默认路径另建 Doc（新 YDoc），
    // 新会话会与对端仍持有的旧 YDoc 内容做 CRDT 并集，两端都堆出「旧+新」的脏文档。
    // collaboration 由可选插件 @mce/collaboration 注入，核心不声明其类型 → 运行时可选链兜底缺失。
    if ((editor as any).collaboration?.active?.value) {
      const children = toChildren(source)
      releaseTextures(oldDoc)
      // 仅替换内容（children），保留共享 Doc 自身 id/name —— 维持会话文档标识稳定。
      // 必须包在 transact(should=true)=LOCAL_ORIGIN 中：① reset/重填的 yjs 写入带 LOCAL origin，
      // observe 守卫识别为自身事务而跳过「回写视图」，否则默认 origin(null) 会触发 accessor→yMap.set→
      // observe→accessor 的回写死循环（Maximum call stack）；② LOCAL 非 INTERNAL，Provider 照常把
      // 删除/新增增量广播给对端。随后 clearHistory 把这次整文档替换移出 undo 栈（与新建 Doc 语义一致）。
      oldDoc.transact(() => oldDoc.set({ children } as any), true)
      oldDoc.clearHistory()
      emit('docSet', oldDoc, oldDoc)
      return oldDoc
    }

    const doc = source instanceof Doc ? source : new Doc(source, { name: options.docName })
    releaseTextures(oldDoc)
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
      const doc = new Doc(data, { name: options.docName })
      if (config.value.db.local) {
        await doc.loadIndexeddb()
      }
      // 协同原地换内容时 setDoc 会复用当前共享 Doc 并弃置传入的 doc，故以返回值为准。
      const result = setDoc(doc)
      emit('docLoaded', source, result)
      docLoading.value = false
      return result
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
      { command: 'newDoc', key: 'Alt+CmdOrCtrl+N' },
      { command: 'openDoc', key: 'CmdOrCtrl+O' },
    ],
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
