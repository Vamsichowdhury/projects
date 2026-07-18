# Codebase Map — Where Everything Lives

Quick reference: find code for any feature or concept.

---

## 📍 Feature → Code Mapping

### Create Habit
| Component | File | What It Does |
|-----------|------|--------------|
| Dialog UI | `src/components/dialogs/AddHabitDialog.vue` | UI: name, emoji, frequency, color inputs |
| Validation | `src/components/dialogs/AddHabitDialog.vue` L19-26 | Check name not empty, no duplicates |
| Store Action | `src/stores/habit.store.ts` L49-57 | `addHabit()` → calls Firebase `addDoc()` |
| Firebase | `src/firebase/firebase.ts` | `db` instance, Firestore init |
| Type | `src/types/index.ts` L4-11 | `Habit` interface definition |

### Edit Habit
| Component | File | What It Does |
|-----------|------|--------------|
| Dialog UI | `src/components/dialogs/EditHabitDialog.vue` | Pre-fill form, edit fields |
| Validation | `src/components/dialogs/EditHabitDialog.vue` L35-48 | Same as create (name, duplicates) |
| Store Action | `src/stores/habit.store.ts` L59-63 | `updateHabit()` → Firebase `updateDoc()` |
| Parent | `src/components/habits/HabitCard.vue` L27 | Passes `habit` to dialog via `v-model` |

### Delete Habit
| Component | File | What It Does |
|-----------|------|--------------|
| Confirmation Dialog | `src/components/dialogs/DeleteConfirmDialog.vue` | Show warning, confirm button |
| Store Action | `src/stores/habit.store.ts` L65-75 | Atomic batch: delete habit + all entries |
| Parent | `src/components/habits/HabitCard.vue` L40 | Handle confirm, call `store.deleteHabit()` |

### Heatmap (Daily/Weekly/Monthly)
| Component | File | What It Does |
|-----------|------|--------------|
| Heatmap Container | `src/components/heatmap/HabitHeatmap.vue` | Renders daily/weekly/monthly grid |
| Cell Component | `src/components/heatmap/HeatmapCell.vue` | Individual square; tooltip; click emit |
| Grid Logic | `src/composables/useHeatmap.ts` | `dailyWeeks[]`, `weeklyCells[]`, `monthlyCells[]` computation |
| Color Blending | `src/utils/colorUtils.ts` L18-25 | `tierToBackground()` → `color-mix()` |
| CSS Colors | `src/styles/variables.scss` L1-15 | `--heatmap-0` through `--heatmap-5` |
| Type | `src/types/index.ts` L20-28 | `HeatmapCell` interface |

### Mark Pixel (Set Rating/Notes)
| Component | File | What It Does |
|-----------|------|--------------|
| Pixel Dialog | `src/components/dialogs/PixelDetailDialog.vue` | 5-star rating + notes textarea |
| Star Selector | `src/components/dialogs/PixelDetailDialog.vue` L46-61 | Interactive stars, click to set rating |
| Store Action | `src/stores/habit.store.ts` L84-94 | `setEntry()` → addDoc or updateDoc |
| Parent | `src/components/habits/HabitCard.vue` L30-31 | Listen to cell click, open dialog |
| Firestore | `src/firebase/firebase.ts` | Uses `db` for `addDoc()`, `updateDoc()` |
| Type | `src/types/index.ts` L14-19 | `HabitEntry` interface |

### Unmark Pixel (Remove Entry)
| Component | File | What It Does |
|-----------|------|--------------|
| Unmark Button | `src/components/dialogs/PixelDetailDialog.vue` L74 | "Unmark" button (only if entry exists) |
| Store Action | `src/stores/habit.store.ts` L96-101 | `removeEntry()` → Firebase `deleteDoc()` |

### Streak Calculation
| Composable | File | What It Does |
|-----------|------|--------------|
| Streak Logic | `src/composables/useStreak.ts` | `currentStreak` and `longestStreak` computed |
| Daily Logic | `src/composables/useStreak.ts` L16-28 | Walk back from today, count consecutive days |
| Weekly Logic | `src/composables/useStreak.ts` L30-42 | Walk back from Monday, count weeks |
| Monthly Logic | `src/composables/useStreak.ts` L44-54 | Walk back from 1st, count months |
| Display | `src/components/habits/HabitCard.vue` L23 | Shows 🔥 current + 🏆 longest |

### Today's Progress
| Component | File | What It Does |
|-----------|------|--------------|
| Progress Card | `src/components/progress/TodayProgress.vue` | Progress bar + stats |
| Calculation | `src/stores/habit.store.ts` L30-46 | `todayCompleted`, `todayTotal`, `todayPercent` |
| Display | `src/components/progress/TodayProgress.vue` L12-27 | % bar, counts, stats |
| Condition | `src/views/HomeView.vue` L22 | Only shown if `store.dailyHabits.length > 0` |

### Theme Toggle
| Component | File | What It Does |
|-----------|------|--------------|
| Toggle Button | `src/components/theme/ThemeToggle.vue` | Icon button, calls `store.toggle()` |
| Store State | `src/stores/theme.store.ts` | `isDark` boolean, toggle action |
| Root Watcher | `src/App.vue` L8-13 | Watches `isDark` → updates Vuetify theme |
| CSS Colors | `src/styles/variables.scss` L7-15 | `.v-theme--dark` dark colors |

### Real-Time Firestore Sync
| File | What It Does |
|------|--------------|
| `src/stores/habit.store.ts` L18-24 | Two `onSnapshot()` listeners (habits + entries) |
| `src/stores/habit.store.ts` L25-28 | Error handler for listener failures |
| `src/firebase/firebase.ts` | Firebase app init, `db` export |
| `.env.local` | Firebase credentials (kept out of Git) |

---

## 🔍 Concept → Code Mapping

### Component Hierarchy / Rendering
| Concept | File | Details |
|---------|------|---------|
| Entry Point | `src/main.ts` | Creates Vue app, mounts to #app |
| Root Component | `src/App.vue` | Theme watcher, RouterView |
| Router | `src/router/index.ts` | Single route: HomeView |
| Home Page | `src/views/HomeView.vue` | Renders TodayProgress + HabitCard[] + FAB |
| Per-Habit Card | `src/components/habits/HabitCard.vue` | Heatmap + streaks + edit/delete buttons |
| Heatmap Grid | `src/components/heatmap/HabitHeatmap.vue` | Daily/weekly/monthly grid renderer |

### Data Structures & Types
| Concept | File | Definition |
|---------|------|------------|
| Habit Interface | `src/types/index.ts` L4-11 | `{ id, name, emoji, color, frequency, createdAt }` |
| HabitEntry Interface | `src/types/index.ts` L14-19 | `{ id, habitId, date, rating, description }` |
| HeatmapCell Interface | `src/types/index.ts` L21-28 | `{ date, dateStr, tier, entry, label, isFuture }` |
| HabitFrequency Type | `src/types/index.ts` L1 | `'daily' \| 'weekly' \| 'monthly'` |
| HabitRating Type | `src/types/index.ts` L2 | `1 \| 2 \| 3 \| 4 \| 5` |

### State Management (Pinia)
| Concept | File | Details |
|---------|------|---------|
| Habit Store | `src/stores/habit.store.ts` | Core state: habits, entries, CRUD, Firestore sync |
| Theme Store | `src/stores/theme.store.ts` | isDark toggle |
| Computed Properties | `src/stores/habit.store.ts` L30-46 | todayCompleted, todayTotal, todayPercent, dailyHabits |

### Business Logic (Composables)
| Concept | File | Exports |
|---------|------|---------|
| Heatmap Grid Gen | `src/composables/useHeatmap.ts` | `dailyWeeks`, `weeklyCells`, `monthlyCells`, `monthLabels` |
| Streak Calculation | `src/composables/useStreak.ts` | `currentStreak`, `longestStreak` |
| Habit CRUD Wrapper | `src/composables/useHabits.ts` | Convenience functions (optional usage) |

### Utilities
| Concept | File | Exports |
|---------|------|---------|
| Color Mapping | `src/utils/colorUtils.ts` | `HABIT_COLORS[]`, `tierToBackground()` |
| Date Helpers | `src/utils/dateUtils.ts` | `getTodayStr()`, `formatDisplayDate()`, `formatShortDate()` |

### UI Components (Reusable)
| Component | File | Purpose |
|-----------|------|---------|
| ColorPicker | `src/components/common/ColorPicker.vue` | 16-color swatch selector |
| EmptyState | `src/components/common/EmptyState.vue` | "No habits" message + CTA |
| ThemeToggle | `src/components/theme/ThemeToggle.vue` | Light/dark mode button |
| AppHeader | `src/components/layout/AppHeader.vue` | Top bar: greeting, today's date, theme toggle |

### Dialog Components (Modals)
| Dialog | File | Purpose |
|--------|------|---------|
| AddHabitDialog | `src/components/dialogs/AddHabitDialog.vue` | Create new habit |
| EditHabitDialog | `src/components/dialogs/EditHabitDialog.vue` | Edit habit name/emoji/color/frequency |
| DeleteConfirmDialog | `src/components/dialogs/DeleteConfirmDialog.vue` | Confirm deletion |
| PixelDetailDialog | `src/components/dialogs/PixelDetailDialog.vue` | Set/unmark pixel rating + notes |
| DayDetailDialog | `src/components/dialogs/DayDetailDialog.vue` | (Legacy stub — not actively used) |

### Styles & Theming
| Concept | File | Details |
|---------|------|---------|
| Global Styles | `src/styles/main.scss` | Reset, globals, box-sizing |
| CSS Variables | `src/styles/variables.scss` | Heatmap colors, theme-aware |
| Vuetify Theme | `src/main.ts` L11-41 | Light/dark theme config |
| Component Styles | `src/components/**/*.vue` | Scoped SCSS in `<style scoped>` |

### Firebase & Backend
| Concept | File | Details |
|---------|------|---------|
| Firebase Init | `src/firebase/firebase.ts` | `initializeApp()`, `getFirestore()` |
| Auth Exports | `src/firebase/auth.ts` | `getAuth()` (prepared for future use) |
| Config | `.env.local` | API keys, project ID, etc. |
| Collections | Firestore UI | `habits`, `entries` |

---

## 🎯 How to Find Code by Feature

### "I need to modify how pixels are colored"
1. Check color logic: `src/utils/colorUtils.ts` → `tierToBackground()`
2. Check theme colors: `src/styles/variables.scss` → `--heatmap-0` through `--heatmap-5`
3. Check cell rendering: `src/components/heatmap/HeatmapCell.vue` → `bgStyle` computed property
4. Check heatmap layout: `src/components/heatmap/HabitHeatmap.vue` → `<style>` section

### "I need to fix streak calculation"
1. Logic: `src/composables/useStreak.ts` → read entire file
2. Usage: search for `useStreak` imports (used in `HabitCard.vue`)
3. Display: `src/components/habits/HabitCard.vue` L23

### "I need to add a new field to habits"
1. Type definition: `src/types/index.ts` → add to `Habit` interface
2. Dialog form: `src/components/dialogs/AddHabitDialog.vue` or `EditHabitDialog.vue`
3. Store action: `src/stores/habit.store.ts` → update `addHabit()` and `updateHabit()` signatures
4. Firestore will auto-store it (no schema enforcement)

### "I need to debug why streak is wrong"
1. Check data: Open browser DevTools → Application → Firestore Emulator or Firestore Console
2. Check logic: `src/composables/useStreak.ts` → add console.log statements
3. Check source: Are entries being saved correctly? Check `PixelDetailDialog.vue` and `store.setEntry()`

### "I need to change how today's progress is calculated"
1. Store logic: `src/stores/habit.store.ts` L30-46 → `todayCompleted`, `todayTotal`, `todayPercent`
2. Display: `src/components/progress/TodayProgress.vue`
3. Condition: `src/views/HomeView.vue` L22 → only shown if daily habits

### "I need to add a new color or theme"
1. Light colors: `src/styles/variables.scss` L2-5 → add `--new-color`
2. Dark colors: `src/styles/variables.scss` L8-12 → add dark version
3. Vuetify theme: `src/main.ts` L11-41 → add to light/dark theme config

---

## 📚 Files by Lines of Code (LOC)

| File | LOC | Purpose |
|------|-----|---------|
| `src/stores/habit.store.ts` | ~120 | Core business logic |
| `src/composables/useHeatmap.ts` | ~160 | Grid generation |
| `src/components/heatmap/HabitHeatmap.vue` | ~200 | Heatmap rendering + styles |
| `src/components/habits/HabitCard.vue` | ~120 | Per-habit card layout |
| `src/styles/variables.scss` | ~20 | Theme colors |
| `src/types/index.ts` | ~30 | Type definitions |
| Other components | ~50-100 each | Dialogs, UI elements |

---

## 🔗 Import Paths (all use `@/` alias)

```typescript
// Common imports
import { useHabitStore } from '@/stores/habit.store'
import { useHeatmap } from '@/composables/useHeatmap'
import { useStreak } from '@/composables/useStreak'
import type { Habit, HabitEntry, HeatmapCell } from '@/types'
import { tierToBackground, HABIT_COLORS } from '@/utils/colorUtils'
import { format } from 'date-fns'
import { defineStore } from 'pinia'
```

---

## Next Steps

- For detailed feature explanations, see [FEATURES.md](./FEATURES.md)
- For step-by-step feature development, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
