<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')

const submitting = computed(() => authStore.authLoading)
const title = computed(() => (mode.value === 'signin' ? 'Sign in' : 'Create account'))

async function submitEmail() {
  const result =
    mode.value === 'signin'
      ? await authStore.signInWithEmail(email.value, password.value)
      : await authStore.signUpWithEmail(email.value, password.value)
  if (result) router.push('/')
}

async function submitGoogle() {
  const result = await authStore.signInWithGoogle()
  if (result) router.push('/')
}

async function submitGuest() {
  const result = await authStore.signInAsGuest()
  if (result) router.push('/')
}
</script>

<template>
  <v-main class="login-view">
    <v-container class="login-view__container" max-width="420">
      <div class="login-view__brand">
        <h1>🟩 Pixel Habits</h1>
        <p>Track your habits, one pixel at a time.</p>
      </div>

      <v-card rounded="lg">
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text>
          <v-alert
            v-if="authStore.authError"
            type="error"
            variant="tonal"
            class="mb-4"
            :text="authStore.authError"
          />

          <v-form @submit.prevent="submitEmail">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              variant="outlined"
              density="compact"
              autocomplete="email"
            />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              variant="outlined"
              density="compact"
              class="mt-3"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            />
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              block
              class="mt-4"
              :loading="submitting"
              :disabled="submitting"
            >
              {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
            </v-btn>
          </v-form>

          <div class="text-center mt-3">
            <v-btn
              variant="text"
              size="small"
              :disabled="submitting"
              @click="mode = mode === 'signin' ? 'signup' : 'signin'"
            >
              {{
                mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'
              }}
            </v-btn>
          </div>

          <v-divider class="my-4" />

          <v-btn
            variant="outlined"
            block
            prepend-icon="mdi-google"
            :disabled="submitting"
            @click="submitGoogle"
          >
            Continue with Google
          </v-btn>
          <v-btn variant="text" block class="mt-2" :disabled="submitting" @click="submitGuest">
            Continue as Guest
          </v-btn>
        </v-card-text>
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
}
</style>
