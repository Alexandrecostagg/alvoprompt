import { useAppStore } from '../store/useAppStore'
import { db, getScripts, newScriptKey } from './db'
import { pullFromCloud, pushToCloud, type CloudScript } from './syncWorker'
import type { Script } from './types'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

/** Garante uma key estável para roteiros locais ainda sem key (criados antes do sync). */
async function ensureKeys(scripts: Script[]): Promise<Script[]> {
  const withKeys: Script[] = []
  for (const s of scripts) {
    if (s.key) {
      withKeys.push(s)
      continue
    }
    const next = { ...s, key: newScriptKey() }
    if (s.id != null) await db.scripts.put(next)
    withKeys.push(next)
  }
  return withKeys
}

/**
 * Mescla local + nuvem por key (o mais recente vence) e envia o resultado para a nuvem.
 * Roteiros criados em outros dispositivos entram como novos.
 */
export async function syncNow(pass: string): Promise<{ added: number; kept: number }> {
  const cloud = await pullFromCloud(pass)
  const local = await ensureKeys(await getScripts())
  const merged = new Map<string, Script>()

  for (const s of local) {
    if (s.key) merged.set(s.key, s)
  }

  let added = 0
  for (const c of cloud) {
    const existing = merged.get(c.key)
    if (!existing) {
      merged.set(c.key, { ...c, id: undefined, key: c.key })
      added++
    } else if (c.updatedAt > existing.updatedAt) {
      merged.set(c.key, {
        ...existing,
        title: c.title,
        content: c.content,
        tags: c.tags,
        updatedAt: c.updatedAt,
      })
    }
  }

  const final = [...merged.values()]
  await db.transaction('rw', db.scripts, async () => {
    await db.scripts.clear()
    await db.scripts.bulkAdd(final)
  })
  await useAppStore.getState().loadScripts()
  await pushToCloud(pass, final)
  return { added, kept: final.length - added }
}

/** Envia a biblioteca local para a nuvem, substituindo o que está lá. */
export async function pushAll(pass: string): Promise<number> {
  const local = await ensureKeys(await getScripts())
  const count = await pushToCloud(pass, local)
  await useAppStore.getState().loadScripts()
  return count
}

/** Substitui a biblioteca local pela versão da nuvem. */
export async function pullReplace(pass: string): Promise<void> {
  const cloud = await pullFromCloud(pass)
  const rows: Script[] = cloud.map((c: CloudScript) => ({
    id: undefined,
    key: c.key,
    title: c.title,
    content: c.content,
    tags: c.tags,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
  await db.transaction('rw', db.scripts, async () => {
    await db.scripts.clear()
    await db.scripts.bulkAdd(rows)
  })
  await useAppStore.getState().loadScripts()
}
