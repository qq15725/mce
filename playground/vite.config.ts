import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

const baseURI = 'https://admin.bige.show'

// https://vite.dev/config/
export default defineConfig(() => {
  const server = {
    host: '0.0.0.0',
    allowedHosts: ['local.bigesj.com'],
    cors: true,
    proxy: {
      '/new': {
        target: `${baseURI}/new`,
        rewrite: (path: string) => path.replace(/^\/new/, ''),
        changeOrigin: true,
      },
    },
  }

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
      server,
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@mce/bigesj': fileURLToPath(new URL('../packages/bigesj/src/index.ts', import.meta.url)),
          '@mce/gaoding': fileURLToPath(new URL('../packages/gaoding/src/index.ts', import.meta.url)),
          '@mce/mp4': fileURLToPath(new URL('../packages/mp4/src/index.ts', import.meta.url)),
          '@mce/openxml': fileURLToPath(new URL('../packages/openxml/src/index.ts', import.meta.url)),
          '@mce/pdf': fileURLToPath(new URL('../packages/pdf/src/index.ts', import.meta.url)),
          '@mce/svg': fileURLToPath(new URL('../packages/svg/src/index.ts', import.meta.url)),
          'mce/styles': fileURLToPath(new URL('../packages/mce/src/index.ts', import.meta.url)),
          'mce': fileURLToPath(new URL('../packages/mce/src/index.ts', import.meta.url)),
        },
      },
    }
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    server,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
