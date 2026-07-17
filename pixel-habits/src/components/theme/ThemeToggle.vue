<script setup lang="ts">
import { useThemeStore } from '@/stores/theme.store'

const themeStore = useThemeStore()
</script>

<template>
  <v-btn
    :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    variant="text"
    :aria-label="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="themeStore.toggle()"
  />
</template>
