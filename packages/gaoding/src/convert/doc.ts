import type { NormalizedElement } from 'modern-idoc'
import { convertElement } from './element'

export async function convertDoc(doc: any): Promise<NormalizedElement[]> {
  const { version: _version, elements } = doc

  return (await Promise.all(
    elements.map(async (element: any) => {
      try {
        return await convertElement(element, undefined)
      }
      catch (e) {
        console.warn(e)
        return undefined
      }
    }),
  )).filter(Boolean)
}
