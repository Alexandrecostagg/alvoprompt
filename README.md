# Alvoprompt

**Seu texto no alvo, seus olhos na câmera.** · *Your text on target, your eyes on camera.*

Teleprompter com IA — o melhor de BIGVU + Teleprompter Pro + PromptSmart em uma única ferramenta, com **melhorias substanciais**: IA local, control room sem servidor e estúdio de vídeo completo, 100% offline.

Roteiro → Prompter (VoiceTrack) → Gravação → (IA: legendas, edição) → Publicação.

## Marca

- **Nome**: Alvoprompt — "alvo" (mira/ponto de mira, português) + "prompt" (teleprompter): manter os olhos no alvo é a câmera.
- **Slogan (PT)**: Seu texto no alvo, seus olhos na câmera.
- **Slogan (EN)**: Your text on target, your eyes on camera.
- **Domínios disponíveis**: alvoprompt.com · .com.br · .app · .dev · .io · .ai · .net · .live · .studio
- **Logotipo**: marca em squircle com gradiente violeta → ciano formando um "A" cuja barra central é a linha de leitura do teleprompter — [`public/favicon.svg`](public/favicon.svg). Tema claro padrão com alternância claro/escuro no cabeçalho.

| Token | Cor |
|---|---|
| Violeta (primária) | `#A78BFA` → `#6366F1` (gradiente) |
| Ciano (accent) | `#22D3EE` |
| Fundo | `#0B0D12` |
| Superfície | `#12151D` |

## Visão

Estúdio de vídeo de bolso com IA, **PT-BR first** e **core 100% offline**:

- **VoiceTrack** — o texto rola enquanto você fala, pausa quando você para e retoma quando você volta ao script, com **tolerância a paráfrase** (reconhecimento de fala on-device via Web Speech API)
- **Prompter profissional** — rolagem por voz / velocidade fixa (60–300 wpm, passo de 1) / manual, modo espelho (vidro de teleprompter), modo selfie, destaque da palavra atual, atalhos de teclado
- **Câmera + texto na mesma tela** — gravação em qualidade nativa (até 4K/12 Mbps), com "open mic" para continuar gravando após o fim do script
- **Biblioteca local** — roteiros salvos em IndexedDB, import de .txt/.md, 100% offline
- **IA (roadmap)** — gerador de roteiros, legendas automáticas com tradução 70+ idiomas, corte por palavras, remoção de fillers, redimensionamento multi-plataforma
- **Web Control Room** — controle o prompter de outro aparelho na mesma rede, sem servidor (WebRTC + DataChannel com pareamento por código/QR)

Detalhes da pesquisa e decisões de produto: [`docs/`](docs/)

- [docs/01-analise-competidores.md](docs/01-analise-competidores.md) — análise profunda de BIGVU, Teleprompter Pro e PromptSmart
- [docs/02-product-spec.md](docs/02-product-spec.md) — features, MVP, fases e modelo de preço
- [docs/03-analise-competidores-2.md](docs/03-analise-competidores-2.md) — ronda 2: Descript, OpusClip, Opticue e Teleprompter.com (o que copiar)

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand (estado) + Dexie/IndexedDB (persistência local)
- Web Speech API (VoiceTrack on-device)
- MediaRecorder + getUserMedia (câmera/gravação)
- qrcode.react + jsQR (pareamento por QR no Web Control Room)

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

> O VoiceTrack (reconhecimento de voz) funciona em navegadores com Web Speech API (Chrome/Edge/Safari). O restante do app funciona offline em qualquer navegador moderno.

## Atalhos (no prompter)

| Tecla | Ação |
|---|---|
| `Espaço` | Iniciar / pausar |
| `↑` / `↓` | Ajustar posição |
| `M` | Espelhar texto |
| `Esc` | Fechar ajustes / sair |

## Estrutura

```
src/
├── components/
│   ├── ai/AiPanel.tsx            # assistente IA (gerar/melhorar/títulos)
│   ├── library/ScriptLibrary.tsx # lista/criação/importação de roteiros
│   ├── editor/ScriptEditor.tsx   # edição de roteiro
│   ├── editor/ScriptAnalysis.tsx # análise + remoção de fillers
│   ├── editor/VideoEditor.tsx    # corte por palavras, redimensionamento, legendas, marca/som, chroma key + movimento
│   ├── control/ControlRoom.tsx   # Web Control Room (pareamento + painel de controle)
│   ├── control/QrCode.tsx        # QR do código de pareamento (qrcode.react)
│   ├── control/QrScanner.tsx     # leitor de QR pela câmera (jsQR, code-split)
│   ├── SyncControl.tsx           # sync em nuvem por frase-chave (☁️ no header)
│   ├── scheduling/SchedulingHub.tsx # agendamento multi-canal (YouTube, IG, TikTok, LinkedIn, X, WhatsApp)
│   ├── workspace/WorkspacesPanel.tsx # workspaces de equipe + brand kit
│   ├── aiTwin/AiTwin.tsx         # AI Twin: rosto (foto/Flux) + voz + avatar falante
│   └── prompter/
│       ├── PrompterView.tsx      # prompter full-screen (texto + câmera + gravação + legendas)
│       ├── SettingsPanel.tsx     # ajustes de rolagem, texto, câmera e enquadramento
│       └── AspectGuide.tsx       # guias 9:16 / 1:1 / 16:9
├── hooks/
│   ├── usePrompterEngine.ts      # motor de rolagem (fixa/voz/manual)
│   ├── useVoiceTrack.ts          # VoiceTrack: ASR on-device + matching fuzzy
│   ├── useRecorder.ts            # câmera + MediaRecorder
│   └── useTranscription.ts       # transcrição p/ legendas (modos fixa/manual)
├── lib/
│   ├── ai.ts                     # DeepSeek (streaming)
│   ├── controlRoom.ts            # WebRTC + DataChannel (pareamento, comandos host)
│   ├── db.ts                     # Dexie (IndexedDB)
│   ├── importers.ts              # extração de .txt/.md/.docx/PDF/link
│   ├── speech.ts                 # tipos + factory do Web Speech API
│   ├── srt.ts                    # geração de legendas SRT
│   ├── translate.ts              # tradução de legendas (70+ idiomas)
│   ├── video/render.ts           # pipeline de edição de vídeo (canvas + MediaRecorder, logo/música, chroma key, Ken Burns)
│   ├── cuts.ts                   # cortes automáticos por palavra (timeline) e por análise de áudio RMS (remoção de pausas/silêncios)
│   ├── faceTrack.ts              # reframe com tracking de rosto (Shape Detection API → crop dinâmico)
│   ├── clipPrompt.ts             # comandos em linguagem natural p/ cortar/formatar ("de 1:30 a 2:15", "remove silêncio")
│   ├── sync.ts                   # merge/upload/download de roteiros (KV via Worker)
│   ├── syncWorker.ts             # cliente dos endpoints /sync, /schedules e /workspaces (frase-chave)
│   ├── scheduling.ts             # agendamentos: canais, caption por canal, sync por frase-chave
│   ├── workspace.ts              # workspaces: membros/papéis, brand kit, sync por frase-chave
│   ├── aiTwin.ts                 # avatar falante local (canvas+audio) + gravação de amostras de voz
│   ├── cloudflare.ts             # cliente do Worker (Whisper/TTS/tradução)
│   ├── text.ts                   # tokens, normalização, similaridade, fillers, stats
│   └── types.ts                  # tipos e settings padrão
└── store/useAppStore.ts          # Zustand
```

## Serviços em nuvem (planos gratuitos)

### Nuvem Alvoprompt (sincronização de roteiros) — ✅ ativo

Sync sem cadastro por **frase-chave** (o mesmo segredo em outro dispositivo acessa os mesmos
roteiros). Botão **☁️ Sincronizar** no topo: cria a frase-chave, sincroniza (merge por roteiro,
o mais recente vence) e envia alterações automaticamente. Dados ficam no **Cloudflare KV** por
90 dias (expiração). Implementação: `src/lib/sync.ts`, `src/lib/syncWorker.ts`,
`src/components/SyncControl.tsx` e endpoint `GET/PUT /sync` no Worker.

> **Nota**: quem souber sua frase-chave acessa seus roteiros — escolha uma frase só sua.
> Roteiros antigos recebem uma `key` (UUID) estável automaticamente na primeira sincronização.

### Cloudflare (transcrição Whisper, TTS, tradução, sync e mídia) — ✅ configurado

- **Worker `alvoprompt-api`** publicado: https://alvoprompt-api.alexandrecostagg.workers.dev
- **R2 bucket `alvoprompt-media`** criado (binding `alvoprompt_media` no Worker)
- **KV `ALVOPROMPT_SYNC`** criado (binding no Worker; sync de roteiros por frase-chave)
- Endpoints: `POST /transcribe` (Whisper), `POST /tts` (MeloTTS → fallback Aura), `POST /translate` (m2m100),
  `POST /import-url` (YouTube/Google Docs/URL genérica), `POST /avatar` (geração de imagem Flux),
  `PUT/GET/DELETE /media/:key` (R2), `GET/PUT /sync` (roteiros), `GET/PUT /schedules` (agendamentos),
  `GET/PUT /workspaces` (workspaces) — os três últimos usam KV com header `x-sync-pass`
- Código em `api/transcribe`; cliente em `src/lib/cloudflare.ts`

> **Nota sobre YouTube**: o YouTube bloqueia IPs de datacenter, então a transcrição via
> legenda pode falhar (HTTP 429) dependendo do vídeo/horário. Google Docs (export txt) e
> páginas genéricas funcionam de forma confiável.

## PWA instalável

O app é uma PWA instalável (manifest + service worker via `vite-plugin-pwa`): instale pelo
navegador (Chrome/Edge: ícone na barra de endereço; iOS Safari: Compartilhar → Adicionar à
Tela de Início). Funciona offline após o primeiro acesso.

## App mobile (Capacitor — iOS e Android)

O web app é empacotado nativamente com Capacitor (sem reescrever nada):

```bash
npm run android   # build + sync + abre o Android Studio
npm run ios       # build + sync + abre o Xcode
```

- Permissões já configuradas: câmera + microfone (iOS `Info.plist`, Android `AndroidManifest.xml`)
- Plugins: Filesystem, Share, StatusBar, SplashScreen, App
- **iOS**: Web Speech não existe no Safari → o modo Voz usa Whisper via Cloudflare no mobile
- **Android**: Web Speech + Gamepad API funcionam nativamente

## Roadmap

- [x] **Fase 1 (MVP)** — prompter core: VoiceTrack, rolagem fixa/manual, modo espelho, câmera + gravação, biblioteca local
- [x] **Fase 2** — gerador de roteiros IA, melhorar roteiro, títulos & ganchos **+ hashtags**, análise de roteiro (palavras-chave + duração), remoção de fillers/vícios de linguagem, guia de enquadramento 9:16/1:1/16:9, legendas automáticas com export SRT (Web Speech API), tradução de legendas para 70+ idiomas (DeepSeek), **editor de vídeo** (redimensionamento 9:16/1:1/16:9, corte por palavras da transcrição, temas de legenda queimadas no vídeo — canvas + MediaRecorder), import .docx/PDF/link
  - [x] import **áudio (transcrição Whisper)** e **link YouTube/Google Docs** (via Worker Cloudflare)
- [x] **Fase 3** — **Web Control Room** (controlar o prompter de outro aparelho na mesma rede: pareamento sem servidor via WebRTC/DataChannel por código **ou QR escaneado pela câmera**, enviar roteiro, play/pause, seek, espelhar, open mic, status em tempo real), **mírula de contato visual** (dot no centro da câmera), **brand kit no editor** (logo sobreposta + trilha sonora com mix de áudio no vídeo exportado), **green screen (chroma key)** com troca de cor de fundo e suavização, **movimento de câmera (Ken Burns)** no editor de vídeo (zoom-in/zoom-out/pan esquerda-direita por trecho), **B-rolls automáticos** (corte de pausas/silêncios usando o timing das palavras da transcrição **ou análise do áudio por RMS** — funciona até sem transcrição, com limiar de pausa, margem e sensibilidade ajustáveis — tudo offline no editor), **modo tempo-alvo** (terminar o roteiro em X minutos), **atalhos por gamepad/foot pedal**, **fábrica de clipes 9:16** (1 vídeo → N shorts com legendas queimadas e word highlight), **reframe automático seguindo o rosto** (Shape Detection API) **+ eye contact fix** (olhos no terço superior, offline) e **comandos em linguagem natural** ("pega a parte de 1:30 a 2:15", "corte os primeiros 20s", "remove o silêncio"), **intro/outro de marca** (cards com gradiente no início/fim do vídeo), **dublagem IA** (TTS MeloTTS no editor), **fontes p/ dislexia + RTL**, **calculadora de tempo/fala**
  - [x] **agendamento multi-canal** (mesmo vídeo/legenda para YouTube, Instagram, TikTok, LinkedIn, X e WhatsApp, com legenda pronta por canal, link WhatsApp e sync por frase-chave) e **workspaces de equipe** (membros com papéis, brand kit com logo/cores, sync por frase-chave)
- [x] **Fase 4** — **PWA instalável**, **API** (Worker consumido pelo app: transcrição, TTS, import de URL, avatar), **geração de avatares** (AI Twin parte visual, Flux), **empacotamento nativo (Capacitor)** iOS e Android
  - [x] **AI Twin completo** (clone de rosto+voz para avatar falante): rosto por foto ou geração Flux, clone de voz por amostras gravadas, e **avatar falante 100% local** (animação de respiração + "boca" sincronizada com a amplitude do áudio via canvas + MediaRecorder, com export de vídeo)
