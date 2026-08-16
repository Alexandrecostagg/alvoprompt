import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import ScriptLibrary from './components/library/ScriptLibrary'
import ScriptEditor from './components/editor/ScriptEditor'
import PrompterView from './components/prompter/PrompterView'
import VideoEditor from './components/editor/VideoEditor'
import ControlRoom from './components/control/ControlRoom'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="alvog" x1="7" y1="7" x2="41" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="21.5" stroke="url(#alvog)" strokeWidth="3" />
        <circle cx="24" cy="24" r="14.5" stroke="url(#alvog)" strokeWidth="1.5" opacity=".45" />
        <rect x="8" y="21" width="32" height="6" rx="3" fill="var(--accent)" />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-white">
        alvo<span style={{ color: 'var(--accent-2)' }}>prompt</span>
      </span>
    </div>
  )
}

export default function App() {
  const view = useAppStore((s) => s.view)
  const currentScript = useAppStore((s) => s.currentScript)
  const setView = useAppStore((s) => s.setView)

  useEffect(() => {
    void useAppStore.getState().loadScripts()
  }, [])

  if (view === 'prompter') {
    return (
      <div className="h-full">
        <PrompterView />
      </div>
    )
  }

  if (view === 'video-editor') {
    return (
      <div className="h-full">
        <VideoEditor />
      </div>
    )
  }

  if (view === 'control') {
    return (
      <div className="h-full">
        <ControlRoom />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <button onClick={() => setView('library')} className="cursor-pointer">
          <Logo />
        </button>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setView('library')}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{
              background: view === 'library' ? 'var(--panel)' : 'transparent',
              color: view === 'library' ? 'var(--accent)' : 'var(--muted)',
              border: `1px solid ${view === 'library' ? 'var(--border)' : 'transparent'}`,
            }}
          >
            Biblioteca
          </button>
          <button
            onClick={() => setView('editor')}
            disabled={!currentScript}
            className="rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            style={{
              background: view === 'editor' ? 'var(--panel)' : 'transparent',
              color: view === 'editor' ? 'var(--accent)' : 'var(--muted)',
              border: `1px solid ${view === 'editor' ? 'var(--border)' : 'transparent'}`,
            }}
          >
            Editor
          </button>
          <button
            onClick={() => setView('control')}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            🎮 Control Room
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {view === 'library' ? <ScriptLibrary /> : <ScriptEditor />}
      </main>
    </div>
  )
}
