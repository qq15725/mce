import { definePlugin } from 'mce'
import { clipboardLoader } from './loaders'

export function plugin() {
  return definePlugin((_editor) => {
    return {
      name: 'gaoding',
      loaders: [
        clipboardLoader(),
      ],
    }
  })
}
