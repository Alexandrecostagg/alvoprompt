import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeechRecognitionCtor,
  speechRecognitionSupported,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '../lib/speech'

/**
 * Transcrição de fala em tempo real (modos fixo/manual, quando o VoiceTrack
 * não está usando o microfone). Entrega apenas resultados finais; o timing é
 * calculado por quem consome, a partir do instante de chegada de cada fala.
 */
export function useTranscription() {
  const [supported] = useState(() => speechRecognitionSupported())
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const runningRef = useRef(false)
  const onUtteranceRef = useRef<((text: string) => void) | null>(null)

  const handleResult = useCallback((event: SpeechRecognitionEventLike) => {
    const cb = onUtteranceRef.current
    if (!cb) return
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i]
      if (r && r.isFinal) {
        const text = String(r[0]?.transcript ?? '').trim()
        if (text) cb(text)
      }
    }
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    recRef.current?.abort()
    recRef.current = null
    onUtteranceRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(
    (lang: string, onUtterance: (text: string) => void) => {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor || runningRef.current) return
      onUtteranceRef.current = onUtterance
      setError(null)
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = lang
      rec.onresult = handleResult
      rec.onend = () => {
        if (!runningRef.current) return
        window.setTimeout(() => {
          if (runningRef.current) {
            try {
              rec.start()
            } catch {
              /* já iniciado */
            }
          }
        }, 150)
      }
      rec.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          runningRef.current = false
          setListening(false)
          setError('Permissão de microfone negada. Habilite o microfone para gerar legendas.')
        }
      }
      recRef.current = rec
      try {
        rec.start()
        runningRef.current = true
        setListening(true)
      } catch {
        setError('Não foi possível iniciar o reconhecimento de voz neste navegador.')
      }
    },
    [handleResult],
  )

  useEffect(() => () => stop(), [stop])

  return { supported, listening, error, start, stop }
}
