import type { Vector2Data } from 'modern-canvas'
import type { Reactive, Ref } from 'vue'
import { reactive, ref, watch } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface DrawingTools {
      //
    }

    type DrawingToolHandle = (position: Vector2Data) => {
      move?: (position: Vector2Data) => void
      end?: (position: Vector2Data) => void
    } | void

    interface DrawingTool {
      name: string
      handle?: DrawingToolHandle
    }

    interface Editor {
      drawingTools: Reactive<Map<string, Mce.DrawingTool>>
      activeDrawingTool: Ref<Mce.DrawingTool>
      registerDrawingTool: (tool: Mce.DrawingTool | Mce.DrawingTool[]) => void
      unregisterDrawingTool: (tool: string) => void
      setActiveDrawingTool: (tool: string | keyof DrawingTools | undefined) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    state,
  } = editor

  const drawingTools: Mce.Editor['drawingTools'] = reactive(new Map())
  const activeDrawingTool = ref<Mce.DrawingTool>()

  const registerDrawingTool: Mce.Editor['registerDrawingTool'] = (tool): void => {
    if (Array.isArray(tool)) {
      tool.forEach(registerDrawingTool)
    }
    else {
      drawingTools.set(tool.name, tool)
    }
  }

  const unregisterDrawingTool: Mce.Editor['unregisterDrawingTool'] = (tool): void => {
    drawingTools.delete(tool)
  }

  const setActiveDrawingTool: Mce.Editor['setActiveDrawingTool'] = (tool) => {
    if (tool) {
      state.value = 'drawing'
      activeDrawingTool.value = drawingTools.get(String(tool))
    }
    else {
      state.value = undefined
      activeDrawingTool.value = undefined
    }
  }

  Object.assign(editor, {
    drawingTools,
    activeDrawingTool,
    registerDrawingTool,
    unregisterDrawingTool,
    setActiveDrawingTool,
  })

  return () => {
    const {
      state,
    } = editor

    watch(state, (state) => {
      if (state !== 'drawing') {
        activeDrawingTool.value = undefined
      }
    })
  }
})
