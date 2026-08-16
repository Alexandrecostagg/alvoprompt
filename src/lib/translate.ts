import { chatStream } from './ai'

export interface SrtLanguage {
  code: string
  label: string
}

export const SRT_LANGUAGES: SrtLanguage[] = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'en', label: 'Inglês' },
  { code: 'es', label: 'Espanhol' },
  { code: 'fr', label: 'Francês' },
  { code: 'de', label: 'Alemão' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: 'Japonês' },
  { code: 'zh-CN', label: 'Chinês (simplificado)' },
  { code: 'zh-TW', label: 'Chinês (tradicional)' },
  { code: 'ko', label: 'Coreano' },
  { code: 'ar', label: 'Árabe' },
  { code: 'ru', label: 'Russo' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'id', label: 'Indonésio' },
  { code: 'ms', label: 'Malaio' },
  { code: 'th', label: 'Tailandês' },
  { code: 'vi', label: 'Vietnamita' },
  { code: 'tr', label: 'Turco' },
  { code: 'nl', label: 'Holandês' },
  { code: 'pl', label: 'Polonês' },
  { code: 'sv', label: 'Sueco' },
  { code: 'no', label: 'Norueguês' },
  { code: 'da', label: 'Dinamarquês' },
  { code: 'fi', label: 'Finlandês' },
  { code: 'el', label: 'Grego' },
  { code: 'cs', label: 'Tcheco' },
  { code: 'hu', label: 'Húngaro' },
  { code: 'ro', label: 'Romeno' },
  { code: 'bg', label: 'Búlgaro' },
  { code: 'uk', label: 'Ucraniano' },
  { code: 'he', label: 'Hebraico' },
  { code: 'fa', label: 'Persa' },
  { code: 'ur', label: 'Urdu' },
  { code: 'sw', label: 'Suaíli' },
  { code: 'af', label: 'Africâner' },
  { code: 'sq', label: 'Albanês' },
  { code: 'hy', label: 'Armênio' },
  { code: 'az', label: 'Azerbaijano' },
  { code: 'eu', label: 'Basco' },
  { code: 'be', label: 'Bielorrusso' },
  { code: 'ca', label: 'Catalão' },
  { code: 'hr', label: 'Croata' },
  { code: 'et', label: 'Estoniano' },
  { code: 'tl', label: 'Filipino' },
  { code: 'gl', label: 'Galego' },
  { code: 'ka', label: 'Georgiano' },
  { code: 'gu', label: 'Guzerate' },
  { code: 'is', label: 'Islandês' },
  { code: 'kn', label: 'Canarês' },
  { code: 'kk', label: 'Cazaque' },
  { code: 'km', label: 'Khmer' },
  { code: 'ky', label: 'Quirguiz' },
  { code: 'lo', label: 'Lao' },
  { code: 'lv', label: 'Letão' },
  { code: 'lt', label: 'Lituano' },
  { code: 'mk', label: 'Macedônio' },
  { code: 'mg', label: 'Malgaxe' },
  { code: 'mr', label: 'Marata' },
  { code: 'mn', label: 'Mongol' },
  { code: 'ne', label: 'Nepalês' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ps', label: 'Pachto' },
  { code: 'sr', label: 'Sérvio' },
  { code: 'si', label: 'Cingalês' },
  { code: 'sk', label: 'Eslovaco' },
  { code: 'sl', label: 'Esloveno' },
  { code: 'ta', label: 'Tâmil' },
  { code: 'te', label: 'Telugo' },
  { code: 'uz', label: 'Uzbeque' },
  { code: 'am', label: 'Amárico' },
  { code: 'my', label: 'Birmanês' },
  { code: 'zu', label: 'Zulu' },
]

interface TranslateOptions {
  onToken?: (fullText: string) => void
  signal?: AbortSignal
}

function cleanSrt(raw: string): string {
  return raw
    .replace(/```(srt|plaintext)?/gi, '')
    .replace(/```/g, '')
    .trim()
}

/**
 * Traduz uma legenda SRT preservando numeração e timestamps.
 * Retorna o SRT traduzido (ou o original se a resposta for inválida).
 */
export async function translateSrt(
  srt: string,
  target: SrtLanguage,
  opts: TranslateOptions = {},
): Promise<string> {
  const system =
    'Você é um tradutor profissional de legendas de vídeo. ' +
    'Traduza APENAS o texto de cada bloco de legenda, preservando exatamente ' +
    'a numeração, os timestamps e o formato SRT (blocos separados por linha em branco). ' +
    'Responda SOMENTE com o SRT traduzido, sem comentários e sem markdown.'
  const user = [
    `Traduza esta legenda para ${target.label} (${target.code}).`,
    'Mantenha o mesmo número de blocos e os timestamps idênticos.',
    '',
    srt,
  ].join('\n')

  const translated = cleanSrt(
    await chatStream(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      {
        temperature: 0.3,
        signal: opts.signal,
        onToken: (full) => opts.onToken?.(cleanSrt(full)),
      },
    ),
  )

  if (!looksLikeSrt(translated)) {
    throw new Error('A IA retornou uma legenda inválida. Tente novamente.')
  }
  return translated
}

function looksLikeSrt(text: string): boolean {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim())
  if (!blocks.length) return false
  return blocks.every((b) => /\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(b))
}
