<script setup lang="ts">
import { HABIT_COLORS } from '@/utils/colorUtils'

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="color-picker">
    <span class="color-picker__label">Color</span>
    <div class="color-picker__swatches" aria-label="Choose habit color">
      <button
        v-for="c in HABIT_COLORS"
        :key="c"
        :style="{ backgroundColor: c }"
        :class="['color-swatch', { 'color-swatch--selected': model === c }]"
        :aria-label="`Select color ${c}`"
        :aria-pressed="model === c"
        type="button"
        @click="model = c"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.color-picker {
  &__label {
    font-size: 0.75rem;
    opacity: 0.7;
    display: block;
    margin-bottom: 8px;
  }

  &__swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition:
    transform 0.1s,
    border-color 0.1s;
  outline: none;

  &:hover {
    transform: scale(1.15);
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }

  &--selected {
    border-color: rgb(var(--v-theme-on-surface));
    transform: scale(1.2);
  }
}
</style>
