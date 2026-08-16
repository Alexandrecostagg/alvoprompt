import type { User } from 'firebase/auth'
import { getFirebaseAsync } from './firebase'
import { db as localDb, getScripts, saveScript, deleteScript } from './db'
import type { Script } from './types'
import { useAppStore } from '../store/useAppStore'

export type SyncState = 'disabled' | 'signed-out' | 'connecting' | 'synced' | 'error'

/**
 * Sincronização em nuvem (Firestore):
 *  - Usuário faz login (email/senha) → os roteiros locais são enviados para a nuvem.
 *  - Alterações remotas (outro dispositivo) são baixadas para o IndexedDB local.
 *
 * Scaffold de integração. Para ativar, preencha as variáveis VITE_FIREBASE_* (ver .env.example).
 */
export function startSync(
  onState: (state: SyncState, user: User | null) => void,
): () => void {
  let stop = () => {}

  void (async () => {
    const f = await getFirebaseAsync()
    if (!f) {
      onState('disabled', null)
      return
    }
    const { onAuthStateChanged } = await import('firebase/auth')
    const { collection, doc, onSnapshot, setDoc } = await import('firebase/firestore')
    const { auth, db } = f
    const scriptsCol = collection(db, 'scripts')

    let unsubSnapshot: (() => void) | null = null
    let lastPushAt = new Map<number, number>()

    const pushLocal = async () => {
      const scripts = await getScripts()
      await Promise.all(
        scripts.map((s) =>
          setDoc(doc(scriptsCol, String(s.id)), {
            title: s.title,
            content: s.content,
            tags: s.tags ?? [],
            updatedAt: s.updatedAt,
          }),
        ),
      )
      lastPushAt = new Map(scripts.map((s) => [s.id!, s.updatedAt]))
    }

    const subscribeRemote = () => {
      unsubSnapshot = onSnapshot(
        scriptsCol,
        (snap) => {
          void (async () => {
            for (const change of snap.docChanges()) {
              const id = Number(change.doc.id)
              const remote = change.doc.data() as Partial<Script> & {
                updatedAt: number
              }
              if (change.type === 'removed') {
                await deleteScript(id)
                continue
              }
              if (change.type === 'added' || change.type === 'modified') {
                const existing = (await getScripts()).find((s) => s.id === id)
                if (existing && existing.updatedAt === remote.updatedAt) continue
                const script = {
                  id,
                  title: remote.title ?? '',
                  content: remote.content ?? '',
                  tags: remote.tags,
                  updatedAt: remote.updatedAt,
                  createdAt: existing?.createdAt ?? remote.updatedAt,
                }
                if (existing) await saveScript(script)
                else await localDb.scripts.add(script)
              }
            }
            await useAppStore.getState().loadScripts()
          })().catch((err) => {
            console.error('Firestore snapshot handler error', err)
            onState('error', null)
          })
        },
        (err) => {
          console.error('Firestore sync error', err)
          onState('error', null)
        },
      )
    }

    const unwatchLocal = useAppStore.subscribe((state, prev) => {
      if (state.scripts !== prev.scripts) void pushLocal()
    })

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        onState('signed-out', null)
        unsubSnapshot?.()
        unsubSnapshot = null
        return
      }
      onState('connecting', user)
      void (async () => {
        try {
          await pushLocal()
          if (!unsubSnapshot) subscribeRemote()
          onState('synced', user)
        } catch (err) {
          console.error('Firebase sync failed', err)
          onState('error', user)
        }
      })()
    })

    stop = () => {
      unsubAuth()
      unsubSnapshot?.()
      unwatchLocal()
      lastPushAt.clear()
    }
  })()

  return () => stop()
}
