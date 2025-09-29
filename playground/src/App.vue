<script setup lang="ts">
import { Drawboard, useEditor } from '../..'

const editor = useEditor()

editor.setFallbackFont({
  family: 'SourceHanSansCN-Normal',
  src: '/SourceHanSansCN-Normal.woff',
})

editor.setDoc({
  children: [
    {
      style: {
        rotate: 60,
        left: 200,
        top: 10,
        width: 50,
        height: 50,
      },
      foreground: '/example.png',
    },
    {
      style: {
        rotate: 40,
        left: 100,
        top: 100,
        fontSize: 20,
        color: '#FF00FF',
      },
      text: 'test',
    },
    {
      style: {
        left: 200,
        top: 100,
        width: 100,
        height: 200,
        fontSize: 22,
      },
      text: [
        {
          letterSpacing: 3,
          fragments: [
            {
              content: 'He',
              color: '#00FF00',
              fontSize: 12,
            },
            {
              content: 'llo',
              color: '#000000',
            },
          ],
        },
        {
          content: ', ',
          color: '#FF0000',
        },
        {
          content: 'World!',
          color: '#0000FF',
        },
      ],
    },
  ],
})
</script>

<template>
  <div style="width: 100vw;height: 100vh">
    <Drawboard />
  </div>
</template>
