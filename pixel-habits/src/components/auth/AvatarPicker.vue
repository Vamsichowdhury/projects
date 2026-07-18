<script setup lang="ts">
import { AVATAR_ICONS } from '@/constants/avatars'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="avatar-picker">
    <button
      v-for="avatar in AVATAR_ICONS"
      :key="avatar.id"
      class="avatar-picker__button"
      :class="{ 'avatar-picker__button--selected': modelValue === avatar.id }"
      :aria-label="`Select ${avatar.label} avatar`"
      @click="emit('update:modelValue', avatar.id)"
    >
      <v-icon :icon="avatar.icon" size="32" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.avatar-picker {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;

  &__button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: rgba(var(--v-theme-surface-variant), 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(var(--v-theme-on-surface));
    transition: all var(--dur-fast) var(--ease-standard);

    &:hover {
      background: rgba(var(--v-theme-surface-variant), 0.8);
    }

    &--selected {
      background: rgb(var(--v-theme-primary));
      color: rgb(var(--v-theme-on-primary));
      box-shadow: var(--glow-primary);
    }
  }
}
</style>
