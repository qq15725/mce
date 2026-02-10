export interface DragContext {
  event: MouseEvent
  dragging: boolean
  startPoint: { x: number, y: number }
  currentPoint: { x: number, y: number }
}

export interface DragMoveContext extends DragContext {
  movePoint: { x: number, y: number }
}

export interface DragEndContext extends DragContext {
  endPoint: { x: number, y: number }
}

export interface DragListenerOptions {
  threshold?: number
  start?: (ctx: DragContext) => void
  move?: (ctx: DragMoveContext) => void
  end?: (ctx: DragEndContext) => void
}

export function addDragListener(downEvent: MouseEvent | undefined, options: DragListenerOptions = {}): () => void {
  const {
    start,
    move,
    end,
    threshold = 3,
  } = options

  const startPoint = downEvent
    ? { x: downEvent.clientX, y: downEvent.clientY }
    : undefined

  const context: Omit<DragContext, 'event'> = {
    dragging: false,
    startPoint: startPoint!,
    currentPoint: (startPoint ? { ...startPoint } : undefined)!,
  }

  function onMove(moveEvent: MouseEvent) {
    let { startPoint, currentPoint, dragging } = context

    const movePoint = {
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    }

    if (!startPoint) {
      context.startPoint = { ...movePoint }
    }

    if (!currentPoint) {
      context.currentPoint = currentPoint = { ...movePoint }
    }

    const offset = {
      x: movePoint.x - currentPoint.x,
      y: movePoint.y - currentPoint.y,
    }

    if (
      !dragging
      && (
        Math.abs(offset.x) >= threshold
        || Math.abs(offset.y) >= threshold
      )
    ) {
      context.dragging = dragging = true

      start?.({ ...context, event: downEvent ?? moveEvent })
    }

    if (dragging) {
      move?.({ ...context, movePoint, event: moveEvent })

      context.currentPoint = { ...movePoint }
    }
  }

  function onUp(upEvent?: MouseEvent) {
    if (context.dragging && upEvent) {
      const endPoint = {
        x: upEvent.clientX,
        y: upEvent.clientY,
      }

      end?.({ ...context, endPoint, event: upEvent })
    }

    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)

  return onUp
}
