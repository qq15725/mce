export function isClickInsideElement(event: MouseEvent, targetDiv: HTMLElement): boolean {
  const mouseX = event.clientX
  const mouseY = event.clientY
  const divRect = targetDiv.getBoundingClientRect()
  const divLeft = divRect.left
  const divTop = divRect.top
  const divRight = divRect.right
  const divBottom = divRect.bottom
  return mouseX >= divLeft && mouseX <= divRight && mouseY >= divTop && mouseY <= divBottom
}
