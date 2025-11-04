import type { Element2D } from 'modern-canvas'
import { onBeforeUnmount, onMounted } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface ImportOptions extends AddElementOptions {
      //
    }

    interface Commands {
      import: (options?: ImportOptions) => Promise<Element2D[]>
    }

    interface Hotkeys {
      import: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    load,
    openFileDialog,
    addElement,
  } = editor

  const _import: Mce.Commands['import'] = async (options = {}) => {
    const files = await openFileDialog({ multiple: true })

    return addElement(await Promise.all(files.map(file => load(file))), {
      ...options,
      sizeToFit: true,
      positionToFit: true,
    })
  }

  return {
    name: 'mce:import',
    commands: [
      { command: 'import', handle: _import },
    ],
    hotkeys: [
      { command: 'import', key: 'CmdOrCtrl+i' },
    ],
    setup: () => {
      const {
        drawboardPointer,
        drawboardDom,
        exec,
      } = editor

      function onDragover(e: DragEvent) {
        e.preventDefault()
        drawboardPointer.value = { x: e.clientX, y: e.clientY }
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy'
        }
      }

      async function onDrop(e: DragEvent) {
        e.preventDefault()
        if (e.dataTransfer) {
          await exec('paste', e.dataTransfer)
        }
      }

      onMounted(() => {
        drawboardDom.value?.addEventListener('dragover', onDragover)
        drawboardDom.value?.addEventListener('drop', onDrop)
      })
      onBeforeUnmount(() => {
        drawboardDom.value?.removeEventListener('dragover', onDragover)
        drawboardDom.value?.removeEventListener('drop', onDrop)
      })
    },
  }
})
