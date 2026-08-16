import type { PrompterSettings } from '../../lib/types'
import { useAppStore } from '../../store/useAppStore'

const FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'Padrão (Sans)' },
  { value: 'OpenDyslexic, sans-serif', label: 'OpenDyslexic (dislexia)' },
  { value: 'Lexend, sans-serif', label: 'Lexend (leitura fácil)' },
  { value: 'Georgia, serif', label: 'Serifa (Georgia)' },
]

const VOICE_LANGS = [
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'pt-PT', label: 'Português (PT)' },
  { code: 'en-US', label: 'Inglês (US)' },
  { code: 'en-GB', label: 'Inglês (UK)' },
  { code: 'es-ES', label: 'Espanhol (ES)' },
  { code: 'es-419', label: 'Espanhol (LatAm)' },
  { code: 'fr-FR', label: 'Francês' },
  { code: 'de-DE', label: 'Alemão' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'ja-JP', label: 'Japonês' },
  { code: 'zh-CN', label: 'Chinês (Simplificado)' },
]

interface SettingsPanelProps {
  settings: PrompterSettings
  wordCount: number
  onClose: () => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm" style={{ color: 'var(--text)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </label>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
      />
    </button>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
          style={{
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? 'black' : 'var(--muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function SettingsPanel({ settings, wordCount, onClose }: SettingsPanelProps) {
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetSettings = useAppStore((s) => s.resetSettings)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex h-full w-full max-w-sm flex-col border-l" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-white">Configurações do Prompter</h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Fechar (Esc)
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
              Rolagem
            </h3>
            <Row label="Modo">
              <Segmented
                value={settings.mode}
                options={[
                  { value: 'voice', label: 'Voz' },
                  { value: 'fixed', label: 'Fixa' },
                  { value: 'timed', label: 'Tempo' },
                  { value: 'manual', label: 'Manual' },
                ]}
                onChange={(mode) => updateSettings({ mode })}
              />
            </Row>
            {settings.mode === 'fixed' && (
              <Row label={`Velocidade: ${settings.wpm} wpm`}>
                <input
                  type="range"
                  min={60}
                  max={300}
                  step={1}
                  value={settings.wpm}
                  onChange={(e) => updateSettings({ wpm: Number(e.target.value) })}
                  className="w-36"
                />
              </Row>
            )}
            {settings.mode === 'timed' && (
              <>
                <Row label={`Terminar em: ${settings.targetMinutes} min`}>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={0.5}
                    value={settings.targetMinutes}
                    onChange={(e) => updateSettings({ targetMinutes: Number(e.target.value) })}
                    className="w-36"
                  />
                </Row>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Velocidade calculada: ≈{' '}
                  {Math.max(1, Math.round(wordCount / Math.max(0.1, settings.targetMinutes)))} wpm
                  ({wordCount} palavras).
                </p>
              </>
            )}
            {settings.mode === 'voice' && (
              <>
                <Row label={`Sensibilidade: ${Math.round(settings.voiceSensitivity * 100)}%`}>
                  <input
                    type="range"
                    min={0.4}
                    max={0.9}
                    step={0.05}
                    value={settings.voiceSensitivity}
                    onChange={(e) => updateSettings({ voiceSensitivity: Number(e.target.value) })}
                    className="w-36"
                  />
                </Row>
                <Row label="Idioma da voz">
                  <select
                    value={settings.voiceLang}
                    onChange={(e) => updateSettings({ voiceLang: e.target.value })}
                    className="rounded-lg border bg-transparent px-2 py-1.5 text-sm text-white"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {VOICE_LANGS.map((l) => (
                      <option key={l.code} value={l.code} style={{ background: 'var(--panel)' }}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </Row>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  O texto rola conforme você fala e pausa quando você para. Sensibilidade menor
                  tolera mais variações na fala.
                </p>
              </>
            )}
            <Row label="Continuar gravando após o fim (open mic)">
              <Toggle
                checked={settings.openMic}
                onChange={(openMic) => updateSettings({ openMic })}
              />
            </Row>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
              Texto
            </h3>
            <Row label={`Tamanho: ${settings.fontSize}px`}>
              <input
                type="range"
                min={24}
                max={120}
                step={2}
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="w-36"
              />
            </Row>
            <Row label="Espaçamento de linha">
              <input
                type="range"
                min={1.2}
                max={2.4}
                step={0.05}
                value={settings.lineHeight}
                onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                className="w-36"
              />
            </Row>
            <Row label="Espaçamento de letras">
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={settings.letterSpacing}
                onChange={(e) => updateSettings({ letterSpacing: Number(e.target.value) })}
                className="w-36"
              />
            </Row>
            <Row label="Cor do texto">
              <input
                type="color"
                value={settings.fontColor}
                onChange={(e) => updateSettings({ fontColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
            </Row>
            <Row label="Cor de fundo">
              <input
                type="color"
                value={settings.bgColor}
                onChange={(e) => updateSettings({ bgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
            </Row>
            <Row label="Fonte">
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="rounded-lg border bg-transparent px-2 py-1.5 text-sm text-white"
                style={{ borderColor: 'var(--border)' }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} style={{ background: 'var(--panel)' }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Destacar palavra atual">
              <Toggle
                checked={settings.highlightWords}
                onChange={(highlightWords) => updateSettings({ highlightWords })}
              />
            </Row>
            <Row label="Espelhar texto (vidro de teleprompter)">
              <Toggle checked={settings.mirror} onChange={(mirror) => updateSettings({ mirror })} />
            </Row>
            <Row label="Texto da direita p/ esquerda (RTL)">
              <Toggle checked={settings.rtl} onChange={(rtl) => updateSettings({ rtl })} />
            </Row>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
              Câmera
            </h3>
            <Row label="Câmera + gravação">
              <Toggle checked={settings.cameraOn} onChange={(cameraOn) => updateSettings({ cameraOn })} />
            </Row>
            {settings.cameraOn && (
              <Row label="Posição da câmera">
                <Segmented
                  value={settings.cameraPosition}
                  options={[
                    { value: 'bottom', label: 'Baixo' },
                    { value: 'top', label: 'Topo' },
                  ]}
                  onChange={(cameraPosition) => updateSettings({ cameraPosition })}
                />
              </Row>
            )}
            <Row label="Guia de enquadramento">
              <Segmented
                value={settings.aspectGuide}
                options={[
                  { value: 'none', label: 'Nenhum' },
                  { value: '9:16', label: '9:16' },
                  { value: '1:1', label: '1:1' },
                  { value: '16:9', label: '16:9' },
                ]}
                onChange={(aspectGuide) => updateSettings({ aspectGuide })}
              />
            </Row>
            {settings.cameraOn && (
              <Row label="Mirinha de contato visual">
                <Toggle
                  checked={settings.eyeContactDot}
                  onChange={(eyeContactDot) => updateSettings({ eyeContactDot })}
                />
              </Row>
            )}
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              Mostra a área que será visível em cada plataforma na hora da gravação.
            </p>
          </section>

          <button
            onClick={resetSettings}
            className="w-full rounded-lg border py-2 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Restaurar padrões
          </button>
        </div>
      </div>
      <button
        aria-label="Fechar configurações"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </div>
  )
}
