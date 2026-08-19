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
    <label className="flex flex-col items-stretch gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm" style={{ color: 'var(--text)' }}>
        {label}
      </span>
      <div className="flex items-center justify-end gap-2">{children}</div>
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
      className="relative h-7 w-12 rounded-full transition-colors"
      style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all"
        style={{ left: checked ? 'calc(100% - 26px)' : '2px' }}
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
    <div className="flex max-w-full overflow-x-auto rounded-xl border p-0.5" style={{ borderColor: 'var(--border)' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="min-h-9 shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
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
    <div className="fixed inset-0 z-40 flex items-end sm:justify-end">
      <button aria-label="Fechar configurações" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-[2rem] border sm:h-full sm:max-h-none sm:max-w-sm sm:rounded-none sm:border-l" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
        <span className="mx-auto mt-3 block h-1 w-12 rounded-full sm:hidden" style={{ background: 'var(--border)' }} aria-hidden="true" />
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <div><h2 className="font-semibold text-white">Ajustes do prompter</h2><p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>Veja o resultado enquanto configura.</p></div>
          <button
            onClick={onClose}
            className="min-h-10 rounded-xl border px-3 text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Concluir
          </button>
        </div>

        <div className="mx-5 mt-4 overflow-hidden rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: settings.bgColor }} aria-label="Prévia do texto do prompter">
          <p className="truncate text-center" style={{ color: settings.fontColor, fontFamily: settings.fontFamily, fontSize: Math.min(settings.fontSize, 28), lineHeight: settings.lineHeight, letterSpacing: settings.letterSpacing, transform: settings.mirror ? 'scaleX(-1)' : undefined }}>Seu roteiro aparece assim na tela</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
    </div>
  )
}
