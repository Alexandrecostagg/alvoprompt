/**
 * Cliente do Worker Cloudflare (transcrição Whisper, TTS/dublagem e tradução).
 * Desativado por padrão — só faz requisições quando o Worker está rodando
 * (wrangler dev --port 8787) ou VITE_CLOUDFLARE_API_BASE aponta para a URL publicada.
 */
const DEFAULT_BASE = 'http://localhost:8787'

export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface WhisperResult {
  text: string
  words?: WhisperWord[]
}

function apiBase(): string {
  return (import.meta.env.VITE_CLOUDFLARE_API_BASE as string | undefined) || DEFAULT_BASE
}

async function fetchJson(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${apiBase()}${path}`, init)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status} na API`)
  }
  return res.json()
}

export async function transcribeAudio(blob: Blob, lang: string): Promise<WhisperResult> {
  const form = new FormData()
  form.append('audio', blob, 'audio.webm')
  form.append('lang', lang)
  const payload = (await fetchJson('/transcribe', { method: 'POST', body: form })) as {
    result: WhisperResult
  }
  return payload.result
}

export async function speakWithTts(text: string, lang = 'pt-br'): Promise<Blob> {
  const res = await fetch(`${apiBase()}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  })
  if (!res.ok) throw new Error(`Erro ${res.status} no TTS`)
  return res.blob()
}

export async function translateCloud(text: string, targetLang: string, sourceLang = 'pt'): Promise<string> {
  const payload = (await fetchJson('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  })) as { result: { translated_text?: string } }
  return payload.result.translated_text ?? ''
}
