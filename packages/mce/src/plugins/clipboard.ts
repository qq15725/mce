import type { Node } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { Element2D } from 'modern-canvas'
import { onBeforeUnmount, ref } from 'vue'
import { definePlugin } from '../plugin'
import { isInputEvent, SUPPORTS_CLIPBOARD } from '../utils'

declare global {
  namespace Mce {
    interface Hotkeys {
      copy: [event: KeyboardEvent]
      cut: [event: KeyboardEvent]
      paste: [event: KeyboardEvent]
      duplicate: [event: KeyboardEvent]
    }

    type CopySource = string | Blob | Blob[] | Record<string, any>[]
    type PasteSource = DataTransfer | ClipboardItem[]

    interface Commands {
      copy: (source?: CopySource) => Promise<void>
      cut: () => Promise<void>
      paste: (source?: PasteSource) => Promise<void>
      duplicate: () => void
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
    addElements,
  } = editor

  const copiedData = ref<any>()

  const useClipboard = options.clipboard !== false && SUPPORTS_CLIPBOARD

  const copy: Mce.Commands['copy'] = async (source) => {
    if (typeof source === 'string') {
      if (useClipboard) {
        await navigator!.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([source], { type: 'text/plain' }),
          }),
        ])
      }
    }
    else if (source instanceof Blob) {
      if (useClipboard) {
        await navigator!.clipboard.write([
          new ClipboardItem({
            [source.type]: source,
          }),
        ])
      }
    }
    else if (Array.isArray(source) && source.some(v => v instanceof Blob)) {
      if (useClipboard) {
        const items: Record<string, any> = {}
        source
          .forEach((blob) => {
            if (blob instanceof Blob) {
              items[blob.type] = blob
            }
          })
        await navigator!.clipboard.write([
          new ClipboardItem(items),
        ])
      }
    }
    else {
      if (useClipboard) {
        const textItems: string[] = []
        let html = ''
        if (!source) {
          const selected = selection.value
          html += `<mce-clipboard>${JSON.stringify(selected.map((v) => {
            const json = v.toJSON()
            if (json.style) {
              delete json.style.left
              delete json.style.top
            }
            return json
          }))}</mce-clipboard>`

          const cb = (child: Node): boolean => {
            if (child instanceof Element2D) {
              const _text = child.text.base.toString()
              textItems.push(_text)
              html += `<span>${_text}</span>`
            }
            return false
          }

          selected.forEach((node) => {
            cb(node)
            node.findOne(cb)
          })
        }
        else {
          html += `<mce-clipboard>${JSON.stringify(source)}</mce-clipboard>`
        }

        const items: Record<string, any> = {}
        if (textItems.length) {
          items['text/plain'] = new Blob([textItems.join('\n')], { type: 'text/plain' })
        }
        if (html) {
          items['text/html'] = new Blob([html], { type: 'text/html' })
        }
        await navigator!.clipboard.write([
          new ClipboardItem(items),
        ])
      }
      else {
        if (source === undefined) {
          source = selection.value.map((v) => {
            const json = v.toJSON()
            delete json.style.left
            delete json.style.top
            return json
          })
        }

        if (Array.isArray(source)) {
          copiedData.value = source
        }
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
      const types = [...item.types]
      ;['image/svg+xml', 'text/html'].forEach((type) => {
        const index = types.indexOf(type)
        if (index > -1) {
          types.splice(index, 1)
          types.unshift(type)
        }
      })
      for (const type of types) {
        const blob = await item.getType(type)
        if (await canLoad(blob)) {
          elements.push(...(await load(blob)))
          break
        }
        else {
          console.warn(`Unhandled clipboard ${blob.type}`, await blob.text())
        }
      }
    }
    if (elements.length) {
      addElements(elements, {
        position: 'pointer',
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
            case 'string':
              switch (item.type) {
                case 'application/json': {
                  const json = await new Promise<string>(r => item.getAsString(r))
                  const blob = new Blob([json], { type: item.type })
                  const file = new File([blob], 'data.json', { type: item.type })
                  items.push(new ClipboardItem({ [item.type]: file }))
                  break
                }
              }
              break
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
            addElements(copiedData.value?.map(el => cloneDeep(el)) ?? [], {
              position: 'pointer',
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

  function duplicate(): void {
    if (!selection.value.length) {
      return
    }

    addElements(
      selection.value.map((v) => {
        const el = v.toJSON()
        if (el.style) {
          if (el.style.left) {
            el.style.left += 20
          }
          if (el.style.top) {
            el.style.top += 20
          }
        }
        return el
      }),
      {
        parent: selection.value[0].parent,
        index: selection.value[0].getIndex() + 1,
        active: true,
        regenId: true,
      },
    )
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
