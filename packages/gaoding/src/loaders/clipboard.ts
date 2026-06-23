import { base64ToText } from 'mce'
import { convertDoc } from '../convert'

export function clipboardLoader(): Mce.Loader {
  return {
    name: 'gaoding-clipboard',
    test: (doc: Document) => {
      return doc instanceof Document
        && Boolean(doc.querySelector('span[data-app="editor-next"]'))
    },
    load: async (doc: Document) => {
      const encoded = doc.querySelector('span[data-app="editor-next"]')

      if (encoded) {
        const doc = JSON.parse(
          decodeURIComponent(
            base64ToText(encoded.getAttribute('data-clipboard')?.replace(/\s+/g, '') ?? ''),
          ),
        )

        return await convertDoc(doc)
      }

      return []
    },
  }
}
