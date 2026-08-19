import { describe, expect, it } from 'vitest'
import { estimateDurationMinutes, normalizeWord, readingStats, removeFillers, similarity, splitWords } from './text'

describe('text utilities', () => {
  it('normaliza acentos e pontuação para comparação de fala', () => {
    expect(normalizeWord('Câmera!')).toBe('camera')
    expect(splitWords('  Olhe para a câmera.  ')).toHaveLength(4)
  })

  it('aceita pequenas diferenças sem tratar palavras distantes como iguais', () => {
    expect(similarity('câmera', 'camera')).toBe(1)
    expect(similarity('gravacao', 'gravação')).toBe(1)
    expect(similarity('roteiro', 'janela')).toBeLessThan(0.4)
  })

  it('remove vícios puros sem apagar marcadores por padrão', () => {
    expect(removeFillers('Olá, hmm, então vamos começar.')).toBe('Olá, então vamos começar.')
    expect(removeFillers('Olá, hmm, então vamos começar.', true)).toBe('Olá, vamos começar.')
  })

  it('calcula duração e estatísticas básicas', () => {
    expect(estimateDurationMinutes(300, 150)).toBe(2)
    const stats = readingStats('Roteiro claro. Roteiro direto.', 120)
    expect(stats.words).toBe(4)
    expect(stats.keywords[0]).toEqual({ word: 'roteiro', count: 2 })
  })
})
