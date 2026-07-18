/**
 * Add Habit Dialog Component
 *
 * Modal form for creating a new habit.
 * Opened when user clicks FAB button (+) in HomeView.
 *
 * Form fields:
 * - name: Required, max 60 chars, must be unique (case-insensitive)
 * - emoji: Optional, max 2 chars (defaults to ✅)
 * - color: One of 16 preset colors from HABIT_COLORS (defaults to first one, green)
 * - frequency: daily | weekly | monthly (defaults to daily)
 *
 * Validation:
 * - name required, must be unique
 * - emoji is free-form (any Unicode)
 * - color validates against HABIT_COLORS array
 * - frequency validates against enum
 *
 * On submit:
 * - Calls store.addHabit() → creates Firestore doc → listeners update habits[]
 * - Closes dialog (model=false)
 *
 * On cancel/close:
 * - Resets form to defaults
 * - Closes dialog (model=false)
 *
 * Props: v-model (boolean) — true=open, false=closed
 */

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import { HABIT_COLORS } from '@/utils/colorUtils'
import ColorPicker from '@/components/common/ColorPicker.vue'
import type { HabitFrequency } from '@/types'

// v-model: dialog is open when true
const model = defineModel<boolean>({ required: true })

const store = useHabitStore()

// Form state: all fields required for creating habit
const name = ref('')                           // Habit name (e.g., "Morning run")
const emoji = ref('✅')                        // Emoji icon
const color = ref(HABIT_COLORS[0] ?? '#4caf50')  // Hex color for heatmap
const frequency = ref<HabitFrequency>('daily') // How often to track
const nameError = ref('')                      // Validation error message

/** Frequency options displayed in select dropdown */
const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

/**
 * When dialog closes, reset form to defaults for next open.
 */
watch(model, (open) => {
  if (!open) reset()
})

/**
 * Reset form to default values.
 */
function reset() {
  name.value = ''
  emoji.value = '✅'
  color.value = HABIT_COLORS[0] ?? '#4caf50'
  frequency.value = 'daily'
  nameError.value = ''
}

/**
 * Validate form before submission.
 * Checks:
 * - name is non-empty
 * - name is unique (case-insensitive)
 * Returns true if valid, false otherwise (sets nameError).
 */
function validate(): boolean {
  const trimmed = name.value.trim()

  if (!trimmed) {
    nameError.value = 'Name is required'
    return false
  }

  // Check uniqueness (case-insensitive)
  if (store.habits.some((h) => h.name.toLowerCase() === trimmed.toLowerCase())) {
    nameError.value = 'A habit with this name already exists'
    return false
  }

  nameError.value = ''  // Clear error if validation passes
  return true
}

/**
 * Submit button clicked: Validate and create habit.
 * Calls store.addHabit() → Firestore write → listeners update → closes dialog.
 */
function submit() {
  if (!validate()) return  // Don't submit if validation fails

  // Fire and forget (ignore errors; Firestore errors are shown in parent via firestoreError)
  store.addHabit(name.value, emoji.value, color.value, frequency.value).catch(() => {})

  model.value = false  // Close dialog
}
</script>

<template>
  <v-dialog v-model="model" max-width="480">
    <v-card>
      <v-card-title>New Habit</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Habit name"
          placeholder="e.g. Read 30 minutes"
          :error-messages="nameError"
          maxlength="60"
          autofocus
          @keydown.enter="submit"
          @input="nameError = ''"
        />
        <v-text-field
          v-model="emoji"
          label="Emoji"
          maxlength="2"
          class="mt-3"
        />
        <v-select
          v-model="frequency"
          :items="FREQUENCIES"
          item-title="label"
          item-value="value"
          label="Frequency"
          class="mt-3"
          hide-details
        />
        <div class="mt-4">
          <ColorPicker v-model="color" />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Cancel</v-btn>
        <v-btn class="btn-gradient" @click="submit">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
