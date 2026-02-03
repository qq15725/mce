import type { Reactive, WritableComputedRef } from 'vue'
import { isClient, useEventListener } from '@vueuse/core'
import { reactive } from 'vue'
import { defineMixin } from '../mixin'
import { isInputEvent, isMac, isWindows } from '../utils'

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
      preventDefault?: boolean
    }

    interface Hotkey extends HotkeyData {
      when?: (e: KeyboardEvent) => boolean
      handle?: (e: KeyboardEvent) => void
    }

    interface Editor {
      hotkeysData: WritableComputedRef<HotkeyData[]>
      hotkeys: Reactive<Map<string, Hotkey>>
      registerHotkey: (value: Hotkey | Hotkey[]) => void
      unregisterHotkey: (command: string) => void
      getKbd: (command: string) => string
    }
  }
}

const isff: boolean
  = typeof navigator !== 'undefined'
    ? navigator.userAgent.toLowerCase().indexOf('firefox') > 0
    : false

// Special Keys
const _keyMap: Record<string, number> = {
  'backspace': 8,
  '⌫': 8,
  'tab': 9,
  'clear': 12,
  'enter': 13,
  '↩': 13,
  'return': 13,
  'esc': 27,
  'escape': 27,
  'space': 32,
  'left': 37,
  'up': 38,
  'right': 39,
  'down': 40,
  /// https://w3c.github.io/uievents/#events-keyboard-key-location
  'arrowup': 38,
  'arrowdown': 40,
  'arrowleft': 37,
  'arrowright': 39,
  'del': 46,
  'delete': 46,
  'ins': 45,
  'insert': 45,
  'home': 36,
  'end': 35,
  'pageup': 33,
  'pagedown': 34,
  'capslock': 20,
  'num_0': 96,
  'num_1': 97,
  'num_2': 98,
  'num_3': 99,
  'num_4': 100,
  'num_5': 101,
  'num_6': 102,
  'num_7': 103,
  'num_8': 104,
  'num_9': 105,
  'num_multiply': 106,
  'num_add': 107,
  'num_enter': 108,
  'num_subtract': 109,
  'num_decimal': 110,
  'num_divide': 111,
  '⇪': 20,
  ',': 188,
  '<': 188,
  '.': 190,
  '>': 190,
  '/': 191,
  '?': 191,
  '`': 192,
  '~': 192,
  '-': isff ? 173 : 189,
  '_': isff ? 173 : 189,
  '=': isff ? 61 : 187,
  '+': isff ? 61 : 187,
  ';': isff ? 59 : 186,
  ':': isff ? 59 : 186,
  '\'': 222,
  '"': 222,
  '[': 219,
  '{': 219,
  ']': 221,
  '}': 221,
  '\\': 220,
  '|': 220,
}

// Modifier Keys
const _modifier: Record<string, number> = {
  // shiftKey
  '⇧': 16,
  'shift': 16,
  // altKey
  '⌥': 18,
  'alt': 18,
  'option': 18,
  // ctrlKey
  '⌃': 17,
  'ctrl': 17,
  'control': 17,
  // metaKey
  '⌘': 91,
  'cmd': 91,
  'meta': 91,
  'command': 91,
}

const kbdMap = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Slash: '/',
  Semicolon: ';',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Quote: '\'',
  Comma: ',',
  Minus: '-',
  Equal: '=',
  Backspace: '⌫',
  Enter: '⏎',
  Escape: 'Esc',
  Dead: 'N',
}

function getCharCode(x: string): number {
  let code = _keyMap[x.toLowerCase()]
    || _modifier[x.toLowerCase()]
    || x.toUpperCase().charCodeAt(0)

  // In Gecko (Firefox), the command key code is 224; unify it with WebKit (Chrome)
  // In WebKit, left and right command keys have different codes
  if (code === 93 || code === 224) {
    code = 91
  }

  /**
   * Collect bound keys
   * If an Input Method Editor is processing key input and the event is keydown, return 229.
   * https://stackoverflow.com/questions/25043934/is-it-ok-to-ignore-keydown-events-with-keycode-229
   * http://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
   */
  if (code === 229) {
    return 0
  }

  return code
}

function parseKey(key: string) {
  return key
    .split('+')
    .map((v) => {
      switch (v) {
        case 'Meta':
        case 'Control':
        case 'Ctrl':
        case 'CommandOrControl':
        case 'CmdOrCtrl':
          return 'CmdOrCtrl'
        case 'Alt':
        case 'Shift':
          return v
        default:
          return String.fromCharCode(getCharCode(v))
      }
    })
    .filter(Boolean)
    .sort()
    .join('+')
}

function parseKeyboardEvent(event: KeyboardEvent) {
  if (event.key.toLowerCase() === 'capslock') {
    return
  }

  const { code } = event
  let key = event.keyCode || event.which || event.charCode
  if (code && /^Key[A-Z]$/.test(code)) {
    key = code.charCodeAt(3)
  }

  return [
    (event.metaKey || event.ctrlKey) && 'CmdOrCtrl',
    event.altKey && 'Alt',
    event.shiftKey && 'Shift',
    !['Meta', 'Control', 'Alt', 'Shift'].includes(event.key) && String.fromCharCode(key),
  ]
    .filter(Boolean)
    .sort()
    .join('+')
}

export default defineMixin((editor) => {
  const {
    registerConfig,
  } = editor

  const hotkeysData = registerConfig<Mce.HotkeyData[]>('hotkeys', {
    default: () => [],
  })
  const hotkeys: Mce.Editor['hotkeys'] = reactive(new Map())

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

      hotkeys.set(command, value)
    }
  }

  function unregisterHotkey(command: string): void {
    hotkeysData.value = hotkeysData.value.filter(v => v.command !== command)
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
    const {
      exec,
    } = editor

    useEventListener(
      isClient ? window : undefined,
      'keydown',
      (e: KeyboardEvent) => {
        if (isInputEvent(e)) {
          return
        }

        const eKey = parseKeyboardEvent(e)

        hotkeysData.value.forEach((hotkeyData) => {
          const command = hotkeyData.command
          const hotkey = hotkeys.get(command)
          const keys = Array.isArray(hotkeyData.key) ? hotkeyData.key : [hotkeyData.key]
          keys.forEach((key) => {
            const tKey = parseKey(key)

            if (eKey === tKey && (!hotkey?.when || hotkey.when(e))) {
              if (hotkey?.preventDefault !== false) {
                e.preventDefault()
                e.stopPropagation()
              }
              if (hotkey?.handle) {
                hotkey.handle(e)
              }
              else {
                (exec as any)(command)
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
