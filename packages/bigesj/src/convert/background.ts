import type { NormalizedBackground } from 'modern-idoc'
import type { BigeElement } from './types'
import { isGradient } from 'modern-idoc'

export function convertBackground(el: BigeElement): NormalizedBackground | undefined {
  let background: NormalizedBackground | undefined

  const backgroundColor = el.backgroundColor
    ?? el.background?.color

  const backgroundImage = el.backgroundImage
    ?? el.background?.image

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

  if (backgroundImage) {
    background = {
      image: backgroundImage,
    }
  }

  return background
}
