<script setup lang="ts">
import { computed } from 'vue'
import type { HeatmapCell } from '@/types'

const props = defineProps<{
  cell: HeatmapCell | null
  habitColor: string
  clickable?: boolean
  size?: number
}>()

const emit = defineEmits<{
  click: [cell: HeatmapCell]
}>()

const cellSize = computed(() => `${props.size ?? 10}px`)

const bgStyle = computed(() => {
  if (!props.cell || props.cell.tier === 0) return {}
  // color-mix blends theme-aware empty color (--heatmap-0) with the habit color
  const emptyPct = (5 - props.cell.tier) * 20
  return {
    '--hc': props.habitColor,
    backgroundColor: `color-mix(in srgb, var(--heatmap-0) ${emptyPct}%, var(--hc))`,
  }
})

const tooltipText = computed(() => {
  if (!props.cell) return ''
  const base = props.cell.label
  if (!props.cell.entry) return base
  const filled = '\u2605'.repeat(props.cell.entry.rating)
  const empty = '\u2606'.repeat(5 - props.cell.entry.rating)
  return `${base}  ${filled}${empty}`
})

function handleClick() {
  if (props.cell) emit('click', props.cell)
}
</script>

<template>
  <v-tooltip v-if="cell" :text="tooltipText" location="top" :open-delay="150">
    <template #activator="{ props: tip }">
      <button
        v-bind="tip"
        :class="[
          'hm-cell',
          cell.tier === 0 ? 'hm-cell--empty' : 'hm-cell--filled',
          { 'hm-cell--clickable': clickable },
        ]"
        :style="[{ width: cellSize, height: cellSize }, bgStyle]"
        :aria-label="tooltipText"
        :tabindex="clickable ? 0 : -1"
        type="button"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick"
      />
    </template>
  </v-tooltip>
  <div
    v-else
    class="hm-cell hm-cell--blank"
    :style="{ width: cellSize, height: cellSize }"
    aria-hidden="true"
  />
</template>

<style scoped lang="scss">
.hm-cell {
  /* Reset button defaults so cells look identical to div legend swatches */
  padding: 0;
  border: none;
  appearance: none;
  display: block;

  border-radius: 2px;
  flex-shrink: 0;
  /* Subtle GitHub-style cell border */
  box-shadow: inset 0 0 0 1px rgba(27, 31, 35, 0.06);

  :global(.v-theme--dark) & {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  &--empty {
    background-color: var(--heatmap-0);
  }

  &--blank {
    background-color: transparent;
    box-shadow: none;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.4);
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: 2px;
    }
  }
}
</style>
