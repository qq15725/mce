import type { Vector2Like } from 'modern-canvas'
import type { Reactive, Ref } from 'vue'
import { reactive, ref, watch } from 'vue'
import { defineMixin } from '../mixin'

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

  const tools: Mce.Editor['tools'] = reactive(new Map())
  const activeTool = ref<Mce.Tool>()

  const registerTool: Mce.Editor['registerTool'] = (tool): void => {
    if (Array.isArray(tool)) {
      tool.forEach(registerTool)
    }
    else {
      tools.set(tool.name, tool)
    }
  }

  const unregisterTool: Mce.Editor['unregisterTool'] = (tool): void => {
    tools.delete(tool)
  }

  const activateTool: Mce.Editor['activateTool'] = (tool) => {
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
