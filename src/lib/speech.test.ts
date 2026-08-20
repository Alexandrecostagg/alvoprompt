import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSpeechRecognitionCtor, speechRecognitionSupported } from './speech'

describe('speech recognition support', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports unsupported when the browser exposes no recognition API', () => {
    vi.stubGlobal('window', {})

    expect(getSpeechRecognitionCtor()).toBeNull()
    expect(speechRecognitionSupported()).toBe(false)
  })

  it('returns the browser recognition constructor when available', () => {
    class Recognition {}
    vi.stubGlobal('window', { webkitSpeechRecognition: Recognition })

    expect(getSpeechRecognitionCtor()).toBe(Recognition)
    expect(speechRecognitionSupported()).toBe(true)
  })
})
