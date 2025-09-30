import type { Document, NormalizedDocument } from 'modern-idoc'
import { throttle } from 'lodash-es'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../editor'
import { DocModel } from '../models'

declare global {
  namespace Mce {
    interface Editor {
      getDoc: () => NormalizedDocument
      setDoc: (doc: Document) => Promise<DocModel | undefined>
      clearDoc: () => void
    }

    interface EditorOptions {
      doc?: Document
    }

    interface Events {
      setDoc: [doc: DocModel]
      clearDoc: []
      updateDoc: [update: Uint8Array, origin: any]
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    workspace,
    docModel,
    renderEngine,
    emit,
    setActiveElement,
    setActiveFrame,
    setState,
    to,
  } = editor

  function getDoc(): NormalizedDocument {
    return to('json')
  }

  async function setDoc(doc: Document): Promise<DocModel | undefined> {
    setState('loading')
    const mDoc = new DocModel({ id: doc.id || idGenerator() }, editor)
    try {
      const model = mDoc
      clearDoc()
      await model.load(() => {
        model.reset()
        doc.children?.forEach((child) => {
          model.addElement(child)
        })
        renderEngine.value.timeline.endTime = doc.meta?.endTime || 0
        renderEngine.value.timeline.loop = true
      })
      model.on(
        'update',
        throttle((update, origin) => emit('updateDoc', update, origin), 200),
      )
      workspace.value?.addDoc(model)
      docModel.value?.destroy()
      docModel.value = model
      setActiveFrame(0)
      emit('setDoc', model)
    }
    finally {
      setState(undefined)
    }

    return mDoc
  }

  function clearDoc(): void {
    renderEngine.value.root.removeChildren()
    renderEngine.value.root.children.length = 0 // TODO
    docModel.value = undefined
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
