import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { ref } from 'vue'
import { definePlugin } from '../editor'

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
      paste: () => void
      duplicate: () => void
    }

    interface Editor {
      copiedData: Ref<any | undefined>
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    activeElement,
    selectedElements,
    addElement,
    setActiveElement,
    registerHotkey,
    registerCommand,
    deleteCurrentElements,
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

  function paste(): void {
    if (Array.isArray(copiedData.value)) {
      copiedData.value?.forEach((el) => {
        delete el.id
        el.style.left += 10
        el.style.top += 10
        setActiveElement(
          addElement(
            cloneDeep(el),
            {
              fitSize: false,
              fitPosition: false,
            },
          ),
        )
      })
    }
  }

  function duplicate(): void {
    copy()
    paste()
  }

  provideProperties({
    copiedData,
  })
})
