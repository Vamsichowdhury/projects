/**
 * Home View Component — Main Application Page
 *
 * Single-page application (SPA) layout.
 * Displays:
 * - AppHeader: Logo, theme toggle, navigation
 * - TodayProgress: Daily habits completion card (only if frequency=daily habits exist)
 * - HabitCards: Grid of all habits (one card per habit)
 * - FAB: Floating action button (+) to create new habit
 * - EmptyState: Friendly message if no habits yet
 * - LoadingSpinner: While Firestore listeners initializing
 * - ErrorAlert: If Firestore connection fails
 *
 * State Management:
 * - Uses habit store (Pinia) for all data: habits[], entries[], loading, firestoreError
 * - showAddDialog: Controls AddHabitDialog visibility
 * - Everything else is reactive computed from store state
 *
 * Rendering Logic:
 * 1. While loading: show spinner
 * 2. If Firestore error: show error message with setup hint
 * 3. If no habits: show EmptyState with "Create your first habit" CTA
 * 4. Otherwise: render HabitCard for each habit
 *
 * Interactions:
 * - FAB or EmptyState "Create" button → opens AddHabitDialog
 * - AddHabitDialog calls store.addHabit() → Firestore write → listeners fire → auto-renders new card
 */

<script setup lang="ts">
import { ref } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import AppHeader from '@/components/layout/AppHeader.vue'
import TodayProgress from '@/components/progress/TodayProgress.vue'
import HabitCard from '@/components/habits/HabitCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AddHabitDialog from '@/components/dialogs/AddHabitDialog.vue'

const store = useHabitStore()
const showAddDialog = ref(false)  // Controls AddHabitDialog visibility
</script>

<template>
  <v-main>
    <v-container :max-width="1200" class="home-view">
      <AppHeader />

      <TodayProgress v-if="store.dailyHabits.length > 0" class="mb-4" />

      <div v-if="store.loading" class="home-view__loading">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <v-alert
        v-else-if="store.firestoreError"
        type="error"
        variant="tonal"
        class="mb-4"
        :text="`Firestore error: ${store.firestoreError}. Check that your Firestore security rules allow this account to read/write users/{uid}/habits and users/{uid}/entries — see docs/FIREBASE.md.`"
      />

      <template v-else>
        <EmptyState v-if="store.habits.length === 0" @create="showAddDialog = true" />

        <TransitionGroup v-else name="habit-list" tag="div" class="home-view__habits">
          <HabitCard v-for="(habit, index) in store.habits" :key="habit.id" :habit="habit" :style="{ '--stagger': `${Math.min(index * 40, 400)}ms` }" />
        </TransitionGroup>
      </template>
    </v-container>

    <v-btn
      icon="mdi-plus"
      size="x-large"
      class="home-view__fab"
      aria-label="Add new habit"
      @click="showAddDialog = true"
    />

    <AddHabitDialog v-model="showAddDialog" />
  </v-main>
</template>

<style scoped lang="scss">
.home-view {
  padding-bottom: 100px;

  &__loading {
    display: flex;
    justify-content: center;
    padding: 80px 0;
  }

  &__habits {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9;
    background: var(--gradient-brand) !important;
    box-shadow: var(--glow-primary);
    transition: box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard);

    &:hover {
      box-shadow: 0 12px 32px -8px rgba(var(--v-theme-primary), 0.6);
      transform: translateY(-2px) scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.habit-list-enter-active {
  transition: all var(--dur-base) var(--ease-standard);
}

.habit-list-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.habit-list-leave-active {
  transition: all var(--dur-base) var(--ease-standard);
}

.habit-list-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.habit-list-move {
  transition: transform var(--dur-base) var(--ease-standard);
}

.home-view__habits > * {
  animation: fade-in-up var(--dur-base) var(--ease-standard);
  animation-delay: var(--stagger, 0ms);
}
</style>
