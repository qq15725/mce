import type { Reactive } from 'vue'
import { defineMixin } from '../mixin'
import { createMapRegistry, isReadonlySafeCommand } from '../utils'

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
      commands: Reactive<Map<string, Command>>
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

  const {
    map: commands,
    register: registerCommand,
    unregister: unregisterCommand,
  } = createMapRegistry<Mce.Command>(item => item.command)

  const exec: Mce.Editor['exec'] = (command, ...args) => {
    const [name, arg1] = command.split(':')
    // 只读：一切经命令的写入口（快捷键 / 右键菜单 / 拖入 / 系统粘贴 / UI 按钮）在此统一拦截；
    // 仅放行读取 / 视图类命令。程序化加载（loadDoc / setDoc）与协同远端不经 exec，不受影响。
    if (editor.readonly.value && !isReadonlySafeCommand(command)) {
      return undefined as any
    }
    if (arg1 !== undefined) {
      (args as any).unshift(arg1)
    }
    const item = commands.get(name)
    if (!item) {
      throw new Error(`Command "${name}" not found`)
    }
    const res = item.handle(...args)
    emit(`command:${name}` as any, res)
    return res
  }

  Object.assign(editor, {
    commands,
    registerCommand,
    unregisterCommand,
    exec,
  })
})
