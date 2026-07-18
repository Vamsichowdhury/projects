/** * Habit Card Component — Individual Habit Display * * Displays a single habit with: * - Header:
emoji, name, frequency chip, current & longest streaks, edit/delete buttons * - Body: Heatmap grid
(daily/weekly/monthly based on habit.frequency) * - Dialogs: PixelDetailDialog (for marking pixels),
EditHabitDialog, DeleteConfirmDialog * * Reactive updates: * - When habit entries change →
HabitHeatmap re-renders with new colors * - When habit data changes → chip and streaks update * -
When clicked pixel → PixelDetailDialog opens with pre-filled data * * Props: Single Habit object
(id, name, emoji, color, frequency, createdAt) * Emits: None (mutations handled via store) */

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import { useStreak } from '@/composables/useStreak'
import { getTodayStr } from '@/utils/dateUtils'
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

const todayStr = getTodayStr()
const todayEntry = computed(() => store.getEntry(props.habit.id, todayStr))
const isMarkedToday = computed(() => todayEntry.value !== null)

function quickMarkToday() {
  if (isMarkedToday.value) {
    store.removeEntry(props.habit.id, todayStr).catch(() => {})
  } else {
    store.setEntry(props.habit.id, todayStr, 5, todayEntry.value?.description ?? '').catch(() => {})
  }
}

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
  <v-card elevation="0" border class="habit-card">
    <div class="habit-card__header">
      <div class="habit-card__identity">
        <span
          class="habit-card__color-dot"
          :style="{ backgroundColor: habit.color, boxShadow: `0 0 6px 1px ${habit.color}` }"
          aria-hidden="true"
        />
        <span class="habit-card__emoji" aria-hidden="true">{{ habit.emoji }}</span>
        <span class="habit-card__name">{{ habit.name }}</span>
        <v-chip :color="habit.color" size="x-small" variant="tonal" class="ml-2">
          {{ FREQ_LABELS[habit.frequency] }}
        </v-chip>
      </div>

      <div class="habit-card__meta">
        <div class="habit-card__stat">
          <span
            class="habit-card__stat-icon"
            :class="{ 'habit-card__stat-icon--active': currentStreak > 0 }"
            >🔥</span
          >
          <span class="habit-card__stat-value">{{ currentStreak }}</span>
          <span class="habit-card__stat-label">Current</span>
        </div>

        <div class="habit-card__stat">
          <span class="habit-card__stat-icon">🏆</span>
          <span class="habit-card__stat-value">{{ longestStreak }}</span>
          <span class="habit-card__stat-label">Longest</span>
        </div>
        <v-btn
          icon="mdi-trash-can-outline"
          size="small"
          variant="text"
          density="compact"
          color="error"
          :aria-label="`Delete ${habit.name}`"
          @click="deleteTarget = habit"
        />
        <v-btn
          icon="mdi-pencil-outline"
          size="small"
          variant="text"
          density="compact"
          :aria-label="`Edit ${habit.name}`"
          @click="editTarget = habit"
        />
        <button
          class="habit-card__quick-mark"
          :class="{ 'habit-card__quick-mark--done': isMarkedToday }"
          :aria-label="
            isMarkedToday ? 'Marked today — click to undo' : `Mark today's ${habit.name} as done`
          "
          @click="quickMarkToday"
        >
          <v-icon
            :icon="isMarkedToday ? 'mdi-check-circle' : 'mdi-check-circle-outline'"
            size="28"
          />
          <span class="habit-card__quick-mark-label">{{ isMarkedToday ? 'Done' : 'Mark' }}</span>
        </button>
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
  transition:
    transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

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
    transition: box-shadow var(--dur-fast) var(--ease-standard);
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
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
  }

  &__stat-icon {
    font-size: 1.1rem;
    transition: text-shadow var(--dur-fast) var(--ease-standard);

    &--active {
      text-shadow: 0 0 8px rgba(255, 140, 40, 0.65);
    }
  }

  &__stat-value {
    font-weight: 600;
    font-size: 0.85rem;
  }

  &__stat-label {
    font-size: 0.65rem;
    opacity: 0.6;
  }

  &__quick-mark {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: rgb(var(--v-theme-primary));
    border-radius: 50%;
    transition: box-shadow var(--dur-fast) var(--ease-standard);
    box-shadow: var(--glow-primary);
    animation: pulse-glow var(--dur-slower) var(--ease-standard) infinite;
    padding: 0;

    &--done {
      animation: none;
      color: rgb(var(--v-theme-success));
      box-shadow: none;
    }
  }

  &__quick-mark-label {
    font-size: 0.65rem;
    opacity: 0.7;
  }
}
</style>
