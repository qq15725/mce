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
      copy: () => Promise<void>
      cut: () => Promise<void>
      paste: () => Promise<void>
      duplicate: () => Promise<void>
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
    exec,
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

  async function copy(): Promise<void> {
    const data = activeElement.value
      ? [activeElement.value.toJSON()]
      : selectedElements.value.map(v => v.toJSON())
    if (SUPPORTS_CLIPBOARD) {
      const type = 'text/html'
      await navigator!.clipboard.write([
        new ClipboardItem({
          [type]: new Blob([
            `<mce-clipboard>${JSON.stringify(data)}</mce-clipboard>`,
          ], { type }),
        }),
      ])
    }
    else {
      copiedData.value = data
    }
  }

  async function cut(): Promise<void> {
    await copy()
    deleteCurrentElements()
  }

  async function paste(): Promise<void> {
    if (SUPPORTS_CLIPBOARD) {
      const items: ClipboardItems = await navigator!.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type)
          if (blob.type.startsWith('image/')) {
            const image = await upload(new File([blob], 'pasted'))
            exec('insertImage', image)
          }
          else {
            switch (blob.type) {
              case 'text/plain':
                exec('insertText', await blob.text())
                break
              case 'text/html': {
                const dom = new DOMParser().parseFromString(await blob.text(), 'text/html')
                const mceClipboard = dom.querySelector('mce-clipboard')
                if (mceClipboard) {
                  const els = JSON.parse(mceClipboard.textContent)
                  if (Array.isArray(els)) {
                    els.forEach((el) => {
                      delete el.id
                      el.style.left += 10
                      el.style.top += 10
                      setActiveElement(
                        addElement(cloneDeep(el)),
                      )
                    })
                  }
                }
                break
              }
              default:
                console.warn(`Unhandled clipboard ${blob.type}`, await blob.text())
                break
            }
          }
        }
      }
    }
    else if (copiedData.value) {
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
  }

  async function duplicate(): Promise<void> {
    await copy()
    await paste()
  }

  Object.assign(editor, {
    copiedData,
  })
})
