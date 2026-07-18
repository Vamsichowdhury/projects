/**
 * Pixel Detail Dialog Component
 *
 * Modal for marking/unmarking heatmap pixels with rating + notes.
 * Opened when user clicks a heatmap cell (HeatmapCell → HabitCard parent).
 *
 * Functionality:
 * - Display date (formatted per frequency: "Jan 15, 2025" for daily, "Jan 8 - Jan 14" for weekly, "January 2025" for monthly)
 * - 5-star rating selector (1-5, default 3)
 * - Textarea for optional notes (max 500 chars)
 * - Save button: calls store.setEntry() (creates new or updates existing)
 * - Unmark button: calls store.removeEntry() (only shown if entry already exists)
 *
 * Dialog opens when habit && dateStr are both non-null (set by parent HabitCard).
 * Dialog closes on: Cancel button, close button (X), or successful save/unmark.
 *
 * Props:
 * - habit: The habit being marked (null when dialog closed)
 * - dateStr: YYYY-MM-DD date identifier (null when dialog closed)
 * - existingEntry: HabitEntry if user marked this before (pre-fills form); null if new
 *
 * Emits:
 * - close: Dialog should close (parent sets habit=null & dateStr=null to close)
 */

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, parseISO, endOfWeek } from 'date-fns'
import { useHabitStore } from '@/stores/habit.store'
import type { Habit, HabitEntry, HabitRating } from '@/types'

const props = defineProps<{
  habit: Habit | null           // Set by parent when pixel clicked; null when dialog should close
  dateStr: string | null        // YYYY-MM-DD identifier; null when dialog should close
  existingEntry: HabitEntry | null  // Pre-filled values if user already marked this pixel
}>()

const emit = defineEmits<{
  close: []  // Emitted when user clicks Cancel or successfully saves/unmarked
}>()

const store = useHabitStore()

// Form state: rating (1-5) and notes
const rating = ref<HabitRating>(3)         // Default rating if no existing entry
const description = ref('')                // Optional notes (max 500 chars)
const saving = ref(false)                  // Show loading spinner while saving to Firestore

/** Dialog is open iff both habit and dateStr are provided by parent */
const isOpen = computed(() => props.habit !== null && props.dateStr !== null)

/**
 * Format date label based on frequency.
 * - daily: "Jan 15, 2025"
 * - weekly: "Jan 8 – Jan 14, 2025" (shows full week range)
 * - monthly: "January 2025"
 */
const displayLabel = computed(() => {
  if (!props.dateStr || !props.habit) return ''
  const d = parseISO(props.dateStr)
  if (props.habit.frequency === 'monthly') {
    return format(d, 'MMMM yyyy')
  }
  if (props.habit.frequency === 'weekly') {
    const end = endOfWeek(d, { weekStartsOn: 1 })
    return `${format(d, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  return format(d, 'MMM d, yyyy')
})

/**
 * When dialog opens (habit/dateStr change) or existing entry changes,
 * pre-fill form with existing values or reset to defaults.
 */
watch(
  () => [props.habit?.id, props.dateStr, props.existingEntry] as const,
  ([, , entry]) => {
    // Pre-fill with existing entry data, or use defaults
    rating.value = entry?.rating ?? 3
    description.value = entry?.description ?? ''
  },
  { immediate: true },  // Run immediately when component mounts
)

/**
 * Save button clicked: Create or update entry with rating + notes.
 * Shows spinner while Firestore write is in progress.
 */
async function save() {
  if (!props.habit || !props.dateStr) return
  saving.value = true
  try {
    await store.setEntry(props.habit.id, props.dateStr, rating.value, description.value)
  } finally {
    saving.value = false
  }
  emit('close')  // Dialog closes; parent will set habit=null & dateStr=null
}

/**
 * Unmark button clicked: Delete entry for this pixel.
 * Removes rating and notes; pixel becomes empty (tier 0).
 */
async function unmark() {
  if (!props.habit || !props.dateStr) return
  saving.value = true
  try {
    await store.removeEntry(props.habit.id, props.dateStr)
  } finally {
    saving.value = false
  }
  emit('close')  // Dialog closes
}

/**
 * Dialog backdrop or cancel button clicked.
 * If value=false, user is closing the dialog → emit close.
 */
function onDialogChange(value: boolean) {
  if (!value) emit('close')
}
</script>

<template>
  <v-dialog :model-value="isOpen" max-width="440" @update:model-value="onDialogChange">
    <v-card>
      <v-card-title class="pixel-dialog__title">
        <span v-if="habit">{{ habit.emoji }} {{ habit.name }}</span>
      </v-card-title>
      <v-card-subtitle class="pb-0">{{ displayLabel }}</v-card-subtitle>

      <v-card-text>
        <div class="pixel-dialog__rating-label">Rating</div>
        <div class="pixel-dialog__stars" role="radiogroup" aria-label="Rating 1 to 5">
          <button
            v-for="n in 5"
            :key="n"
            :class="['pixel-dialog__star', { 'pixel-dialog__star--active': n <= rating }]"
            :aria-label="`${n} star${n > 1 ? 's' : ''}`"
            :aria-pressed="n === rating"
            type="button"
            @click="rating = n as HabitRating"
          >
            ★
          </button>
        </div>

        <v-textarea
          v-model="description"
          label="Notes (optional)"
          rows="3"
          class="mt-4"
          maxlength="500"
          auto-grow
          hide-details
        />
      </v-card-text>

      <v-card-actions>
        <v-btn
          v-if="existingEntry"
          color="error"
          variant="text"
          :loading="saving"
          @click="unmark"
        >
          Unmark
        </v-btn>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('close')">Cancel</v-btn>
        <v-btn class="btn-gradient" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.pixel-dialog {
  &__title {
    font-size: 1rem;
    font-weight: 600;
  }

  &__rating-label {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 8px;
  }

  &__stars {
    display: flex;
    gap: 4px;
  }

  &__star {
    font-size: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    color: rgba(var(--v-theme-on-surface), 0.2);
    transition:
      color var(--dur-fast) var(--ease-standard),
      transform var(--dur-fast) var(--ease-standard);

    &--active {
      color: var(--color-star);
    }

    &:hover {
      transform: scale(1.2);
      color: var(--color-star);
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
}
</style>

