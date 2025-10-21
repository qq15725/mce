import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => {
  if (process.env.MODE === 'local') {
    return {
      plugins: [
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag: string) => tag === 'text-editor',
            },
          },
        }),
        vueDevTools(),
      ],
      server: {
        host: '0.0.0.0',
        allowedHosts: [
          'local.bigesj.com',
        ],
        cors: true,
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@mce/bigesj': fileURLToPath(new URL('../bigesj/src/index.ts', import.meta.url)),
          '@mce/gaoding': fileURLToPath(new URL('../gaoding/src/index.ts', import.meta.url)),
          'mce/styles': fileURLToPath(new URL('../mce/src/index.ts', import.meta.url)),
          'mce': fileURLToPath(new URL('../mce/src/index.ts', import.meta.url)),
        },
      },
    }
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
