import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { estimateDurationMinutes, wordCount } from '../../lib/text'
import { formatElapsed } from '../../hooks/useRecorder'
import { IMPORTABLE_EXT, extractTextFromFile, fileNameFromImport } from '../../lib/importers'
import { speakWithTts } from '../../lib/cloudflare'
import AiPanel from '../ai/AiPanel'
import ScriptAnalysis from './ScriptAnalysis'

const SPEEDS = [100, 130, 150, 180, 200]

export default function ScriptEditor() {
  const { currentScript, upsertScript, setView, settings, updateSettings, aiPanelTab, openAiPanel, closeAiPanel } =
    useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef(currentScript)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [dirty, setDirty] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showTiming, setShowTiming] = useState(false)
  const [ttsBusy, setTtsBusy] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)

  useEffect(() => {
    savedRef.current = currentScript
    setDirty(false)
  }, [currentScript])

  useEffect(() => {
    if (aiPanelTab == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAiPanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiPanelTab, closeAiPanel])

  if (!currentScript) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <p style={{ color: 'var(--muted)' }}>Nenhum roteiro selecionado.</p>
        <button
          onClick={() => setView('library')}
          className="mt-4 rounded-lg border px-4 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          Voltar para a biblioteca
        </button>
      </div>
    )
  }

  const words = wordCount(currentScript.content)
  const minutes = estimateDurationMinutes(words, settings.wpm)

  const handleSave = async () => {
    if (!currentScript) return
    await upsertScript(currentScript)
    setDirty(false)
  }

  const importFile = async (file: File) => {
    try {
      const content = await extractTextFromFile(file)
      const next = { ...currentScript, title: fileNameFromImport(file.name) || currentScript.title, content }
      useAppStore.getState().selectScript(next)
      setDirty(true)
    } catch (err) {
      window.alert(`Não foi possível importar o arquivo: ${(err as Error).message}`)
    }
  }

  const toggleDubbing = async () => {
    if (ttsBusy) return
    const audio = audioRef.current
    if (audio && ttsPlaying) {
      audio.pause()
      audio.currentTime = 0
      setTtsPlaying(false)
      return
    }
    if (!currentScript.content.trim()) return
    setTtsBusy(true)
    try {
      const blob = await speakWithTts(currentScript.content.trim(), 'pt-br')
      if (audio) {
        audio.src = URL.createObjectURL(blob)
        await audio.play()
        setTtsPlaying(true)
      }
    } catch (err) {
      window.alert(`Dublagem indisponível: ${(err as Error).message}`)
    } finally {
      setTtsBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b px-4 pb-3 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-2xl sm:border sm:p-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('library')} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border text-lg" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }} aria-label="Voltar para a biblioteca">←</button>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Editar roteiro</p><p className="text-[11px]" style={{ color: dirty ? 'var(--warn)' : 'var(--muted)' }}>{dirty ? 'Alterações não salvas' : 'Tudo salvo neste dispositivo'}</p></div>
          <button onClick={() => void handleSave()} disabled={!dirty} className="min-h-11 rounded-2xl border px-3 text-xs font-bold disabled:opacity-50" style={{ borderColor: dirty ? 'var(--warn)' : 'var(--border)', color: dirty ? 'var(--warn)' : 'var(--muted)' }}>{dirty ? 'Salvar' : 'Salvo'}</button>
          <button onClick={() => setView('prompter')} disabled={words === 0} className="min-h-11 rounded-2xl px-4 text-sm font-bold text-white disabled:opacity-40" style={{ background: 'var(--brand-gradient)' }}>Prompter</button>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 sm:justify-end">
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-10 shrink-0 rounded-xl border px-3 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            ▤ Importar
          </button>
          <button
            onClick={() => openAiPanel(aiPanelTab ?? 'generate')}
            className="min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold"
            style={{
              background: 'var(--accent-2)',
              color: '#0e0a1a',
            }}
          >
            ✨ IA
          </button>
          <button
            onClick={() => void toggleDubbing()}
            disabled={ttsBusy || words === 0}
            className="min-h-10 shrink-0 rounded-xl border px-3 text-sm disabled:opacity-40"
            style={{
              borderColor: ttsPlaying ? 'var(--accent)' : 'var(--border)',
              color: ttsPlaying ? 'var(--accent)' : 'var(--text)',
            }}
            title="Gera a narração do roteiro com IA (dublagem)"
          >
            {ttsBusy ? 'Gerando...' : ttsPlaying ? '⏹ Parar dublagem' : '🔊 Dublar'}
          </button>
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="min-h-10 shrink-0 rounded-xl border px-3 text-sm"
            style={{
              borderColor: showAnalysis ? 'var(--accent)' : 'var(--border)',
              color: showAnalysis ? 'var(--accent)' : 'var(--text)',
            }}
            title="Análise, palavras-chave e remoção de vícios de linguagem"
          >
            📊 Analisar
          </button>
          <button onClick={() => setShowTiming((value) => !value)} className="min-h-10 shrink-0 rounded-xl border px-3 text-sm" style={{ borderColor: showTiming ? 'var(--accent)' : 'var(--border)', color: showTiming ? 'var(--accent)' : 'var(--text)' }}>◷ Ritmo</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={IMPORTABLE_EXT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importFile(file)
            e.target.value = ''
          }}
        />
        <audio
          ref={audioRef}
          onEnded={() => setTtsPlaying(false)}
          onPause={() => setTtsPlaying(false)}
          className="hidden"
        />
      </div>

      <input
        value={currentScript.title}
        onChange={(e) => {
          useAppStore.getState().selectScript({ ...currentScript, title: e.target.value })
          setDirty(true)
        }}
        placeholder="Título do roteiro"
        className="mb-3 min-h-[3.25rem] w-full rounded-2xl border bg-transparent px-4 py-3 text-lg font-semibold text-white outline-none focus:ring-2"
        style={{ borderColor: 'var(--border)' }}
      />

      <textarea
        value={currentScript.content}
        onChange={(e) => {
          useAppStore.getState().selectScript({ ...currentScript, content: e.target.value })
          setDirty(true)
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault()
            handleSave()
          }
        }}
        placeholder="Cole ou digite aqui o texto que você vai ler..."
        className="min-h-[55dvh] w-full flex-1 resize-none rounded-2xl border p-4 text-base leading-relaxed text-white outline-none focus:ring-2 sm:min-h-[50vh]"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      />

      <div className="mt-3 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: 'var(--muted)' }}>
        <span>
          {words} palavras · duração estimada ~{formatElapsed(minutes * 60)} a {settings.wpm} wpm
        </span>
        <span>Dica: use parágrafos curtos para a rolagem por voz acompanhar melhor.</span>
      </div>

      <div className={`${showTiming ? 'flex' : 'hidden'} mt-3 flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 sm:flex`} style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
            Duração por velocidade
          </p>
          <div className="flex flex-wrap gap-2">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => updateSettings({ wpm: s })}
                className="rounded-md px-2 py-1 text-[11px] tabular-nums transition-colors"
                style={{
                  background: s === settings.wpm ? 'var(--accent)' : 'rgba(0,0,0,0.25)',
                  color: s === settings.wpm ? 'black' : 'var(--text)',
                }}
                title="Clique para definir esta velocidade"
              >
                {s} wpm · {formatElapsed(estimateDurationMinutes(words, s) * 60)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-8 w-px" style={{ background: 'var(--border)' }} />
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
            Para terminar em
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 5].map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ targetMinutes: t, mode: 'timed' })}
                className="rounded-md px-2 py-1 text-[11px] tabular-nums transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', color: 'var(--text)' }}
                title="Abre no modo tempo-alvo do prompter"
              >
                {t} min · ≈{Math.max(1, Math.round(words / t))} wpm
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAnalysis && (
        <ScriptAnalysis
          content={currentScript.content}
          wpm={settings.wpm}
          onApplyClean={(text) => {
            useAppStore.getState().selectScript({ ...currentScript, content: text })
            setDirty(true)
          }}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {aiPanelTab != null && <AiPanel tab={aiPanelTab} />}
    </div>
  )
}
