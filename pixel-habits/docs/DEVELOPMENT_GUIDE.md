# Development Guide — Adding Features & Common Tasks

Step-by-step instructions for developers/AI agents to add features, debug, and maintain the codebase.

---

## 🛠️ Development Workflow

### Local Setup

```bash
# Clone / open project
cd pixel-habits

# Install dependencies
npm install

# Create .env.local with Firebase credentials
cp .env.example .env.local
# Edit .env.local with your Firebase project values

# Start dev server
npm run dev
# Open http://localhost:5173 in browser

# Run type-checking
npm run type-check

# Run linting & formatting
npm run lint
npm run format
```

### Build & Deploy

```bash
# Type-check and build
npm run build

# Preview production build locally
npm run preview

# Deploy to Firebase Hosting (if configured)
firebase deploy --only hosting
```

---

## 🎨 Adding a New Feature

### Example: Add "Habit Goals" (target completion count per period)

**Step 1: Update Type Definition**

File: `src/types/index.ts`

```typescript
interface Habit {
  // ... existing fields ...
  goal?: number  // e.g., "complete 5 days per week"
}
```

**Step 2: Update Store**

File: `src/stores/habit.store.ts`

```typescript
async function addHabit(
  name: string,
  emoji: string,
  color: string,
  frequency: HabitFrequency,
  goal?: number  // NEW
): Promise<void> {
  await addDoc(collection(db, 'habits'), {
    name: name.trim(),
    emoji,
    color,
    frequency,
    goal,  // NEW
    createdAt: new Date().toISOString(),
  })
}

async function updateHabit(
  id: string,
  name: string,
  emoji: string,
  color: string,
  frequency: HabitFrequency,
  goal?: number  // NEW
): Promise<void> {
  await updateDoc(doc(db, 'habits', id), {
    name: name.trim(),
    emoji,
    color,
    frequency,
    goal,  // NEW
  })
}
```

**Step 3: Update Add/Edit Dialogs**

File: `src/components/dialogs/AddHabitDialog.vue`

```vue
<script setup>
  const goal = ref<number | undefined>()  // NEW
</script>

<template>
  <v-text-field
    v-model.number="goal"
    label="Weekly goal (optional)"
    type="number"
    min="1"
    max="7"
    hint="Target completions per week"
  />
  <v-btn @click="submit">
    <!-- submit now passes goal -->
    void store.addHabit(name.value, emoji.value, color.value, frequency.value, goal.value)
  </v-btn>
</template>
```

Repeat for `EditHabitDialog.vue`.

**Step 4: Add Display Component**

File: `src/components/habits/HabitGoal.vue` (NEW)

```vue
<script setup lang="ts">
  import type { Habit } from '@/types'

  defineProps<{
    habit: Habit
    completed: number  // count for this period
  }>()
</script>

<template>
  <div v-if="habit.goal" class="habit-goal">
    <v-progress-linear
      :model-value="(completed / habit.goal) * 100"
      :max="100"
    />
    <small>{{ completed }} / {{ habit.goal }}</small>
  </div>
</template>
```

**Step 5: Use in HabitCard**

File: `src/components/habits/HabitCard.vue`

```vue
<script setup>
  import HabitGoal from '@/components/habits/HabitGoal.vue'
</script>

<template>
  <HabitGoal :habit="habit" :completed="todayCompleted" />
</template>
```

**Step 6: Test**

```bash
npm run dev
# Create new habit with goal
# Verify it displays
# Edit habit, change goal
# Delete habit
```

**Step 7: Type-check**

```bash
npm run type-check
# Should have zero errors
```

---

## 🐛 Debugging

### View Component State (Vue DevTools)

1. Install [Vue DevTools](https://devtools.vuejs.org/)
2. Open browser DevTools → **Vue** tab
3. Inspect any component → see `data`, `props`, `emits`
4. Modify state in real-time to test

### View Pinia Store

Same DevTools:
1. Open browser DevTools → **Vue** tab
2. Look for **Pinia** section
3. Expand `habit` store → see reactive state
4. Modify and test

### View Firestore

1. Firebase Console → **Firestore Database**
2. Click on collections → see documents in real-time
3. Add/edit/delete manually to test app's response

### Add Logging

```typescript
// In any composable or store
console.log('DEBUG: currentStreak =', currentStreak.value)
console.log('DEBUG: entries =', entries.value)

// Remove before committing!
```

### Browser DevTools Console

```javascript
// In console tab:

// Check store state
$pinia.state  // See all store data

// Check entries
$pinia.state.value.habits._state.value.entries

// Manually call store method
$pinia.state.value.habits.addHabit('Test', '✅', '#4caf50', 'daily')
```

---

## 🔄 Modifying Existing Features

### Example: Change Heatmap Cell Size from 10px to 12px

**Step 1: Find Usage**

File: `src/components/heatmap/HeatmapCell.vue`

```typescript
const cellSize = computed(() => `${props.size ?? 10}px`)
// Change 10 to 12
```

**Step 2: Check Default Size**

File: `src/components/heatmap/HabitHeatmap.vue`

```vue
<HeatmapCell
  v-for="(cell, di) in week"
  :key="di"
  :cell="cell"
  :habit-color="habit.color"
  :clickable="cell !== null"
  <!-- no :size prop → uses default 12px (from above) -->
/>
```

**Step 3: Test**

```bash
npm run dev
# Heatmap cells should be larger
```

### Example: Add Tooltip to HeatmapCell

The Vuetify `<v-tooltip>` component is already used. To customize:

```vue
<!-- Current (in HeatmapCell.vue) -->
<v-tooltip v-if="cell" :text="tooltipText" location="top" :open-delay="150">
  <!-- Change location to 'bottom' -->
  <!-- Change :open-delay to '0' for instant -->
</v-tooltip>
```

---

## 📦 Adding Dependencies

### Add NPM Package

```bash
npm install some-new-package
npm install --save-dev some-dev-package
```

### Import & Use

```typescript
// src/composables/something.ts
import { someFunction } from 'some-new-package'

export function useMyComposable() {
  const result = someFunction()
  return { result }
}
```

### Type Safety

If package lacks TypeScript types:

```bash
npm install --save-dev @types/some-new-package
```

If no types available:

```typescript
// Declare types
declare module 'some-new-package' {
  export function someFunction(): string
}
```

---

## 🎯 Common Tasks

### Task: Add a New Page / Route

Currently single-page. To add:

**Step 1: Create View**

```typescript
// src/views/HabitsListView.vue
<script setup lang="ts">
  import { useHabitStore } from '@/stores/habit.store'
  
  const store = useHabitStore()
</script>

<template>
  <v-container>
    <h1>All Habits</h1>
    <v-list>
      <v-list-item v-for="habit in store.habits" :key="habit.id">
        {{ habit.name }}
      </v-list-item>
    </v-list>
  </v-container>
</template>
```

**Step 2: Add Route**

File: `src/router/index.ts`

```typescript
{
  path: '/habits',
  name: 'habits',
  component: () => import('../views/HabitsListView.vue')
}
```

**Step 3: Link in UI**

```vue
<router-link to="/habits">View All</router-link>
```

### Task: Add a New Color to Palette

File: `src/utils/colorUtils.ts`

```typescript
export const HABIT_COLORS: string[] = [
  // ... existing colors ...
  '#e8a0bf',  // Add new rose color
]
```

File: `src/components/common/ColorPicker.vue` will automatically show it.

### Task: Change Dark Mode Colors

File: `src/styles/variables.scss`

```scss
.v-theme--dark {
  --heatmap-0: #21262d;  // Change empty cell color
  --heatmap-1: #0e4429;
  --heatmap-2: #006d32;
  // ... etc
}
```

### Task: Add Keyboard Shortcut

```typescript
// In any component's <script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'n' && e.ctrlKey) {
      showAddDialog.value = true
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
```

### Task: Persist Additional Data to Firestore

Use the existing Firebase structure. For example, if you want to store user preferences:

```typescript
// Create a new collection "userPreferences" 
// Or add fields to existing "habits" docs

// Store Action
async function updateHabitPreferences(habitId: string, preferences: any) {
  await updateDoc(doc(db, 'habits', habitId), {
    preferences  // Firebase stores nested objects
  })
}
```

---

## ✅ Code Quality Checklist

Before submitting changes:

- [ ] **Type Safety**: `npm run type-check` passes (zero errors)
- [ ] **Linting**: `npm run lint` passes
- [ ] **No Console Logs**: Remove all `console.log()` (except errors)
- [ ] **No TODO Comments**: Finish or create issue
- [ ] **Prop Validation**: All `defineProps` are typed
- [ ] **Emit Validation**: All `defineEmits` are typed
- [ ] **Accessibility**: Add `:aria-label` to buttons, form fields
- [ ] **Responsive**: Test on mobile (DevTools device emulation)
- [ ] **Dark Mode**: Test in both light and dark themes
- [ ] **Async/Await**: All async calls awaited (no dangling promises)
- [ ] **No Dead Code**: Remove unused imports/variables
- [ ] **Comments**: Add comments to complex logic

---

## 🚨 Common Mistakes

### ❌ Forgetting to Await Async Store Actions

```typescript
// WRONG
store.addHabit(name, emoji, color, frequency)
showDialog.value = false  // Closes before save completes

// RIGHT
await store.addHabit(name, emoji, color, frequency)
showDialog.value = false  // Closes after save completes
```

### ❌ Mutating State Directly (instead of via store)

```typescript
// WRONG
store.habits.push({ ... })  // Bypasses Firestore

// RIGHT
await store.addHabit(name, emoji, color, frequency)  // Goes through store
```

### ❌ Not Handling Firestore Errors

```typescript
// WRONG
await store.addHabit(name, emoji, color, frequency)
// If Firestore fails, error is silent

// RIGHT
try {
  await store.addHabit(name, emoji, color, frequency)
} catch (err) {
  console.error('Failed to add habit:', err)
  // Show error toast to user
}
```

### ❌ Missing v-model Two-Way Binding

```vue
<!-- WRONG: Dialog won't close on Cancel -->
<EditHabitDialog :habit="editTarget" />

<!-- RIGHT: Dialog opens/closes based on editTarget -->
<EditHabitDialog v-model="editTarget" />
```

### ❌ Comparing Dates as Strings Incorrectly

```typescript
// WRONG
const isSameDay = dateA === dateB  // Fails if dates are Date objects

// RIGHT
import { isSameDay as isSameDayFn } from 'date-fns'
const isSame = isSameDayFn(dateA, dateB)

// Or string comparison (if both are YYYY-MM-DD)
const isSame = dateA === dateB
```

---

## 📝 Inline Comments Best Practices

**Add comments for**:
- Complex algorithms (e.g., streak calculation)
- Non-obvious business logic
- Firestore operations (why batched, etc.)
- Edge cases and workarounds

**Avoid comments for**:
- Obvious code: `const x = 5  // Set x to 5` ← useless
- Self-documenting code: Well-named variables/functions

Example:

```typescript
// GOOD: Explains WHY
const batch = writeBatch(db)
// Delete habit and all entries atomically to avoid orphaned data
batch.delete(doc(db, 'habits', id))
for (const entry of entries) {
  batch.delete(doc(db, 'entries', entry.id))
}

// BAD: Explains WHAT (already obvious)
const batch = writeBatch(db)  // Create batch
batch.delete(...)  // Delete habit
```

---

## 🎓 Learning Resources

- **Vue 3 Docs**: https://vuejs.org/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Pinia Docs**: https://pinia.vuejs.org/
- **Vuetify Docs**: https://vuetifyjs.com/
- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **date-fns Docs**: https://date-fns.org/

---

## Next Steps

- For feature descriptions, see [FEATURES.md](./FEATURES.md)
- For code locations, see [CODEBASE_MAP.md](./CODEBASE_MAP.md)
- For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
