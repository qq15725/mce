import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Editor {
      //
    }
  }
}

export default definePlugin((_editor) => {
  return {
    name: 'mce:smartSelection',
  }
})
