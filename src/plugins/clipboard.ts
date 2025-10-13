import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { ref } from 'vue'
import { definePlugin } from '../editor'
import { SUPPORTS_CLIPBOARD } from '../utils'

declare global {
  namespace Mce {
    interface Hotkeys {
      copy: [event: KeyboardEvent]
      cut: [event: KeyboardEvent]
      paste: [event: KeyboardEvent]
      duplicate: [event: KeyboardEvent]
    }

    interface Commands {
      copy: () => void
      cut: () => void
      paste: () => Promise<void>
      duplicate: () => void
    }

    interface Editor {
      copiedData: Ref<any | undefined>
    }
  }
}

export default definePlugin((editor) => {
  const {
    activeElement,
    selectedElements,
    addElement,
    setActiveElement,
    registerHotkey,
    registerCommand,
    deleteCurrentElements,
    upload,
  } = editor

  registerCommand([
    { key: 'copy', handle: copy },
    { key: 'cut', handle: cut },
    { key: 'paste', handle: paste },
    { key: 'duplicate', handle: duplicate },
  ])

  registerHotkey([
    { key: 'copy', accelerator: 'CmdOrCtrl+c', editable: false },
    { key: 'cut', accelerator: 'CmdOrCtrl+x', editable: false },
    { key: 'paste', accelerator: 'CmdOrCtrl+v', editable: false },
    { key: 'duplicate', accelerator: 'CmdOrCtrl+d', editable: false },
  ])

  const copiedData = ref<any>()

  function copy(): void {
    copiedData.value = activeElement.value
      ? [activeElement.value.toJSON()]
      : selectedElements.value.map(v => v.toJSON())
  }

  function cut(): void {
    copy()
    deleteCurrentElements()
  }

  async function paste(): Promise<void> {
    if (copiedData.value) {
      if (Array.isArray(copiedData.value)) {
        copiedData.value?.forEach((el) => {
          delete el.id
          el.style.left += 10
          el.style.top += 10
          setActiveElement(
            addElement(cloneDeep(el)),
          )
        })
      }
    }
    else {
      if (SUPPORTS_CLIPBOARD) {
        const text: string = await navigator!.clipboard.readText()
        const items: ClipboardItems = await navigator!.clipboard.read()
        if (items.length) {
          for (const item of items) {
            for (const type of item.types) {
              const blob = await item.getType(type)
              switch (blob.type) {
                case 'text/plain':
                  await blob.text()
                  // TODO insertText
                  break
                case 'text/html':
                  // TODO
                  break
                default:
                  if (blob.type.startsWith('image/')) {
                    await upload(new File([blob], 'pasted'))
                    // TODO insertImage
                  }
                  else if (blob.type.startsWith('application/')) {
                    // TODO
                  }
              }
            }
          }
        }
        else if (text) {
          // TODO insertText
        }
      }
    }
  }

  function duplicate(): void {
    copy()
    paste()
  }

  Object.assign(editor, {
    copiedData,
  })
})
