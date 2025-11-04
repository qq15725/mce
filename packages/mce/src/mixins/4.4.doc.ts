import type { Document, Element } from 'modern-idoc'
import { throttle } from 'lodash-es'
import { defineMixin } from '../editor'
import { Doc } from '../models'

declare global {
  namespace Mce {
    interface Editor {
      getDoc: () => JsonData
      setDoc: (doc: Document | Element[] | string) => Promise<Doc>
      loadDoc: (source: any) => Promise<Doc>
      clearDoc: () => void
    }

    interface Options {
      doc?: Document | string
    }

    interface Events {
      setDoc: [doc: Doc]
      loadDoc: [doc: Doc, source: any]
      clearDoc: []
      updateDoc: [update: Uint8Array, origin: any]
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    doc,
    renderEngine,
    emit,
    selection,
    state,
    to,
    waitUntilFontLoad,
    config,
    load,
  } = editor

  const clearDoc: Mce.Editor['clearDoc'] = () => {
    renderEngine.value.root.removeChildren()
    renderEngine.value.root.children.length = 0 // TODO
    doc.value.destroy()
    doc.value = new Doc()
    selection.value = []
    emit('clearDoc')
  }

  const getDoc: Mce.Editor['getDoc'] = () => {
    return to('json')
  }

  async function initDoc(doc: Doc, source?: Document | Element[] | string) {
    await doc.load(async () => {
      if (config.value.localDb) {
        try {
          await doc.loadIndexeddb()
        }
        catch (e) {
          console.error(e)
        }
      }
      if (source && typeof source !== 'string') {
        if (Array.isArray(source)) {
          doc.set({ children: source })
        }
        else {
          doc.set(source)
        }
      }
    })
    doc.on('update', throttle((update, origin) => emit('updateDoc', update, origin), 200))
    renderEngine.value.root.appendChild(doc.root)
  }

  const setDoc: Mce.Editor['setDoc'] = async (source) => {
    let id: string | undefined
    if (typeof source === 'string') {
      id = source
    }
    else if (source) {
      if (Array.isArray(source) && source.length === 1) {
        source = source[0]
      }

      if (!Array.isArray(source)) {
        if (source.meta?.inEditorIs === 'Doc') {
          id = source.id
        }
        else {
          source = [source]
        }
      }
    }

    const _doc = new Doc(id)

    state.value = 'loading'

    try {
      await waitUntilFontLoad()
      clearDoc()
      await initDoc(_doc, source)
      doc.value = _doc
      emit('setDoc', _doc)
    }
    finally {
      state.value = undefined
    }

    return _doc
  }

  const loadDoc: Mce.Editor['loadDoc'] = async (source) => {
    const _doc = await setDoc(await load(source))
    emit('loadDoc', _doc, source)
    return _doc
  }

  Object.assign(editor, {
    getDoc,
    setDoc,
    loadDoc,
    clearDoc,
  })

  return () => {
    const {
      doc: source,
    } = options

    if (source) {
      setDoc(source)
    }
    else {
      initDoc(doc.value)
    }
  }
})
