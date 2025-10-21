export function parseClipboard(dom: HTMLElement): string | undefined {
  const data = dom.querySelector('span[data-app="editor-next"]')

  if (data) {
    return decodeURIComponent(
      new TextDecoder('utf-8', { fatal: false }).decode(
        new Uint8Array(
          atob(
            data
              .getAttribute('data-clipboard')
              ?.replace(/\s+/g, '') ?? '',
          )
            .split('')
            .map(c => c.charCodeAt(0)),
        ),
      ),
    )
  }

  return undefined
}
