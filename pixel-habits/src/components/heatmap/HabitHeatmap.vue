/** * Habit Heatmap Component — Three Grid Layouts * * Renders heatmap in one of three formats based
on habit.frequency: * * 1. DAILY (default): GitHub-style 52-week × 7-day grid * - Shows entire year
from Jan 1 to today * - Columns = weeks, rows = days (Sun-Sat) * - Includes month labels above for
reference * - Legend: grayscale intensity (0=empty → 5=darkest) * * 2. WEEKLY: Linear strip of 52
weeks * - One cell per week (Monday-based) * - Rendered as flex row with wrapping * - Shows count:
"X weeks this year" * * 3. MONTHLY: 12-cell grid (one per month) * - One cell per month * - Grid
layout with month abbreviations below * - Shows "January", "February", etc. * * Behavior: * - Each
cell is clickable (except future dates) * - Click emits 'cellClick' event with HeatmapCell data * -
Parent (HabitCard) listens and opens PixelDetailDialog * - Colors determined by HeatmapCell.tier
(0-5) and habit color (blend) * * No data mutations; purely presentational. */

<script setup lang="ts">
import { computed } from 'vue'
import { isSameMonth } from 'date-fns'
import { useHabitStore } from '@/stores/habit.store'
import { useHeatmap } from '@/composables/useHeatmap'
import HeatmapCell from './HeatmapCell.vue'
import type { Habit, HeatmapCell as HeatmapCellType } from '@/types'

const props = defineProps<{
  habit: Habit
}>()

const emit = defineEmits<{
  cellClick: [cell: HeatmapCellType]
}>()

const store = useHabitStore()
const habitEntries = computed(() => store.getEntriesForHabit(props.habit.id))
const habitFrequency = computed(() => props.habit.frequency)

const { dailyWeeks, monthLabels, weeklyCells, monthlyCells } = useHeatmap(
  habitFrequency,
  habitEntries,
)

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const LEGEND_TIERS = [1, 2, 3, 4, 5] as const

const monthStartWeeks = computed(
  () => new Set(monthLabels.value.filter((m) => m.column > 1).map((m) => m.column - 1)),
)

const weekMonthBoundaries = computed(() => {
  const cells = weeklyCells.value
  if (!cells || cells.length === 0) return []
  return cells.map((cell, i) => i > 0 && !isSameMonth(cell.date, cells[i - 1]!.date))
})

const weeklyMonthLabels = computed(() => {
  const cells = weeklyCells.value
  if (!cells) return []
  const labels: { name: string; index: number }[] = []
  let lastMonth = -1
  for (let i = 0; i < cells.length; i++) {
    const month = cells[i]!.date.getMonth()
    if (month !== lastMonth) {
      labels.push({ name: cells[i]!.label.slice(0, 3), index: i })
      lastMonth = month
    }
  }
  // Span = number of week-columns this month occupies, so the label can be centered over them
  return labels.map((label, i) => {
    const nextIndex = i < labels.length - 1 ? labels[i + 1]!.index : cells.length
    return { ...label, span: nextIndex - label.index }
  })
})

function onCellClick(cell: HeatmapCellType) {
  emit('cellClick', cell)
}
</script>

<template>
  <div class="habit-heatmap">
    <!-- ── DAILY: year grid ── -->
    <template v-if="habit.frequency === 'daily'">
      <div class="hm-scroll" role="grid" :aria-label="`${habit.name} heatmap`">
        <div class="hm-months-row">
          <div class="hm-day-spacer" aria-hidden="true" />
          <div class="hm-months" :style="{ '--wc': dailyWeeks.length }">
            <span
              v-for="m in monthLabels"
              :key="m.name"
              class="hm-month-label"
              :style="{ gridColumn: `${m.column} / span ${m.span}` }"
            >
              {{ m.name }}
            </span>
          </div>
        </div>
        <div class="hm-body">
          <div class="hm-day-labels" aria-hidden="true">
            <span v-for="(lbl, i) in DAY_LABELS" :key="i" class="hm-day-label">
              {{ i % 2 === 1 ? lbl : '' }}
            </span>
          </div>
          <div class="hm-grid">
            <div
              v-for="(week, wi) in dailyWeeks"
              :key="wi"
              class="hm-week"
              :class="{ 'hm-week--month-start': monthStartWeeks.has(wi) }"
            >
              <HeatmapCell
                v-for="(cell, di) in week"
                :key="di"
                :cell="cell"
                :habit-color="habit.color"
                :clickable="cell !== null"
                @click="onCellClick"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── WEEKLY: one cell per week ── -->
    <template v-else-if="habit.frequency === 'weekly'">
      <div class="hm-scroll" role="grid" :aria-label="`${habit.name} weekly heatmap`">
        <div class="hm-linear__months" :style="{ '--wc': weeklyCells.length }">
          <span
            v-for="m in weeklyMonthLabels"
            :key="`${m.index}-${m.name}`"
            class="hm-linear__month-label"
            :style="{ gridColumn: `${m.index + 1} / span ${m.span}` }"
          >
            {{ m.name }}
          </span>
        </div>
        <div class="hm-linear__cells">
          <span
            v-for="(cell, i) in weeklyCells"
            :key="cell.dateStr"
            class="hm-linear__item"
            :class="{ 'hm-linear__item--month-start': weekMonthBoundaries[i] }"
          >
            <HeatmapCell
              :cell="cell"
              :habit-color="habit.color"
              :size="13"
              clickable
              @click="onCellClick"
            />
          </span>
        </div>
        <div class="hm-linear__info">{{ weeklyCells.length }} weeks this year</div>
      </div>
    </template>

    <!-- ── MONTHLY: one cell per month ── -->
    <template v-else>
      <div class="hm-monthly" role="grid" :aria-label="`${habit.name} monthly heatmap`">
        <div v-for="cell in monthlyCells" :key="cell.dateStr" class="hm-monthly__col">
          <HeatmapCell
            :cell="cell"
            :habit-color="habit.color"
            :size="28"
            clickable
            @click="onCellClick"
          />
          <span class="hm-monthly__label">{{ cell.label.slice(0, 3) }}</span>
        </div>
      </div>
    </template>

    <!-- Legend -->
    <div class="hm-legend" aria-hidden="true">
      <span class="hm-legend__label">Less</span>
      <div class="hm-legend__cell hm-legend__cell--empty" />
      <div
        v-for="t in LEGEND_TIERS"
        :key="t"
        class="hm-legend__cell"
        :style="{
          '--hc': habit.color,
          backgroundColor: `color-mix(in srgb, var(--heatmap-0) ${(5 - t) * 20}%, var(--hc))`,
        }"
      />
      <span class="hm-legend__label">More</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.habit-heatmap {
  min-width: 0;
}

/* ──── DAILY ────────────────────────────────────────────────────────────── */
.hm-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.hm-months-row {
  display: flex;
  margin-bottom: 4px;
}

.hm-day-spacer {
  width: 28px;
  flex-shrink: 0;
}

.hm-months {
  display: grid;
  grid-template-columns: repeat(var(--wc), 12px);
}

.hm-month-label {
  font-size: 0.68rem;
  opacity: 0.65;
  white-space: nowrap;
  text-align: center;
}

.hm-body {
  display: flex;
  gap: 4px;
}

.hm-day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 24px;
  flex-shrink: 0;
}

.hm-day-label {
  height: 10px;
  font-size: 0.6rem;
  opacity: 0.55;
  line-height: 10px;
  text-align: right;
}

.hm-grid {
  display: flex;
  gap: 2px;
}

.hm-week {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;

  &--month-start::before {
    content: '';
    position: absolute;
    left: -3px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(var(--v-theme-on-surface), 0.15);
  }
}

/* ──── WEEKLY ─────────────────────────────────────────────────────────── */
.hm-linear {
  &__months {
    display: grid;
    grid-template-columns: repeat(var(--wc), 15px);
    margin-bottom: 4px;
  }

  &__month-label {
    font-size: 0.68rem;
    opacity: 0.65;
    white-space: nowrap;
    text-align: center;
  }

  &__cells {
    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
  }

  &__item {
    position: relative;

    &--month-start::before {
      content: '';
      position: absolute;
      left: -3px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(var(--v-theme-on-surface), 0.15);
    }
  }

  &__info {
    font-size: 0.68rem;
    opacity: 0.5;
    margin-top: 6px;
  }
}

/* ──── MONTHLY ────────────────────────────────────────────────────────── */
.hm-monthly {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;

  &__col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__label {
    font-size: 0.62rem;
    opacity: 0.6;
  }
}

/* ──── LEGEND ─────────────────────────────────────────────────────────── */
.hm-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 10px;
  justify-content: flex-end;

  &__label {
    font-size: 0.68rem;
    opacity: 0.6;
    margin: 0 2px;
  }

  &__cell {
    width: 10px;
    height: 10px;
    border-radius: 2px;

    &--empty {
      background-color: var(--heatmap-0);
    }
  }
}
</style>
