import type { Vector2Like } from 'modern-path2d'
import type { Reactive, Ref } from 'vue'
import { ref, watch } from 'vue'
import { defineMixin } from '../mixin'
import { createMapRegistry } from '../utils'

declare global {
  namespace Mce {
    interface Tools {
      //
    }

    type ToolHandle = (position: Vector2Like) => {
      move?: (position: Vector2Like) => void
      end?: (position: Vector2Like) => void
    } | void

    interface Tool {
      name: string
      handle?: ToolHandle
    }

    interface Editor {
      tools: Reactive<Map<string, Tool>>
      activeTool: Ref<Tool>
      registerTool: (tool: Tool | Tool[]) => void
      unregisterTool: (tool: string) => void
      activateTool: (tool: string | keyof Tools | undefined) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    state,
  } = editor

  const {
    map: tools,
    register: registerTool,
    unregister: unregisterTool,
  } = createMapRegistry<Mce.Tool>(item => item.name)
  const activeTool = ref<Mce.Tool>()

  const activateTool: Mce.Editor['activateTool'] = (tool) => {
    if (editor.readonly.value) {
      return // 只读：不激活任何工具
    }
    if (tool) {
      state.value = 'drawing'
      activeTool.value = tools.get(String(tool))
    }
    else {
      state.value = undefined
      activeTool.value = undefined
    }
  }

  Object.assign(editor, {
    tools,
    activeTool,
    registerTool,
    unregisterTool,
    activateTool,
  })

  return () => {
    const {
      state,
    } = editor

    watch(state, (state) => {
      if (state !== 'drawing') {
        activeTool.value = undefined
      }
    })
  }
})
