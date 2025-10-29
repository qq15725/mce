import { definePlugin } from 'mce'

export function plugin() {
  return definePlugin((_editor) => {
    return {
      name: 'gaoding',
    }
  })
}
