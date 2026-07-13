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
        // 只读：不接受拖入（真正的写由 exec('paste') 拦截，这里同步禁用拷贝光标反馈）。
        if (editor.readonly.value) {
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'none'
          }
          return
        }
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
          // 落定后：粘贴 / 外部拖入的元素命中画板则嵌入（flex 画板按主轴插入到正确位置）。
          const p = editor.getGlobalPointer()
          editor.elementSelection.value.forEach(el =>
            exec('nestIntoFrame', el, { pointer: p } as any),
          )
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
