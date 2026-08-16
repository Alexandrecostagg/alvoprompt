import Dexie, { type Table } from 'dexie'
import type { Script } from './types'

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
  if (script.id != null) {
    await db.scripts.update(script.id, { ...script, updatedAt: now })
    return script.id
  }
  return db.scripts.add({ ...script, createdAt: now, updatedAt: now })
}

export async function deleteScript(id: number): Promise<void> {
  await db.scripts.delete(id)
}
