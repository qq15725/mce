import type { NormalizedBackground } from 'modern-idoc'
import type { BigeElement } from './types'
import { isGradient } from 'modern-idoc'
import { transformToCropRect } from './transform'

export function convertBackground(el: BigeElement): NormalizedBackground | undefined {
  let background: NormalizedBackground | undefined

  const backgroundColor = el.backgroundColor
    ?? el.background?.color

  if (backgroundColor) {
    if (isGradient(backgroundColor ?? '')) {
      background = {
        image: backgroundColor,
      }
    }
    else {
      background = {
        color: backgroundColor,
      }
    }
  }

  const backgroundImage = el.backgroundImage
    ?? el.background?.image

  if (backgroundImage) {
    background = {
      image: backgroundImage.match(/url\((.+)\)/)?.[1] ?? backgroundImage,
    }
  }

  const backgroundTransform = el.backgroundTransform
    ?? el.background?.transform

  if (background && backgroundTransform) {
    background.cropRect = transformToCropRect(
      backgroundTransform,
      el.style.width,
      el.style.height,
    )
  }

  return background
}
