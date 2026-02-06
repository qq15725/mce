export interface HandleDragOptions {
  threshold?: number
  start?: (event: MouseEvent) => void
  move?: (offset: { x: number, y: number }, event: MouseEvent) => void
  end?: (event: MouseEvent) => void
}

export function handleDrag(downEvent: MouseEvent, options: HandleDragOptions = {}): void {
  const {
    start,
    move,
    end,
    threshold = 3,
  } = options

  let dragging = false
  let currentPos = { x: downEvent.clientX, y: downEvent.clientY }

  function onMouseMove(moveEvent: MouseEvent) {
    const movePos = { x: moveEvent.clientX, y: moveEvent.clientY }
    const offsetPos = { x: movePos.x - currentPos.x, y: movePos.y - currentPos.y }

    if (
      !dragging
      && (
        Math.abs(offsetPos.x) >= threshold
        || Math.abs(offsetPos.y) >= threshold
      )
    ) {
      dragging = true
      start?.(moveEvent)
    }

    if (dragging) {
      currentPos = { ...movePos }
      move?.(offsetPos, moveEvent)
    }
  }

  function onMouseUp(upEvent: MouseEvent) {
    if (dragging) {
      end?.(upEvent)
    }
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
