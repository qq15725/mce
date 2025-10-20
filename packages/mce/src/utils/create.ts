import type { NormalizedElement } from 'modern-idoc'
import { idGenerator, normalizeTextContent } from 'modern-idoc'
import { measureText } from 'modern-text'
import { getImageSizeFromUrl } from './image'

export function createTextElement(content: string, style?: Record<string, any>): NormalizedElement {
  const box = measureText({ style, content }).boundingBox

  return {
    id: idGenerator(),
    style: {
      ...style,
      width: box.width,
      height: box.height,
    },
    text: { content: normalizeTextContent(content) },
    meta: { inPptIs: 'Shape' },
  }
}

export async function createImageElement(image: string): Promise<NormalizedElement> {
  return {
    id: idGenerator(),
    style: {
      ...await getImageSizeFromUrl(image),
    },
    foreground: { image },
    meta: { inPptIs: 'Picture' },
  }
}
