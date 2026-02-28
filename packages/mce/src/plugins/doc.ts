import type { Element } from 'modern-idoc'
import { Element2D } from 'modern-canvas'
import { Doc } from '../nodes'
import { definePlugin } from '../plugin'

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
      = | InternalDocument
        | Element[]
        | string

    interface Editor {
      getDoc: () => JsonData
      setDoc: (doc: DocumentSource) => Promise<Doc>
      loadDoc: (source: any) => Promise<Doc>
      clearDoc: () => void
      newDoc: () => void
      openDoc: () => Promise<void>
    }

    interface Commands {
      getDoc: () => JsonData
      setDoc: (doc: DocumentSource) => Promise<Doc>
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
      setDoc: [root: Doc, oldRoot: Doc]
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

  const setDoc: Mce.Editor['setDoc'] = async (source) => {
    fonts.clear()
    await waitUntilFontLoad()
    const oldRoot = root.value
    const _root = new Doc(source, config.value.db.local)
    // TODO gc
    oldRoot.findOne((node) => {
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
    root.value = _root
    oldRoot.remove()
    await _root.load()
    renderEngine.value.root.append(_root)
    emit('setDoc', _root, oldRoot)
    oldRoot.destroy()
    return _root
  }

  const loadDoc: Mce.Editor['loadDoc'] = async (source) => {
    docLoading.value = true
    emit('docLoading', source)
    try {
      const _doc = await setDoc(await load(source))
      emit('docLoaded', source, _doc)
      docLoading.value = false
      return _doc
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
    },
  }
})
