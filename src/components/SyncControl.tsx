import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import {
  clearSyncPass,
  saveSyncPass,
  savedSyncPass,
} from '../lib/syncWorker'
import { pullReplace, pushAll, syncNow, type SyncStatus } from '../lib/sync'

export default function SyncControl() {
  const [status, setStatus] = useState<SyncStatus>('off')
  const [open, setOpen] = useState(false)
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const connected = savedSyncPass() !== null
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!connected) return
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.scripts === prev.scripts) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void (async () => {
          setStatus('syncing')
          try {
            await pushAll(savedSyncPass()!)
            setStatus('synced')
          } catch {
            setStatus('error')
          }
        })()
      }, 1500)
    })
    setStatus('synced')
    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [connected])

  const run = async (fn: (p: string) => Promise<unknown>, okText: string) => {
    const p = savedSyncPass() ?? pass
    if (!p || p.trim().length < 4) {
      setMsg({ type: 'err', text: 'Crie uma frase-chave com pelo menos 4 caracteres.' })
      return
    }
    setBusy(true)
    setMsg(null)
    setStatus('syncing')
    try {
      await fn(p.trim())
      setStatus('synced')
      setMsg({ type: 'ok', text: okText })
    } catch (err) {
      setStatus('error')
      setMsg({ type: 'err', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const handleConnect = () => {
    if (pass.trim().length < 4) {
      setMsg({ type: 'err', text: 'Crie uma frase-chave com pelo menos 4 caracteres.' })
      return
    }
    saveSyncPass(pass)
    setPass('')
    void run(async (p) => {
      const r = await syncNow(p)
      return `Sincronizado: ${r.added} novo(s), ${r.kept} mantido(s).`
    }, 'Sincronizado!')
  }

  const handleDisconnect = () => {
    clearSyncPass()
    setOpen(false)
    setMsg(null)
    setStatus('off')
  }

  const label =
    status === 'syncing'
      ? '☁️ sincronizando…'
      : status === 'error'
        ? '☁️ erro de sync'
        : connected
          ? '☁️ sincronizado'
          : '☁️ Sincronizar'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-1 rounded-lg border px-2.5 py-1.5 text-sm transition-colors"
        style={{
          borderColor: status === 'error' ? 'var(--danger)' : 'var(--border)',
          color: status === 'error' ? 'var(--danger)' : 'var(--muted)',
        }}
        title="Sincronização em nuvem (gratuita, via frase-chave)"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-72 rounded-xl border p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}
        >
          {connected ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Roteiros sincronizados na nuvem. Use a mesma frase-chave em outro dispositivo para
                acessar os mesmos roteiros.
              </p>
              <button
                onClick={() => void run(async (p) => {
                  const r = await syncNow(p)
                  return `Sincronizado: ${r.added} novo(s), ${r.kept} mantido(s).`
                }, 'Sincronizado!')}
                disabled={busy}
                className="w-full rounded-lg py-2 text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {busy ? 'Sincronizando…' : '🔄 Sincronizar agora'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => void run(pushAll, 'Roteiros enviados para a nuvem.')}
                  disabled={busy}
                  className="flex-1 rounded-lg border py-2 text-xs font-medium disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Enviar p/ nuvem
                </button>
                <button
                  onClick={() => void run(pullReplace, 'Biblioteca substituída pela nuvem.')}
                  disabled={busy}
                  className="flex-1 rounded-lg border py-2 text-xs font-medium disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Baixar (substitui local)
                </button>
              </div>
              {msg && (
                <p className="text-xs" style={{ color: msg.type === 'err' ? 'var(--danger)' : 'var(--ok)' }}>
                  {msg.text}
                </p>
              )}
              <button
                onClick={handleDisconnect}
                className="w-full rounded-lg border py-2 text-sm font-medium"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Sincronize seus roteiros entre dispositivos.
              </p>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConnect()
                }}
                placeholder="Crie sua frase-chave"
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                A mesma frase-chave em outro aparelho libera seus roteiros na nuvem. Sem cadastro,
                sem e-mail — só guarde bem a frase.
              </p>
              {msg && (
                <p className="text-xs" style={{ color: msg.type === 'err' ? 'var(--danger)' : 'var(--ok)' }}>
                  {msg.text}
                </p>
              )}
              <button
                onClick={handleConnect}
                disabled={busy}
                className="w-full rounded-lg py-2 text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {busy ? 'Conectando…' : 'Conectar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
