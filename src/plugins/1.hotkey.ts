import type { Ref, WritableComputedRef } from 'vue'
import { isClient, useEventListener } from '@vueuse/core'
import { ref } from 'vue'
import { definePlugin } from '../editor'
import { isMac, isWindows } from '../utils'

declare global {
  namespace Mce {
    interface Hotkeys {
      cancel: [event: KeyboardEvent]
    }

    type HotkeyEvents = {
      [K in keyof Hotkeys as `hotkey:${K}`]: Hotkeys[K]
    }

    interface Events extends HotkeyEvents {
      //
    }

    interface Config {
      hotkeys: HotkeyData[]
    }

    interface HotkeyData {
      key: keyof Hotkeys
      accelerator: string | string[]
      editable?: boolean
      enabled?: boolean
      system?: boolean
    }

    interface Hotkey extends HotkeyData {
      condition?: (e: KeyboardEvent) => boolean
      handle?: (e: KeyboardEvent) => void
    }

    interface Editor {
      hotkeysData: WritableComputedRef<HotkeyData[]>
      hotkeys: Ref<Map<string, Hotkey>>
      registerHotkey: {
        (key: string, hotkey: Hotkey): void
        (hotkeys: Hotkey[]): void
      }
      unregisterHotkey: (key: string) => void
      getKbd: (key: string | keyof Hotkeys) => string
    }
  }
}

const defaultHotkeys: Mce.HotkeyData[] = [
  { key: 'cancel', accelerator: 'Esc', editable: false },
]

function isInputEvent(event?: KeyboardEvent): boolean {
  if (!event)
    return false
  let path: EventTarget[] = (event as any).path
  if (!path && event.composedPath)
    path = event.composedPath()
  if (!path)
    return false
  return path?.some(
    (el: any) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el?.tagName) || el?.contentEditable === 'true',
  )
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    registerConfig,
    commands,
  } = editor

  const hotkeysData = registerConfig('hotkeys', defaultHotkeys)
  const hotkeys = ref(new Map<string, Mce.Hotkey>())

  function registerHotkey(key: string, hotkey: Mce.Hotkey): void
  function registerHotkey(hotkeys: Mce.Hotkey[]): void
  function registerHotkey(...args: any[]): void {
    if (Array.isArray(args[0])) {
      args[0].forEach(item => registerHotkey(item.key, item))
    }
    else {
      const [key, item] = args
      const {
        condition: _condition,
        handle: _handle,
        ...hotkeyData
      } = item
      hotkeysData.value = [
        ...hotkeysData.value.filter(v => v.key !== key),
        hotkeyData,
      ]
      hotkeys.value.set(key, item)
    }
  }

  function unregisterHotkey(key: string): void {
    hotkeysData.value = hotkeysData.value.filter(v => v.key !== key)
  }

  const kbdMap = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Slash': '/',
    'Semicolon': ';',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Backslash': '\\',
    'Quote': '\'',
    'Comma': ',',
    'Minus': '-',
    'Equal': '=',
    'Backspace': '⌫',
    'Enter': '⏎',
    'Escape': 'Esc',

    'º': '0',
    '¡': '1',
    '™': '2',
    'Dead': 'N',
  }

  function getKbd(key: string): string {
    if (!key) {
      return ''
    }
    let arr
    const hotkey = hotkeysData.value.find(v => v.key === key)
    if (hotkey) {
      arr = Array.isArray(hotkey.accelerator) ? hotkey.accelerator : [hotkey.accelerator]
    }
    else {
      arr = [key]
    }
    return arr[0].split('+').map((key) => {
      switch (key) {
        case 'Control':
          return isMac ? '⌃' : 'Ctrl'
        case 'Ctrl':
          return isMac ? '⌃' : 'Ctrl'
        case 'Command':
          return isMac ? '⌘' : isWindows ? 'Win' : 'Super'
        case 'Alt':
          return isMac ? '⌥' : 'Alt'
        case 'Shift':
          return isMac ? '⇧' : 'Shift'
        case 'CommandOrControl':
        case 'CmdOrCtrl':
          return isMac ? '⌘' : 'Ctrl'
        default:
          return (kbdMap as any)[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
      }
    }).join(' ')
  }

  provideProperties({
    hotkeys,
    hotkeysData,
    registerHotkey,
    unregisterHotkey,
    getKbd,
  })

  return () => {
    useEventListener(
      isClient ? window : undefined,
      'keydown',
      (e: KeyboardEvent) => {
        if (isInputEvent(e)) {
          return
        }

        const eKey = [
          (e.metaKey || e.ctrlKey) && 'CmdOrCtrl',
          e.altKey && 'Alt',
          e.shiftKey && 'Shift',
          !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key) && e.key,
        ]
          .filter(Boolean)
          .sort()
          .join('+')

        hotkeysData.value.forEach((hotkeyData) => {
          const key = hotkeyData.key
          const hotkey = hotkeys.value.get(key)

          const accelerators = Array.isArray(hotkeyData.accelerator)
            ? hotkeyData.accelerator
            : [hotkeyData.accelerator]

          accelerators.forEach((accelerator) => {
            const tKey = accelerator
              .split('+')
              .map((v) => {
                switch (v) {
                  case 'Meta':
                  case 'Control':
                  case 'CommandOrControl':
                    return 'CmdOrCtrl'
                  default:
                    return v
                }
              })
              .filter(Boolean)
              .sort()
              .join('+')

            if (eKey === tKey && (!hotkey?.condition || hotkey.condition(e))) {
              e.preventDefault()
              if (hotkey?.handle) {
                hotkey.handle(e)
              }
              else {
                (commands.value.get(key) as any)?.()
              }
              editor.emit(`hotkey:${key}` as any, e)
            }
          })
        })
      },
      false,
    )
  }
})
