import { Element2D } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      testPerformance: (count?: number) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    root,
    exec,
    drawboardAabb,
  } = editor

  function testPerformance(count = 500) {
    root.value.removeChildren()
    const { width, height } = drawboardAabb.value
    for (let i = 0; i < count; i++) {
      const size = 10 + Math.random() * 40
      const x = Math.random() * (width - size)
      const y = Math.random() * (height - size)
      const rect = new Element2D({
        style: {
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: '#FFFFFF',
          borderColor: '#000000',
        },
      })
      root.value.appendChild(rect)
    }
    exec('zoomTo100')
  }

  return {
    name: 'mce:test',
    commands: [
      { command: 'testPerformance', handle: testPerformance },
    ],
  }
})
