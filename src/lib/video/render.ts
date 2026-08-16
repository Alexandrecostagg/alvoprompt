export type CaptionThemeKey = 'cinema' | 'social' | 'box' | 'none'

export interface CaptionTheme {
  key: CaptionThemeKey
  label: string
  color: string
  stroke: string
  strokeWidth: number
  fontSizePct: number
  background: string | null
}

export const CAPTION_THEMES: CaptionTheme[] = [
  {
    key: 'cinema',
    label: 'Cinema',
    color: '#ffffff',
    stroke: 'rgba(0,0,0,0.9)',
    strokeWidth: 6,
    fontSizePct: 5,
    background: null,
  },
  {
    key: 'social',
    label: 'Social',
    color: '#ffe066',
    stroke: 'rgba(0,0,0,0.95)',
    strokeWidth: 7,
    fontSizePct: 7,
    background: null,
  },
  {
    key: 'box',
    label: 'Com fundo',
    color: '#ffffff',
    stroke: '',
    strokeWidth: 0,
    fontSizePct: 5,
    background: 'rgba(0,0,0,0.65)',
  },
  {
    key: 'none',
    label: 'Sem legenda',
    color: '#ffffff',
    stroke: 'rgba(0,0,0,0.9)',
    strokeWidth: 0,
    fontSizePct: 0,
    background: null,
  },
]

export interface CaptionCue {
  start: number
  end: number
  text: string
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface LogoOverlay {
  image: HTMLImageElement
  position: LogoPosition
  widthPct: number
  opacity: number
}

export interface BackgroundMusic {
  buffer: AudioBuffer
  volume: number
}

export type MotionPreset = 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right'

export const MOTION_PRESETS: { value: MotionPreset; label: string }[] = [
  { value: 'none', label: 'Sem movimento' },
  { value: 'zoom-in', label: 'Zoom in' },
  { value: 'zoom-out', label: 'Zoom out' },
  { value: 'pan-left', label: 'Pan → esq' },
  { value: 'pan-right', label: 'Pan → dir' },
]

export interface ChromaKeyConfig {
  color: string
  similarity: number
  smoothness: number
  bgColor: string
}

export interface VideoCrop {
  sx: number
  sy: number
  sw: number
  sh: number
}

export interface RenderRange {
  start: number
  end: number
}

export interface RenderConfig {
  sourceBlob: Blob
  targetWidth: number
  targetHeight: number
  crop: VideoCrop
  keepRanges: RenderRange[]
  captions: CaptionCue[]
  theme: CaptionTheme
  logo?: LogoOverlay
  music?: BackgroundMusic
  motion?: MotionPreset
  chroma?: ChromaKeyConfig
  fps?: number
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

export function computeCrop(srcW: number, srcH: number, targetW: number, targetH: number): VideoCrop {
  const srcA = srcW / srcH
  const targetA = targetW / targetH
  if (srcA > targetA) {
    const sw = srcH * targetA
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH }
  }
  const sh = srcW / targetA
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh }
}

function findCue(cues: CaptionCue[], t: number): CaptionCue | null {
  for (const cue of cues) {
    if (t >= cue.start && t < cue.end) return cue
  }
  return null
}

/**
 * Aplica o preset de movimento (zoom/pan) ao crop base ao longo de um trecho.
 * f vai de 0 (início do trecho) a 1 (fim do trecho).
 */
export function applyMotion(base: VideoCrop, motion: MotionPreset, f: number, srcW: number, srcH: number): VideoCrop {
  if (motion === 'none') return base
  const cx = base.sx + base.sw / 2
  const cy = base.sy + base.sh / 2
  let scale = 1
  let dx = 0
  switch (motion) {
    case 'zoom-in':
      scale = 1 + 0.25 * f
      break
    case 'zoom-out':
      scale = 1.25 - 0.25 * f
      break
    case 'pan-left':
      dx = -base.sw * 0.25 * f
      break
    case 'pan-right':
      dx = base.sw * 0.25 * f
      break
  }
  let sw = base.sw / scale
  let sh = base.sh / scale
  let sx = cx - sw / 2 + dx
  let sy = cy - sh / 2 + (motion === 'pan-left' || motion === 'pan-right' ? 0 : 0)
  if (sx < 0) sx = 0
  if (sy < 0) sy = 0
  if (sx + sw > srcW) sx = srcW - sw
  if (sy + sh > srcH) sy = srcH - sh
  return { sx, sy, sw, sh }
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Remove o fundo verde/azul (chroma key) de um ImageData, zerando o alfa
 * dos pixels próximos da cor-chave. "similarity" controla quanto é removido
 * e "smoothness" suaviza as bordas.
 */
export function chromaKeyPixels(data: Uint8ClampedArray, chroma: ChromaKeyConfig) {
  const [kr, kg, kb] = hexToRgb(chroma.color)
  const sim = Math.max(0, Math.min(1, chroma.similarity / 100))
  const smooth = Math.max(0, Math.min(1, chroma.smoothness / 100))
  const threshold = 0.72 - 0.5 * sim
  const soft = 0.08 + 0.45 * smooth
  const keyDistScale = 1 / Math.sqrt(3 * 255 * 255)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    let green = 0
    if (g >= r && g >= b) {
      green = (g - Math.max(r, b)) / 255
    }
    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) * keyDistScale
    const keyness = Math.min(1, green * 2) * sat * (1 - dist)
    let a = (threshold - keyness) / Math.max(0.01, soft)
    if (a < 0) a = 0
    else if (a > 1) a = 1
    data[i + 3] = Math.round(a * 255)
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  theme: CaptionTheme,
  w: number,
  h: number,
) {
  const size = Math.round((h * theme.fontSizePct) / 100)
  if (size < 10) return
  const fontSize = Math.min(size, Math.round(w / (text.length * 0.6)))
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const x = w / 2
  const y = h - Math.max(28, fontSize * 1.1)
  if (theme.background) {
    const padX = fontSize * 0.5
    const bw = ctx.measureText(text).width + padX * 2
    const bh = fontSize * 1.7
    ctx.fillStyle = theme.background
    roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, fontSize * 0.3)
    ctx.fill()
  } else if (theme.strokeWidth > 0) {
    ctx.lineJoin = 'round'
    ctx.strokeStyle = theme.stroke
    ctx.lineWidth = theme.strokeWidth
    ctx.strokeText(text, x, y)
  }
  ctx.fillStyle = theme.color
  ctx.fillText(text, x, y)
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: LogoOverlay,
  w: number,
  h: number,
) {
  const img = logo.image
  if (!img.naturalWidth) return
  const pad = Math.max(16, w * 0.02)
  const logoW = Math.min(w * (logo.widthPct / 100), img.naturalWidth)
  const logoH = logoW * (img.naturalHeight / img.naturalWidth)
  let x = pad
  let y = pad
  if (logo.position === 'top-right' || logo.position === 'bottom-right') x = w - logoW - pad
  if (logo.position === 'bottom-left' || logo.position === 'bottom-right') y = h - logoH - pad
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, logo.opacity))
  ctx.drawImage(img, x, y, logoW, logoH)
  ctx.restore()
}

const MIME_PREFERRED = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
]

/**
 * Processa o vídeo gravado no navegador: recorta para a proporção alvo,
 * remove os trechos fora dos keepRanges e opcionalmente queima as legendas
 * com o tema escolhido. Usa canvas.captureStream + MediaRecorder, então roda
 * em tempo real (sem WebCodecs) e é compatível com Chrome/Edge/Safari.
 */
export async function renderVideo(cfg: RenderConfig): Promise<Blob> {
  const url = URL.createObjectURL(cfg.sourceBlob)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = false
  video.volume = 0
  video.playsInline = true
  video.src = url

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Não foi possível abrir o vídeo para edição.'))
    video.load()
  })

  const canvas = document.createElement('canvas')
  canvas.width = cfg.targetWidth
  canvas.height = cfg.targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador.')

  const fps = cfg.fps ?? 30
  const canvasStream = canvas.captureStream(fps)
  const out = new MediaStream()
  out.addTrack(canvasStream.getVideoTracks()[0]!)

  // Áudio: se há música de fundo ou áudio do vídeo, roteia via Web Audio
  // para permitir mixar as duas fontes.
  let actx: AudioContext | null = null
  let musicNode: AudioBufferSourceNode | null = null
  const elStream = (
    video as HTMLVideoElement & { captureStream?: () => MediaStream }
  ).captureStream?.()
  const hasElAudio = (elStream?.getAudioTracks().length ?? 0) > 0

  if (cfg.music || hasElAudio) {
    actx = new AudioContext()
    const dest = actx.createMediaStreamDestination()
    if (hasElAudio) {
      try {
        actx.createMediaElementSource(video).connect(dest)
      } catch {
        // elemento já roteado; usa captureStream como fallback
        for (const t of elStream?.getAudioTracks() ?? []) out.addTrack(t)
      }
    }
    if (cfg.music) {
      musicNode = actx.createBufferSource()
      musicNode.buffer = cfg.music.buffer
      const gain = actx.createGain()
      gain.gain.value = Math.max(0, Math.min(1, cfg.music.volume))
      musicNode.connect(gain)
      gain.connect(dest)
      musicNode.start()
    }
    for (const t of dest.stream.getAudioTracks()) out.addTrack(t)
    void actx.resume()
  } else {
    for (const t of elStream?.getAudioTracks() ?? []) out.addTrack(t)
  }

  const mime = MIME_PREFERRED.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
  const rec = mime
    ? new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 12_000_000 })
    : new MediaRecorder(out)

  return new Promise<Blob>((resolve, reject) => {
    const chunks: Blob[] = []
    let done = false

    const cleanup = () => {
      if (done) return
      done = true
      video.pause()
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      out.getTracks().forEach((t) => t.stop())
      musicNode?.stop()
      if (actx && actx.state !== 'closed') void actx.close()
    }

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' })
      cleanup()
      resolve(blob)
    }
    rec.onerror = () => {
      cleanup()
      reject(new Error('Erro ao processar o vídeo. Tente outro navegador ou formato.'))
    }

    const total = cfg.keepRanges.reduce((s, r) => s + (r.end - r.start), 0)
    let completed = 0
    let rangeIdx = 0

    let keyCanvas: HTMLCanvasElement | null = null
    let keyCtx: CanvasRenderingContext2D | null = null

    const drawChroma = (
      out: CanvasRenderingContext2D,
      crop: VideoCrop,
      chroma: ChromaKeyConfig,
      outW: number,
      outH: number,
    ) => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return
      const scale = Math.min(1, 1280 / Math.max(vw, vh))
      const kw = Math.max(2, Math.round(vw * scale))
      const kh = Math.max(2, Math.round(vh * scale))
      if (!keyCanvas) {
        keyCanvas = document.createElement('canvas')
        keyCanvas.width = kw
        keyCanvas.height = kh
        keyCtx = keyCanvas.getContext('2d', { willReadFrequently: true })
      } else if (keyCanvas.width !== kw || keyCanvas.height !== kh) {
        keyCanvas.width = kw
        keyCanvas.height = kh
      }
      if (!keyCtx) return
      keyCtx.clearRect(0, 0, kw, kh)
      keyCtx.drawImage(video, 0, 0, kw, kh)
      const img = keyCtx.getImageData(0, 0, kw, kh)
      chromaKeyPixels(img.data, chroma)
      keyCtx.putImageData(img, 0, 0)
      out.fillStyle = chroma.bgColor
      out.fillRect(0, 0, outW, outH)
      out.drawImage(
        keyCanvas,
        crop.sx * scale,
        crop.sy * scale,
        crop.sw * scale,
        crop.sh * scale,
        0,
        0,
        outW,
        outH,
      )
    }

    const draw = (fraction: number) => {
      const crop = cfg.motion
        ? applyMotion(cfg.crop, cfg.motion, fraction, video.videoWidth, video.videoHeight)
        : cfg.crop
      const t = video.currentTime
      ctx.save()
      if (cfg.chroma) {
        drawChroma(ctx, crop, cfg.chroma, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          video,
          crop.sx,
          crop.sy,
          crop.sw,
          crop.sh,
          0,
          0,
          canvas.width,
          canvas.height,
        )
      }
      if (cfg.theme.key !== 'none') {
        const cue = findCue(cfg.captions, t)
        if (cue) drawCaption(ctx, cue.text, cfg.theme, canvas.width, canvas.height)
      }
      if (cfg.logo) drawLogo(ctx, cfg.logo, canvas.width, canvas.height)
      ctx.restore()
    }

    const playNext = () => {
      if (done) return
      if (rangeIdx >= cfg.keepRanges.length) {
        if (rec.state !== 'inactive') rec.stop()
        return
      }
      if (cfg.signal?.aborted) {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const range = cfg.keepRanges[rangeIdx]!

      const onSeeked = async () => {
        video.removeEventListener('seeked', onSeeked)
        try {
          await video.play()
        } catch (err) {
          video.muted = true
          try {
            await video.play()
          } catch {
            cleanup()
            reject(err instanceof Error ? err : new Error('Falha ao reproduzir o vídeo.'))
            return
          }
        }

        const onFrame = () => {
          if (done) return
          const pos = Math.min(video.currentTime, range.end) - range.start
          const rangeDur = Math.max(0.001, range.end - range.start)
          draw(Math.min(1, pos / rangeDur))
          cfg.onProgress?.(total ? Math.min(1, (completed + pos) / total) : 1)
          if (video.currentTime >= range.end || video.ended) {
            completed += Math.min(range.end, video.duration) - range.start
            rangeIdx++
            video.pause()
            playNext()
          } else if (typeof video.requestVideoFrameCallback === 'function') {
            video.requestVideoFrameCallback(onFrame)
          } else {
            requestAnimationFrame(onFrame)
          }
        }
        onFrame()

        const onEnded = () => {
          if (done || rangeIdx >= cfg.keepRanges.length) return
          completed += Math.min(range.end, video.duration) - range.start
          rangeIdx++
          video.pause()
          playNext()
        }
        video.addEventListener('ended', onEnded)
      }

      video.addEventListener('seeked', onSeeked)
      video.currentTime = range.start
    }

    rec.start(500)
    playNext()
  })
}
