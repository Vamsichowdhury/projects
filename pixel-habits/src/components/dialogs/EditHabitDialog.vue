<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import ColorPicker from '@/components/common/ColorPicker.vue'
import type { Habit, HabitFrequency } from '@/types'

const model = defineModel<Habit | null>({ required: true })

const store = useHabitStore()

const name = ref('')
const emoji = ref('')
const color = ref('')
const frequency = ref<HabitFrequency>('daily')
const nameError = ref('')

const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

watch(
  model,
  (habit) => {
    if (habit) {
      name.value = habit.name
      emoji.value = habit.emoji
      color.value = habit.color
      frequency.value = habit.frequency
      nameError.value = ''
    }
  },
  { immediate: true },
)

function validate(): boolean {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Name is required'
    return false
  }
  if (
    store.habits.some(
      (h) => h.name.toLowerCase() === trimmed.toLowerCase() && h.id !== model.value?.id,
    )
  ) {
    nameError.value = 'A habit with this name already exists'
    return false
  }
  nameError.value = ''
  return true
}

function onDialogChange(value: boolean) {
  if (!value) model.value = null
}

function submit() {
  if (!model.value || !validate()) return
  store.updateHabit(model.value.id, name.value, emoji.value, color.value, frequency.value).catch(() => {})
  model.value = null
}
</script>

<template>
  <v-dialog :model-value="model !== null" max-width="480" @update:model-value="onDialogChange">
    <v-card>
      <v-card-title>Edit Habit</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Habit name"
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
        <div class="mt-4">
          <ColorPicker v-model="color" />
        </div>
        <v-select
          v-model="frequency"
          :items="FREQUENCIES"
          item-title="label"
          item-value="value"
          label="Frequency"
          class="mt-3"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = null">Cancel</v-btn>
        <v-btn class="btn-gradient" @click="submit">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
