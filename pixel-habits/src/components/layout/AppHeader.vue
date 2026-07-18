<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import ThemeToggle from '@/components/theme/ThemeToggle.vue'
import LinkAccountDialog from '@/components/dialogs/LinkAccountDialog.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()
const showLinkDialog = ref(false)

const today = computed(() => format(new Date(), 'EEEE, MMMM d, yyyy'))

const greeting = computed(() => {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = authStore.user?.displayName
  return name ? `${timeGreeting}, ${name}` : timeGreeting
})

const accountLabel = computed(() => (authStore.isAnonymous ? 'Guest' : authStore.email ?? 'Account'))

const resolvedAvatar = computed(() => {
  const icon = profileStore.profile?.avatarIcon
  const photo = authStore.user?.photoURL
  if (icon) return { type: 'icon' as const, value: icon }
  if (photo) return { type: 'photo' as const, value: photo }
  return { type: 'default' as const }
})

async function handleSignOut() {
  const result = await authStore.signOutUser()
  if (result !== null) router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__text app-header__text--entrance">
      <p class="app-header__brand">🟩 Pixel Habits</p>
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
          <v-btn variant="text" v-bind="props" :aria-label="`Account: ${accountLabel}`">
            <v-avatar v-if="resolvedAvatar.type === 'photo'" :image="resolvedAvatar.value" size="32" />
            <v-avatar v-else-if="resolvedAvatar.type === 'icon'" size="32" color="primary">
              <v-icon :icon="`mdi-${resolvedAvatar.value}`" />
            </v-avatar>
            <v-avatar v-else size="32" color="surface-variant">
              <v-icon icon="mdi-account-circle" />
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item :title="accountLabel" subtitle="Signed in" disabled />
          <v-divider />
          <v-list-item
            title="Profile"
            prepend-icon="mdi-account-box"
            @click="router.push('/profile')"
          />
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

    &--entrance {
      animation: fade-in-up var(--dur-base) var(--ease-standard);
    }
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

  &__brand {
    background: var(--gradient-brand);
    background-size: 200% 200%;
    animation: gradient-shift var(--dur-slower) var(--ease-standard) infinite alternate;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 2px 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &__actions {
    display: flex;
    align-items: center;
  }
}
</style>
