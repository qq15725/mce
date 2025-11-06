import { definePlugin } from '../editor'

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
  } = editor

  return {
    name: 'mce:scroll',
    commands: [
      { command: 'scrollToSelection', handle: options => scrollTo('selection', options) },
    ],
  }
})
