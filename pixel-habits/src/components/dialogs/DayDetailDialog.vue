<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'

const props = defineProps<{
  dateStr: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const isOpen = computed(() => props.dateStr !== null)

const displayDate = computed(() =>
  props.dateStr ? format(parseISO(props.dateStr), 'EEEE, MMMM d, yyyy') : '',
)

function onDialogChange(value: boolean) {
  if (!value) emit('close')
}
</script>

<template>
  <v-dialog :model-value="isOpen" max-width="480" @update:model-value="onDialogChange">
    <v-card rounded="lg">
      <v-card-title>{{ displayDate }}</v-card-title>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('close')">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
