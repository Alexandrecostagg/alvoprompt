import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import ScriptLibrary from './components/library/ScriptLibrary'
import ScriptEditor from './components/editor/ScriptEditor'
import PrompterView from './components/prompter/PrompterView'
import VideoEditor from './components/editor/VideoEditor'
import ControlRoom from './components/control/ControlRoom'
import SyncControl from './components/SyncControl'
import SchedulingHub from './components/scheduling/SchedulingHub'
import WorkspacesPanel from './components/workspace/WorkspacesPanel'
import AiTwin from './components/aiTwin/AiTwin'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="alvog" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#alvog)" />
        <g stroke="#fff" strokeLinecap="round" strokeWidth="4.5">
          <path d="M24 16 17.2 34" />
          <path d="M24 16 30.8 34" />
        </g>
        <rect x="18.4" y="25.6" width="11.2" height="4.6" rx="2.3" fill="#fff" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-white">
        alvo<span style={{ color: 'var(--accent-2)' }}>prompt</span>
      </span>
    </div>
  )
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('alvoprompt-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('alvoprompt-theme', theme)
  }, [theme])

  return { theme, toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }
}

export default function App() {
  const view = useAppStore((s) => s.view)
  const currentScript = useAppStore((s) => s.currentScript)
  const setView = useAppStore((s) => s.setView)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    void useAppStore.getState().loadScripts()
    void useAppStore.getState().refreshWorkspaces()
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
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <button onClick={() => setView('library')} className="cursor-pointer">
          <Logo />
        </button>
        <div className="flex flex-wrap items-center gap-1 text-sm">
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
          <button
            onClick={() => setView('scheduling')}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{
              color: view === 'scheduling' ? 'var(--accent)' : 'var(--muted)',
              background: view === 'scheduling' ? 'var(--panel)' : 'transparent',
              border: `1px solid ${view === 'scheduling' ? 'var(--border)' : 'transparent'}`,
            }}
          >
            📅 Agendar
          </button>
          <button
            onClick={() => setView('workspaces')}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{
              color: view === 'workspaces' ? 'var(--accent)' : 'var(--muted)',
              background: view === 'workspaces' ? 'var(--panel)' : 'transparent',
              border: `1px solid ${view === 'workspaces' ? 'var(--border)' : 'transparent'}`,
            }}
          >
            👥 Equipe
          </button>
          <button
            onClick={() => setView('ai-twin')}
            className="rounded-lg px-3 py-1.5 transition-colors"
            style={{
              color: view === 'ai-twin' ? 'var(--accent)' : 'var(--muted)',
              background: view === 'ai-twin' ? 'var(--panel)' : 'transparent',
              border: `1px solid ${view === 'ai-twin' ? 'var(--border)' : 'transparent'}`,
            }}
          >
            🤖 AI Twin
          </button>
          <button
            onClick={toggleTheme}
            className="ml-1 rounded-lg border px-2.5 py-1.5 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <SyncControl />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {view === 'library' ? <ScriptLibrary /> : null}
        {view === 'editor' ? <ScriptEditor /> : null}
        {view === 'scheduling' ? <SchedulingHub /> : null}
        {view === 'workspaces' ? <WorkspacesPanel /> : null}
        {view === 'ai-twin' ? <AiTwin /> : null}
      </main>
    </div>
  )
}
