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
            new TextDecoder('utf-8', { fatal: false }).decode(
              new Uint8Array(
                atob(
                  encoded
                    .getAttribute('data-clipboard')
                    ?.replace(/\s+/g, '') ?? '',
                )
                  .split('')
                  .map(c => c.charCodeAt(0)),
              ),
            ),
          ),
        )

        return await convertDoc(doc)
      }

      return []
    },
  }
}
