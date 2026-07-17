<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import { useStreak } from '@/composables/useStreak'
import HabitHeatmap from '@/components/heatmap/HabitHeatmap.vue'
import EditHabitDialog from '@/components/dialogs/EditHabitDialog.vue'
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue'
import PixelDetailDialog from '@/components/dialogs/PixelDetailDialog.vue'
import type { Habit, HeatmapCell } from '@/types'

const props = defineProps<{
  habit: Habit
}>()

const store = useHabitStore()

const selectedCell = ref<HeatmapCell | null>(null)
const editTarget = ref<Habit | null>(null)
const deleteTarget = ref<Habit | null>(null)

const habitEntries = computed(() => store.getEntriesForHabit(props.habit.id))
const habitFrequency = computed(() => props.habit.frequency)
const { currentStreak, longestStreak } = useStreak(habitEntries, habitFrequency)

const selectedEntry = computed(() =>
  selectedCell.value ? store.getEntry(props.habit.id, selectedCell.value.dateStr) : null,
)

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

function onCellClick(cell: HeatmapCell) {
  selectedCell.value = cell
}

function onDeleteConfirm() {
  store.deleteHabit(props.habit.id)
  deleteTarget.value = null
}
</script>

<template>
  <v-card rounded="lg" elevation="0" border class="habit-card">
    <div class="habit-card__header">
      <div class="habit-card__identity">
        <span
          class="habit-card__color-dot"
          :style="{ backgroundColor: habit.color }"
          aria-hidden="true"
        />
        <span class="habit-card__emoji" aria-hidden="true">{{ habit.emoji }}</span>
        <span class="habit-card__name">{{ habit.name }}</span>
        <v-chip :color="habit.color" size="x-small" variant="tonal" class="ml-2">
          {{ FREQ_LABELS[habit.frequency] }}
        </v-chip>
      </div>

      <div class="habit-card__meta">
        <span class="habit-card__streak" :title="`Current streak: ${currentStreak}`">
          🔥 {{ currentStreak }}
        </span>
        <span class="habit-card__streak" :title="`Longest streak: ${longestStreak}`">
          🏆 {{ longestStreak }}
        </span>
        <v-btn
          icon="mdi-pencil-outline"
          size="small"
          variant="text"
          density="compact"
          :aria-label="`Edit ${habit.name}`"
          @click="editTarget = habit"
        />
        <v-btn
          icon="mdi-trash-can-outline"
          size="small"
          variant="text"
          density="compact"
          color="error"
          :aria-label="`Delete ${habit.name}`"
          @click="deleteTarget = habit"
        />
      </div>
    </div>

    <v-card-text class="pt-2 pb-3">
      <HabitHeatmap :habit="habit" @cell-click="onCellClick" />
    </v-card-text>

    <PixelDetailDialog
      :habit="habit"
      :date-str="selectedCell?.dateStr ?? null"
      :existing-entry="selectedEntry"
      @close="selectedCell = null"
    />

    <EditHabitDialog v-model="editTarget" />

    <DeleteConfirmDialog
      :habit="deleteTarget"
      @confirm="onDeleteConfirm"
      @cancel="deleteTarget = null"
    />
  </v-card>
</template>

<style scoped lang="scss">
.habit-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 4px;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__emoji {
    font-size: 1.1rem;
  }

  &__name {
    font-weight: 600;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__streak {
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.85;
    white-space: nowrap;
    padding: 0 4px;
  }
}
</style>
