import type { Document, NormalizedDocument } from 'modern-idoc'
import { throttle } from 'lodash-es'
import { definePlugin } from '../editor'
import { Doc } from '../models'

declare global {
  namespace Mce {
    interface Editor {
      getDoc: () => NormalizedDocument
      setDoc: (doc: Document | string) => Promise<Doc | undefined>
      clearDoc: () => void
    }

    interface Options {
      doc?: Document | string
    }

    interface Events {
      setDoc: [doc: Doc]
      clearDoc: []
      updateDoc: [update: Uint8Array, origin: any]
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    workspace,
    doc,
    renderEngine,
    emit,
    setActiveElement,
    setActiveFrame,
    setState,
    to,
    waitUntilFontLoad,
  } = editor

  function getDoc(): NormalizedDocument {
    return to('json')
  }

  async function setDoc(source: Document | string): Promise<Doc | undefined> {
    setState('loading')

    const _doc = new Doc(
      typeof source === 'string' ? { id: source } : source,
      editor,
    )

    try {
      await waitUntilFontLoad()
      clearDoc()
      await _doc.load(() => {
        if (typeof source !== 'string') {
          _doc.setDoc(source)
        }
      })
      _doc.on('update', throttle((update, origin) => emit('updateDoc', update, origin), 200))
      workspace.value?.addDoc(_doc)
      doc.value?.destroy()
      doc.value = _doc
      renderEngine.value.timeline.endTime = _doc.root.meta.endTime || 0
      renderEngine.value.timeline.loop = true
      setActiveFrame(0)
      emit('setDoc', _doc)
    }
    finally {
      setState(undefined)
    }

    return _doc
  }

  function clearDoc(): void {
    renderEngine.value.root.removeChildren()
    renderEngine.value.root.children.length = 0 // TODO
    doc.value = undefined
    setActiveElement(undefined)
    emit('clearDoc')
  }

  provideProperties({
    getDoc,
    setDoc,
    clearDoc,
  })

  return (_, options) => {
    const {
      doc,
    } = options

    if (doc) {
      setDoc(doc)
    }
  }
})
