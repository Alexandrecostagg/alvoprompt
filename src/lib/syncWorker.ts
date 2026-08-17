import { apiBase } from './cloudflare'
import type { Script } from './types'

const PASS_KEY = 'alvoprompt-sync-pass'

export interface CloudScript {
  key: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export function savedSyncPass(): string | null {
  return localStorage.getItem(PASS_KEY)
}

export function saveSyncPass(pass: string): void {
  localStorage.setItem(PASS_KEY, pass.trim())
}

export function clearSyncPass(): void {
  localStorage.removeItem(PASS_KEY)
}

async function syncFetch(init: RequestInit, pass: string): Promise<unknown> {
  const res = await fetch(`${apiBase()}/sync`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-sync-pass': pass.trim(),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status} ao sincronizar`)
  }
  return res.json()
}

export async function pullFromCloud(pass: string): Promise<CloudScript[]> {
  const payload = (await syncFetch({ method: 'GET' }, pass)) as { scripts: CloudScript[] }
  return payload.scripts
}

export async function pushToCloud(pass: string, scripts: Script[]): Promise<number> {
  const payload = (await syncFetch(
    {
      method: 'PUT',
      body: JSON.stringify({
        scripts: scripts.map((s) => ({
          key: s.key ?? '',
          title: s.title,
          content: s.content,
          tags: s.tags ?? [],
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      }),
    },
    pass,
  )) as { ok: boolean; count: number }
  return payload.count
}
