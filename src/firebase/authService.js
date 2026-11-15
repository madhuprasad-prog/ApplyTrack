import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './config.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email.trim(), password)
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function logout() {
  return signOut(auth)
}

const authErrorMessages = {
  'auth/account-exists-with-different-credential': 'An account already exists with this email. Try signing in with its original method.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
  'auth/cancelled-popup-request': 'A Google sign-in request is already in progress.',
  'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account was found with this email.',
  'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/network-request-failed': 'A network error interrupted authentication. Check your connection and try again.',
}

export function getAuthErrorMessage(error) {
  return authErrorMessages[error?.code] ?? 'We could not complete authentication. Please try again.'
}
