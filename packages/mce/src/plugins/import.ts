import type { Element2D } from 'modern-canvas'
import { Vector2 } from 'modern-path2d'
import { onMounted, onScopeDispose } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface ImportOptions extends AddElementOptions {
      //
    }

    interface Commands {
      importFile: (options?: ImportOptions) => Promise<Element2D[]>
    }

    interface Hotkeys {
      importFile: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    load,
    openFileDialog,
    addElements,
  } = editor

  const _import: Mce.Commands['importFile'] = async (options = {}) => {
    const files = await openFileDialog({ multiple: true })

    return addElements((
      await Promise.all(files.map(async (file) => {
        const items = await load(file)
        return items.flatMap((item) => {
          if (item.meta?.inEditorIs === 'Doc' && item.children) {
            return item.children
          }
          return [item]
        })
      }))
    ).flat(), {
      position: 'right',
      ...options,
    })
  }

  return {
    name: 'mce:import',
    commands: [
      { command: 'importFile', handle: _import },
    ],
    hotkeys: [
      { command: 'importFile', key: 'CmdOrCtrl+I' },
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

      let dom: HTMLElement | undefined
      onMounted(() => {
        dom = drawboardDom.value
        dom?.addEventListener('dragover', onDragover)
        dom?.addEventListener('drop', onDrop)
      })
      onScopeDispose(() => {
        dom?.removeEventListener('dragover', onDragover)
        dom?.removeEventListener('drop', onDrop)
        dom = undefined
      })
    },
  }
})
