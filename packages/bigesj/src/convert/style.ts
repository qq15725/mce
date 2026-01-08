export function getStyle(el: Record<string, any>, clone = false) {
  let style = el.style ?? el

  if (clone) {
    style = { ...style }

    // common
    delete style.right
    delete style.bottom
    delete style.transform

    // layout
    delete style.backgroundColor
    delete style.backgroundImage
    delete style.backgroundImageOpacity
    delete style.backgroundPosition
    delete style.backgroundSize
    delete style.backgroundTransform
    delete style.backgroundUrl
    delete style.elements
    delete style.imageTransform
  }

  return style
}
