import { useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { estimateDurationMinutes, wordCount } from '../../lib/text'
import { formatElapsed } from '../../hooks/useRecorder'
import { IMPORTABLE_EXT, extractTextFromFile, extractTextFromUrl, fileNameFromImport } from '../../lib/importers'
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
  const { scripts, loading, removeScript, selectScript, setView, settings, openAiPanel } =
    useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showLinkImport, setShowLinkImport] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

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

  const openPrompter = (script: Script) => {
    selectScript(script)
    setView('prompter')
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Meus roteiros</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {scripts.length} roteiro{scripts.length === 1 ? '' : 's'} · salvos localmente no seu
            dispositivo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setLinkError(null)
              setShowLinkImport(true)
            }}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Importar de link
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Importar arquivo
          </button>
          <button
            onClick={createWithAi}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-2)', color: '#0e0a1a' }}
          >
            ✨ Gerar com IA
          </button>
          <button
            onClick={createNew}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            + Novo roteiro
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
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Carregando...
        </p>
      ) : scripts.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-lg font-medium text-white">Nenhum roteiro ainda</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Crie um roteiro ou importe um arquivo .txt / .md / .docx / PDF para começar.
          </p>
          <button
            onClick={createNew}
            className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-black"
            style={{ background: 'var(--accent)' }}
          >
            Criar meu primeiro roteiro
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {scripts.map((script) => {
            const words = wordCount(script.content)
            const minutes = estimateDurationMinutes(words, settings.wpm)
            return (
              <li
                key={script.id}
                className="group flex items-center gap-4 rounded-xl border p-4 transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                <button
                  onClick={() => {
                    selectScript(script)
                    setView('editor')
                  }}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-white">{script.title || 'Sem título'}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    {words} palavras · ~{formatElapsed(minutes * 60)} a {settings.wpm} wpm ·{' '}
                    {relativeTime(script.updatedAt)}
                  </p>
                </button>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openPrompter(script)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black"
                    style={{ background: 'var(--accent)' }}
                  >
                    Prompter
                  </button>
                  <button
                    onClick={() => {
                      selectScript(script)
                      setView('editor')
                    }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => script.id != null && removeScript(script.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}
                    aria-label="Excluir roteiro"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {showLinkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div
            className="w-full max-w-lg rounded-2xl border p-5"
            style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <h3 className="mb-1 font-semibold text-white">Importar de link</h3>
            <p className="mb-4 text-xs" style={{ color: 'var(--muted)' }}>
              Cole uma URL pública com texto (funciona quando o site permite acesso direto).
              YouTube e Google Docs precisam de importação manual ou servidor (roadmap).
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
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
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
