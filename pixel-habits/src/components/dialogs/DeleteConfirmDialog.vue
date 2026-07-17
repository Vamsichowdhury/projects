<script setup lang="ts">
import type { Habit } from '@/types'

const props = defineProps<{
  habit: Habit | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onDialogChange(value: boolean) {
  if (!value) {
    emit('cancel')
  }
}
</script>

<template>
  <v-dialog
    :model-value="props.habit !== null"
    max-width="400"
    @update:model-value="onDialogChange"
  >
    <v-card rounded="lg">
      <v-card-title>Delete Habit</v-card-title>

      <v-card-text>
        Are you sure you want to delete
        <strong> {{ props.habit?.emoji }} {{ props.habit?.name }} </strong>
        ? This will remove all its tracking history.
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="emit('cancel')"> Cancel </v-btn>

        <v-btn color="error" variant="flat" @click="emit('confirm')"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
