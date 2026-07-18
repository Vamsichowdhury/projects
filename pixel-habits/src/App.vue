<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { useThemeStore } from '@/stores/theme.store'
import { useAuthStore } from '@/stores/auth.store'

const themeStore = useThemeStore()
const vuetifyTheme = useTheme()
const authStore = useAuthStore()

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
    <RouterView v-if="authStore.authReady" />
    <div v-else class="app-loading brand-bg">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>
  </v-app>
</template>

<style scoped lang="scss">
.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
