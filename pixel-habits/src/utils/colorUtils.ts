/**
 * Preset habit colors — 16 colors from Material Design palette.
 * Users select one when creating a habit.
 * Used for heatmap cell blending, card badges, and legend swatches.
 * Colors are vibrant enough to distinguish while still readable in light and dark themes.
 */
export const HABIT_COLORS: string[] = [
  '#ef5350',  // Red
  '#e91e63',  // Pink
  '#9c27b0',  // Purple
  '#673ab7',  // Deep Purple
  '#3f51b5',  // Indigo
  '#2196f3',  // Blue
  '#03a9f4',  // Light Blue
  '#00bcd4',  // Cyan
  '#009688',  // Teal
  '#4caf50',  // Green (default)
  '#8bc34a',  // Light Green
  '#cddc39',  // Lime
  '#ffc107',  // Amber
  '#ff9800',  // Orange
  '#ff5722',  // Deep Orange
  '#795548',  // Brown
]

/**
 * Convert tier (0-5) and hex color to theme-aware RGB.
 *
 * Used for legend swatch colors (displayed as divs beneath daily heatmap).
 * Linearly interpolates from light-theme empty base color to the habit color.
 * Example:
 * - tier 0 → empty (not used; legend starts at 1)
 * - tier 1 → 20% habit color (very light)
 * - tier 3 → 60% habit color (medium)
 * - tier 5 → 100% habit color (full)
 *
 * Note: Heatmap cells use CSS `color-mix()` instead for automatic light/dark mode.
 * This function is only for legend swatches (static, light theme).
 *
 * @param tier - Intensity level (1-5); 0 returns empty string
 * @param habitColor - Hex color (e.g., "#2196f3")
 * @returns RGB color string (e.g., "rgb(100, 150, 200)")
 */
export function tierToBackground(tier: number, habitColor: string): string {
  if (tier <= 0) return ''  // Tier 0 (empty) has no color in legend

  // Map tier to blend ratio: tier 1 = 20%, tier 5 = 100%
  const ratios = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
  const ratio = ratios[tier] ?? 1.0  // Default to full color if out of range

  // Parse hex color to RGB components
  const hex = habitColor.replace('#', '')
  const r2 = Number.parseInt(hex.slice(0, 2), 16)  // Red channel
  const g2 = Number.parseInt(hex.slice(2, 4), 16)  // Green channel
  const b2 = Number.parseInt(hex.slice(4, 6), 16)  // Blue channel

  // Blend with light-theme empty base color (#ebedf0 = rgb(235, 237, 240))
  // Formula: blended = base * (1 - ratio) + habitColor * ratio
  // This creates smooth gradient from light gray to full habit color
  const r = Math.round(0xeb * (1 - ratio) + r2 * ratio)
  const g = Math.round(0xed * (1 - ratio) + g2 * ratio)
  const b = Math.round(0xf0 * (1 - ratio) + b2 * ratio)

  return `rgb(${r}, ${g}, ${b})`
}
