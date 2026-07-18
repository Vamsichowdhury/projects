import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { useAuthStore } from './auth.store'

export interface ProfileData {
  name: string | null
  avatarIcon: string | null
}

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  const profile = ref<ProfileData | null>(null)
  let unsubscribe: (() => void) | null = null

  watch(
    () => authStore.uid,
    uid => {
      if (unsubscribe) unsubscribe()

      if (uid) {
        const profileRef = doc(db, 'users', uid)
        unsubscribe = onSnapshot(
          profileRef,
          snapshot => {
            if (snapshot.exists()) {
              const data = snapshot.data()
              profile.value = {
                name: data.name ?? null,
                avatarIcon: data.avatarIcon ?? null,
              }
            } else {
              profile.value = { name: null, avatarIcon: null }
            }
          },
          () => {
            profile.value = null
          }
        )
      } else {
        profile.value = null
      }
    },
    { immediate: true }
  )

  async function ensureProfile(defaults: Partial<ProfileData>) {
    const uid = authStore.uid
    if (!uid) return

    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, defaults, { merge: true })
  }

  async function updateProfile(updates: Partial<ProfileData>) {
    const uid = authStore.uid
    if (!uid) return

    const profileRef = doc(db, 'users', uid)
    await updateDoc(profileRef, updates)
  }

  return { profile, ensureProfile, updateProfile }
})
