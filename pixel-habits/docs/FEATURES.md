# Features — Detailed Breakdown

## 📋 Feature Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Pixel Habits Features                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Create Habits      → Name, emoji, frequency, color selection │
│ 2. Edit Habits        → Modify name, emoji, frequency, color    │
│ 3. Delete Habits      → Remove with confirmation                │
│ 4. Per-Habit Heatmap  → Daily/Weekly/Monthly contribution grid  │
│ 5. Mark Pixels        → Set 1-5 rating + optional notes         │
│ 6. Unmark Pixels      → Remove rating from past pixels          │
│ 7. Streak Tracking    → Current & longest streaks per habit     │
│ 8. Today's Progress   → Daily completion % bar (all daily)      │
│ 9. Theme Toggle       → Light/Dark mode with persistence        │
│ 10. Real-time Sync    → Firebase auto-saves all changes         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Create Habit

### User Flow
1. Click **[+]** FAB (Floating Action Button) or "Create Your First Habit" button
2. **AddHabitDialog** opens
3. Enter:
   - **Name** (required, trimmed, max 60 chars, unique)
   - **Emoji** (optional, max 2 chars)
   - **Frequency** (Daily / Weekly / Monthly)
   - **Color** (16 preset colors)
4. Click **Create** → Habit added to Firestore
5. Dialog closes; HabitCard appears on home page

### Technical Implementation

**Component**: `AddHabitDialog.vue`
```typescript
// User types name + selects frequency/color
// Validation: name not empty, no duplicates
// On "Create": store.addHabit(name, emoji, color, frequency)
```

**Store**: `habit.store.ts` → `addHabit()` action
```typescript
// Calls: addDoc(collection(db, 'habits'), {...})
// Firebase auto-generates ID, onSnapshot syncs state
```

**Firestore**: `habits` collection
```json
{
  "id": "1abc-2def-3ghi",
  "name": "Morning Run",
  "emoji": "🏃",
  "color": "#2196f3",
  "frequency": "daily",
  "createdAt": "2025-01-15T08:30:00.000Z"
}
```

---

## 2️⃣ Edit Habit

### User Flow
1. Open any HabitCard → Click **[✏️]** edit button
2. **EditHabitDialog** opens with pre-filled values
3. Change any field (name, emoji, frequency, color)
4. Click **Save** → Updated in Firestore
5. Dialog closes; HabitCard re-renders with new data

### Technical Implementation

**Component**: `EditHabitDialog.vue`
```typescript
// Props: v-model habit (Habit | null)
// On edit button click from HabitCard:
//   editTarget = habit  →  dialog opens
```

**Validation**:
- Name must not be empty or duplicate (except same habit)
- Frequency can change independently

**Store**: `habit.store.ts` → `updateHabit()` action
```typescript
// Calls: updateDoc(doc(db, 'habits', id), {...})
// onSnapshot triggers, habits[] updates, all watchers re-render
```

---

## 3️⃣ Delete Habit

### User Flow
1. Click **[🗑️]** delete button on HabitCard
2. **DeleteConfirmDialog** shows habit name and warning
3. Click **Delete** to confirm
4. Habit + ALL associated entries deleted from Firestore
5. Dialog closes; HabitCard disappears

### Technical Implementation

**Store**: `habit.store.ts` → `deleteHabit()` action
```typescript
const batch = writeBatch(db)
batch.delete(doc(db, 'habits', id))
for (const entry of entries where entry.habitId === id) {
  batch.delete(doc(db, 'entries', entry.id))
}
await batch.commit()  // Atomic: all-or-nothing
```

**Why Batch?** Ensures habit + all its entries are deleted atomically. If we deleted separately, app could crash mid-deletion and leave orphaned entries.

---

## 4️⃣ Per-Habit Heatmap

Each habit displays a GitHub-style contribution grid. The grid type depends on habit's `frequency`:

### Daily Heatmap (52 weeks × 7 days)

```
         Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
      ┌─────────────────────────────────────────────────────────────────────────┐
    S │ □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  │
    M │ □  □  □  □  □  □  □  □  █  █  █  █  █  █  █  █  █  ▓  ▓  ▓  ▒  ░  □  │
    T │ □  □  □  █  █  █  █  █  █  █  █  █  █  █  █  █  █  ▓  ▓  ▓  ▒  ░  □  │
    W │ □  □  □  █  █  █  █  █  █  █  █  █  █  █  █  █  █  ▓  ▓  ▓  ▒  ░  □  │
    T │ □  □  □  █  █  █  █  █  █  █  █  █  █  █  █  █  █  ▓  ▓  ▓  ▒  ░  □  │
    F │ □  □  □  █  █  █  █  █  █  █  █  █  █  █  █  █  █  ▓  ▓  ▓  ▒  ░  □  │
    S │ □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  □  │
      └─────────────────────────────────────────────────────────────────────────┘
        Legend: □=0  ░=1  ▒=2  ▓=3  █=4-5
```

**Components**:
- `HabitHeatmap.vue` — Renders the grid (uses `useHeatmap()` composable)
- `HeatmapCell.vue` — Individual 10×10px square with tooltip

**Color Logic**:
- Each pixel = one day of the current year
- Color = `color-mix(in srgb, emptyColor N%, habitColor)`
  - N% blends based on rating tier (1–5)
  - GitHub green → user's habit color
- Empty cells = light gray (theme-aware)
- Hover shows date + star rating (★★★☆☆)

### Weekly Heatmap (52 cells = 52 weeks)

```
┌─────────────────────────────────────────────────────────┐
│ ░ ▒ ▓ █ █ ▓ ▒ ░ ░ ▒ ▓ █ █ █ ▓ ▒ ░ ░ ▒ ▓ █ █ ▓ ...     │
│ 52 weeks of the year, one cell per Monday–Sunday week  │
└─────────────────────────────────────────────────────────┘
```

**Date Logic**: Week = Monday start (Monday is the date stored). Hover shows "Jan 13 – Jan 19, 2025".

### Monthly Heatmap (12 cells = 12 months)

```
┌──────────────────────────────────────┐
│ Jan  Feb  Mar  Apr  May  Jun         │
│  ░    ▒    ▓    █    █    ▓          │
│                                      │
│ Jul  Aug  Sep  Oct  Nov  Dec         │
│  ▒    ░    ░    ▒    ▓    █          │
└──────────────────────────────────────┘
```

**Date Logic**: Month = 1st of month. Hover shows "January 2025".

### Technical Implementation

**Composable**: `useHeatmap.ts`
```typescript
// Takes: frequency (Ref), entries (Ref)
// Returns: dailyWeeks[], weeklyCells[], monthlyCells[]

// For daily:
//   - Generate all days from Jan 1 to today
//   - Group into 7-day columns (weeks)
//   - Compute tier for each based on entry rating

// For weekly:
//   - Generate week-start dates (Mondays)
//   - One cell per week from Jan 1 to today
//   - Compute tier based on entry for that Monday

// For monthly:
//   - Generate 1st of each month
//   - One cell per month (Jan–Dec)
//   - Compute tier based on entry for the 1st
```

**Color Computation** (`colorUtils.ts`):
```typescript
tierToBackground(tier: number, habitColor: string): string
  // tier 0 = empty color (--heatmap-0)
  // tier 1-5 = blend from empty to habit color
  // Uses: color-mix(in srgb, empty N%, habit)
  // Returns: CSS color string
```

---

## 5️⃣ Mark Pixel (Set Rating & Notes)

### User Flow
1. Click any pixel in heatmap
2. **PixelDetailDialog** opens showing:
   - Habit name + emoji
   - Date/week/month label
   - 5-star rating selector
   - Notes textarea (optional, max 500 chars)
3. Set rating (1–5 stars)
4. Add optional notes
5. Click **Save**
6. Entry created/updated in Firestore
7. Dialog closes; heatmap cell color updates immediately

### Technical Implementation

**Component**: `PixelDetailDialog.vue`
```typescript
// Props: habit, dateStr, existingEntry
// State: rating (1-5), description (string)
// On mount/dateStr change: load existing entry or default to 3 stars
```

**Store Action**: `store.setEntry(habitId, dateStr, rating, description)`
```typescript
// Check if entry exists for this (habitId, dateStr) pair
if (existing) {
  updateDoc(doc(db, 'entries', existing.id), { rating, description })
} else {
  addDoc(collection(db, 'entries'), { habitId, dateStr, rating, description })
}
// onSnapshot fires → entries[] updates → heatmap re-renders
```

**Firestore Schema**:
```json
{
  "id": "auto-generated",
  "habitId": "1abc-2def-3ghi",
  "date": "2025-01-15",
  "rating": 4,
  "description": "Ran 5 miles in 45 minutes"
}
```

---

## 6️⃣ Unmark Pixel (Remove Entry)

### User Flow
1. Click a pixel that has an entry (filled color)
2. PixelDetailDialog opens
3. Click **Unmark** button
4. Entry deleted from Firestore
5. Dialog closes; pixel reverts to empty color

### Technical Implementation

**Store Action**: `store.removeEntry(habitId, dateStr)`
```typescript
const existing = entries.find(e => e.habitId === habitId && e.date === dateStr)
if (existing) {
  deleteDoc(doc(db, 'entries', existing.id))
}
```

---

## 7️⃣ Streak Tracking

Each `HabitCard` displays:
- **🔥 Current Streak** — How many consecutive periods (days/weeks/months) with an entry
- **🏆 Longest Streak** — Max consecutive periods ever recorded

### Calculation Logic

**Composable**: `useStreak.ts`
```typescript
// useStreak(entries: Ref<HabitEntry[]>, frequency: Ref<HabitFrequency>)

// Daily:
//   Start from today (or yesterday if today empty)
//   Walk backward counting consecutive days with entries
//   Stop at first gap
//   → currentStreak

// Weekly:
//   Start from this week's Monday
//   Walk backward counting weeks with entries
//   → currentStreak

// Monthly:
//   Start from this month's 1st
//   Walk backward counting months with entries
//   → currentStreak

// longestStreak: scan all entries, find longest gap-free sequence
```

### Example: Daily Habit

```
Days:    Jan 10  Jan 11  Jan 12  Jan 13  Jan 14  Jan 15 (today)
Entries:   ✓       ✓      (gap)    ✓       ✓       ✓
                    ↑                      ↑
             2-day streak            3-day streak (CURRENT)
```

---

## 8️⃣ Today's Progress

**Component**: `TodayProgress.vue` (only shown if any daily habits exist)

Displays a progress bar showing:
- **Completed**: Number of daily habits with entry today
- **Remaining**: Total daily − completed
- **Percentage**: (completed / total) × 100

**Calculation** (in `habit.store.ts`):
```typescript
todayStr = format(new Date(), 'yyyy-MM-dd')
todayCompleted = dailyHabits.filter(h => 
  entries.some(e => e.habitId === h.id && e.date === todayStr)
).length
todayTotal = dailyHabits.length
todayPercent = (todayCompleted / todayTotal) * 100
```

---

## 9️⃣ Theme Toggle

**Component**: `ThemeToggle.vue` (in AppHeader)

- Click **[☀️/🌙]** button
- `theme.store.toggle()` inverts `isDark` boolean
- **App.vue** watches `isDark` → updates Vuetify theme name
- CSS custom properties (`--heatmap-0` etc.) switch to dark colors
- Entire UI re-renders with dark color scheme

**Persistence** (in `theme.store.ts`):
- Theme preference NOT stored (intentionally — use user's OS preference)
- But can add localStorage in future if needed

---

## 🔟 Real-Time Sync with Firebase

All state changes auto-sync to Firestore with no user action.

### Architecture

```
User Action
    ↓
Component calls store method (e.g., store.setEntry())
    ↓
Store calls Firebase API (updateDoc, addDoc, deleteDoc)
    ↓
Firestore persists change
    ↓
Firestore's onSnapshot() listener fires (in store)
    ↓
Store's reactive refs update (habits, entries)
    ↓
All components watching those refs re-compute
    ↓
UI updates automatically (no manual re-render needed)
```

### Offline Behavior

Currently: App requires Firestore connection. If offline:
- Reads fail → loading stays true → loading spinner shown
- Writes fail → error shown in console (can add toast in future)

**Future Enhancement**: Use Firestore offline persistence (`enableIndexedDbPersistence`) to cache data locally and queue writes.

---

## 🎯 Edge Cases & Behaviors

### What happens if I delete a habit?
- Habit doc deleted
- ALL entries for that habit deleted (batched atomically)
- HabitCard disappears immediately
- Cannot be undone (so confirmation dialog)

### What if I change a habit's frequency?
- Old heatmap grid disappears
- New frequency grid appears
- All existing entries stay (date format doesn't change)
- Streaks recalculate based on new frequency

### Can I have duplicate habit names?
- No — validation rejects it
- Error message: "A habit with this name already exists"

### What if I mark the same pixel twice?
- First time: creates entry with rating 1-5
- Click again: PixelDetailDialog opens with existing data
- Change rating/notes → **Save** updates (not duplicate)
- Update is atomic (not deleted + re-added)

### Can I mark future dates?
- No — heatmap only shows dates up to today
- Future pixels are hidden/non-clickable

---

## Next Steps

- See [CODEBASE_MAP.md](./CODEBASE_MAP.md) to find code for each feature
- See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) to add new features
