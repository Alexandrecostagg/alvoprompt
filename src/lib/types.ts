export interface Script {
  id?: number
  /** Identificador estável entre dispositivos (UUID). Usado pelo sync em nuvem. */
  key?: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  tags?: string[]
}

export type View = 'library' | 'editor' | 'prompter' | 'video-editor' | 'control'

export type AiPanelTab = 'generate' | 'improve' | 'titles'

export type ScrollMode = 'voice' | 'fixed' | 'manual' | 'timed'

export type AspectGuideRatio = 'none' | '9:16' | '1:1' | '16:9'

export interface PrompterSettings {
  mode: ScrollMode
  wpm: number
  targetMinutes: number
  fontSize: number
  lineHeight: number
  fontColor: string
  bgColor: string
  fontFamily: string
  letterSpacing: number
  mirror: boolean
  rtl: boolean
  cameraOn: boolean
  cameraPosition: 'top' | 'bottom'
  aspectGuide: AspectGuideRatio
  eyeContactDot: boolean
  voiceLang: string
  voiceSensitivity: number
  openMic: boolean
  highlightWords: boolean
}

export const DEFAULT_SETTINGS: PrompterSettings = {
  mode: 'voice',
  wpm: 150,
  targetMinutes: 3,
  fontSize: 48,
  lineHeight: 1.6,
  fontColor: '#ffffff',
  bgColor: '#000000',
  fontFamily: 'system-ui, sans-serif',
  letterSpacing: 0,
  mirror: false,
  rtl: false,
  cameraOn: false,
  cameraPosition: 'bottom',
  aspectGuide: 'none',
  eyeContactDot: false,
  voiceLang: 'pt-BR',
  voiceSensitivity: 0.6,
  openMic: false,
  highlightWords: true,
}

export type EngineState = 'idle' | 'running' | 'paused' | 'done'
