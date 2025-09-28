import type { Document } from 'modern-idoc'
import { throttle } from 'lodash-es'
import { idGenerator } from 'modern-idoc'
import { defineProvider } from '../editor'
import { DocModel } from '../models'

declare global {
  namespace Mce {
    interface Editor {
      setDoc: (doc: Document) => Promise<DocModel | undefined>
      clearDoc: () => void
    }

    interface Events {
      setDoc: [doc: DocModel]
      clearDoc: []
      updateDoc: [update: Uint8Array, origin: any]
    }
  }
}

export default defineProvider((editor) => {
  const {
    provideProperties,
    workspace,
    docModel,
    renderEngine,
    emit,
    setActiveElement,
    setActiveFrame,
    setStatus,
    frames,
    config,
  } = editor

  async function setDoc(doc: Document): Promise<DocModel | undefined> {
    setStatus('loading')
    const mDoc = new DocModel({ id: doc.id || idGenerator() }, editor)
    try {
      const model = mDoc
      clearDoc()
      await model.load(async () => {
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
      setStatus(undefined)
    }

    if (!frames.value.length || frames.value.length > 1) {
      config.value.viewMode = 'edgeless'
      config.value.camera = true
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
    setDoc,
    clearDoc,
  })
})
