import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let app: FirebaseApp | null = null
let auth: Auth | null = null

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>)
  auth = getAuth(app)
  auth.languageCode = 'pt-BR'
}

function requireAuth(): Auth {
  if (!auth) throw new Error('O login ainda não foi configurado neste ambiente.')
  return auth
}

export function observeUser(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => undefined
  }
  return onAuthStateChanged(auth, callback)
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password)
  await updateProfile(credential.user, { displayName: name.trim() })
  await sendEmailVerification(credential.user).catch(() => undefined)
  return credential.user
}

export async function signIn(email: string, password: string): Promise<User> {
  return (await signInWithEmailAndPassword(requireAuth(), email.trim(), password)).user
}

export function signUserOut(): Promise<void> {
  return signOut(requireAuth())
}

export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(requireAuth(), email.trim())
}

export async function getIdToken(): Promise<string> {
  const user = requireAuth().currentUser
  if (!user) throw new Error('Entre na sua conta para continuar.')
  return user.getIdToken()
}

export async function getOptionalIdToken(): Promise<string | null> {
  return auth?.currentUser ? auth.currentUser.getIdToken() : null
}

export type { User }
