<script setup lang="ts">
import type { Habit } from '@/types'

const props = defineProps<{
  habit: Habit
  completed: boolean
}>()

const emit = defineEmits<{
  edit: [habit: Habit]
  delete: [habit: Habit]
  toggle: []
}>()
</script>

<template>
  <li :class="['habit-item', { 'habit-item--done': completed }]">
    <div class="habit-item__main" @click="emit('toggle')">
      <v-checkbox
        :model-value="completed"
        color="primary"
        hide-details
        density="compact"
        class="habit-item__checkbox"
        :aria-label="`Toggle ${habit.name}`"
        @click.stop
        @update:model-value="emit('toggle')"
      />
      <span class="habit-item__emoji" aria-hidden="true">{{ habit.emoji }}</span>
      <span class="habit-item__name">{{ habit.name }}</span>
    </div>

    <div class="habit-item__actions">
      <v-btn
        icon="mdi-pencil-outline"
        size="small"
        variant="text"
        density="compact"
        :aria-label="`Edit ${habit.name}`"
        @click="emit('edit', habit)"
      />
      <v-btn
        icon="mdi-trash-can-outline"
        size="small"
        variant="text"
        density="compact"
        color="error"
        :aria-label="`Delete ${habit.name}`"
        @click="emit('delete', habit)"
      />
    </div>
  </li>
</template>

<style scoped lang="scss">
.habit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  border-radius: 8px;
  min-height: 48px;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }

  &--done {
    .habit-item__name {
      text-decoration: line-through;
      opacity: 0.45;
    }

    .habit-item__emoji {
      opacity: 0.45;
    }
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    user-select: none;
  }

  &__checkbox {
    flex-shrink: 0;
  }

  &__emoji {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  &__name {
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  &:hover &__actions,
  &:focus-within &__actions {
    opacity: 1;
  }
}
</style>
