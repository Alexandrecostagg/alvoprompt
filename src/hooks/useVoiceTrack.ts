import { useCallback, useEffect, useRef, useState } from 'react'
import { similarity, type WordToken } from '../lib/text'
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '../lib/speech'

interface VoiceTrackOptions {
  words: WordToken[]
  enabled: boolean
  lang: string
  sensitivity: number
  onWordMatch: (index: number) => void
  onSpeechActivity: (active: boolean) => void
  onUtterance?: (text: string) => void
}

const SILENCE_MS = 1800
const AHEAD_WINDOW = 8
const BEHIND_WINDOW = 3

export function useVoiceTrack({
  words,
  enabled,
  lang,
  sensitivity,
  onWordMatch,
  onSpeechActivity,
  onUtterance,
}: VoiceTrackOptions) {
  const [supported] = useState(() => getSpeechRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const runningRef = useRef(false)
  const pointerRef = useRef(0)
  const activeRef = useRef(false)
  const silenceTimerRef = useRef<number | null>(null)
  const exactMapRef = useRef<Map<string, number[]>>(new Map())
  const cbRef = useRef({ words, onWordMatch, onSpeechActivity, sensitivity, lang, onUtterance })
  cbRef.current = { words, onWordMatch, onSpeechActivity, sensitivity, lang, onUtterance }

  useEffect(() => {
    const map = new Map<string, number[]>()
    for (const w of words) {
      if (!w.normalized) continue
      const list = map.get(w.normalized)
      if (list) list.push(w.index)
      else map.set(w.normalized, [w.index])
    }
    exactMapRef.current = map
    pointerRef.current = 0
  }, [words])

  const markActive = useCallback(() => {
    if (!activeRef.current) {
      activeRef.current = true
      cbRef.current.onSpeechActivity(true)
    }
    if (silenceTimerRef.current != null) window.clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = window.setTimeout(() => {
      activeRef.current = false
      cbRef.current.onSpeechActivity(false)
    }, SILENCE_MS)
  }, [])

  const processText = useCallback(
    (text: string) => {
      const { words, onWordMatch, sensitivity } = cbRef.current
      if (!words.length) return
      const tokens = text.split(/\s+/).filter(Boolean)
      let pointer = pointerRef.current
      for (const token of tokens) {
        let bestIdx = -1
        let bestScore = sensitivity
        const from = Math.max(0, pointer - BEHIND_WINDOW)
        const to = Math.min(words.length - 1, pointer + AHEAD_WINDOW)
        for (let i = from; i <= to; i++) {
          const score = similarity(token, words[i].normalized)
          if (score > bestScore) {
            bestScore = score
            bestIdx = i
          }
        }
        if (bestIdx < 0) {
          const candidates = exactMapRef.current.get(token.toLowerCase())
          if (candidates?.length) {
            const nearest = candidates.reduce((a, b) =>
              Math.abs(a - pointer) <= Math.abs(b - pointer) ? a : b,
            )
            if (Math.abs(nearest - pointer) > AHEAD_WINDOW) {
              bestIdx = nearest
            }
          }
        }
        if (bestIdx >= pointer) {
          pointer = bestIdx + 1
          onWordMatch(bestIdx)
        }
      }
      pointerRef.current = Math.min(pointer, words.length)
    },
    [],
  )

  const handleResult = useCallback(
    (event: SpeechRecognitionEventLike) => {
      markActive()
      const { onUtterance } = cbRef.current
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r?.isFinal) {
          const text = String(r[0]?.transcript ?? '').trim()
          if (text) onUtterance?.(text)
        }
        processText(String(event.results[i]?.[0]?.transcript ?? ''))
      }
    },
    [markActive, processText],
  )

  const stop = useCallback(() => {
    runningRef.current = false
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setListening(false)
    if (silenceTimerRef.current != null) window.clearTimeout(silenceTimerRef.current)
    activeRef.current = false
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || runningRef.current) return
    setError(null)
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = cbRef.current.lang
    rec.onresult = handleResult
    rec.onend = () => {
      if (!runningRef.current) return
      window.setTimeout(() => {
        if (runningRef.current) {
          try {
            rec.start()
          } catch {
            /* already started */
          }
        }
      }, 150)
    }
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        runningRef.current = false
        setListening(false)
        setError('Permissão de microfone negada. Habilite o microfone para usar o VoiceTrack.')
        return
      }
      if (event.error === 'no-speech') return
    }
    recognitionRef.current = rec
    try {
      rec.start()
      runningRef.current = true
      setListening(true)
    } catch {
      setError('Não foi possível iniciar o reconhecimento de voz neste navegador.')
    }
  }, [handleResult])

  const reset = useCallback(() => {
    pointerRef.current = 0
  }, [])

  useEffect(() => {
    if (!enabled) stop()
  }, [enabled, stop])

  useEffect(() => () => stop(), [stop])

  return { supported, listening, error, start, stop, reset }
}
