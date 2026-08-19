import { describe, expect, it } from 'vitest'
import { dataUrlToBlob, safeShareFileName } from './share'

describe('social sharing', () => {
  it('creates a safe file name without losing its extension', () => {
    expect(safeShareFileName('Meu vídeo final 01.mp4')).toBe('Meu-video-final-01.mp4')
  })

  it('converts a saved data URL back into a video blob', async () => {
    const blob = dataUrlToBlob('data:video/webm;base64,YWx2bw==')
    expect(blob.type).toBe('video/webm')
    expect(await blob.text()).toBe('alvo')
  })

  it('rejects invalid saved media', () => {
    expect(() => dataUrlToBlob('invalid')).toThrow('formato válido')
  })
})
