import Dexie, { type Table } from 'dexie'
import type { Script } from './types'

export function newScriptKey(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

class AlvopromptDB extends Dexie {
  scripts!: Table<Script, number>

  constructor() {
    super('alvoprompt')
    this.version(1).stores({
      scripts: '++id, title, updatedAt',
    })
  }
}

export const db = new AlvopromptDB()

export async function getScripts(): Promise<Script[]> {
  return db.scripts.orderBy('updatedAt').reverse().toArray()
}

export async function saveScript(script: Script): Promise<number> {
  const now = Date.now()
  const next: Script = { ...script, key: script.key ?? newScriptKey(), updatedAt: now }
  if (next.id != null) {
    await db.scripts.put(next)
    return next.id
  }
  return db.scripts.add(next)
}

export async function deleteScript(id: number): Promise<void> {
  await db.scripts.delete(id)
}
