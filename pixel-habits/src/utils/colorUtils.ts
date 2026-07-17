export const HABIT_COLORS: string[] = [
  '#ef5350',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
]

/** Converts a tier (1-5) and a hex habitColor to a blended rgb() string.
 *  Blends linearly between the light-theme empty cell base (#ebedf0) and the full habit color.
 *  Used for legend swatches; heatmap cells use CSS color-mix() for theme awareness.
 */
export function tierToBackground(tier: number, habitColor: string): string {
  if (tier <= 0) return ''
  const ratios = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
  const ratio = ratios[tier] ?? 1.0
  const hex = habitColor.replace('#', '')
  const r2 = Number.parseInt(hex.slice(0, 2), 16)
  const g2 = Number.parseInt(hex.slice(2, 4), 16)
  const b2 = Number.parseInt(hex.slice(4, 6), 16)
  // Blend with light-theme empty base: #ebedf0
  const r = Math.round(0xeb * (1 - ratio) + r2 * ratio)
  const g = Math.round(0xed * (1 - ratio) + g2 * ratio)
  const b = Math.round(0xf0 * (1 - ratio) + b2 * ratio)
  return `rgb(${r}, ${g}, ${b})`
}
