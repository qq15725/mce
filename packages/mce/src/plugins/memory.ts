import { watch } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      logMemory: () => Promise<void>
    }
  }
}

function humanBytes(size: number): string {
  if (!size)
    return ''
  const num = 1024.0 // byte
  if (size < num)
    return `${size}B`
  if (size < num ** 2)
    return `${(size / num).toFixed(2)}KB`
  if (size < num ** 3)
    return `${(size / num ** 2).toFixed(2)}MB`
  if (size < num ** 4)
    return `${(size / num ** 3).toFixed(2)}G`
  return `${(size / num ** 4).toFixed(2)}T`
}

export default definePlugin((editor) => {
  async function logMemory() {
    const performance = window.performance

    if ('memory' in performance) {
      const memory = performance.memory as any
      console.log(`used memory: ${humanBytes(memory.usedJSHeapSize)}, total memory: ${humanBytes(memory.totalJSHeapSize)}`)
    }

    if ('measureUserAgentSpecificMemory' in performance) {
      const measureUserAgentSpecificMemory = performance.measureUserAgentSpecificMemory as any
      measureUserAgentSpecificMemory(editor).then((bytes: any) => {
        console.log(`editor memory: ${humanBytes(bytes.bytes)}`)
      })
    }
  }

  return {
    name: 'mce:memory',
    commands: [
      { command: 'logMemory', handle: logMemory },
    ],
    setup: () => {
      const {
        debug,
      } = editor

      let timer: any
      watch(debug, (debug) => {
        timer && clearInterval(timer)
        if (debug) {
          timer = setInterval(logMemory, 2000)
        }
      }, {
        immediate: true,
      })
    },
  }
})
