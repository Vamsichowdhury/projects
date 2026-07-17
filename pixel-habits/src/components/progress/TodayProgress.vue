<script setup lang="ts">
import { useHabitStore } from '@/stores/habit.store'

const store = useHabitStore()
</script>

<template>
  <v-card class="progress-card" rounded="lg" elevation="0" border>
    <v-card-text>
      <div class="progress-card__header">
        <span class="progress-card__title">Today's Progress</span>
        <span class="progress-card__percent">{{ store.todayPercent }}%</span>
      </div>

      <v-progress-linear
        :model-value="store.todayPercent"
        color="primary"
        bg-color="surface-variant"
        rounded
        height="8"
        class="progress-card__bar"
        aria-label="Today's completion progress"
      />

      <div class="progress-card__stats">
        <span>
          <strong>{{ store.todayCompleted }}</strong>
          completed
        </span>
        <span>
          <strong>{{ store.todayTotal - store.todayCompleted }}</strong>
          remaining
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.progress-card {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 14px;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 600;
  }

  &__percent {
    font-size: 1.75rem;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    line-height: 1;
  }

  &__bar {
    margin-bottom: 12px;
  }

  &__stats {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    opacity: 0.75;
  }
}
</style>
