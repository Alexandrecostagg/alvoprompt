import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, getFirebaseAsync } from '../lib/firebase'
import { startSync, type SyncState } from '../lib/sync'

export default function SyncControl() {
  const [state, setState] = useState<SyncState>('disabled')
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured()) return
    return startSync((s, u) => {
      setState(s)
      setUser(u)
    })
  }, [])

  if (!firebaseConfigured()) return null

  const handleAuth = async (register: boolean) => {
    if (!email || !password) {
      setMsg('Preencha e-mail e senha.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const fb = await getFirebaseAsync()
      if (!fb) {
        setMsg('Firebase não configurado.')
        return
      }
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import(
        'firebase/auth'
      )
      if (register) await createUserWithEmailAndPassword(fb.auth, email, password)
      else await signInWithEmailAndPassword(fb.auth, email, password)
      setEmail('')
      setPassword('')
      setOpen(false)
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try {
      const fb = await getFirebaseAsync()
      if (!fb) return
      const { signOut } = await import('firebase/auth')
      await signOut(fb.auth)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const label =
    state === 'synced' || state === 'connecting'
      ? '☁️ sincronizando…'
      : state === 'error'
        ? '☁️ erro de sync'
        : '☁️ Entrar'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-1 rounded-lg border px-2.5 py-1.5 text-sm transition-colors"
        style={{
          borderColor: state === 'error' ? 'var(--danger)' : 'var(--border)',
          color: state === 'error' ? 'var(--danger)' : 'var(--muted)',
        }}
        title="Sincronização em nuvem (Firebase)"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-72 rounded-xl border p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}
        >
          {user ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Conectado como <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Roteiros sincronizados com a nuvem. Alterações em outros dispositivos são baixadas
                automaticamente.
              </p>
              <button
                onClick={() => void handleSignOut()}
                disabled={busy}
                className="w-full rounded-lg border py-2 text-sm font-medium disabled:opacity-40"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              {msg && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>
                  {msg}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => void handleAuth(false)}
                  disabled={busy}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold text-black disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  Entrar
                </button>
                <button
                  onClick={() => void handleAuth(true)}
                  disabled={busy}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Criar conta
                </button>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Use o plano gratuito do Firebase Auth (e-mail/senha). O sync mantém uma cópia na
                nuvem — seus roteiros continuam no dispositivo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
