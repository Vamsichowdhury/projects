<script setup lang="ts">
import { ref } from 'vue'
import { format } from 'date-fns'
import { useHabitStore } from '@/stores/habit.store'
import HabitItem from './HabitItem.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import EditHabitDialog from '@/components/dialogs/EditHabitDialog.vue'
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue'
import type { Habit } from '@/types'

const emit = defineEmits<{
  addHabit: []
}>()

const store = useHabitStore()
const todayStr = format(new Date(), 'yyyy-MM-dd')

const editTarget = ref<Habit | null>(null)
const deleteTarget = ref<Habit | null>(null)

function isCompletedToday(habitId: string): boolean {
  return store.getEntry(habitId, todayStr) !== null
}

function handleToggle(habitId: string) {
  if (isCompletedToday(habitId)) {
    store.removeEntry(habitId, todayStr).catch(() => {})
  } else {
    store.setEntry(habitId, todayStr, 3, '').catch(() => {})
  }
}

function confirmDelete() {
  if (deleteTarget.value) {
    store.deleteHabit(deleteTarget.value.id).catch(() => {})
    deleteTarget.value = null
  }
}
</script>

<template>
  <v-card rounded="lg" elevation="0" border class="habits-list">
    <v-card-title class="habits-list__title">Today's Habits</v-card-title>
    <v-card-text>
      <EmptyState v-if="store.habits.length === 0" @create="emit('addHabit')" />
      <ul v-else class="habits-list__items">
        <HabitItem
          v-for="habit in store.habits"
          :key="habit.id"
          :habit="habit"
          :completed="isCompletedToday(habit.id)"
          @toggle="handleToggle(habit.id)"
          @edit="(h) => (editTarget = h)"
          @delete="(h) => (deleteTarget = h)"
        />
      </ul>
    </v-card-text>

    <EditHabitDialog v-model="editTarget" />
    <DeleteConfirmDialog
      :habit="deleteTarget"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </v-card>
</template>

<style scoped lang="scss">
.habits-list {
  &__title {
    font-size: 0.95rem;
    font-weight: 600;
    padding-bottom: 0;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
