# PromptFlow — Product Spec (Working Title)

> "O melhor de Bigvu + Teleprompter Pro + PromptSmart — melhor que todos juntos."

## Visão
Estúdio de vídeo de bolso com IA: **roteiro → prompter → gravação → legendas → exportação → publicação**, com rolagem guiada por voz (VoiceTrack) e **PT-BR first**.

## Princípios
1. **Core 100% offline** — prompter, VoiceTrack e gravação funcionam sem internet (modo avião)
2. **Privacidade por design** — reconhecimento de fala on-device; dados nunca vendidos
3. **Preço transparente** — Free + Compra Única + Assinatura, sem dark patterns (o calcanhar de Aquiles dos 3 concorrentes)
4. **PT-BR first** — UI, reconhecimento de fala, legendas e templates de roteiro em português

---

## 1. Prompter Core (o melhor dos três)

### Rolagem Híbrida (diferencial #1)
- **Modo VoiceTrack**: rola enquanto você fala, para quando pausa/improvisa, retoma quando volta ao script
  - **Tolerância a paráfrase** (fuzzy matching com threshold ajustável) — resolve a queixa nº 1 do PromptSmart
  - Sensibilidade de voz ajustável + limiar de ativação
- **Modo Fixo**: velocidade constante (WPM), com **granularidade fina** (resolve queixa do Teleprompter Pro: 80–250 wpm em passos de 1)
- **Modo Manual**: toque/gesto, teclado, Bluetooth, controle remoto
- **Auto-pause no silêncio** (BIGVU) + retomada automática

### Texto & Layout
- Textos ilimitados (sem limite no plano free)
- **Import multi-formato**: colar, .txt, .md, .docx, PDF, link YouTube/Google Docs, áudio (transcrição)
- Fontes, tamanho, cor, cores de fundo, espaçamento, destaque de palavras-chave
- **Modo espelho** (vidro de teleprompter/hardware) — do Teleprompter Pro
- **Modo Selfie** (texto junto à câmera frontal) — do PromptSmart
- **Mirinha de contato visual**: ponto de fixação no centro da câmera (diferencial)
- Ponto de partida / marcador de posição (retomar de onde parou)
- Waypoints/flags com atalhos de teclado — do PromptSmart
- Seções/cenas com jump (story blocks) — do PromptSmart

### Câmera & Gravação
- **Câmera + texto na mesma tela** (resolve queixa nº 1 do Teleprompter Pro)
- Gravação em **qualidade nativa da câmera** (resolve queixa do PromptSmart), 4K
- Filtros de beleza sutis (pele, dentes), desfoque de fundo — do BIGVU
- Bloqueio de exposição, pause no silêncio, timer, contagem regressiva
- **Continuar gravando depois que o texto termina** (resolve queixa do BIGVU) — modo "open mic" pós-script

---

## 2. Camada de IA (o melhor do BIGVU)

### Roteiro
- Gerador de roteiros por IA com templates: TikTok/Reels, YouTube, vendas, vlog, **culto/pregação**, anúncio, curso
- Input flexível: tema, público, tom, duração-alvo, CTA
- Voice-to-text → roteiro organizado

### Legendas
- Subtítulos automáticos (transcrição on-device ou API)
- Temas de legendas, destaque de palavras-chave, estilo "cinema" ou "social"
- Tradução p/ 70+ idiomas, **PT-BR nativo**
- Export SRT/VTT

### Edição (fases 2+)
- Corte por palavras da transcrição (trim inteligente)
- Remoção de filler words (pausas, "ééé")
- Redimensionamento auto 9:16 / 1:1 / 16:9
- Eye Contact Fix, Background Replace (green screen + IA), B-rolls auto, split screen
- Dublagem IA (30+ idiomas)
- Logo/brand kit overlay, música de fundo (biblioteca sem copyright)

### Distribuição (fase 3)
- Agendamento multi-canal (YT, IG, TikTok, LinkedIn, X, WhatsApp)
- Video e-mail
- Dashboard de métricas
- Workspaces de equipe + brand kits

---

## 3. Controle & Multi-dispositivo (PromptSmart)
- **Web Control Room**: controlar o prompter do celular pelo desktop; push de texto em tempo real; mirror do texto; multi-display
- **App/remote separado** + atalhos de teclado + **Bluetooth** (do Teleprompter Pro)
- Sync cloud opcional (Drive, Dropbox, OneDrive)
- Janela translúcida sobre meetings (desktop) — fase 3

---

## 4. Modelo de Preço (diferencial estratégico)
| Plano | Preço (sugestão BR) | O que inclui |
|---|---|---|
| **Free** | R$ 0 | Prompter completo + VoiceTrack (offline), textos ilimitados, gravação HD até 10 min, 1080p, marca d'água sutil, créditos IA limitados |
| **Pro (compra única)** | ~R$ 149 | Sem marca d'água, 4K, import multi-formato, modo espelho, Bluetooth, editor básico, créditos IA mensais |
| **Studio (assinatura)** | ~R$ 29/mês ou R$ 249/ano | Tudo do Pro + editor IA completo, legendas 70+ idiomas, agendamento multi-canal, times, web control room |

- **Sem pressão de upgrade**: trial real de 7 dias com cancelamento em 1 toque no app (resolve as queixas de faturamento dos 3)
- Compra única como âncora de confiança (assim como o Teleprompter Pro faz)

---

## 5. Escopo do MVP (Fase 1)
Objetivo: **prompter de verdade, melhor que todos, sem depender de nuvem.**

### Inclui
1. Editor de script (colar/importar .txt/.md/.docx, múltiplos scripts, seções)
2. Prompter em tela cheia: fontes/cores/tamanhos, velocidade fina (WPM), modo espelho, modo selfie, marcador de posição
3. **VoiceTrack com tolerância a paráfrase** (Web Speech API on-device, PT-BR + EN)
4. **Câmera + overlay de texto + gravação** (MediaRecorder, qualidade nativa)
5. Continuar gravando pós-script (open mic)
6. Biblioteca de scripts local (IndexedDB) + export .txt
7. Tema claro/escuro, PWA instalável, 100% offline
8. Gerador de roteiro IA (1 modelo, templates básicos) — feature de gancho

### Fases seguintes
- **Fase 2**: Legendas IA (temas, tradução, SRT), editor (corte por palavras, fillers, redimensionamento), import PDF/link/áudio, Bluetooth
- **Fase 3**: Editor IA completo (eye contact, B-roll, dublagem, green screen IA), agendamento multi-canal, web control room, workspaces
- **Fase 4**: AI Twin/avatar, API, apps nativos (capacitor)

---

## 6. Stack (proposta — pendente de confirmação)
| Camada | Opção A (recomendada) | Opção B |
|---|---|---|
| Frontend | **React + Vite + TypeScript** | Next.js (se SSR for necessário depois) |
| Estilo | Tailwind CSS | — |
| Estado | Zustand | React Query + contexto |
| Armazenamento | IndexedDB (Dexie.js) | — |
| Voz (VoiceTrack) | Web Speech API (on-device) + fallback Whisper (local via transformers.js) | — |
| Vídeo | MediaRecorder + getUserMedia | WebCodecs (fases futuras) |
| IA | API OpenAI (roteiros/legendas) — chave do usuário ou backend | — |
| PWA | vite-plugin-pwa | — |

**Por que web/PWA no MVP:** 1 código para desktop + celular (browser), Web Speech API madura em Chrome/Android, iteração rápida, instalável; empacotar nativo (Capacitor) depois se necessário.
