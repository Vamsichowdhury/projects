<script setup lang="ts">
import { useThemeStore } from '@/stores/theme.store'

const themeStore = useThemeStore()
</script>

<template>
  <v-btn
    variant="text"
    :aria-label="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="themeStore.toggle()"
  >
    <Transition name="theme-icon" mode="out-in">
      <v-icon :key="themeStore.isDark ? 'sun' : 'moon'">
        {{ themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
      </v-icon>
    </Transition>
  </v-btn>
</template>

<style scoped lang="scss">
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: transform var(--dur-fast) var(--ease-standard), opacity var(--dur-fast) var(--ease-standard);
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}
</style>
