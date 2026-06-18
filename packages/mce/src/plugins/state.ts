import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      getState: () => State
      setState: (value: State) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    state,
  } = editor

  return {
    name: 'mce:state',
    commands: [
      { command: 'getState', handle: () => state.value },
      // `'move'`（移动/默认工具）在 State 类型中对应空闲态 undefined，
      // 派生命令 `setState:move`（V 键）会传入字符串 'move'，此处归一化避免写入非法值。
      { command: 'setState', handle: val => state.value = (val as string) === 'move' ? undefined : val },
    ],
    hotkeys: [
      { command: 'setState:move', key: 'V' },
      { command: 'setState:hand', key: 'H' },
    ],
  }
})
