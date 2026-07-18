# Architecture & System Design

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Pixel Habits App                          │
│                   (Vue 3 SPA / Vite)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐   ┌─────────────┐  │
│  │   HomeView   │      │ Per-Habit    │   │   Header    │  │
│  │   (Router)   │──→   │ Components   │   │  + Theme    │  │
│  └──────────────┘      │  (HabitCard) │   └─────────────┘  │
│                        └──────────────┘                     │
│                               ↓                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Pinia State Management                    │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  auth.store.ts (Authentication)                │ │   │
│  │  │  • user (currentUser)                          │ │   │
│  │  │  • uid, email, isAnonymous                     │ │   │
│  │  │  • Sign in/up, guest, linking                 │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  habit.store.ts (Core Logic)                   │ │   │
│  │  │  • habits[]  (Habit list, per-user)            │ │   │
│  │  │  • entries[] (HabitEntry records, per-user)    │ │   │
│  │  │  • CRUD operations (scoped to uid)             │ │   │
│  │  │  • Real-time Firestore onSnapshot listeners   │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  theme.store.ts (UI State)                     │ │   │
│  │  │  • isDark boolean                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                        ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Composables (Pure Logic / Helpers)               │   │
│  │   • useHeatmap()    → Daily/Weekly/Monthly grid    │   │
│  │   • useStreak()     → Streak calculations           │   │
│  │   • useHabits()     → CRUD wrappers                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                        ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Firebase / Firestore & Auth                      │   │
│  │   • Authentication (email, Google, anonymous)     │   │
│  │   • Per-user Firestore paths: users/{uid}/...     │   │
│  │   • Real-time sync (onSnapshot)                    │   │
│  │   • Collections: users/{uid}/habits, entries       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
USER INTERACTION
    ↓
Components (e.g., HabitCard, AddHabitDialog)
    ↓
Call store methods (addHabit, setEntry, etc.)
    ↓
Store updates Firestore via Firebase SDK
    ↓
Firestore triggers onSnapshot listeners (in store)
    ↓
Store reactive refs update automatically
    ↓
Vue components re-render with new data
    ↓
UI reflects changes
```

### Example: User Marks a Pixel Complete

1. User clicks a pixel in HeatmapCell → `emit('click', cell)`
2. HabitCard receives click → opens PixelDetailDialog
3. User sets rating (1-5) and notes → clicks "Save"
4. PixelDetailDialog calls `store.setEntry(habitId, dateStr, rating, description)`
5. Store calls Firebase `addDoc()` or `updateDoc()`
6. Firestore persists the change
7. Firestore's `onSnapshot(collection(db, 'entries'))` triggers
8. Store's `entries` ref updates automatically
9. All components watching `entries` re-compute and re-render
10. Heatmap cell color updates, streak recalculates, "Save" closes dialog

---

## 🎨 Component Hierarchy

```
App.vue (authReady gate + theme watcher)
└── RouterView
    ├── LoginView (if not authenticated)
    │   ├── Email/password form (sign in/up toggle)
    │   ├── Google sign-in button
    │   └── Guest sign-in button
    └── HomeView (if authenticated)
        ├── AppHeader
        │   ├── ThemeToggle
        │   ├── "Save progress" button (guest only)
        │   └── Account menu (sign out, link account)
        │       └── LinkAccountDialog (modal)
        ├── TodayProgress (shown only if daily habits exist)
        ├── EmptyState (shown if no habits)
        └── HabitCard (one per habit)
            ├── HabitHeatmap
            │   └── HeatmapCell[] (10-365 cells depending on frequency)
            ├── PixelDetailDialog (modal)
            │   └── Rating selector (5-star) + notes textarea
            ├── EditHabitDialog (modal)
            ├── DeleteConfirmDialog (modal)
            ├── Streak indicators (current 🔥 + longest 🏆)
            └── Edit/Delete action buttons

FAB (Floating Action Button)
└── AddHabitDialog (modal)
    ├── Name input
    ├── Emoji input
    ├── Frequency selector (Daily/Weekly/Monthly)
    └── ColorPicker
```

---

## 🗃️ State Management (Pinia)

### `auth.store.ts` — Authentication State

```typescript
// State
user: ShallowRef<User | null>      // Current Firebase user
authReady: boolean                 // Auth initialization complete
authError: string | null           // Error message (user-friendly)
authLoading: boolean               // Action in progress

// Computed
isAuthenticated: boolean           // user !== null
isAnonymous: boolean               // user?.isAnonymous
uid: string | null                 // user?.uid
email: string | null               // user?.email

// Actions (all async, return result | null on error)
signInWithEmail(email, password): Promise<...>
signUpWithEmail(email, password): Promise<...>
signInWithGoogle(): Promise<...>
signInAsGuest(): Promise<...>
linkGoogleAccount(): Promise<...>  // Upgrade anonymous to Google (same uid)
linkEmailAccount(email, password): Promise<...>  // Upgrade anonymous to email
signOutUser(): Promise<...>
```

### `habit.store.ts` — Habit Store (per-user, scoped to uid)

```typescript
// State
habits: Habit[]           // User's habits (synced from users/{uid}/habits)
entries: HabitEntry[]     // User's entries (synced from users/{uid}/entries)
loading: boolean          // Firestore sync in progress
firestoreError: string | null  // Error message

// Computed
dailyHabits: Habit[]      // Only frequency='daily' habits
todayCompleted: number    // Count of daily habits with entry today
todayTotal: number        // Total daily habits
todayPercent: number      // (todayCompleted / todayTotal) * 100

// Actions (all async, scoped to current uid)
addHabit(name, emoji, color, frequency): Promise<void>
updateHabit(id, name, emoji, color, frequency): Promise<void>
deleteHabit(id): Promise<void>      // Deletes habit + all entries (batched)
getEntry(habitId, date): HabitEntry | null
setEntry(habitId, date, rating, description): Promise<void>
removeEntry(habitId, date): Promise<void>
getEntriesForHabit(habitId): HabitEntry[]
```

**Note**: Resubscribes to Firestore whenever `authStore.uid` changes. Linking (guest → Google/email) preserves uid, so no resubscription occurs.

### `theme.store.ts` — Theme State

```typescript
isDark: boolean           // Light/dark mode
toggle(): void            // Toggle theme
```

---

## 💾 Data Model (TypeScript)

See [DATA_MODEL.md](./DATA_MODEL.md) for full details, but the key types:

```typescript
interface Habit {
  id: string
  name: string
  emoji: string
  color: string                    // Hex color for the habit
  frequency: 'daily' | 'weekly' | 'monthly'
  createdAt: string                // ISO timestamp
}

interface HabitEntry {
  id: string
  habitId: string
  date: string                      // 'YYYY-MM-DD' format
  rating: 1 | 2 | 3 | 4 | 5        // Completion level
  description: string               // User notes
}

interface HeatmapCell {
  date: Date
  dateStr: string                   // 'YYYY-MM-DD'
  tier: 0 | 1 | 2 | 3 | 4 | 5      // Visual intensity (computed from rating)
  entry: HabitEntry | null
  label: string                     // Display text (e.g., "Jan 15, 2025")
  isFuture: boolean
}
```

---

## 🎨 Styling & Theming

**CSS Custom Properties** (`src/styles/variables.scss`):
- `--heatmap-0` through `--heatmap-5` — Heatmap cell colors (theme-aware)
- Vuetify's built-in token system for primary, surface, etc.

**Theme Flow**:
1. User toggles theme via ThemeToggle button
2. `theme.store.isDark` ref changes
3. App.vue watches `isDark` → updates `vuetifyTheme.global.name.value`
4. Vuetify switches CSS class to `.v-theme--dark` or `.v-theme--light`
5. CSS custom properties update via media queries or class overrides
6. All components using `rgb(var(--v-theme-primary))` re-render with new colors

---

## 🔥 Firebase Integration

**Firestore Collections**:
- `habits` — One doc per habit (id = habit.id)
- `entries` — One doc per rating (id = auto-generated)

**Real-Time Sync**:
- App starts → `habit.store.ts` sets up `onSnapshot()` listeners
- Changes in Firestore → listeners fire → store refs update → UI re-renders
- No polling; fully reactive

**Security Rules**:
- (Currently open read/write for development — see [FIREBASE.md](./FIREBASE.md) for production rules)

---

## 🚀 Build & Deployment

**Local Development**:
```bash
npm run dev          # Vite dev server (fast HMR)
npm run build        # Production build
npm run preview      # Preview prod build locally
npm run type-check   # TypeScript validation
npm run lint         # Linting + formatting
```

**Build Output**:
- `/dist/` folder contains optimized JS, CSS, HTML
- Ready to deploy to any static host (Vercel, Netlify, Firebase Hosting, etc.)

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vue | 3.5.x | Reactive UI framework |
| typescript | latest | Type safety |
| pinia | 3.0.x | State management |
| vuetify | 4.1.x | UI component library |
| firebase | 12.16.x | Firestore & Auth |
| date-fns | 4.4.x | Date manipulation |
| vite | latest | Build tool |
| sass | latest | CSS preprocessing |

---

## 🔐 Environment Variables

Required in `.env.local`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

(See [FIREBASE.md](./FIREBASE.md) for setup instructions)

---

## ✅ Quality Standards

- **Type Safety**: Strict TypeScript, no `any`
- **Composition API**: `<script setup>` throughout, no Options API
- **Clean Code**: Small, focused components; reusable composables
- **Accessibility**: ARIA labels, keyboard nav, focus management
- **Responsive**: Mobile-first, flex/grid layouts
- **Dark Mode**: Full support with theme-aware colors
- **No Dead Code**: All components in use; all imports resolved

---

## Next Steps

- For implementation details, see [CODEBASE_MAP.md](./CODEBASE_MAP.md)
- For adding features, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
