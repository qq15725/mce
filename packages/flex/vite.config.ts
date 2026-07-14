import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import mcePkg from 'mce/package.json' with { type: 'json' }
import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: () => `index.js`,
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(mcePkg.dependencies || {}),
        ...Object.keys(mcePkg.peerDependencies || {}),
        ...Object.keys(mcePkg.devDependencies || {}),
      ].map(v => new RegExp(`^${v}`)),
      output: {
        assetFileNames: () => 'index.css',
      },
    },
  },
})
