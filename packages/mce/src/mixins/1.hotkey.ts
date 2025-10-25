import type { Ref, WritableComputedRef } from 'vue'
import { isClient, useEventListener } from '@vueuse/core'
import { ref } from 'vue'
import { defineMixin } from '../editor'
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
      command: string
      key: string | string[]
      editable?: boolean
      enabled?: boolean
      system?: boolean
    }

    interface Hotkey extends HotkeyData {
      when?: (e: KeyboardEvent) => boolean
      handle?: (e: KeyboardEvent) => void
    }

    interface Editor {
      hotkeysData: WritableComputedRef<HotkeyData[]>
      hotkeys: Ref<Map<string, Hotkey>>
      registerHotkey: (value: Hotkey | Hotkey[]) => void
      unregisterHotkey: (command: string) => void
      getKbd: (command: string) => string
    }
  }
}

const defaultHotkeys: Mce.HotkeyData[] = [
  { command: 'cancel', key: 'Esc', editable: false },
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

export default defineMixin((editor) => {
  const {
    registerConfig,
    commands,
  } = editor

  const hotkeysData = registerConfig('hotkeys', defaultHotkeys)
  const hotkeys = ref(new Map<string, Mce.Hotkey>())

  function registerHotkey(value: Mce.Hotkey | Mce.Hotkey[]): void {
    if (Array.isArray(value)) {
      value.forEach(item => registerHotkey(item))
    }
    else {
      const {
        when: _when,
        handle: _handle,
        ...hotkeyData
      } = value

      const {
        command,
      } = hotkeyData

      hotkeysData.value = [
        ...hotkeysData.value.filter(v => v.command !== command),
        hotkeyData,
      ]

      hotkeys.value.set(command, value)
    }
  }

  function unregisterHotkey(command: string): void {
    hotkeysData.value = hotkeysData.value.filter(v => v.command !== command)
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

    '=': '+',
    'º': '0',
    '¡': '1',
    '™': '2',
    'Dead': 'N',
  }

  function getKbd(command: string): string {
    if (!command) {
      return ''
    }
    let keys
    const hotkey = hotkeysData.value.find(v => v.command === command)
    if (hotkey) {
      keys = Array.isArray(hotkey.key) ? hotkey.key : [hotkey.key]
    }
    else {
      keys = [command]
    }
    return keys[0].split('+').map((key) => {
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
    }).join('')
  }

  Object.assign(editor, {
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
          const command = hotkeyData.command
          const hotkey = hotkeys.value.get(command)
          const keys = Array.isArray(hotkeyData.key) ? hotkeyData.key : [hotkeyData.key]
          keys.forEach((key) => {
            const tKey = key
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

            if (eKey === tKey && (!hotkey?.when || hotkey.when(e))) {
              e.preventDefault()
              if (hotkey?.handle) {
                hotkey.handle(e)
              }
              else {
                commands.value.get(command)?.handle()
              }
              editor.emit(`hotkey:${command}` as any, e)
            }
          })
        })
      },
      false,
    )
  }
})
