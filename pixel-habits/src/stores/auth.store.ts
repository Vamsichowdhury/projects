import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/auth'

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups and try again.'
    case 'auth/credential-already-in-use':
      return 'That account is already linked to a different user.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/missing-email':
      return 'Please enter your email address.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null)
  const authReady = ref(false)
  const authError = ref<string | null>(null)
  const authLoading = ref(false)

  let resolveReady!: () => void
  const authReadyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  onAuthStateChanged(auth, (u) => {
    user.value = u
    if (!authReady.value) {
      authReady.value = true
      resolveReady()
    }
  })

  const isAuthenticated = computed(() => user.value !== null)
  const isAnonymous = computed(() => user.value?.isAnonymous ?? false)
  const uid = computed(() => user.value?.uid ?? null)
  const email = computed(() => user.value?.email ?? null)

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    authError.value = null
    authLoading.value = true
    try {
      return await fn()
    } catch (err) {
      authError.value = mapAuthError(err)
      return null
    } finally {
      authLoading.value = false
    }
  }

  function signInWithEmail(emailAddr: string, password: string) {
    return run(() => signInWithEmailAndPassword(auth, emailAddr, password))
  }

  function signUpWithEmail(emailAddr: string, password: string, name?: string) {
    return run(async () => {
      const cred = await createUserWithEmailAndPassword(auth, emailAddr, password)
      if (name) await updateProfile(cred.user, { displayName: name })
      return cred
    })
  }

  function signInWithGoogle() {
    return run(() => signInWithPopup(auth, googleProvider))
  }

  function signInAsGuest() {
    return run(() => signInAnonymously(auth))
  }

  function linkGoogleAccount() {
    return run(async () => {
      if (!auth.currentUser) throw new Error('no-current-user')
      const result = await linkWithPopup(auth.currentUser, googleProvider)
      user.value = auth.currentUser
      return result
    })
  }

  function linkEmailAccount(emailAddr: string, password: string) {
    return run(async () => {
      if (!auth.currentUser) throw new Error('no-current-user')
      const credential = EmailAuthProvider.credential(emailAddr, password)
      const result = await linkWithCredential(auth.currentUser, credential)
      user.value = auth.currentUser
      return result
    })
  }

  function signOutUser() {
    return run(() => signOut(auth))
  }

  function resetPassword(emailAddr: string) {
    return run(() => sendPasswordResetEmail(auth, emailAddr))
  }

  return {
    user,
    authReady,
    authReadyPromise,
    authError,
    authLoading,
    isAuthenticated,
    isAnonymous,
    uid,
    email,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsGuest,
    linkGoogleAccount,
    linkEmailAccount,
    signOutUser,
    resetPassword,
  }
})
