<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import { HABIT_COLORS } from '@/utils/colorUtils'
import ColorPicker from '@/components/common/ColorPicker.vue'
import type { HabitFrequency } from '@/types'

const model = defineModel<boolean>({ required: true })

const store = useHabitStore()

const name = ref('')
const emoji = ref('✅')
const color = ref(HABIT_COLORS[0] ?? '#4caf50')
const frequency = ref<HabitFrequency>('daily')
const nameError = ref('')

const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

watch(model, (open) => {
  if (!open) reset()
})

function reset() {
  name.value = ''
  emoji.value = '✅'
  color.value = HABIT_COLORS[0] ?? '#4caf50'
  frequency.value = 'daily'
  nameError.value = ''
}

function validate(): boolean {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Name is required'
    return false
  }
  if (store.habits.some((h) => h.name.toLowerCase() === trimmed.toLowerCase())) {
    nameError.value = 'A habit with this name already exists'
    return false
  }
  nameError.value = ''
  return true
}

function submit() {
  if (!validate()) return
  store.addHabit(name.value, emoji.value, color.value, frequency.value).catch(() => {})
  model.value = false
}
</script>

<template>
  <v-dialog v-model="model" max-width="480">
    <v-card rounded="lg">
      <v-card-title>New Habit</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Habit name"
          placeholder="e.g. Read 30 minutes"
          :error-messages="nameError"
          maxlength="60"
          autofocus
          variant="outlined"
          density="compact"
          @keydown.enter="submit"
          @input="nameError = ''"
        />
        <v-text-field
          v-model="emoji"
          label="Emoji"
          maxlength="2"
          class="mt-3"
          variant="outlined"
          density="compact"
        />
        <v-select
          v-model="frequency"
          :items="FREQUENCIES"
          item-title="label"
          item-value="value"
          label="Frequency"
          class="mt-3"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div class="mt-4">
          <ColorPicker v-model="color" />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Cancel</v-btn>
        <v-btn variant="flat" color="primary" @click="submit">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
