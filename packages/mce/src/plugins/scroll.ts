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
  }
})
