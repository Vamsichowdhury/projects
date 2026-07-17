<script setup lang="ts">
defineProps<{
  currentStreak: number
  longestStreak: number
}>()
</script>

<template>
  <v-card class="streak-card" rounded="lg" elevation="0" border>
    <v-card-text class="streak-card__content">
      <div class="streak-card__item">
        <span class="streak-card__icon" aria-hidden="true">🔥</span>
        <div>
          <div class="streak-card__value" aria-label="Current streak">{{ currentStreak }}</div>
          <div class="streak-card__label">Current streak</div>
        </div>
      </div>

      <v-divider vertical class="streak-card__divider" />

      <div class="streak-card__item">
        <span class="streak-card__icon" aria-hidden="true">🏆</span>
        <div>
          <div class="streak-card__value" aria-label="Longest streak">{{ longestStreak }}</div>
          <div class="streak-card__label">Longest streak</div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.streak-card {
  height: 100%;

  &__content {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 100%;
  }

  &__divider {
    align-self: stretch;
    opacity: 0.2;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  &__value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  &__label {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 3px;
  }
}
</style>
