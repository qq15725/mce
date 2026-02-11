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

    interface Commands {
      getDoc: () => JsonData
      setDoc: (doc: DocumentSource) => Promise<Doc>
      loadDoc: (source: any) => Promise<Doc>
      clearDoc: () => void
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
  } = editor

  const getDoc: Mce.Commands['getDoc'] = () => {
    return to('json')
  }

  const setDoc: Mce.Commands['setDoc'] = async (source) => {
    fonts.clear()
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

  const loadDoc: Mce.Commands['loadDoc'] = async (source) => {
    docLoading.value = true
    emit('docLoading', source)
    try {
      await waitUntilFontLoad()
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

  const clearDoc: Mce.Commands['clearDoc'] = async () => {
    setDoc([])
  }

  return {
    name: 'mce:doc',
    commands: [
      { command: 'getDoc', handle: getDoc },
      { command: 'setDoc', handle: setDoc },
      { command: 'loadDoc', handle: loadDoc },
      { command: 'clearDoc', handle: clearDoc },
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
