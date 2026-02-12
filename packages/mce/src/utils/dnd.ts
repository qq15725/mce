export interface DragContext {
  [key: string]: any
  event: MouseEvent
  dragging: boolean
  startEvent: MouseEvent
  startPoint: { x: number, y: number }
  moveEvent: MouseEvent
  movePoint: { x: number, y: number }
  lastPoint: { x: number, y: number }
  endEvent: MouseEvent
  endPoint: { x: number, y: number }
}

export interface DragListenerOptions<T extends DragContext> {
  threshold?: number
  start?: (ctx: T) => void
  move?: (ctx: T) => void
  end?: (ctx: T) => void
}

export function addDragListener<T extends DragContext>(
  downEvent: MouseEvent | undefined,
  options: DragListenerOptions<T> = {},
): () => void {
  const {
    start,
    move,
    end,
    threshold = 0,
  } = options

  const startPoint = downEvent
    ? { x: downEvent.clientX, y: downEvent.clientY }
    : undefined

  const context = {
    dragging: false,
    startPoint: startPoint!,
    lastPoint: (startPoint ? { ...startPoint } : undefined)!,
  } as T

  function onMove(moveEvent: MouseEvent) {
    let { startPoint, lastPoint, dragging } = context

    const movePoint = {
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    }

    if (!startPoint) {
      context.startPoint = { ...movePoint }
    }

    if (!lastPoint) {
      context.lastPoint = lastPoint = { ...movePoint }
    }

    const offset = {
      x: movePoint.x - lastPoint.x,
      y: movePoint.y - lastPoint.y,
    }

    if (
      !dragging
      && (
        Math.abs(offset.x) >= threshold
        || Math.abs(offset.y) >= threshold
      )
    ) {
      context.dragging = dragging = true
      context.event = context.startEvent = downEvent ?? moveEvent
      start?.(context)
    }

    if (dragging) {
      context.event = context.moveEvent = moveEvent
      context.movePoint = movePoint
      move?.(context)
      context.lastPoint = { ...movePoint }
    }
  }

  function onUp(upEvent?: MouseEvent) {
    if (context.dragging && upEvent) {
      context.event = context.endEvent = upEvent
      context.endPoint = {
        x: upEvent.clientX,
        y: upEvent.clientY,
      }
      end?.(context)
    }

    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)

  return onUp
}
