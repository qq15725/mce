import type { Document, NormalizedDocument } from 'modern-idoc'
import { throttle } from 'lodash-es'
import { defineMixin } from '../editor'
import { Doc } from '../models'

declare global {
  namespace Mce {
    interface Editor {
      getDoc: () => NormalizedDocument
      setDoc: (doc: Document | string) => Promise<Doc>
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

export default defineMixin((editor) => {
  const {
    workspace,
    doc,
    renderEngine,
    emit,
    selection,
    setActiveFrame,
    state,
    to,
    waitUntilFontLoad,
    config,
    load,
  } = editor

  function getDoc(): NormalizedDocument {
    return to('json')
  }

  async function setDoc(source: Document | string): Promise<Doc> {
    state.value = 'loading'

    const _doc = new Doc(typeof source === 'string' ? source : source.id)

    try {
      await waitUntilFontLoad()
      clearDoc()
      await _doc.load(async () => {
        if (config.value.localDb) {
          try {
            await _doc.loadIndexeddb()
          }
          catch (e) {
            console.error(e)
          }
        }
        if (typeof source !== 'string') {
          _doc.set(source)
        }
      })
      _doc.on('update', throttle((update, origin) => emit('updateDoc', update, origin), 200))
      workspace.value?.addDoc(_doc)
      doc.value?.destroy()
      doc.value = _doc
      renderEngine.value.root.appendChild(_doc.root)
      setActiveFrame(0)
      emit('setDoc', _doc)
    }
    finally {
      state.value = undefined
    }

    return _doc
  }

  async function loadDoc(source: any): Promise<Doc> {
    const _doc = await setDoc(await load(source))
    emit('loadDoc', _doc, source)
    return _doc
  }

  function clearDoc(): void {
    renderEngine.value.root.removeChildren()
    renderEngine.value.root.children.length = 0 // TODO
    doc.value = undefined
    selection.value = []
    emit('clearDoc')
  }

  Object.assign(editor, {
    getDoc,
    setDoc,
    loadDoc,
    clearDoc,
  })

  return (_, options) => {
    const {
      doc,
    } = options

    if (doc) {
      setDoc(doc)
    }
    else {
      setDoc({
        style: {
          width: 1920,
          height: 1080,
        },
        children: [],
      })
    }
  }
})
