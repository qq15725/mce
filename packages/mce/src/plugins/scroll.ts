import Scrollbars from '../components/Scrollbars.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      scrollToSelection: (options?: ScrollToOptions) => void
    }

    interface Config {
      scrollbar: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    scrollTo,
    config,
    registerConfig,
  } = editor

  registerConfig('scrollbar', false)

  return {
    name: 'mce:scroll',
    commands: [
      { command: 'scrollToSelection', handle: options => scrollTo('selection', options) },
    ],
    components: [
      {
        type: 'overlay',
        component: Scrollbars,
        ignore: () => !config.value.scrollbar,
      },
    ],
    // setup: () => {
    //   const {
    //     viewportAabb,
    //     getGlobalPointer,
    //     state,
    //     camera,
    //   } = editor
    //
    //   setInterval(() => {
    //     if (state.value === 'transforming' || state.value === 'selecting') {
    //       const _camera = camera.value
    //       const { min, max } = viewportAabb.value
    //       const { zoom } = _camera
    //       const dist = 10 / zoom.x
    //       const pointer = getGlobalPointer()
    //       if (pointer.x - dist <= min.x) {
    //         scrollTo({ x: min.x })
    //       }
    //       if (pointer.x + dist >= max.x) {
    //         scrollTo({ x: max.x })
    //       }
    //       if (pointer.y - dist <= min.y) {
    //         scrollTo({ y: min.y })
    //       }
    //       if (pointer.y + dist >= max.y) {
    //         scrollTo({ y: max.y })
    //       }
    //     }
    //   }, 100)
    // },
  }
})
