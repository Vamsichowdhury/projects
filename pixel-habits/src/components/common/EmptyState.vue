<script setup lang="ts">
const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="empty-state" aria-live="polite">
    <v-icon icon="mdi-clipboard-check-outline" size="56" class="empty-state__icon" />
    <p class="empty-state__heading">No habits yet.</p>
    <p class="empty-state__sub">Track your daily habits and build streaks.</p>
    <Transition name="fade-entrance">
      <v-btn color="primary" variant="outlined" @click="emit('create')">
        Create Your First Habit
      </v-btn>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  gap: 10px;
  text-align: center;
  animation: fade-in-up var(--dur-base) var(--ease-standard);

  &__icon {
    opacity: 0.25;
    margin-bottom: 4px;
  }

  &__heading {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
  }

  &__sub {
    font-size: 0.875rem;
    opacity: 0.6;
    margin: 0 0 6px;
  }
}

.fade-entrance-enter-active,
.fade-entrance-leave-active {
  transition: opacity var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard);
}

.fade-entrance-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-entrance-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
