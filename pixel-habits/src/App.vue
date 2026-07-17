<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { useThemeStore } from '@/stores/theme.store'

const themeStore = useThemeStore()
const vuetifyTheme = useTheme()

vuetifyTheme.global.name.value = themeStore.isDark ? 'dark' : 'light'

watch(
  () => themeStore.isDark,
  (isDark) => {
    vuetifyTheme.global.name.value = isDark ? 'dark' : 'light'
  },
)
</script>

<template>
  <v-app>
    <RouterView />
  </v-app>
</template>
