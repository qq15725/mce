import { getCurrentInstance, inject } from 'vue'
import { Editor } from '../editor'

export function useEditor(): Editor {
  let editor = inject(Editor.injectionKey, null)
  if (!editor) {
    const _editor = (getCurrentInstance()?.proxy as any)?.editor as any
    if (_editor instanceof Editor) {
      editor = _editor
    }
  }
  return editor!
}
