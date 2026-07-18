<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import ThemeToggle from '@/components/theme/ThemeToggle.vue'
import LinkAccountDialog from '@/components/dialogs/LinkAccountDialog.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()
const showLinkDialog = ref(false)

const today = computed(() => format(new Date(), 'EEEE, MMMM d, yyyy'))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const accountLabel = computed(() => (authStore.isAnonymous ? 'Guest' : authStore.email ?? 'Account'))

async function handleSignOut() {
  const result = await authStore.signOutUser()
  if (result !== null) router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__text">
      <h1 class="app-header__greeting">{{ greeting }} 👋</h1>
      <p class="app-header__date">{{ today }}</p>
    </div>

    <div class="app-header__actions">
      <v-btn
        v-if="authStore.isAnonymous"
        variant="tonal"
        color="primary"
        size="small"
        prepend-icon="mdi-content-save"
        class="mr-2"
        @click="showLinkDialog = true"
      >
        Save progress
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-account-circle"
            variant="text"
            v-bind="props"
            :aria-label="`Account: ${accountLabel}`"
          />
        </template>
        <v-list density="compact">
          <v-list-item :title="accountLabel" subtitle="Signed in" disabled />
          <v-divider />
          <v-list-item
            v-if="authStore.isAnonymous"
            title="Save your progress"
            prepend-icon="mdi-content-save"
            @click="showLinkDialog = true"
          />
          <v-list-item title="Sign out" prepend-icon="mdi-logout" @click="handleSignOut" />
        </v-list>
      </v-menu>

      <ThemeToggle />
    </div>

    <LinkAccountDialog v-model="showLinkDialog" />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 20px;

  &__text {
    min-width: 0;
  }

  &__greeting {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  &__date {
    font-size: 0.875rem;
    margin: 4px 0 0;
    opacity: 0.6;
  }

  &__actions {
    display: flex;
    align-items: center;
  }
}
</style>
