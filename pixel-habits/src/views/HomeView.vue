<script setup lang="ts">
import { ref } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import AppHeader from '@/components/layout/AppHeader.vue'
import TodayProgress from '@/components/progress/TodayProgress.vue'
import HabitCard from '@/components/habits/HabitCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AddHabitDialog from '@/components/dialogs/AddHabitDialog.vue'

const store = useHabitStore()
const showAddDialog = ref(false)
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
        :text="`Firestore error: ${store.firestoreError}. Check your Firebase security rules — allow read, write: if true; for development.`"
      />

      <template v-else>
        <EmptyState v-if="store.habits.length === 0" @create="showAddDialog = true" />

        <div v-else class="home-view__habits">
          <HabitCard v-for="habit in store.habits" :key="habit.id" :habit="habit" />
        </div>
      </template>
    </v-container>

    <v-btn
      icon="mdi-plus"
      color="primary"
      size="x-large"
      elevation="6"
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
  }
}
</style>
