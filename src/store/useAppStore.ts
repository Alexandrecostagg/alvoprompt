import { create } from 'zustand'
import {
  DEFAULT_SETTINGS,
  type AiPanelTab,
  type EngineState,
  type PrompterSettings,
  type Script,
  type View,
  type Workspace,
} from '../lib/types'
import { getScripts, saveScript, deleteScript } from '../lib/db'
import { listWorkspaces } from '../lib/workspace'
import type { CaptionUtterance } from '../lib/srt'

export interface RecordingData {
  blob: Blob
  url: string
  srt: string | null
  utterances: CaptionUtterance[]
}

export interface PrompterStatus {
  state: EngineState
  fraction: number
}

interface AppState {
  view: View
  scripts: Script[]
  currentScript: Script | null
  settings: PrompterSettings
  loading: boolean
  aiPanelTab: AiPanelTab | null
  recording: RecordingData | null
  prompterState: PrompterStatus | null
  workspaces: Workspace[]
  activeWorkspaceId: number | null
  loadScripts: () => Promise<void>
  setView: (view: View) => void
  selectScript: (script: Script | null) => void
  upsertScript: (script: Script) => Promise<number>
  removeScript: (id: number) => Promise<void>
  updateSettings: (patch: Partial<PrompterSettings>) => void
  resetSettings: () => void
  openAiPanel: (tab: AiPanelTab) => void
  closeAiPanel: () => void
  setRecording: (recording: RecordingData | null) => void
  setPrompterState: (state: PrompterStatus | null) => void
  loadWorkspaces: () => Promise<void>
  refreshWorkspaces: () => Promise<void>
  setActiveWorkspace: (id: number | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'library',
  scripts: [],
  currentScript: null,
  settings: DEFAULT_SETTINGS,
  loading: false,
  aiPanelTab: null,
  recording: null,
  prompterState: null,
  workspaces: [],
  activeWorkspaceId: (() => {
    const saved = localStorage.getItem('alvoprompt-active-workspace')
    return saved ? Number(saved) : null
  })(),

  loadScripts: async () => {
    set({ loading: true })
    const scripts = await getScripts()
    set({ scripts, loading: false })
  },

  setView: (view) => set({ view }),

  selectScript: (script) => set({ currentScript: script }),

  upsertScript: async (script) => {
    const id = await saveScript(script)
    const scripts = await getScripts()
    set({ scripts, currentScript: { ...script, id } })
    return id
  },

  removeScript: async (id) => {
    await deleteScript(id)
    const scripts = (await getScripts()).filter((s) => s.id !== id)
    set({
      scripts,
      currentScript: get().currentScript?.id === id ? null : get().currentScript,
    })
  },

  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  openAiPanel: (tab) => set({ aiPanelTab: tab }),

  closeAiPanel: () => set({ aiPanelTab: null }),

  setRecording: (recording) => set({ recording }),

  setPrompterState: (prompterState) => set({ prompterState }),

  loadWorkspaces: async () => {
    const workspaces = await listWorkspaces()
    set({ workspaces })
  },

  refreshWorkspaces: async () => {
    const workspaces = await listWorkspaces()
    const activeWorkspaceId = get().activeWorkspaceId
    const stillExists = workspaces.some((w) => w.id === activeWorkspaceId)
    set({
      workspaces,
      activeWorkspaceId: stillExists ? activeWorkspaceId : workspaces[0]?.id ?? null,
    })
    if (!stillExists) localStorage.removeItem('alvoprompt-active-workspace')
  },

  setActiveWorkspace: (id) => {
    if (id == null) localStorage.removeItem('alvoprompt-active-workspace')
    else localStorage.setItem('alvoprompt-active-workspace', String(id))
    set({ activeWorkspaceId: id })
  },
}))
