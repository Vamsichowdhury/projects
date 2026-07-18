import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    maskableFormat: 'svg'
  },
  images: ['public/logo.svg']
})
