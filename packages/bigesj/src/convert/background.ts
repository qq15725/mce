import type { NormalizedBackground } from 'modern-idoc'
import type { BigeElement } from './types'
import { isGradient } from 'modern-idoc'
import { getStyle } from './style'
import { transformToCropRect } from './transform'

export function convertBackground(el: BigeElement): NormalizedBackground | undefined {
  const style = getStyle(el)

  let background: NormalizedBackground | undefined

  const color = el.backgroundColor
    ?? el.background?.color

  if (color) {
    if (isGradient(color ?? '')) {
      background = {
        image: color,
      }
    }
    else {
      background = {
        color,
      }
    }
  }

  const image = el.backgroundImage
    ?? el.background?.image

  if (image) {
    background = {
      image: image.match(/url\((.+)\)/)?.[1] ?? image,
    }
  }

  let transform = el.backgroundTransform
    ?? el.background?.transform

  if (!transform && el.imageTransform) {
    const imageTransform = el.imageTransform
    transform = {
      zoom: imageTransform?.scale || 1,
      translateX: imageTransform?.translateX || 0,
      translateY: imageTransform?.translateY || 0,
      originWidth: imageTransform?.imageWidth,
      originHeight: imageTransform?.imageHeight,
      imageWidth: imageTransform?.imageWidth || style.width,
      imageHeight: imageTransform?.imageHeight || style.height,
    }
  }

  if (background && transform) {
    background.cropRect = transformToCropRect(
      transform,
      style.width,
      style.height,
    )
  }

  return background
}
