import Scrollbars from '../components/Scrollbars.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      scrollToSelection: (options?: ScrollToOptions) => void
    }

    interface Editor {
      //
    }
  }
}

export default definePlugin((editor) => {
  const {
    scrollTo,
    config,
  } = editor

  return {
    name: 'mce:scroll',
    commands: [
      { command: 'scrollToSelection', handle: options => scrollTo('selection', options) },
    ],
    components: [
      {
        type: 'overlay',
        ignore: () => !config.value.scrollbar,
        component: Scrollbars,
      },
    ],
  }
})
