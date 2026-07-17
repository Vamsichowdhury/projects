<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, parseISO, endOfWeek } from 'date-fns'
import { useHabitStore } from '@/stores/habit.store'
import type { Habit, HabitEntry, HabitRating } from '@/types'

const props = defineProps<{
  habit: Habit | null
  dateStr: string | null
  existingEntry: HabitEntry | null
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useHabitStore()

const rating = ref<HabitRating>(3)
const description = ref('')
const saving = ref(false)

const isOpen = computed(() => props.habit !== null && props.dateStr !== null)

const displayLabel = computed(() => {
  if (!props.dateStr || !props.habit) return ''
  const d = parseISO(props.dateStr)
  if (props.habit.frequency === 'monthly') return format(d, 'MMMM yyyy')
  if (props.habit.frequency === 'weekly') {
    const end = endOfWeek(d, { weekStartsOn: 1 })
    return `${format(d, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  return format(d, 'MMM d, yyyy')
})

watch(
  () => [props.habit?.id, props.dateStr, props.existingEntry] as const,
  ([, , entry]) => {
    rating.value = entry?.rating ?? 3
    description.value = entry?.description ?? ''
  },
  { immediate: true },
)

async function save() {
  if (!props.habit || !props.dateStr) return
  saving.value = true
  await store.setEntry(props.habit.id, props.dateStr, rating.value, description.value)
  saving.value = false
  emit('close')
}

async function unmark() {
  if (!props.habit || !props.dateStr) return
  saving.value = true
  await store.removeEntry(props.habit.id, props.dateStr)
  saving.value = false
  emit('close')
}

function onDialogChange(value: boolean) {
  if (!value) emit('close')
}
</script>

<template>
  <v-dialog :model-value="isOpen" max-width="440" @update:model-value="onDialogChange">
    <v-card rounded="lg">
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
          variant="outlined"
          density="compact"
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
        <v-btn variant="flat" color="primary" :loading="saving" @click="save">Save</v-btn>
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
      color 0.1s,
      transform 0.1s;

    &--active {
      color: #f5a623;
    }

    &:hover {
      transform: scale(1.2);
      color: #f5a623;
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
}
</style>

