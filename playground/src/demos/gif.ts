import type { Editor } from 'mce'
import { fitAndPlay } from './shared'

export function loadGifDemo(editor: Editor): void {
  editor.setDoc([
    {
      id: 'gif-demo',
      style: { left: 0, top: 0, width: 300, height: 300 },
      foreground: { image: '/example.gif' },
      meta: { inCanvasIs: 'Element2D', inPptIs: 'Picture' },
    },
  ] as any)
  fitAndPlay(editor, 200)
}
