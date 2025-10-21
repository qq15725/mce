import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      //
    }

    type Command = (...args: any[]) => any

    type CommandEvents = {
      [K in keyof Commands as `command:${K}`]: [ReturnType<Commands[K]>]
    }

    interface Events extends CommandEvents {
      //
    }

    interface Editor {
      commands: Ref<Map<string, Commands[keyof Commands]>>
      registerCommand: {
        <K extends keyof Commands>(key: K, command: Commands[K]): void
        <K extends keyof Commands>(commands: { key: K, handle: Commands[K] }[]): void
      }
      unregisterCommand: <K extends keyof Commands = keyof Commands>(key: K) => void
      exec: <K extends keyof Commands>(key: K, ...args: Parameters<Commands[K]>) => ReturnType<Commands[K]>
    }
  }
}
export default defineMixin((editor) => {
  const {
    emit,
  } = editor

  const commands: Mce.Editor['commands'] = ref(new Map())

  function registerCommand(key: string, command: Mce.Command): void
  function registerCommand(commands: { key: string, handle: Mce.Command }[]): void
  function registerCommand(...args: any[]): void {
    if (Array.isArray(args[0])) {
      args[0].forEach((command) => {
        commands.value.set(command.key, command.handle)
      })
    }
    else {
      commands.value.set(args[0], args[1])
    }
  }

  const unregisterCommand: Mce.Editor['unregisterCommand'] = (key) => {
    commands.value.delete(key)
  }

  const exec: Mce.Editor['exec'] = (key, ...args) => {
    const command = commands.value.get(key) as any
    if (!command) {
      console.warn(`Command "${key}" not found`)
    }
    const res = command(...args)
    emit(`command:${key}` as any, res)
    return res
  }

  Object.assign(editor, {
    commands,
    registerCommand,
    unregisterCommand,
    exec,
  })
})
