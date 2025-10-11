import type { Ref } from 'vue'
import { ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      //
    }

    type CommandHandle = (...args: any[]) => any

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
export default definePlugin((editor) => {
  const {
    provideProperties,
    emit,
  } = editor

  const commands = ref(new Map<string, Mce.CommandHandle>())

  function registerCommand(key: string, command: Mce.CommandHandle): void
  function registerCommand(commands: { key: string, handle: Mce.CommandHandle }[]): void
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

  function unregisterCommand(key: string): void {
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

  provideProperties({
    commands,
    registerCommand,
    unregisterCommand,
    exec,
  })
})
