import type { Node } from 'modern-canvas'
import type { Ref } from 'vue'
import type { Editor } from '../editor'
import { Lottie2D, Video2D } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor } from './editor'

export function useNode(
  nodeRef: Ref<Node>,
  editor: Editor = useEditor(),
) {
  const {
    inEditorIs,
    isElement,
    t,
  } = editor

  const thumbnailIcon = computed(() => {
    const node = nodeRef.value
    if (inEditorIs(node, 'Frame')) {
      return '$frame'
    }
    else if (node.children.filter(isElement).length) {
      return '$group'
    }
    else if (node instanceof Lottie2D) {
      return '$lottie'
    }
    else if (node instanceof Video2D) {
      return '$video'
    }
    else if (isElement(node)) {
      if (node.foreground.isValid() && node.foreground.image) {
        return '$image'
      }
      if (node.text.isValid()) {
        return '$text'
      }
    }
    return '$shape'
  })

  const thumbnailName = computed(() => {
    const node = nodeRef.value
    let value = node.name
    if (!value || value[0] === '@') {
      // 工作流节点（inEditorIs = Workflow<Type>）的图层名走 i18n，
      // 这样切换语言能即时生效；用户显式重命名后 node.name 非空则优先用它。
      const inEditor = (node as any).meta?.inEditorIs
      if (typeof inEditor === 'string' && inEditor.startsWith('Workflow')) {
        return t(`workflow:${inEditor.slice('Workflow'.length).toLowerCase()}`)
      }
      if (inEditorIs(node, 'Frame')) {
        return t('frame')
      }
      else if (node.children.filter(isElement).length) {
        value = t('group')
      }
      else if (node instanceof Lottie2D) {
        value = t('lottie')
      }
      else if (node instanceof Video2D) {
        value = t('video')
      }
      else if (isElement(node)) {
        if (node.foreground.isValid() && node.foreground.image) {
          value = t('image')
        }
        else if (node.text.isValid()) {
          value = (node as any)._textContent || node.text.getStringContent()
        }
        else {
          value = t('shape')
        }
      }
    }
    return value || node.id
  })

  return {
    thumbnailIcon,
    thumbnailName,
  }
}
