<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import AvatarPicker from '@/components/auth/AvatarPicker.vue'
import { AVATAR_ICONS } from '@/constants/avatars'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()

const mode = ref<'signin' | 'signup' | 'reset'>('signin')
const email = ref('')
const password = ref('')
const name = ref('')
const selectedAvatar = ref(AVATAR_ICONS[0]!.id)
const resetSent = ref(false)

const submitting = computed(() => authStore.authLoading)
const title = computed(() => {
  if (mode.value === 'signin') return 'Sign in'
  if (mode.value === 'signup') return 'Create account'
  return 'Reset password'
})

async function submitEmail() {
  const result =
    mode.value === 'signin'
      ? await authStore.signInWithEmail(email.value, password.value)
      : await authStore.signUpWithEmail(email.value, password.value, name.value || undefined)
  if (result) {
    if (mode.value === 'signup') {
      await profileStore.ensureProfile({ name: name.value || null, avatarIcon: selectedAvatar.value })
    }
    router.push('/')
  }
}

async function submitGoogle() {
  const result = await authStore.signInWithGoogle()
  if (result) {
    await profileStore.ensureProfile({ name: result.user.displayName ?? null, avatarIcon: null })
    router.push('/')
  }
}

async function submitGuest() {
  const result = await authStore.signInAsGuest()
  if (result) {
    await profileStore.ensureProfile({ avatarIcon: AVATAR_ICONS[0]!.id })
    router.push('/')
  }
}

async function submitReset() {
  const result = await authStore.resetPassword(email.value)
  if (result !== null) resetSent.value = true
}

function switchMode(newMode: 'signin' | 'signup' | 'reset') {
  mode.value = newMode
  authStore.authError = null
  resetSent.value = false
  name.value = ''
  selectedAvatar.value = AVATAR_ICONS[0]!.id
}
</script>

<template>
  <v-main class="login-view brand-bg">
    <v-container class="login-view__container" max-width="420">
      <div class="login-view__brand">
        <h1 class="login-view__title">🟩 Pixel Habits</h1>
        <p>Track your habits, one pixel at a time.</p>
      </div>

      <v-card class="login-view__card">
        <v-card-title>{{ title }}</v-card-title>
        <Transition name="mode-switch" mode="out-in">
        <v-card-text :key="mode">
          <v-alert
            v-if="authStore.authError"
            type="error"
            variant="tonal"
            class="mb-4"
            :text="authStore.authError"
          />

          <v-form @submit.prevent="mode === 'reset' ? submitReset() : submitEmail()">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
            />
            <v-text-field
              v-if="mode !== 'reset'"
              v-model="password"
              label="Password"
              type="password"
              class="mt-3"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            />
            <v-text-field
              v-if="mode === 'signup'"
              v-model="name"
              label="Your name"
              class="mt-3"
              autocomplete="name"
            />
            <div v-if="mode === 'signup'" class="mt-4">
              <label class="text-caption">Choose your profile icon</label>
              <AvatarPicker v-model="selectedAvatar" class="mt-2" />
            </div>
            <v-btn
              type="submit"
              block
              class="mt-4 btn-gradient"
              :loading="submitting"
              :disabled="submitting || resetSent"
            >
              {{
                mode === 'reset'
                  ? 'Send reset link'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'
              }}
            </v-btn>
          </v-form>

          <div v-if="mode === 'reset' && resetSent" class="mt-4">
            <v-alert
              type="success"
              variant="tonal"
              class="mb-3"
              text="If an account exists for that email, we've sent a reset link. Check your inbox!"
            />
            <div class="text-center">
              <v-btn variant="text" size="small" @click="switchMode('signin')">
                Back to sign in
              </v-btn>
            </div>
          </div>

          <div v-else-if="mode !== 'reset'" class="text-center mt-3">
            <v-btn
              variant="text"
              size="small"
              :disabled="submitting"
              @click="switchMode(mode === 'signin' ? 'signup' : 'signin')"
            >
              {{
                mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'
              }}
            </v-btn>
          </div>

          <div v-if="mode === 'signin'" class="text-center mt-2">
            <v-btn variant="text" size="small" :disabled="submitting" @click="switchMode('reset')">
              Forgot password?
            </v-btn>
          </div>

          <div v-if="mode === 'reset' && !resetSent" class="text-center mt-3">
            <v-btn variant="text" size="small" @click="switchMode('signin')">
              Back to sign in
            </v-btn>
          </div>

          <v-divider v-if="mode !== 'reset'" class="my-4" />

          <v-btn
            v-if="mode !== 'reset'"
            variant="outlined"
            block
            prepend-icon="mdi-google"
            :disabled="submitting"
            @click="submitGoogle"
          >
            Continue with Google
          </v-btn>
          <v-btn
            v-if="mode !== 'reset'"
            variant="text"
            block
            class="mt-2"
            :disabled="submitting"
            @click="submitGuest"
          >
            Continue as Guest
          </v-btn>
        </v-card-text>
        </Transition>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped lang="scss">
.login-view {
  display: flex;
  align-items: center;
  min-height: 100vh;

  &__container {
    margin: 0 auto;
  }

  &__brand {
    text-align: center;
    margin-bottom: 24px;
  }

  &__title {
    background: var(--gradient-brand);
    background-size: 200% 200%;
    animation: gradient-shift var(--dur-slower) var(--ease-standard) infinite alternate;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 8px 0;
    font-size: 1.75rem;
    font-weight: 700;
  }

  &__card {
    background: rgba(var(--v-theme-surface), 0.85) !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  }
}

.mode-switch-enter-active,
.mode-switch-leave-active {
  transition: opacity var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard);
}

.mode-switch-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.mode-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
