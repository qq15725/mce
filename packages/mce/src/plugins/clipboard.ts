import type { Element } from 'modern-idoc'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { IN_BROWSER } from 'modern-canvas'
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
      copy: (data?: any) => Promise<void>
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
    selection,
    exec,
    canLoad,
    load,
    addElement,
  } = editor

  const copiedData = ref<any>()

  const copy: Mce.Commands['copy'] = async (data) => {
    if (data === undefined) {
      data = selection.value.length === 1
        ? [selection.value[0].toJSON()]
        : selection.value.map(v => v.toJSON())
    }
    if (SUPPORTS_CLIPBOARD) {
      if (Array.isArray(data)) {
        const type = 'text/html'
        const content = `<mce-clipboard>${JSON.stringify(data)}</mce-clipboard>`
        await navigator!.clipboard.write([
          new ClipboardItem({
            [type]: new Blob([content], { type }),
          }),
        ])
      }
      else if (typeof data === 'string') {
        const type = 'text/plain'
        await navigator!.clipboard.write([
          new ClipboardItem({ [type]: new Blob([data], { type }) }),
        ])
      }
    }
    else {
      if (Array.isArray(data)) {
        copiedData.value = data
      }
    }
  }

  async function cut(): Promise<void> {
    await copy()
    exec('delete')
  }

  let lock = false
  function pasteLock(): { lock: boolean, unlock: () => void } {
    if (!lock) {
      lock = true
    }
    return {
      lock,
      unlock: () => lock = false,
    }
  }

  async function onPaste(source?: ClipboardItem[]): Promise<void> {
    const items = source ?? await navigator.clipboard.read()
    const elements: Element[] = []
    for (const item of items) {
      for (const type of item.types) {
        const blob = await item.getType(type)
        if (await canLoad(blob)) {
          elements.push(await load(blob))
        }
        else {
          console.warn(`Unhandled clipboard ${blob.type}`, await blob.text())
        }
      }
    }
    addElement(elements, {
      inPointerPosition: true,
      active: true,
      regenId: true,
    })
  }

  async function paste(): Promise<void> {
    await new Promise(r => setTimeout(r, 0))
    const { lock, unlock } = pasteLock()
    if (!lock) {
      try {
        if (SUPPORTS_CLIPBOARD) {
          await onPaste()
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
      finally {
        unlock()
      }
    }
    else {
      unlock()
    }
  }

  async function duplicate(): Promise<void> {
    await copy()
    await paste()
  }

  Object.assign(editor, {
    copiedData,
  })

  return {
    name: 'mce:clipboard',
    commands: [
      { command: 'copy', handle: copy },
      { command: 'cut', handle: cut },
      { command: 'paste', handle: paste },
      { command: 'duplicate', handle: duplicate },
    ],
    hotkeys: [
      { command: 'copy', key: 'CmdOrCtrl+c', editable: false },
      { command: 'cut', key: 'CmdOrCtrl+x', editable: false },
      { command: 'paste', key: 'CmdOrCtrl+v', editable: false, preventDefault: false },
      { command: 'duplicate', key: 'CmdOrCtrl+d', editable: false },
    ],
    setup: () => {
      if (IN_BROWSER) {
        window.addEventListener('paste', async (e) => {
          const items = e.clipboardData?.items
          if (items?.length) {
            pasteLock()
            const clipboardItems: ClipboardItem[] = []
            for (const item of items) {
              switch (item.kind) {
                case 'file': {
                  const file = item.getAsFile()
                  if (file) {
                    clipboardItems.push(
                      new ClipboardItem({
                        [file.type]: file,
                      }),
                    )
                  }
                  break
                }
              }
            }
            await onPaste(
              clipboardItems.length ? clipboardItems : undefined,
            )
          }
        })
      }
    },
  }
})
