import type { Element } from 'modern-idoc'
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
  } = editor

  const getDoc: Mce.Commands['getDoc'] = () => {
    return to('json')
  }

  const setDoc: Mce.Commands['setDoc'] = async (source) => {
    const oldRoot = root.value
    const _root = new Doc(source, config.value.localDb)
    await _root.load()
    oldRoot.remove()
    renderEngine.value.root.append(_root)
    root.value = _root
    emit('setDoc', _root, oldRoot)
    return _root
  }

  const loadDoc: Mce.Commands['loadDoc'] = async (source) => {
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
