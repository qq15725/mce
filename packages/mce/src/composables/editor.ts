import { inject, provide } from 'vue'
import { Editor } from '../editor'

export function useEditor(): Editor {
  return inject(Editor.injectionKey)!
}

export function provideEditor(editor = new Editor()): Editor {
  provide(Editor.injectionKey, editor)
  return editor
}
