import type { Element2D } from 'modern-canvas'
import { Vector2 } from 'modern-canvas'
import { onBeforeUnmount, onMounted } from 'vue'
import { definePlugin } from '../plugin'

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
    addElements,
  } = editor

  const _import: Mce.Commands['import'] = async (options = {}) => {
    const files = await openFileDialog({ multiple: true })

    return addElements((await Promise.all(files.map(file => load(file)))).flat(), {
      sizeToFit: true,
      ...options,
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
        drawboardAabb,
        exec,
      } = editor

      function onDragover(e: DragEvent) {
        e.preventDefault()
        drawboardPointer.value = new Vector2(
          e.clientX - drawboardAabb.value.left,
          e.clientY - drawboardAabb.value.top,
        )
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
