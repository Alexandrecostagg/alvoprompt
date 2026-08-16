import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

/**
 * Configuração do Firebase a partir das variáveis de ambiente VITE_*.
 * Sem as variáveis, o app funciona 100% local (modo offline).
 * O módulo do Firebase é carregado de forma dinâmica para não inflar o bundle inicial.
 */
export function readFirebaseConfig(): {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
} | null {
  const v = import.meta.env as Record<string, string | undefined>
  const cfg = {
    apiKey: v.VITE_FIREBASE_API_KEY ?? '',
    authDomain: v.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: v.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: v.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: v.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: v.VITE_FIREBASE_APP_ID ?? '',
  }
  return cfg.projectId && cfg.apiKey ? cfg : null
}

let _configured: boolean | null = null

export function firebaseConfigured(): boolean {
  if (_configured === null) _configured = readFirebaseConfig() !== null
  return _configured
}

let _fb: { auth: Auth; db: Firestore } | null = null

/** Inicializa o Firebase de forma preguiçosa (chunks dinâmicos). Retorna null se não configurado. */
export async function getFirebaseAsync(): Promise<{ auth: Auth; db: Firestore } | null> {
  if (!firebaseConfigured()) return null
  if (_fb) return _fb
  const { initializeApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')
  const { getFirestore } = await import('firebase/firestore')
  const app = initializeApp(readFirebaseConfig()!)
  _fb = { auth: getAuth(app), db: getFirestore(app) }
  return _fb
}
