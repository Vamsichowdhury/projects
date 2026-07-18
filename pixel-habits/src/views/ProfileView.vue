<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import AvatarPicker from '@/components/auth/AvatarPicker.vue'
import { updateProfile } from 'firebase/auth'
import { auth } from '@/firebase/auth'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()

const editingName = ref(false)
const nameInput = ref('')
const saving = ref(false)

const displayName = computed(() => profileStore.profile?.name || authStore.user?.displayName || '')
const avatarIcon = computed(() => profileStore.profile?.avatarIcon || null)
const photoUrl = computed(() => authStore.user?.photoURL || null)

const resolvedAvatar = computed(() => {
  if (avatarIcon.value) return { type: 'icon' as const, value: avatarIcon.value }
  if (photoUrl.value) return { type: 'photo' as const, value: photoUrl.value }
  return { type: 'default' as const }
})

function startEditingName() {
  nameInput.value = displayName.value
  editingName.value = true
}

async function saveName() {
  if (!nameInput.value.trim()) {
    editingName.value = false
    return
  }

  saving.value = true
  try {
    await updateProfile(auth.currentUser!, { displayName: nameInput.value.trim() })
    await profileStore.updateProfile({ name: nameInput.value.trim() })
    editingName.value = false
  } finally {
    saving.value = false
  }
}

async function updateAvatar(newIcon: string) {
  await profileStore.updateProfile({ avatarIcon: newIcon })
}
</script>

<template>
  <v-main class="profile-view">
    <v-container max-width="480" class="py-8">
      <v-card class="profile-card">
        <v-card-title>Profile</v-card-title>
        <v-card-text class="pa-8">
          <div class="profile-avatar-section">
            <v-avatar v-if="resolvedAvatar.type === 'photo'" :image="resolvedAvatar.value" size="96" />
            <v-avatar v-else-if="resolvedAvatar.type === 'icon'" size="96" color="primary">
              <v-icon :icon="`mdi-${resolvedAvatar.value}`" size="56" />
            </v-avatar>
            <v-avatar v-else size="96" color="surface-variant">
              <v-icon icon="mdi-account-circle" size="56" />
            </v-avatar>
          </div>

          <div class="mt-8">
            <div v-if="!editingName" class="name-display">
              <div class="text-h6">{{ displayName || 'Guest' }}</div>
              <v-btn variant="text" size="small" @click="startEditingName" class="mt-2">
                Edit name
              </v-btn>
            </div>
            <div v-else class="name-edit">
              <v-text-field
                v-model="nameInput"
                label="Your name"
                variant="outlined"
                dense
                autofocus
              />
              <div class="mt-3 d-flex gap-2">
                <v-btn
                  size="small"
                  variant="elevated"
                  @click="saveName"
                  :loading="saving"
                >
                  Save
                </v-btn>
                <v-btn size="small" variant="text" @click="editingName = false">
                  Cancel
                </v-btn>
              </div>
            </div>
          </div>

          <v-divider class="my-8" />

          <div class="mt-8">
            <label class="text-subtitle2">Profile Icon</label>
            <AvatarPicker
              :modelValue="avatarIcon || 'face-man'"
              @update:modelValue="updateAvatar"
              class="mt-4"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="mt-6 text-center">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="router.back()"
        >
          Back
        </v-btn>
      </div>
    </v-container>
  </v-main>
</template>

<style scoped lang="scss">
.profile-view {
  background: var(--gradient-brand-soft);
  background-size: 200% 200%;
  animation: gradient-shift var(--dur-slower) var(--ease-standard) infinite alternate;
  min-height: 100vh;
}

.profile-card {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.profile-avatar-section {
  display: flex;
  justify-content: center;
}

.name-display {
  text-align: center;
}

.name-edit {
  max-width: 300px;
  margin: 0 auto;
}
</style>
