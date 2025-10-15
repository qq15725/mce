import type { Element } from 'modern-idoc'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { ref } from 'vue'
import { definePlugin } from '../editor'
import { createTextElement, SUPPORTS_CLIPBOARD } from '../utils'

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
    registerHotkey,
    registerCommand,
    deleteCurrentElements,
    load,
    addElement,
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
      const elements: Element[] = []
      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type)
          if (blob.type.startsWith('image/')) {
            elements.push(await load(blob))
          }
          else {
            switch (blob.type) {
              case 'text/plain':
                elements.push(createTextElement(await blob.text()))
                break
              case 'text/html': {
                const dom = new DOMParser().parseFromString(await blob.text(), 'text/html')

                const mce = dom.querySelector('mce-clipboard')
                if (mce) {
                  const els = JSON.parse(mce.textContent) as any[]
                  if (Array.isArray(els)) {
                    elements.push(...els)
                  }
                }

                const gd = dom.querySelector('span[data-app="editor-next"]')
                if (gd) {
                  const json = decodeURIComponent(
                    new TextDecoder('utf-8', { fatal: false }).decode(
                      new Uint8Array(
                        atob(
                          gd
                            .getAttribute('data-clipboard')
                            ?.replace(/\s+/g, '') ?? '',
                        )
                          .split('')
                          .map(c => c.charCodeAt(0)),
                      ),
                    ),
                  )

                  const blob = new Blob([json], {
                    type: 'application/json',
                  })

                  elements.push(await load(blob))
                }
                break
              }
              case 'application/json':
                elements.push(await load(blob))
                break
              default:
                console.warn(`Unhandled clipboard ${blob.type}`, await blob.text())
                break
            }
          }
        }
      }

      addElement(elements, {
        inPointerPosition: true,
        active: true,
        regenId: true,
      })
    }
    else if (copiedData.value) {
      if (Array.isArray(copiedData.value)) {
        addElement(copiedData.value?.map(el => cloneDeep(el)) ?? [], {
          inPointerPosition: true,
          active: true,
          regenId: true,
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
