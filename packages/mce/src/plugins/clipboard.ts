import type { Element } from 'modern-idoc'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { onBeforeUnmount, ref } from 'vue'
import { definePlugin } from '../editor'
import { isInputEvent, SUPPORTS_CLIPBOARD } from '../utils'

declare global {
  namespace Mce {
    interface Hotkeys {
      copy: [event: KeyboardEvent]
      cut: [event: KeyboardEvent]
      paste: [event: KeyboardEvent]
      duplicate: [event: KeyboardEvent]
    }

    type PasteSource = DataTransfer | ClipboardItem[]

    interface Commands {
      copy: (data?: any) => Promise<void>
      cut: () => Promise<void>
      paste: (source?: PasteSource) => Promise<void>
      duplicate: () => Promise<void>
    }

    interface Editor {
      copiedData: Ref<any | undefined>
    }

    interface Options {
      clipboard?: boolean
    }
  }
}

export default definePlugin((editor, options) => {
  const {
    selection,
    exec,
    canLoad,
    load,
    addElement,
  } = editor

  const copiedData = ref<any>()

  const useClipboard = options.clipboard !== false && SUPPORTS_CLIPBOARD

  const copy: Mce.Commands['copy'] = async (data) => {
    if (data === undefined) {
      data = selection.value.map((v) => {
        const json = v.toJSON()
        delete json.style.left
        delete json.style.top
        return json
      })
    }
    if (useClipboard) {
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

  const cut: Mce.Commands['cut'] = async () => {
    await copy()
    exec('delete')
  }

  let locked = false
  function getPasteLock(): { locked: boolean, lock: () => void, unlock: () => void } {
    return {
      locked,
      lock: () => locked = true,
      unlock: () => locked = false,
    }
  }

  async function _paste(items: ClipboardItem[]): Promise<void> {
    const elements: Element[] = []
    for (const item of items) {
      for (const type of item.types) {
        const blob = await item.getType(type)
        if (await canLoad(blob)) {
          elements.push(...(await load(blob)))
        }
        else {
          console.warn(`Unhandled clipboard ${blob.type}`, await blob.text())
        }
      }
    }
    if (elements.length) {
      addElement(elements, {
        inPointerPosition: true,
        active: true,
        regenId: true,
      })
    }
  }

  const paste: Mce.Commands['paste'] = async (source) => {
    if (source) {
      const { unlock, lock } = getPasteLock()
      lock()
      let items: ClipboardItem[] = []
      if (source instanceof DataTransfer) {
        for (const item of source.items) {
          switch (item.kind) {
            case 'file': {
              const file = item.getAsFile()
              if (file) {
                items.push(new ClipboardItem({ [file.type]: file }))
              }
              break
            }
          }
        }
      }
      else {
        items = source
      }
      if (items.length) {
        await _paste(items)
      }
      else {
        unlock()
      }
    }
    else {
      await new Promise(r => setTimeout(r, 100))
      const { locked, unlock } = getPasteLock()
      if (!locked) {
        if (useClipboard) {
          await _paste(await navigator.clipboard.read())
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
      else {
        unlock()
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
      if (useClipboard) {
        async function onPaste(e: ClipboardEvent) {
          if (isInputEvent(e)) {
            return
          }
          if (e.clipboardData) {
            await paste(e.clipboardData)
          }
        }
        window.addEventListener('paste', onPaste)
        onBeforeUnmount(() => window.removeEventListener('paste', onPaste))
      }
    },
  }
})
