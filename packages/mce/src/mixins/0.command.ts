import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type CommandHandle = (...args: any[]) => any

    interface Command {
      command: string
      handle: CommandHandle
    }

    type CommandEvents = {
      [K in keyof Commands as `command:${K}`]: [ReturnType<Commands[K]>]
    }

    interface Events extends CommandEvents {
      //
    }

    interface Editor {
      commands: Ref<Map<string, Command>>
      registerCommand: (value: Command | Command[]) => void
      unregisterCommand: (command: string) => void
      exec: <K extends keyof Commands>(command: K & string, ...args: Parameters<Commands[K]>) => ReturnType<Commands[K]>
    }
  }
}
export default defineMixin((editor) => {
  const {
    emit,
  } = editor

  const commands: Mce.Editor['commands'] = ref(new Map())

  const registerCommand: Mce.Editor['registerCommand'] = (value) => {
    if (Array.isArray(value)) {
      value.forEach(item => registerCommand(item))
    }
    else {
      commands.value.set(value.command, value)
    }
  }

  const unregisterCommand: Mce.Editor['unregisterCommand'] = (command) => {
    commands.value.delete(command)
  }

  const exec: Mce.Editor['exec'] = (command, ...args) => {
    const item = commands.value.get(command)
    if (!item) {
      throw new Error(`Command "${command}" not found`)
    }
    const res = item.handle(...args)
    emit(`command:${command}` as any, res)
    return res
  }

  Object.assign(editor, {
    commands,
    registerCommand,
    unregisterCommand,
    exec,
  })
})
