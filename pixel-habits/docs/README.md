# Pixel Habits — Documentation Hub

> A GitHub-style contribution heatmap habit tracker built with Vue 3, TypeScript, Vite, Pinia, Vuetify 3, and Firebase.

## 📖 Documentation Structure

### Quick Start
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tech stack, folder structure, and system design overview
- **[FEATURES.md](./FEATURES.md)** — Detailed feature descriptions and user flows
- **[CODEBASE_MAP.md](./CODEBASE_MAP.md)** — Where each feature/logic lives in the code

### Deep Dives
- **[DATA_MODEL.md](./DATA_MODEL.md)** — TypeScript types and Firestore collection schemas
- **[FIREBASE.md](./FIREBASE.md)** — Firebase setup, environment variables, and Firestore security rules
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** — How to add features, run locally, debug
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** — Common issues and solutions

### Visual Aids
- **[diagrams/](./diagrams/)** — Mermaid and ASCII diagrams for architecture, data flow, and component hierarchy

---

## 🎯 Project Overview

**Pixel Habits** is a single-page web app that lets users track habits using GitHub-style contribution heatmaps. Each habit has its own heatmap (daily/weekly/monthly), showing completion as colored pixels with intensity from 0–5 rating scale.

### Key Features
- ✅ **Per-Habit Heatmaps** — Each habit displays its own daily/weekly/monthly contribution grid
- ✅ **1–5 Rating System** — Click any pixel to assign a rating (completeness) and add notes
- ✅ **Streak Tracking** — Current and longest streak for each habit
- ✅ **Dark/Light Theme** — Persistent theme preference
- ✅ **Firebase Sync** — Real-time data persistence across sessions
- ✅ **No Auth Required** — Client-side only; data stored in Firestore

### Tech Stack
- **UI Framework**: Vue 3 (Composition API + `<script setup>`)
- **Type Safety**: TypeScript with strict mode
- **Build Tool**: Vite
- **State Management**: Pinia
- **UI Components**: Vuetify 3
- **Styling**: SCSS with CSS custom properties (theming)
- **Date Handling**: date-fns
- **Backend**: Firebase (Firestore for data, Auth optional)
- **Icons**: Material Design Icons (MDI)

---

## 🗂️ Folder Structure

```
pixel-habits/
├── src/
│   ├── components/          # Vue components organized by feature
│   │   ├── common/          # Shared: ColorPicker, EmptyState
│   │   ├── dialogs/         # Modals: AddHabit, EditHabit, PixelDetail
│   │   ├── habits/          # HabitCard, HabitItem, HabitsList
│   │   ├── heatmap/         # HabitHeatmap, HeatmapCell (pixel rendering)
│   │   ├── layout/          # AppHeader
│   │   ├── progress/        # TodayProgress (daily completion %)
│   │   ├── streak/          # StreakCard (current/longest streak)
│   │   └── theme/           # ThemeToggle
│   ├── composables/         # Vue 3 Composition API hooks
│   │   ├── useHabits.ts     # Habit CRUD operations
│   │   ├── useHeatmap.ts    # Heatmap grid generation logic
│   │   ├── useStreak.ts     # Streak calculation
│   │   └── useLocalStorage.ts # (Deprecated — Firebase replaces this)
│   ├── stores/              # Pinia state management
│   │   ├── habit.store.ts   # Core: habits, entries, CRUD, Firestore sync
│   │   └── theme.store.ts   # Theme state (light/dark)
│   ├── utils/               # Helper functions
│   │   ├── colorUtils.ts    # Color mapping (tier → hex)
│   │   └── dateUtils.ts     # Date formatting helpers
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts         # Habit, HabitEntry, HeatmapCell, etc.
│   ├── styles/              # Global styles
│   │   ├── main.scss        # Reset, globals
│   │   └── variables.scss   # CSS custom properties (colors, theme)
│   ├── firebase/            # Firebase configuration
│   │   ├── firebase.ts      # App init, Firestore instance
│   │   └── auth.ts          # Auth exports (if needed later)
│   ├── router/              # Vue Router (currently single-page)
│   │   └── index.ts         # Routes (HomeView only)
│   ├── views/               # Page-level components
│   │   └── HomeView.vue     # Single home page
│   ├── App.vue              # Root component
│   └── main.ts              # Entry point
├── docs/                    # 📍 This documentation
├── .env.example             # Template for environment variables
├── .env.local               # (Add your Firebase keys here)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase**
   - Copy `.env.example` to `.env.local`
   - Add your Firebase project credentials (see [FIREBASE.md](./FIREBASE.md))

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

---

## 🤝 For New Developers/AI Agents

Start here in this order:
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the big picture
2. Review [FEATURES.md](./FEATURES.md) to understand what the app does
3. Check [CODEBASE_MAP.md](./CODEBASE_MAP.md) to find code for specific features
4. Look at [DATA_MODEL.md](./DATA_MODEL.md) to understand the data structures
5. Reference [FIREBASE.md](./FIREBASE.md) if modifying backend logic
6. Use [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) when adding features

All critical source files have detailed inline comments explaining the logic.

---

## 📝 License

Private project.
