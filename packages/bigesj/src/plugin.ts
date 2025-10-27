import type { Node } from 'modern-canvas'
import { gunzipSync } from 'fflate'
import { definePlugin } from 'mce'
import { Element2D } from 'modern-canvas'
import { onBeforeMount, onBeforeUnmount } from 'vue'
import { useFonts } from './composables'
import { convertDoc } from './convert'

export const plugin = definePlugin((editor) => {
  const { config } = editor

  return {
    name: 'bigesj',
    loaders: [
      {
        name: 'bige',
        accept: '.bige',
        test: (file: any) => {
          return file instanceof File
            && file.name.endsWith('.bige')
        },
        load: async (file: File) => {
          return await convertDoc(
            JSON.parse(
              new TextDecoder().decode(
                gunzipSync(new Uint8Array(await file.arrayBuffer())),
              ),
            ).content,
            config.value.frameGap,
          )
        },
      },
    ],
    setup: () => {
      const {
        on,
        off,
        root,
      } = editor

      const {
        initFonts,
        loadFont,
      } = useFonts()

      function preloadNode(node: Node) {
        if (node instanceof Element2D) {
          if (node.style.fontFamily) {
            loadFont(node.style.fontFamily).then(() => node.text.update())
          }

          node.text.content.forEach((p) => {
            p.fragments.forEach((f) => {
              if (f.fontFamily) {
                loadFont(f.fontFamily).then(() => node.text.update())
              }
            })
            if (p.fontFamily) {
              loadFont(p.fontFamily).then(() => node.text.update())
            }
          })
        }
      }

      function preloadNodes(node: Node[]) {
        node.forEach((child) => {
          preloadNode(child)
          child.findOne((descendant) => {
            preloadNode(descendant)
            return false
          })
        })
      }

      async function preload() {
        root.value && preloadNodes([root.value])
      }

      onBeforeMount(async () => {
        on('setDoc', preload)
        on('addElement', preloadNodes)
        await initFonts()
      })

      onBeforeUnmount(() => {
        off('setDoc', preload)
        off('addElement', preloadNodes)
      })
    },
  }
})
