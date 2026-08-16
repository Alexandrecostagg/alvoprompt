const API_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamOptions {
  onToken?: (fullText: string) => void
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

function getApiKey(): string {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY
  if (!key) {
    throw new Error(
      'Chave da DeepSeek não configurada. Crie o arquivo .env.local com VITE_DEEPSEEK_API_KEY e reinicie o dev server.',
    )
  }
  return key
}

export async function chatStream(messages: ChatMessage[], opts: StreamOptions = {}): Promise<string> {
  const apiKey = getApiKey()
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
    signal: opts.signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    let message = `Erro na API (${response.status}).`
    try {
      const json = JSON.parse(detail)
      if (json?.error?.message) message = `Erro na API: ${json.error.message}`
    } catch {
      if (detail) message += ` ${detail.slice(0, 200)}`
    }
    throw new Error(message)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Resposta sem corpo. Tente novamente.')

  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const token: string | undefined = json.choices?.[0]?.delta?.content
        if (token) {
          full += token
          opts.onToken?.(full)
        }
      } catch {
        // chunk incompleto ou keep-alive; ignora
      }
    }
  }

  if (!full) throw new Error('A IA não retornou conteúdo. Tente novamente.')
  return full
}

export async function chat(messages: ChatMessage[], opts: StreamOptions = {}): Promise<string> {
  return chatStream(messages, opts)
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Não foi possível interpretar a resposta da IA.')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

export interface ScriptGenerationInput {
  topic: string
  format: string
  tone: string
  duration: string
  audience?: string
  notes?: string
}

export function generateScript(
  input: ScriptGenerationInput,
  opts: StreamOptions = {},
): Promise<string> {
  const system =
    'Você é um roteirista profissional especialista em vídeos para a internet, apresentações e teleprompter. ' +
    'Escreva sempre em português do Brasil, em linguagem falada e natural (nada de tom escrito/formal), ' +
    'com frases curtas, ritmo dinâmico, um gancho forte nos primeiros segundos e uma chamada final clara. ' +
    'Responda APENAS com o texto do roteiro pronto para ler, sem títulos, sem markdown, sem comentários.'
  const user = [
    `Crie um roteiro para ser lido em um teleprompter.`,
    `Formato: ${input.format}`,
    `Tema: ${input.topic}`,
    `Tom: ${input.tone}`,
    `Duração alvo: ${input.duration}`,
    input.audience ? `Público-alvo: ${input.audience}` : null,
    input.notes ? `Observações adicionais: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  return chatStream([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], opts)
}

export type ImproveAction = 'fluencia' | 'encurtar' | 'gancho' | 'tom'

const IMPROVE_PROMPTS: Record<ImproveAction, string> = {
  fluencia:
    'Reescreva este roteiro para ficar mais fluido e natural ao ser lido em voz alta. Mantenha a mensagem, o tom e a duração aproximada. Responda APENAS com o roteiro reescrito, sem comentários.',
  encurtar:
    'Encurte este roteiro para cerca de metade do tamanho, mantendo o gancho inicial, os pontos principais e a chamada final. Responda APENAS com o roteiro encurtado, sem comentários.',
  gancho:
    'Reescreva apenas o início deste roteiro (primeiras 2-3 frases) com um gancho muito mais forte e impactante, mantendo o restante do roteiro intacto. Responda APENAS com o roteiro completo, sem comentários.',
  tom:
    'Ajuste o tom deste roteiro conforme instruído abaixo, mantendo a mensagem e a estrutura. Responda APENAS com o roteiro ajustado, sem comentários.',
}

export function improveScript(
  content: string,
  action: ImproveAction,
  opts: StreamOptions & { toneInstruction?: string } = {},
): Promise<string> {
  const prompt =
    action === 'tom'
      ? `${IMPROVE_PROMPTS.tom}\nInstrução de tom: ${opts.toneInstruction ?? 'mais direto e confiante'}`
      : IMPROVE_PROMPTS[action]
  return chatStream(
    [
      {
        role: 'system',
        content:
          'Você é um editor profissional de roteiros para vídeo em português do Brasil. ' +
          'Preserva sempre a intenção original do texto e escreve em linguagem falada.',
      },
      { role: 'user', content: `${prompt}\n\nRoteiro:\n${content}` },
    ],
    opts,
  )
}

export interface TitlesAndHooks {
  titles: string[]
  hooks: string[]
}

export async function suggestTitlesAndHooks(content: string): Promise<TitlesAndHooks> {
  const raw = await chatStream(
    [
      {
        role: 'system',
        content:
          'Você é um estrategista de conteúdo para vídeos. Responda SEMPRE em português do Brasil ' +
          'e SOMENTE com JSON válido, sem markdown, no formato: ' +
          '{"titulos": ["..."], "ganchos": ["..."]}',
      },
      {
        role: 'user',
        content:
          'Com base neste roteiro, sugira 5 títulos de vídeo (curtos, com curiosidade ou benefício claro) ' +
          'e 5 ganchos de abertura (frases de até 15 palavras para os primeiros 3 segundos). ' +
          'JSON no formato {"titulos": [...], "ganchos": [...]}. Roteiro:\n\n' +
          content.slice(0, 6000),
      },
    ],
    { temperature: 0.8, maxTokens: 1200 },
  )
  const data = extractJson(raw) as { titulos?: unknown; ganchos?: unknown }
  const titles = Array.isArray(data.titulos) ? data.titulos.map(String) : []
  const hooks = Array.isArray(data.ganchos) ? data.ganchos.map(String) : []
  if (!titles.length && !hooks.length) {
    throw new Error('A IA não retornou sugestões válidas. Tente novamente.')
  }
  return { titles, hooks }
}
