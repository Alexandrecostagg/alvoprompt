import { lazy, Suspense, useEffect, useReducer, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { controlRoom } from '../../lib/controlRoom'
import type { EngineState } from '../../lib/types'
import QrCode from './QrCode'

const QrScanner = lazy(() => import('./QrScanner'))

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-lg border px-3 py-1.5 text-xs"
      style={{
        borderColor: copied ? 'var(--ok)' : 'var(--border)',
        color: copied ? 'var(--ok)' : 'var(--text)',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar código'}
    </button>
  )
}

const STATUS_LABEL: Record<EngineState, string> = {
  idle: 'Pronto',
  running: '▶ Apresentando',
  paused: '❚❚ Pausado',
  done: '✔ Concluído',
}

export default function ControlRoom() {
  const [, force] = useReducer((x) => x + 1, 0)
  const setView = useAppStore((s) => s.setView)

  const [hostOffer, setHostOffer] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [controlOfferInput, setControlOfferInput] = useState('')
  const [controlAnswer, setControlAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scriptTitle, setScriptTitle] = useState('')
  const [scriptContent, setScriptContent] = useState('')
  const [remoteStatus, setRemoteStatus] = useState<{ state: EngineState; fraction: number } | null>(null)
  const [mirrorOn, setMirrorOn] = useState(false)
  const [openMicOn, setOpenMicOn] = useState(false)
  const [scanMode, setScanMode] = useState<'offer' | 'answer' | null>(null)

  useEffect(() => controlRoom.subscribe(force), [])

  useEffect(
    () =>
      controlRoom.onCommand((msg) => {
        if (msg.t === 'status') setRemoteStatus({ state: msg.state, fraction: msg.fraction })
      }),
    [],
  )

  const role = controlRoom.getRole()
  const status = controlRoom.getStatus()
  const connected = controlRoom.isConnected()

  const startHost = async () => {
    setError(null)
    try {
      setHostOffer(await controlRoom.initHost())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submitAnswer = async () => {
    setError(null)
    try {
      await controlRoom.submitAnswer(answerInput)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const startControl = async () => {
    setError(null)
    try {
      setControlAnswer(await controlRoom.acceptOffer(controlOfferInput))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const codeBox = (label: string, value: string, hint: string) => (
    <div>
      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <div className="flex gap-2">
        <textarea
          readOnly
          value={value}
          rows={6}
          className="min-w-0 flex-1 resize-none rounded-lg border bg-transparent p-3 font-mono text-[10px] leading-relaxed text-white outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        />
        <div className="flex flex-col justify-center gap-2">
          <CopyButton text={value} />
        </div>
      </div>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
        {hint}
      </p>
    </div>
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setView('library')}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          ← Voltar
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">🎮 Web Control Room</h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Controle o prompter de outro aparelho na mesma rede — sem servidor.
          </p>
        </div>
      </div>

      {status === 'error' && (
        <p className="mb-4 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          Tempo esgotado na conexão. Confira se os dois aparelhos estão na mesma rede Wi-Fi e tente
          novamente.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {role === null && !connected && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => void startHost()}
            className="rounded-2xl border p-6 text-left transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            <p className="text-lg font-semibold text-white">📱 Sou o prompter</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Este aparelho vai apresentar o texto. Gere o código e leia-o no aparelho de
              controle (celular ou desktop) para conectar.
            </p>
            <span
              className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-black"
              style={{ background: 'var(--accent)' }}
            >
              Gerar código de pareamento
            </span>
          </button>
          <button
            onClick={() => controlRoom.startControl()}
            className="rounded-2xl border p-6 text-left transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            <p className="text-lg font-semibold text-white">🖥️ Sou o controle</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Este aparelho envia comandos e roteiros para o prompter. Abra o código gerado no
              outro aparelho e cole aqui.
            </p>
            <span
              className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--accent-2)', color: '#0e0a1a' }}
            >
              Conectar ao prompter
            </span>
          </button>
        </div>
      )}

      {role === 'host' && !connected && (
        <div className="space-y-5">
          {hostOffer ? (
            <>
              {codeBox(
                'Código do prompter (offer)',
                hostOffer,
                'Copie e envie para o aparelho de controle. Depois cole aqui a RESPOSTA gerada lá.',
              )}
              <div className="flex flex-wrap items-start gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Escaneie com o aparelho de controle
                  </p>
                  <QrCode value={hostOffer} size={190} />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    No controle: toque em “Sou o controle” e depois em “Escanear QR do prompter”.
                  </p>
                  <button
                    onClick={() => setScanMode('answer')}
                    className="rounded-lg border px-4 py-2 text-sm"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    📷 Escanear resposta (QR)
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Resposta do controle (answer)
                </p>
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  rows={4}
                  placeholder="Cole aqui a resposta gerada no aparelho de controle..."
                  className="w-full resize-none rounded-lg border bg-transparent p-3 font-mono text-[10px] leading-relaxed text-white outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button
                  onClick={() => void submitAnswer()}
                  disabled={!answerInput.trim()}
                  className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  Conectar
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Gerando código...</p>
          )}
        </div>
      )}

      {role === 'control' && !connected && (
        <div className="space-y-5">
          {!controlAnswer ? (
            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                Código do prompter (offer)
              </p>
              <textarea
                value={controlOfferInput}
                onChange={(e) => setControlOfferInput(e.target.value)}
                rows={6}
                placeholder="Cole o código gerado no aparelho do prompter..."
                className="w-full resize-none rounded-lg border bg-transparent p-3 font-mono text-[10px] leading-relaxed text-white outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => void startControl()}
                  disabled={!controlOfferInput.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: 'var(--accent-2)', color: '#0e0a1a' }}
                >
                  Gerar resposta e conectar
                </button>
                <button
                  onClick={() => setScanMode('offer')}
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  📷 Escanear QR do prompter
                </button>
              </div>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                No prompter, o código aparece como QR. Aponte a câmera para ele e o código será
                preenchido automaticamente.
              </p>
            </div>
          ) : (
            <>
              {codeBox(
                'Envie este código de volta ao prompter (answer)',
                controlAnswer,
                'Cole este código no aparelho do prompter e clique em Conectar lá. A conexão abre automaticamente.',
              )}
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Ou escaneie este QR no prompter
                </p>
                <QrCode value={controlAnswer} size={190} />
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {status === 'signaling' || status === 'connecting'
                  ? 'Aguardando conexão do prompter...'
                  : ''}
              </p>
            </>
          )}
        </div>
      )}

      {connected && (
        <div className="space-y-5">
          {role === 'host' && (
            <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--ok)', background: 'var(--panel)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--ok)' }}>
                ✓ Conectado ao controle
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Abra o prompter para apresentar. O controle poderá iniciar/pausar, avançar o texto,
                espelhar, continuar gravando após o texto e enviar novos roteiros.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setView('prompter')}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-black"
                  style={{ background: 'var(--accent)' }}
                >
                  📖 Abrir prompter
                </button>
                <button
                  onClick={() => {
                    controlRoom.destroy()
                    setView('library')
                  }}
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  Encerrar conexão
                </button>
              </div>
            </div>
          )}

          {role === 'control' && (
            <div className="space-y-5">
              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--ok)', background: 'var(--panel)' }}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--ok)' }}>
                    ✓ Conectado ao prompter
                  </p>
                  <button
                    onClick={() => {
                      controlRoom.destroy()
                      setHostOffer('')
                      setAnswerInput('')
                      setControlOfferInput('')
                      setControlAnswer('')
                      setRemoteStatus(null)
                    }}
                    className="rounded-lg border px-3 py-1 text-xs"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    Desconectar
                  </button>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background:
                        remoteStatus?.state === 'running'
                          ? 'rgba(52,211,153,0.15)'
                          : 'var(--border)',
                      color: remoteStatus?.state === 'running' ? 'var(--ok)' : 'var(--muted)',
                    }}
                  >
                    {remoteStatus ? STATUS_LABEL[remoteStatus.state] : 'Aguardando status do prompter...'}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                    {remoteStatus ? `${Math.round(remoteStatus.fraction * 100)}%` : ''}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((remoteStatus?.fraction ?? 0) * 100)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() =>
                      controlRoom.send(remoteStatus?.state === 'running' ? { t: 'pause' } : { t: 'play' })
                    }
                    className="rounded-lg py-2.5 text-sm font-semibold text-black"
                    style={{ background: remoteStatus?.state === 'running' ? 'var(--warn)' : 'var(--accent)' }}
                  >
                    {remoteStatus?.state === 'running' ? '❚❚ Pausar' : '▶ Iniciar'}
                  </button>
                  <button
                    onClick={() => {
                      const next = !mirrorOn
                      setMirrorOn(next)
                      controlRoom.send({ t: 'mirror', on: next })
                    }}
                    className="rounded-lg border py-2.5 text-sm"
                    style={{
                      borderColor: mirrorOn ? 'var(--accent)' : 'var(--border)',
                      color: mirrorOn ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {mirrorOn ? '🪞 Espelho ON' : 'Espelhar'}
                  </button>
                  <button
                    onClick={() => {
                      const next = !openMicOn
                      setOpenMicOn(next)
                      controlRoom.send({ t: 'openMic', on: next })
                    }}
                    className="rounded-lg border py-2.5 text-sm"
                    style={{
                      borderColor: openMicOn ? 'var(--accent)' : 'var(--border)',
                      color: openMicOn ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    Open mic {openMicOn ? 'ON' : 'OFF'}
                  </button>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Posição do texto: {Math.round((remoteStatus?.fraction ?? 0) * 100)}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round((remoteStatus?.fraction ?? 0) * 100)}
                    onChange={(e) => controlRoom.send({ t: 'seek', f: Number(e.target.value) / 100 })}
                    className="w-full"
                  />
                </label>
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
                <p className="mb-3 text-sm font-medium text-white">Enviar roteiro para o prompter</p>
                <input
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                  placeholder="Título do roteiro"
                  className="mb-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <textarea
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={5}
                  placeholder="Cole aqui o texto que o prompter deve exibir e seguir..."
                  className="mb-2 w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed text-white outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button
                  onClick={() => {
                    controlRoom.send({
                      t: 'script',
                      title: scriptTitle.trim() || 'Roteiro remoto',
                      content: scriptContent,
                    })
                    setScriptContent('')
                  }}
                  disabled={!scriptContent.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: 'var(--accent-2)', color: '#0e0a1a' }}
                >
                  📤 Enviar para o prompter
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {scanMode && (
        <Suspense fallback={<p className="py-4 text-xs" style={{ color: 'var(--muted)' }}>Abrindo câmera...</p>}>
          <QrScanner
            onResult={(text) => {
              if (scanMode === 'offer') setControlOfferInput(text)
              else setAnswerInput(text)
              setScanMode(null)
            }}
            onClose={() => setScanMode(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
