import type { CaptionUtterance } from './srt'
import type { RenderRange } from './video/render'

export interface WordTiming {
  word: string
  start: number
  end: number
}

/**
 * Velocidade média de fala usada para estimar a duração de cada palavra a
 * partir do número de caracteres (~13 caracteres por segundo, ≈ 150 wpm).
 */
export const CHARS_PER_SECOND = 13

/**
 * Estima o timeline por palavra a partir das falas reconhecidas. A Web Speech
 * API entrega apenas o instante em que cada frase foi reconhecida (≈ fim da
 * fala), então a duração de cada palavra é proporcional aos caracteres e o
 * bloco termina em `at`. Com isso conseguimos medir as pausas entre palavras
 * e cortá-las automaticamente.
 */
export function estimateWordTimings(utterances: CaptionUtterance[]): WordTiming[] {
  const clean = utterances
    .map((u) => ({ text: u.text.trim().replace(/\s+/g, ' '), at: u.at }))
    .filter((u) => u.text.length > 0 && Number.isFinite(u.at))
    .sort((a, b) => a.at - b.at)

  if (!clean.length) return []

  let lastAt = 0
  const paced = clean.map((u) => {
    const at = Math.max(u.at, lastAt)
    lastAt = at
    return { text: u.text, at }
  })

  const words: WordTiming[] = []
  for (let i = 0; i < paced.length; i++) {
    const u = paced[i]!
    const tokens = u.text.split(' ').filter(Boolean)
    if (!tokens.length) continue
    const chars = tokens.reduce((s, t) => s + t.length, 0)
    const baseDur = chars / CHARS_PER_SECOND
    const nextAt = i + 1 < paced.length ? paced[i + 1]!.at : u.at + Math.max(1.5, baseDur)
    const dur = Math.min(baseDur, Math.max(0.05, nextAt - u.at))
    let cursor = Math.max(0, u.at - dur)
    for (const tok of tokens) {
      const wdur = (tok.length / chars) * dur
      words.push({ word: tok, start: cursor, end: cursor + wdur })
      cursor += wdur
    }
  }

  return words.sort((a, b) => a.start - b.start)
}

export interface AutoCutOptions {
  /** Pausas maiores que isso (em segundos) são cortadas. */
  minSilence: number
  /** Margem (em segundos) mantida antes/depois de cada bloco de fala. */
  pad: number
}

/**
 * Gera os trechos a manter (keepRanges) removendo as pausas maiores que
 * `minSilence` entre palavras faladas. Palavras próximas são agrupadas num
 * mesmo trecho.
 */
export function autoCutRanges(words: WordTiming[], opts: AutoCutOptions): RenderRange[] {
  if (!words.length) return []
  const { minSilence, pad } = opts
  const ranges: RenderRange[] = []
  let start = Math.max(0, words[0]!.start - pad)
  let end = words[0]!.end + pad
  for (let i = 1; i < words.length; i++) {
    const w = words[i]!
    if (w.start - end > minSilence) {
      ranges.push({ start, end })
      start = Math.max(0, w.start - pad)
      end = w.end + pad
    } else {
      end = Math.max(end, w.end + pad)
    }
  }
  ranges.push({ start, end })
  return ranges
}

/** Duração total (s) de um conjunto de trechos. */
export function totalRangesDuration(ranges: RenderRange[]): number {
  return ranges.reduce((s, r) => s + Math.max(0, r.end - r.start), 0)
}

export interface AudioSpeechOptions {
  /** Pausas maiores que isso (em segundos) são cortadas. */
  minSilence: number
  /** Margem (em segundos) mantida antes/depois de cada bloco de fala. */
  pad: number
  /** Limiar em dB relativo ao pico (ex.: -30). Menos negativo = mais sensível. */
  thresholdDb: number
  /** Tamanho da janela de análise RMS em ms. */
  windowMs?: number
}

function mixDown(buffer: AudioBuffer): Float32Array {
  const n = buffer.length
  const out = new Float32Array(n)
  const chs = buffer.numberOfChannels
  for (let c = 0; c < chs; c++) {
    const d = buffer.getChannelData(c)
    for (let i = 0; i < n; i++) out[i] += d[i]
  }
  if (chs > 1) for (let i = 0; i < n; i++) out[i] /= chs
  return out
}

/**
 * Detecta os trechos com som (fala/música) do áudio de uma gravação por RMS,
 * gerando keepRanges que removem silêncios. Não depende de transcrição.
 */
export function detectSpeechRanges(buffer: AudioBuffer, opts: AudioSpeechOptions): RenderRange[] {
  const { minSilence, pad, thresholdDb } = opts
  const windowMs = opts.windowMs ?? 50
  const sr = buffer.sampleRate
  const win = Math.max(1, Math.floor((sr * windowMs) / 1000))
  const step = Math.max(1, Math.floor(win / 2))
  const n = buffer.length
  const mix = mixDown(buffer)
  const dur = n / sr

  let peak = 0
  const rms: number[] = []
  for (let off = 0; off < n; off += step) {
    const end = Math.min(n, off + win)
    let sum = 0
    for (let i = off; i < end; i++) sum += mix[i]! * mix[i]!
    const v = Math.sqrt(sum / (end - off))
    rms.push(v)
    if (v > peak) peak = v
  }
  if (peak === 0) return []

  const threshold = peak * Math.pow(10, thresholdDb / 20)
  const ranges: RenderRange[] = []
  let cur: RenderRange | null = null
  for (let i = 0; i < rms.length; i++) {
    if (rms[i]! > threshold) {
      const s = (i * step) / sr
      const e = Math.min(dur, (i * step + win) / sr)
      if (!cur) {
        cur = { start: s, end: e }
      } else if (s - cur.end > minSilence) {
        ranges.push(cur)
        cur = { start: s, end: e }
      } else {
        cur.end = e
      }
    }
  }
  if (cur) ranges.push(cur)

  return ranges.map((r) => ({
    start: Math.max(0, r.start - pad),
    end: Math.min(dur, r.end + pad),
  }))
}
