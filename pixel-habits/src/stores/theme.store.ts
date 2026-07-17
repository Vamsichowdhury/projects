import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

function loadDark(): boolean {
  try {
    return JSON.parse(localStorage.getItem('theme-dark') ?? 'false') as boolean
  } catch {
    return false
  }
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(loadDark())

  watch(isDark, (v) => localStorage.setItem('theme-dark', JSON.stringify(v)))

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
})
