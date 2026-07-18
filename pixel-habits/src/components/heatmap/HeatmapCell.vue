<!--
  Heatmap Cell Component — Individual Pixel


  GitHub-style contribution square (default 10×10px).
  Displays:
  - Background color based on entry rating (0-5 tier)
  - Tooltip on hover: date + star rating (★★★☆☆)
  - Click handler: emits cell data to parent (HabitHeatmap → HabitCard → opens dialog) -->

<!-- Rendering:
  button element (not div) for proper semantics and keyboard support
  - Vuetify v-tooltip` for hover tooltips
  - Reset button defaults (padding, border, appearance) to match legend swatches
  - CSS `color-mix()` for theme-aware color blending
  - Light mode: inset border rgba(27,31,35,0.06)
  - Dark mode: inset border rgba(255,255,255,0.12) — stronger for contrast -->

<!-- Props:
  - cell: HeatmapCell (or null for spacer cells)
  - habitColor: hex color for blending (e.g., "#2196f3")
  - clickable: false for alignment nulls (not clickable)
  - size: custom pixel size (default 10px; weekly=13px, monthly=28px) -->

<!-- Color Formula:
  backgroundColor = color-mix(in srgb, var(--heatmap-0) ${emptyPct}%, var(--hc))
  - --heatmap-0: theme-aware empty cell color (light mode gray, dark mode dark gray)
  - var(--hc): habit color (user-selected, stored in Habit.color)
  - emptyPct: (5 - tier) * 20 = 0% (full color at tier 5) to 100% (empty at tier 0)
  Example: tier=3 → emptyPct=40 → 40% empty + 60% habit color = medium tone -->

<script setup lang="ts">
import { computed } from 'vue'
import type { HeatmapCell } from '@/types'

const props = defineProps<{
  cell: HeatmapCell | null // Null for alignment/padding cells (not rendered)
  habitColor: string // Hex color for blending (e.g., "#ff6b6b")
  clickable?: boolean // False for null cells; false = not interactive
  size?: number // Pixel size (default 10px)
}>()

const emit = defineEmits<{
  click: [cell: HeatmapCell] // Emits cell data when user clicks
}>()

/** Compute CSS size string (e.g., "10px" or "13px") */
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
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.06);
  transition: box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard);

  :global(.v-theme--dark) & {
    box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.12);
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

    &:hover,
    &:focus-visible {
      transform: scale(1.15);
      box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.4);
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: 2px;
    }
  }
}
</style>
