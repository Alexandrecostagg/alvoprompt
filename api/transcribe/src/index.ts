/**
 * Alvoprompt API — Cloudflare Worker com Workers AI (plano gratuito).
 *
 * Endpoints:
 *   POST /transcribe  multipart: audio=<arquivo>, lang=<código ISO>  → { result: { text, words } }
 *   POST /tts         JSON: { text, lang }                            → áudio WAV (MeloTTS)
 *   POST /translate   JSON: { text, sourceLang, targetLang }          → { translated_text }
 *
 * Uso local:  npx wrangler dev --port 8787
 * Publicar:   npx wrangler deploy
 */
export interface Env {
  AI: {
    run(model: string, input: unknown): Promise<unknown>
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function toArrayBuffer(arr: number[]): ArrayBuffer {
  const out = new Uint8Array(arr.length)
  for (let i = 0; i < arr.length; i++) out[i] = arr[i]
  return out.buffer
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
    const url = new URL(request.url)

    if (url.pathname === '/transcribe' && request.method === 'POST') {
      const form = await request.formData()
      const audio = form.get('audio')
      const lang = (form.get('lang') as string | null) ?? 'pt'
      if (!(audio instanceof File)) return json({ error: 'Campo "audio" ausente.' }, 400)
      const bytes = new Uint8Array(await audio.arrayBuffer())
      try {
        const result = (await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
          audio: [...bytes],
          task: 'transcribe',
          language: lang,
          timestamp_granularities: ['word'],
        })) as { text: string; words?: { word: string; start: number; end: number }[] }
        return json({ result })
      } catch (err) {
        return json({ error: (err as Error).message }, 500)
      }
    }

    if (url.pathname === '/tts' && request.method === 'POST') {
      const { text, lang } = (await request.json()) as { text?: string; lang?: string }
      if (!text) return json({ error: 'Campo "text" ausente.' }, 400)
      try {
        const result = (await env.AI.run('@cf/myshell-ai/melotts', {
          text,
          lang: lang ?? 'pt-br',
        })) as { audio: number[] }
        return new Response(toArrayBuffer(result.audio), {
          headers: { 'Content-Type': 'audio/wav', ...CORS_HEADERS },
        })
      } catch (err) {
        return json({ error: (err as Error).message }, 500)
      }
    }

    if (url.pathname === '/translate' && request.method === 'POST') {
      const { text, sourceLang, targetLang } = (await request.json()) as {
        text?: string
        sourceLang?: string
        targetLang?: string
      }
      if (!text || !targetLang) return json({ error: 'Campos "text" e "targetLang" obrigatórios.' }, 400)
      try {
        const result = (await env.AI.run('@cf/meta/m2m100-1.2b', {
          text,
          source_lang: sourceLang ?? 'pt',
          target_lang: targetLang,
        })) as { translated_text?: string }
        return json({ result })
      } catch (err) {
        return json({ error: (err as Error).message }, 500)
      }
    }

    return new Response('alvoprompt api — use /transcribe | /tts | /translate', {
      headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS },
    })
  },
}
