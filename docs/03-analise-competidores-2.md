# Análise de Competidores — Ronda 2: Descript, OpusClip, Opticue, Teleprompter.com

> Pesquisa de referência de produto. Confirme preços e funcionalidades nas fontes oficiais antes de reutilizar estes dados publicamente.

> Pesquisa realizada em 16/08/2026 (sites oficiais: descript.com, opus.pro, teleprompter.com)

---

## 1. Descript — "Editar vídeo como editar um documento"

**Dados:** 6M+ criadores/equipes (Amazon, BBC, Netflix, Spotify, Shopify, NYT, Microsoft) · 25 idiomas de transcrição · planos por assinatura

### Funcionalidades
| Área | Recursos |
|---|---|
| **Edição** | Edição baseada em texto (apaga palavra do áudio/vídeo editando o doc), transcrição automática 25 idiomas (inclui PT-BR), captions dinâmicos (estilos, word highlight), transições, multicam automático, layouts/animations |
| **Áudio IA** | Studio Sound (limpa ruído, qualidade de estúdio em 1 clique), Remove Filler Words ("um, éhh"), Shorten Word Gaps (corta silêncios), Edit for Clarity (corta digressões), Remove Retakes, Regenerate Speech (regera voz pra cobrir cortes) |
| **Visual IA** | **Eye Contact** (ajusta sutilmente o olhar pra parecer que olha pra câmera — "read off your script, screen, or teleprompter without endless retakes"), Green Screen (remove fundo sem chroma físico), Video Regenerate, Center Active Speaker |
| **Criação** | Underlord (co-editor IA que edita por prompt), Create Clips (corta highlights), geração de vídeo/imagem por texto, AI avatars (35+, foto ou texto), AI voices (25+ stock + clone de voz) |
| **Tradução/Dublagem** | Traduz legendas em 61 idiomas, **dublagem em 30 idiomas** (com revisão de tradução), vozes nativas em 14 idiomas |
| **Equipes** | Rooms (gravação remota com produtor/control room, backup cloud), Brand Studio (templates/guardrails da marca), layouts compartilháveis, comentários com timestamp |
| **Plataforma** | Desktop (Win/Mac) + web; API + MCP (editar vídeo por código) |

### Preço (descript.com/pricing)
| Plano | Anual (mensal) | Destaques |
|---|---|---|
| Free | $0 | 60 min de mídia/mês, 100 créditos IA (1x), marca d'água |
| Hobbyist | $16 ($24) | 10h/mês, 400 créditos, 1080p sem marca, Underlord, Studio Sound, Filler Words, Clips |
| Creator | $24 ($35) | 30h/mês, 800 créditos, 4K, +20 ferramentas IA, geração de vídeo |
| Business | $50 ($65) | 40h/mês, 1.500 créditos, Brand Studio, **dublagem 30+ idiomas**, avatares custom |
| Enterprise | custom | SSO/SCIM, SOC 2, controle de dados, suporte dedicado |

### Pontos fortes
- **O "eye contact" que o mercado paga caro**: feature premium confirmada, valida nosso roadmap
- UX de "editar como doc" é o diferencial mais desejado por quem produz muito
- Ecossistema completo (transcrição → edição → clipes → dublagem) e escala enterprise
- Underlord (agente que edita por prompt) = tendência clara de agentes de edição

### Pontos fracos
1. **100% cloud** — sem modo offline; minutos/créditos limitam; áudio/vídeo vai pro servidor
2. **Não tem teleprompter** — gravação é de webcam/arquivo; quem lê script usa apps à parte
3. **Custo por crédito** cresce rápido com uso; regravação/retakes consomem minutos
4. Curva de aprendizado (conceito de documento≠timeline)

### O que copiar/estudar
- **Eye Contact** (IA de olhar) → roadmap do AlvoPrompter; estudar a promessa de venda ("sem retakes")
- **Regenerate Speech / cobrir cortes** → fecha a lacuna de qualidade ao remover silêncios/pausas
- **Edit for Clarity + Shorten Word Gaps** → valida nosso corte de pausas automático (já temos por RMS)
- **Brand Studio + Create Clips** → templates de marca e "1 vídeo → N clipes"
- **Transcrição 25 idiomas com PT-BR** → nossa barra (Web Speech on-device) vs. precisão de cloud deles

---

## 2. OpusClip (opus.pro) — "Fábrica de clipes virais"

**Dados:** 16M+ criadores/negócios · clientes: Logan Paul, Mark Rober, Dhar Mann, iHeartMedia, NVIDIA, GitHub · 20+ idiomas (inclui PT)

### Funcionalidades
- **ClipAnything** — único modelo que clipa qualquer gênero (podcast, vlog, gaming, esportes, entrevista, explicação), com detecção de momentos "viral-worthy" via análise visual + áudio + sentimento; também aceita prompt em linguagem natural ("clipa o momento X")
- **ReframeAnything** — redimensiona para qualquer plataforma com **tracking de objeto por IA** (mantém o sujeito centralizado no reframe); tracking manual como fallback
- **Captions automáticas** (97%+ de precisão, editáveis), dinâmicas
- Brand templates (fonte, cor, logo, intro/outro), team workspace, API/workflow (integração com CMS)
- Fontes: YouTube, Google Drive, Vimeo, Zoom, Twitch, FB, LinkedIn, Twitter, Loom, Riverside, StreamYard

### Preço
| Plano | Preço | Destaques |
|---|---|---|
| Free | $0 | 60 min de processamento/mês (free-forever) |
| Pro (trial 7 dias) | pago mensal/anual | 90 min no trial (~30 clipes); créditos flexíveis |

### Pontos fortes
- Escala massiva e casos reais de crescimento (watch time +57%, views 2x)
- ClipAnything (qualquer tipo de vídeo) + prompt em linguagem natural
- Reframe com tracking de objeto — resolve o corte de movimento no reframe
- Automação por API = "criação em piloto automático"

### Pontos fracos
1. **Cloud puro** — você envia o vídeo e espera; nada local, privacidade zero
2. Zero prompter, zero gravação, zero edição de timeline fina
3. Custo mensal + dependência do algoritmo; sem granularidade de parâmetros
4. Para nosso público (pregação, vendas, aulas) o "momento viral" é menos útil que o "corte limpo de fala"

### O que copiar/estudar
- **1 vídeo longo → N shorts**: evoluir nosso "corte por palavras/pausas" para gerar N cortes com captions dinâmicas 9:16
- **Reframe com tracking**: nosso reframe 9:16/1:1 pode ganhar rastreamento do rosto (centroide da face) em vez de box fixo
- **Captions dinâmicas**: estilos de legenda animada queimada no vídeo (temos fixas)
- **Prompts em linguagem natural para cortar**: "corte os primeiros 20s", "pega a parte da história" — fácil de fazer local
- Publicação multi-destino (roadmap: agendamento multi-canal)

---

## 3. Opticue — teleprompter de referência (UX de leitura)

**Dados:** empresa americana de teleprompter **hardware + software**; usado por criadores profissionais (Ali Abdaal etc.) e estúdios; app iOS/macOS + rig com vidro beam-splitter

> ⚠️ Site não acessível na automação (conteúdo em JS); detalhes baseados em conhecimento público consolidado — confirmar antes de citar números.

### Funcionalidades
- Rolagem suave com **destaque palavra-a-palavra** da linha atual
- **Calibração da lente** para o vidro beam-splitter (foco, distância, espelhamento)
- Modo espelho / atrás da câmera (texto real lido pela lente)
- Controle remoto por outro iPhone/iPad/Apple Watch; atalhos de teclado
- Ajuste fino de velocidade, fonte, cores, tamanho e posição do texto
- Gravação 4K junto ao prompter (sem necessidade de app separado)

### Preço
- App (compra única/IAP) + **hardware (rig) vendido à parte** (faixa de US$ 200–500 conforme kit)

### Pontos fortes
- Referência de **ergonomia e suavidade de leitura** — a sensação "premium" que criadores elogiam
- Ecossistema fechado com hardware próprio (rig → app → gravação)
- Confiança de criadores grandes (o "padrão YouTube" de teleprompter)

### Pontos fracos
1. **Exige hardware caro** — barreira de entrada
2. Sem IA (sem transcrição, cortes, eye contact, legendas)
3. Sem edição, sem cloud, sem multiusuário; iOS/macOS only
4. Sem control room sem servidor

### O que copiar/estudar
- **Curva/física de rolagem suave** e word-by-word highlight → nosso destaque de palavra (já temos) com rolagem mais "física"
- **Calibração** → nosso "modo espelho" pode ganhar assistente de calibração (espelhar apenas o texto, não a câmera)
- **Controle remoto nativo (Watch/pedal)** → atalhos BT (temos teclado; falta foot pedal/MIDI)
- Diferencial nosso: **o mesmo resultado sem comprar hardware** (modo espelho + selfie + mirinha de contato visual)

---

## 4. Teleprompter.com (Teleprompter Kft — bônus descoberto)

**Dados:** 1M+ criadores · 17M+ vídeos gravados · 100K+ avaliações · clientes: P&G, Meta, CNN, BBC, Netflix, Amazon · iOS, Android, Mac, **Web e Apple Watch** · desde 2018

### Funcionalidades
- **VoiceGlide™** — rolagem por voz (segue sua fala, pausa quando você pausa) + 3 outros modos: velocidade fixa, **tempo-alvo** (terminar em X minutos) e WPM
- Cloud sync de roteiros (Google Drive, Dropbox, iCloud, Word, PDF), edição em tempo real
- **Controle remoto amplo** — outro iPhone/iPad/Apple Watch, teclado BT, apresentadores, **controles de jogo (MIDI) e foot pedal**; funciona offline
- Legendas automáticas a partir do roteiro + export em vários formatos
- Gravação 4K sem marca, clean audio (remove ruído), blur/troca de fundo, troca de câmera frontal/traseira ao vivo
- Espelhamento vertical/horizontal para rigs, fontes p/ dislexia (OpenDyslexic, Lexend), RTL (hebraico/árabe)
- **Live streaming multi-plataforma** (IG, TikTok, YT, LinkedIn)
- Tools web: geradores (título, hashtags, roteiro), calculadora de tempo, remoção de ruído, MCP

### Preço
- **Starter grátis** (cloud, fontes/cores, controle remoto básico; gravação com marca d'água)
- **Pro/Max** anuais com 7 dias grátis (4K sem marca, espelhamento p/ rig, controle remoto avançado, legendas automáticas, clean audio)

### Pontos fortes
- Escala global real (1M+ criadores, 100K+ reviews, clientes enterprise)
- VoiceGlide validado comercialmente → confirma o valor do nosso VoiceTrack
- Multi-dispositivo (incl. Apple Watch) + controles profissionais (MIDI, pedal)
- Live streaming multi-plataforma + ferramentas SEO (títulos/hashtags) → motor de aquisição

### Pontos fracos
1. **Sem editor de vídeo IA** — só legendas e resize; sem cortes automáticos, eye contact, dublagem
2. Sem control room sem servidor (remote deles depende da conta/cloud)
3. Cloud dependence; sem promessa de privacidade local; free tem marca d'água
4. Inglês-first (sem foco PT-BR); sem chroma key/Ken Burns/B-rolls

### O que copiar/estudar
- **Modo tempo-alvo** ("terminar em 3 min") — não temos ainda; fácil de calcular com nossa duração estimada
- **Foot pedal / MIDI / gamepad** como atalhos → estender nosso controle remoto
- **Ferramentas web de aquisição** (gerador de título/hashtag, calculadora de tempo, word counter) → tráfego orgânico; podemos espelhar localmente
- **Fontes para dislexia + RTL** → acessibilidade (rápido de adicionar)
- Live streaming multi-destino → roadmap (nosso control room WebRTC já é a base)

---

## 5. Síntese Comparativa

| Capability | Descript | OpusClip | Opticue | Teleprompter.com | **AlvoPrompter** |
|---|---|---|---|---|---|
| Teleprompter core | ❌ | ❌ | ✅✅ (UX) | ✅✅ (VoiceGlide) | ✅✅ (VoiceTrack c/ paráfrase) |
| Câmera + texto na mesma tela | ❌ | ❌ | ✅ | ✅ (4K) | ✅ (nativa) |
| Offline / on-device | ❌ (cloud) | ❌ (cloud) | ✅ | parcial | ✅✅ (100% local) |
| Controle remoto | ❌ | ❌ | ✅ (Apple) | ✅✅ (BT/MIDI/pedal/Watch) | ✅ (WebRTC + atalhos) |
| Edição IA (cortes, eye contact, dublagem) | ✅✅ (pago/créditos) | ✅ (clips) | ❌ | ❌ | ✅ (parcial local) |
| Eye Contact | ✅ (premium) | ❌ | ❌ | ❌ | 🔜 roadmap |
| Clipes/shorts 9:16 | ✅ (Create Clips) | ✅✅ (ClipAnything) | ❌ | ❌ | 🔜 (base: cortes automáticos) |
| Reframe/tracking | parcial | ✅✅ (objeto) | ❌ | ✅ (resize) | ✅ (redimensiona; sem tracking) |
| Chroma key / Ken Burns / B-rolls | ✅ (green screen) | ❌ | ❌ | parcial (blur) | ✅✅ (local) |
| Transcrição + tradução | ✅✅ (25/61/30 id.) | ✅ (captions) | ❌ | ✅ (a partir do roteiro) | ✅ (Web Speech + 70+ id.) |
| Privacidade | fraca | fraca | ✅ | média | ✅✅ (core 100% local) |
| PT-BR first | ❌ | ❌ | ❌ | ❌ | ✅✅ |
| Sem hardware / sem custo de crédito | — | — | exige rig $$ | free c/ marca | ✅✅ |

### Os 4 maiores gaps (oportunidades para o AlvoPrompter)
1. **Ninguém fecha o ciclo inteiro local**: prompter → gravação → edição IA → clipes → publicação. Descript é IA sem prompter; teleprompter.com é prompter sem IA editor; OpusClip só clipa; Opticue só lê.
2. **Offline/privacidade é nosso fosso** — todos os concorrentes relevantes são cloud (envio de vídeo/áudio para servidores).
3. **Eye Contact e Dublagem têm demanda provada** (feature premium da Descript) — é exatamente nosso roadmap da Fase 3/4.
4. **PT-BR continua sem dono** — nenhum é "português-first" com reconhecimento de fala em PT on-device.
