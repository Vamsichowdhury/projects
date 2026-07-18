<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const model = defineModel<boolean>({ required: true })
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

watch(model, (open) => {
  if (!open) {
    email.value = ''
    password.value = ''
  }
})

async function linkGoogle() {
  const result = await authStore.linkGoogleAccount()
  if (result) model.value = false
}

async function linkEmail() {
  const result = await authStore.linkEmailAccount(email.value, password.value)
  if (result) model.value = false
}
</script>

<template>
  <v-dialog v-model="model" max-width="440">
    <v-card rounded="lg">
      <v-card-title>Save your progress</v-card-title>
      <v-card-text>
        <p class="mb-4">
          Link your guest account to a Google or email login to keep your habits, history, and
          streaks if you switch devices or clear your browser.
        </p>

        <v-alert
          v-if="authStore.authError"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="authStore.authError"
        />

        <v-btn
          variant="outlined"
          block
          prepend-icon="mdi-google"
          :loading="authStore.authLoading"
          :disabled="authStore.authLoading"
          @click="linkGoogle"
        >
          Continue with Google
        </v-btn>

        <v-divider class="my-4" />

        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          variant="outlined"
          density="compact"
        />
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          variant="outlined"
          density="compact"
          class="mt-3"
        />
        <v-btn
          variant="flat"
          color="primary"
          block
          class="mt-3"
          :loading="authStore.authLoading"
          :disabled="authStore.authLoading"
          @click="linkEmail"
        >
          Link email &amp; password
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
