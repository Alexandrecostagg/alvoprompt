import { db, getAvatars, getVoiceProfiles, newKey, saveAvatar, saveVoiceProfile } from './db'
import type { AvatarTwin, VoiceProfile, VoiceSample } from './types'

export async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não consegui carregar a imagem.'))
    img.src = dataUrl
  })
}

/** Reduz uma imagem/arquivo para dataUrl pequena (avatar). */
export async function fileToAvatarDataUrl(file: File, maxSize = 1024): Promise<string> {
  const img = await loadImage(URL.createObjectURL(file))
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível.')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = new AudioContext()
  try {
    return await ctx.decodeAudioData(await blob.arrayBuffer())
  } finally {
    void ctx.close()
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler o áudio.'))
    reader.readAsDataURL(blob)
  })
}

export interface TalkingAvatarOptions {
  image: HTMLImageElement
  width: number
  height: number
  /** 1 = enquadra o rosto inteiro; maior = aproxima (crop). */
  zoom?: number
  /** Fração vertical do ponto de foco (0..1). 0.3 mantém o rosto no terço superior. */
  focusY?: number
  motion?: 'subtle' | 'breathing' | 'none'
  onProgress?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

const MIME_PREFERRED = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']

function pickMime(): string {
  return MIME_PREFERRED.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? 'video/webm'
}

/**
 * Avatar falante 100% local: anima uma foto (respiração + "boca" sincronizada
 * com a amplitude do áudio) e grava vídeo com o áudio embutido — sem servidor.
 */
export class TalkingAvatar {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private opts: Required<Omit<TalkingAvatarOptions, 'onProgress' | 'onEnded'>>
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private buffer: AudioBuffer | null = null
  private source: AudioBufferSourceNode | null = null
  private raf = 0
  private startTime = 0
  private pausedAt = 0
  private recording = false
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private ended = false
  private onProgress?: (currentTime: number, duration: number) => void
  private onEnded?: () => void

  constructor(canvas: HTMLCanvasElement, options: TalkingAvatarOptions) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponível.')
    this.ctx = ctx
    this.opts = {
      zoom: options.zoom ?? 1.1,
      focusY: options.focusY ?? 0.3,
      motion: options.motion ?? 'breathing',
      image: options.image,
      width: options.width,
      height: options.height,
    }
    this.onProgress = options.onProgress
    this.onEnded = options.onEnded
    canvas.width = options.width
    canvas.height = options.height
  }

  get duration(): number {
    return this.buffer ? this.buffer.duration : 0
  }

  get currentTime(): number {
    if (!this.audioCtx || !this.buffer) return 0
    if (this.audioCtx.state === 'running' && !this.ended) {
      return (this.audioCtx.currentTime - this.startTime + this.pausedAt) % this.buffer.duration
    }
    return this.pausedAt
  }

  private async ensureCtx(): Promise<void> {
    if (this.audioCtx) return
    this.audioCtx = new AudioContext()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.55
    this.analyser.connect(this.audioCtx.destination)
  }

  async loadAudio(blob: Blob): Promise<void> {
    this.buffer = await decodeAudioBlob(blob)
    this.ended = false
    this.pausedAt = 0
  }

  async start(): Promise<void> {
    if (!this.buffer) throw new Error('Carregue o áudio antes de iniciar.')
    await this.ensureCtx()
    this.audioCtx!.resume()
    this.source = this.audioCtx!.createBufferSource()
    this.source.buffer = this.buffer
    this.source.connect(this.analyser!)
    this.startTime = this.audioCtx!.currentTime - this.pausedAt
    this.source.start(0, this.pausedAt % this.buffer.duration)
    this.source.onended = () => this.handleEnded()
    this.ended = false
    this.tick()
  }

  pause(): void {
    if (this.source && this.audioCtx) {
      this.pausedAt = this.currentTime
      try {
        this.source.stop()
      } catch {
        /* já parado */
      }
      this.source.disconnect()
      this.source = null
      this.audioCtx.suspend()
    }
    cancelAnimationFrame(this.raf)
  }

  stop(): void {
    this.pause()
    this.pausedAt = 0
    this.ended = false
  }

  private handleEnded(): void {
    cancelAnimationFrame(this.raf)
    this.ended = true
    this.pausedAt = this.duration
    this.onEnded?.()
  }

  private amp(): number {
    if (!this.analyser || !this.audioCtx || this.audioCtx.state !== 'running') return 0
    const data = new Uint8Array(this.analyser.fftSize)
    this.analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length)
    return Math.min(1, rms * 3.2)
  }

  private draw(t: number, amp: number): void {
    const { width: w, height: h, image: img, zoom, focusY, motion } = this.opts
    const ctx = this.ctx
    ctx.fillStyle = '#0b0d12'
    ctx.fillRect(0, 0, w, h)

    // enquadra "capa" respeitando o foco vertical (rosto no terço superior)
    const baseScale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const scale = baseScale * zoom
    const drawW = img.naturalWidth * scale
    const drawH = img.naturalHeight * scale
    const focus = Math.max(0, Math.min(1, focusY))
    let x = (w - drawW) / 2
    let y = focus * (h - drawH)

    // respiração + boca sincronizada com a amplitude
    let sx = 1
    let sy = 1
    let bob = 0
    if (motion === 'breathing' || motion === 'subtle') {
      const breath = Math.sin(t * 0.9) * 0.01
      sx = 1 + breath
      sy = 1 + breath
      if (amp > 0.02) {
        const speech = amp * 0.05
        sy *= 1 + speech * Math.sin(t * 9)
        sx *= 1 - speech * 0.4
      }
      bob = Math.sin(t * 1.3) * Math.max(2, h * 0.004)
    }
    const cx = x + drawW / 2
    const cy = y + drawH / 2
    ctx.translate(cx, cy + bob)
    ctx.scale(sx, sy)
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // indicador de "falando" sutil no canto
    if (amp > 0.05) {
      ctx.globalAlpha = 0.85
      const bars = 3
      const bw = 5
      const gap = 3
      const total = bars * bw + (bars - 1) * gap
      const bx = w / 2 - total / 2
      const by = h - 18
      for (let i = 0; i < bars; i++) {
        const ba = Math.max(0.2, Math.sin(t * 10 + i) * 0.5 + 0.5) * (amp + 0.25)
        ctx.fillStyle = '#22d3ee'
        ctx.fillRect(bx + i * (bw + gap), by - ba * 10, bw, ba * 10)
      }
      ctx.globalAlpha = 1
    }
  }

  private tick = (): void => {
    if (this.ended) return
    const t = performance.now() / 1000
    const cur = this.currentTime
    this.onProgress?.(cur, this.duration)
    this.draw(t, this.amp())
    this.raf = requestAnimationFrame(this.tick)
  }

  /** Começa a gravar o vídeo (imagem + áudio). */
  startRecording(): void {
    if (this.recording) return
    this.recording = true
    this.chunks = []
    const stream = this.canvas.captureStream(30)
    if (this.audioCtx) {
      const dest = this.audioCtx.createMediaStreamDestination()
      this.analyser?.disconnect()
      this.analyser?.connect(dest)
      this.analyser?.connect(this.audioCtx.destination)
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
    }
    const mime = pickMime()
    this.recorder = new MediaRecorder(stream, mime.startsWith('video/mp4') ? undefined : { mimeType: mime, videoBitsPerSecond: 6_000_000 })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(200)
  }

  /** Para a gravação e devolve o vídeo (WebM/MP4). */
  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.recorder || !this.recording) {
        this.recording = false
        resolve(null)
        return
      }
      this.recorder.onstop = () => {
        this.recording = false
        if (this.audioCtx) {
          const dest = this.audioCtx.createMediaStreamDestination()
          this.analyser?.disconnect()
          this.analyser?.connect(dest)
          this.analyser?.connect(this.audioCtx.destination)
        }
        const type = this.recorder?.mimeType || 'video/webm'
        resolve(new Blob(this.chunks, { type }))
      }
      this.recorder.stop()
    })
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    if (this.source) {
      try {
        this.source.stop()
      } catch {
        /* já parado */
      }
    }
    if (this.audioCtx) void this.audioCtx.close()
    this.audioCtx = null
    this.analyser = null
  }
}

// ---- CRUD de avatares e perfis de voz ----

export async function listAvatars(): Promise<AvatarTwin[]> {
  return getAvatars()
}

export async function upsertAvatar(avatar: AvatarTwin): Promise<number> {
  return saveAvatar(avatar)
}

export async function removeAvatar(id: number): Promise<void> {
  await db.avatars.delete(id)
}

export async function listVoiceProfiles(): Promise<VoiceProfile[]> {
  return getVoiceProfiles()
}

export async function upsertVoiceProfile(profile: VoiceProfile): Promise<number> {
  return saveVoiceProfile(profile)
}

export async function removeVoiceProfile(id: number): Promise<void> {
  await db.voiceProfiles.delete(id)
}

export async function createAvatar(name: string, dataUrl: string, source: AvatarTwin['source']): Promise<number> {
  return saveAvatar({ key: newKey('a'), name, imageDataUrl: dataUrl, source, createdAt: Date.now() })
}

export async function createVoiceProfile(name: string, samples: VoiceSample[], lang: string): Promise<number> {
  return saveVoiceProfile({ key: newKey('v'), name, samples, lang, createdAt: Date.now() })
}

// ---- Gravação de amostras de voz (clone de voz) ----

export class VoiceRecorder {
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private timer = 0
  private startedAt = 0

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = ['audio/webm', 'audio/mp4', ''].find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? ''
    this.recorder = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined)
    this.chunks = []
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.startedAt = Date.now()
    this.recorder.start()
    this.timer = window.setInterval(() => {
      this.onTick?.((Date.now() - this.startedAt) / 1000)
    }, 200)
  }

  onTick: ((seconds: number) => void) | null = null

  async stop(): Promise<VoiceSample> {
    clearInterval(this.timer)
    const duration = (Date.now() - this.startedAt) / 1000
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('Gravação não iniciada.'))
        return
      }
      this.recorder.onstop = async () => {
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null
        const type = this.recorder?.mimeType || 'audio/webm'
        const blob = new Blob(this.chunks, { type })
        const dataUrl = await blobToDataUrl(blob)
        resolve({ dataUrl, duration })
      }
      this.recorder.stop()
    })
  }

  cancel(): void {
    clearInterval(this.timer)
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.onstop = null
      this.recorder.stop()
    }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/s)
  if (!m) return null
  try {
    const bytes = atob(m[2]!)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new Blob([arr], { type: m[1] ?? 'audio/webm' })
  } catch {
    return null
  }
}
