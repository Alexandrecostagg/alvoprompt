import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { estimateDurationMinutes, wordCount } from '../../lib/text'
import { formatElapsed } from '../../hooks/useRecorder'
import { IMPORTABLE_EXT, extractTextFromFile, extractTextFromUrl, fileNameFromImport } from '../../lib/importers'
import { transcribeAudio } from '../../lib/cloudflare'
import type { Script } from '../../lib/types'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} d`
}

export default function ScriptLibrary() {
  const { scripts, loading, loadError, removeScript, selectScript, setView, settings, openAiPanel } =
    useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const [showLinkImport, setShowLinkImport] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [audioBusy, setAudioBusy] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [query, setQuery] = useState('')

  const visibleScripts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR')
    if (!term) return scripts
    return scripts.filter((script) => `${script.title} ${script.content}`.toLocaleLowerCase('pt-BR').includes(term))
  }, [query, scripts])

  const createNew = () => {
    selectScript({ title: 'Novo roteiro', content: '', createdAt: Date.now(), updatedAt: Date.now() })
    setView('editor')
  }

  const createWithAi = () => {
    selectScript({
      title: 'Roteiro com IA',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    openAiPanel('generate')
    setView('editor')
  }

  const openImported = (title: string, content: string) => {
    selectScript({ title, content, createdAt: Date.now(), updatedAt: Date.now() })
    setView('editor')
  }

  const importFile = async (file: File) => {
    try {
      const content = await extractTextFromFile(file)
      openImported(fileNameFromImport(file.name) || 'Importado', content)
    } catch (err) {
      setLinkError((err as Error).message)
      setShowLinkImport(true)
    }
  }

  const importLink = async () => {
    if (!linkUrl.trim() || linkBusy) return
    setLinkBusy(true)
    setLinkError(null)
    try {
      const content = await extractTextFromUrl(linkUrl.trim())
      openImported('Importado de link', content)
      setShowLinkImport(false)
      setLinkUrl('')
    } catch (err) {
      setLinkError((err as Error).message)
    } finally {
      setLinkBusy(false)
    }
  }

  const importAudio = async (file: File) => {
    if (audioBusy) return
    setAudioBusy(true)
    setLinkError(null)
    try {
      const lang = (settings.voiceLang || 'pt-BR').split('-')[0] || 'pt'
      const result = await transcribeAudio(file, lang)
      if (!result.text?.trim()) throw new Error('A transcrição ficou vazia — verifique se há fala no áudio.')
      openImported(fileNameFromImport(file.name) || 'Transcrito', result.text.trim())
    } catch (err) {
      setLinkError((err as Error).message)
      setShowLinkImport(true)
    } finally {
      setAudioBusy(false)
    }
  }

  const openPrompter = (script: Script) => {
    selectScript(script)
    setView('prompter')
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--brand-strong)' }}>Seu estúdio</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Meus roteiros</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {scripts.length} roteiro{scripts.length === 1 ? '' : 's'} · salvos localmente no seu
            dispositivo
          </p>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={createNew}
            className="min-h-12 rounded-2xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand-gradient)' }}
          >
            + Novo roteiro
          </button>
          <button
            onClick={createWithAi}
            className="min-h-12 rounded-2xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-soft)', color: 'var(--brand-strong)' }}
          >
            ✦ Criar com IA
          </button>
          <button
            onClick={() => {
              setLinkError(null)
              setShowImportMenu(true)
            }}
            className="min-h-12 min-w-12 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Abrir opções de importação"
          >
            {audioBusy ? '…' : 'Importar'}
          </button>
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
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importAudio(file)
            e.target.value = ''
          }}
        />
      </div>

      {scripts.length > 0 ? (
        <label className="mb-4 flex min-h-12 items-center gap-3 rounded-2xl border px-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <span aria-hidden="true" style={{ color: 'var(--muted)' }}>⌕</span>
          <span className="sr-only">Buscar roteiros</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título ou conteúdo"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
          {query ? <button type="button" onClick={() => setQuery('')} className="grid h-8 w-8 place-items-center rounded-full" style={{ color: 'var(--muted)', background: 'var(--bg)' }} aria-label="Limpar busca">×</button> : null}
        </label>
      ) : null}

      {loadError ? (
        <div className="rounded-2xl border p-4 text-sm" role="alert" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--panel)' }}>
          {loadError} Recarregue o aplicativo e tente novamente.
        </div>
      ) : loading ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Carregando...
        </p>
      ) : scripts.length === 0 ? (
        <div
          className="rounded-3xl border p-7 text-center sm:p-12"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: 'var(--accent-soft)' }}>⌁</div>
          <p className="mt-4 text-lg font-bold text-white">Seu primeiro roteiro começa aqui</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Crie um roteiro ou importe um arquivo .txt / .md / .docx / PDF / áudio para começar.
          </p>
          <button
            onClick={createNew}
            className="mt-6 min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: 'var(--brand-gradient)' }}
          >
            Criar meu primeiro roteiro
          </button>
        </div>
      ) : visibleScripts.length === 0 ? (
        <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <p className="font-bold">Nenhum roteiro encontrado</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Tente outro termo ou limpe a busca.</p>
          <button onClick={() => setQuery('')} className="mt-4 min-h-11 rounded-xl px-4 text-sm font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--brand-strong)' }}>Limpar busca</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleScripts.map((script) => {
            const words = wordCount(script.content)
            const minutes = estimateDurationMinutes(words, settings.wpm)
            return (
              <li
                key={script.id}
                className="group relative flex items-center gap-3 rounded-3xl border p-3.5 transition-colors sm:p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                <button
                  onClick={() => {
                    selectScript(script)
                    setView('editor')
                  }}
                  className="min-w-0 flex-1 rounded-2xl px-1 py-1 text-left"
                >
                  <p className="truncate font-semibold text-white">{script.title || 'Sem título'}</p>
                  <p className="mt-1 truncate text-xs" style={{ color: 'var(--muted)' }}>
                    {words} palavras · ~{formatElapsed(minutes * 60)} a {settings.wpm} wpm ·{' '}
                    {relativeTime(script.updatedAt)}
                  </p>
                </button>
                <button onClick={() => openPrompter(script)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: 'var(--brand-gradient)', boxShadow: '0 10px 24px rgba(99,102,241,.22)' }} aria-label={`Abrir “${script.title || 'Sem título'}” no prompter`}>▶</button>
                <details className="relative shrink-0">
                  <summary className="grid h-11 w-9 cursor-pointer list-none place-items-center rounded-xl text-xl" style={{ color: 'var(--muted)' }} aria-label={`Mais opções para “${script.title || 'Sem título'}”`}>⋮</summary>
                  <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl border p-1.5 shadow-2xl" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
                    <button onClick={() => { selectScript(script); setView('editor') }} className="min-h-10 w-full rounded-xl px-3 text-left text-sm font-medium hover:opacity-80">Editar roteiro</button>
                    <button onClick={() => { if (script.id != null && window.confirm(`Excluir “${script.title || 'Sem título'}”?`)) void removeScript(script.id) }} className="min-h-10 w-full rounded-xl px-3 text-left text-sm font-medium" style={{ color: 'var(--danger)' }}>Excluir</button>
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      )}

      {showImportMenu && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 sm:items-center sm:justify-center sm:p-6">
          <button className="absolute inset-0" onClick={() => setShowImportMenu(false)} aria-label="Fechar opções de importação" />
          <section className="relative w-full rounded-t-[2rem] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }} role="dialog" aria-modal="true" aria-label="Importar roteiro">
            <span className="mx-auto mb-4 block h-1 w-12 rounded-full sm:hidden" style={{ background: 'var(--border)' }} aria-hidden="true" />
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Importar roteiro</h3><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Escolha de onde vem o conteúdo.</p></div><button onClick={() => setShowImportMenu(false)} className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--bg)', color: 'var(--muted)' }} aria-label="Fechar">×</button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button onClick={() => { setShowImportMenu(false); fileRef.current?.click() }} className="flex min-h-20 items-center gap-3 rounded-2xl border px-4 text-left sm:flex-col sm:justify-center sm:text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}><span className="text-xl" aria-hidden="true">▤</span><span><strong className="block text-sm">Arquivo</strong><small style={{ color: 'var(--muted)' }}>.txt, .docx ou PDF</small></span></button>
              <button onClick={() => { setShowImportMenu(false); audioRef.current?.click() }} disabled={audioBusy} className="flex min-h-20 items-center gap-3 rounded-2xl border px-4 text-left disabled:opacity-50 sm:flex-col sm:justify-center sm:text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}><span className="text-xl" aria-hidden="true">◉</span><span><strong className="block text-sm">Áudio</strong><small style={{ color: 'var(--muted)' }}>Transcrever uma fala</small></span></button>
              <button onClick={() => { setShowImportMenu(false); setShowLinkImport(true) }} className="flex min-h-20 items-center gap-3 rounded-2xl border px-4 text-left sm:flex-col sm:justify-center sm:text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}><span className="text-xl" aria-hidden="true">↗</span><span><strong className="block text-sm">Link</strong><small style={{ color: 'var(--muted)' }}>YouTube ou página</small></span></button>
            </div>
          </section>
        </div>
      )}

      {showLinkImport && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 sm:items-center sm:justify-center sm:p-6">
          <div
            className="w-full rounded-t-[2rem] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-2xl"
            style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <h3 className="mb-1 font-semibold text-white on-dark">Importar de link</h3>
            <p className="mb-4 text-xs" style={{ color: 'var(--muted)' }}>
              Cole uma URL pública. YouTube (transcrição via legendas), Google Docs e qualquer
              página com texto são suportados pela API AlvoPrompter.
            </p>
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void importLink()
                if (e.key === 'Escape') setShowLinkImport(false)
              }}
              placeholder="https://exemplo.com/roteiro"
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white on-dark outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
            {linkError && (
              <p className="mt-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                {linkError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowLinkImport(false)}
                className="rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void importLink()}
                disabled={!linkUrl.trim() || linkBusy}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {linkBusy ? 'Buscando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
