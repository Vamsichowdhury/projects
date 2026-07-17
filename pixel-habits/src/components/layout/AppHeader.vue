<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import ThemeToggle from '@/components/theme/ThemeToggle.vue'

const today = computed(() => format(new Date(), 'EEEE, MMMM d, yyyy'))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__text">
      <h1 class="app-header__greeting">{{ greeting }} 👋</h1>
      <p class="app-header__date">{{ today }}</p>
    </div>
    <ThemeToggle />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 20px;

  &__text {
    min-width: 0;
  }

  &__greeting {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  &__date {
    font-size: 0.875rem;
    margin: 4px 0 0;
    opacity: 0.6;
  }
}
</style>
