import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import './styles/main.scss'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.store'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VCard: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'compact' },
    VSelect: { variant: 'outlined', density: 'compact' },
    VTextarea: { variant: 'outlined', density: 'compact' },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#238636',
          secondary: '#57ab5a',
          background: '#ffffff',
          surface: '#f6f8fa',
          'surface-variant': '#eaeef2',
          error: '#cf222e',
          warning: '#9a6700',
          info: '#0969da',
          success: '#1a7f37',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#3fb950',
          secondary: '#57ab5a',
          background: '#0d1117',
          surface: '#161b22',
          'surface-variant': '#21262d',
          error: '#f85149',
          warning: '#d29922',
          info: '#58a6ff',
          success: '#3fb950',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
useAuthStore()
app.use(router)
app.use(vuetify)

app.mount('#app')
