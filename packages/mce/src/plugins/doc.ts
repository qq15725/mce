import type { Element } from 'modern-idoc'
import { Element2D } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { Doc } from '../scene'

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
      setDoc: [doc: Doc, oldDoc: Doc]
      docLoading: [source: any]
      docLoaded: [source: any, root: Doc | Error]
      clearDoc: []
      updateDoc: [update: Uint8Array, origin: any]
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

  const setDoc: Mce.Editor['setDoc'] = (source) => {
    fonts.clear()
    const oldDoc = root.value
    const doc = source instanceof Doc ? source : new Doc(source)
    // TODO gc
    oldDoc.findOne((node) => {
      if (node instanceof Element2D) {
        node.foreground.texture?.destroy()
        node.foreground.animatedTexture?.destroy()
        node.fill.texture?.destroy()
        node.fill.animatedTexture?.destroy()
        node.background.texture?.destroy()
        node.background.animatedTexture?.destroy()
        // TODO
        // if (node.context.fillStyle && 'destroy' in node.context.fillStyle) {
        //   node.context.fillStyle.destroy()
        // }
        // if (node.context.strokeStyle && 'destroy' in node.context.strokeStyle) {
        //   node.context.strokeStyle.destroy()
        // }
      }
      return false
    })
    doc.init()
    root.value = doc
    oldDoc.remove()
    renderEngine.value.root.append(doc)
    emit('setDoc', doc, oldDoc)
    oldDoc.destroy()
    return doc
  }

  const loadDoc: Mce.Editor['loadDoc'] = async (source) => {
    docLoading.value = true
    emit('docLoading', source)
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
      { command: 'newDoc', handle: clearDoc },
      { command: 'openDoc', handle: openDoc },
    ],
    hotkeys: [
      { command: 'newDoc', key: 'Alt+CmdOrCtrl+Dead' },
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
