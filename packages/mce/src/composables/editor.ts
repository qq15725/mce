import { inject, provide } from 'vue'
import { createEditor, Editor } from '../editor'

export function useEditor(): Editor {
  return inject(Editor.injectionKey)!
}

export function provideEditor(): Editor {
  const editor = createEditor()
  provide(Editor.injectionKey, editor)
  return editor
}
