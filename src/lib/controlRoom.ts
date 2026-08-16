import { useAppStore, type PrompterStatus } from '../store/useAppStore'

export type RoomRole = 'host' | 'control'
export type ConnStatus = 'idle' | 'signaling' | 'connecting' | 'connected' | 'error'

export type CxMessage =
  | { t: 'ping' }
  | { t: 'pong' }
  | { t: 'play' }
  | { t: 'pause' }
  | { t: 'seek'; f: number }
  | { t: 'mirror'; on: boolean }
  | { t: 'openMic'; on: boolean }
  | { t: 'script'; title: string; content: string }
  | { t: 'status'; state: PrompterStatus['state']; fraction: number }

const PREFIX = 'pf1::'

export interface PairingCode {
  type: 'offer' | 'answer'
  sdp: string
}

function parseCode(code: string): PairingCode {
  const raw = code.trimStart()
  if (!raw.startsWith(PREFIX)) {
    throw new Error('Código inválido. Copie o código inteiro do outro aparelho.')
  }
  const body = raw.slice(PREFIX.length)
  const sep = body.indexOf('::')
  if (sep === -1) throw new Error('Código inválido.')
  const type = body.slice(0, sep) as PairingCode['type']
  let sdp = body.slice(sep + 2).replace(/\r?\n$/, '')
  if (!sdp.endsWith('\r\n')) sdp += '\r\n'
  return { type, sdp }
}

function formatCode(type: PairingCode['type'], sdp: string): string {
  return `${PREFIX}${type}::${sdp}`
}

/**
 * Control Room sem servidor: WebRTC + DataChannel com pareamento manual
 * (código/QR). Funciona entre aparelhos na mesma rede local.
 */
class ControlRoom {
  private pc: RTCPeerConnection | null = null
  private ch: RTCDataChannel | null = null
  private status: ConnStatus = 'idle'
  private role: RoomRole | null = null
  private commandHandlers = new Set<(msg: CxMessage) => void>()
  private subs = new Set<() => void>()
  private statusTimer: number | null = null
  private iceTimer: number | null = null

  getStatus(): ConnStatus {
    return this.status
  }

  getRole(): RoomRole | null {
    return this.role
  }

  isConnected(): boolean {
    return this.status === 'connected'
  }

  subscribe(fn: () => void): () => void {
    this.subs.add(fn)
    return () => this.subs.delete(fn)
  }

  onCommand(fn: (msg: CxMessage) => void): () => void {
    this.commandHandlers.add(fn)
    return () => this.commandHandlers.delete(fn)
  }

  private emit() {
    for (const fn of this.subs) fn()
  }

  private setStatus(s: ConnStatus) {
    this.status = s
    this.emit()
  }

  private handleMessage(raw: string) {
    let msg: CxMessage
    try {
      msg = JSON.parse(raw) as CxMessage
    } catch {
      return
    }
    for (const fn of this.commandHandlers) fn(msg)
    if (msg.t === 'ping' && this.ch?.readyState === 'open') {
      this.ch.send(JSON.stringify({ t: 'pong' }))
    }
  }

  private startIceTimeout() {
    window.clearTimeout(this.iceTimer ?? undefined)
    this.iceTimer = window.setTimeout(() => {
      if (this.status === 'connecting') {
        this.setStatus('error')
      }
    }, 60000)
  }

  /** Aguarda o fim da coleta de ICE para embutir os candidatos no código. */
  private async waitForGathering(): Promise<void> {
    const pc = this.pc
    if (!pc || pc.iceGatheringState === 'complete') return
    await new Promise<void>((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        pc.removeEventListener('icegatheringstatechange', onState)
        resolve()
      }
      const onState = () => {
        if (pc.iceGatheringState === 'complete') finish()
      }
      pc.addEventListener('icegatheringstatechange', onState)
      window.setTimeout(finish, 3000)
    })
  }

  /** Aparelho de controle: inicia o modo (entra no fluxo de colar o código). */
  startControl() {
    this.destroy()
    this.role = 'control'
    this.setStatus('idle')
  }

  /** Aparelho prompter: cria a conexão e devolve o código (offer) para parear. */
  async initHost(): Promise<string> {
    this.destroy()
    this.role = 'host'
    this.setStatus('signaling')
    this.pc = new RTCPeerConnection()
    this.ch = this.pc.createDataChannel('pf')
    const channel = this.ch
    channel.onopen = () => {
      if (this.ch !== channel) return
      this.setStatus('connected')
      this.startStatusBroadcast()
    }
    channel.onmessage = (e) => this.handleMessage(String(e.data))
    channel.onclose = () => {
      if (this.ch !== channel) return
      this.setStatus('idle')
      this.stopStatusBroadcast()
    }
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    await this.waitForGathering()
    return formatCode('offer', this.pc.localDescription!.sdp)
  }

  /** Aparelho prompter: recebe a resposta do controle e conecta. */
  async submitAnswer(code: string): Promise<void> {
    if (!this.pc || this.role !== 'host') throw new Error('Inicie o modo prompter primeiro.')
    const parsed = parseCode(code)
    if (parsed.type !== 'answer') {
      throw new Error('Cole a RESPOSTA gerada no aparelho de controle.')
    }
    await this.pc.setRemoteDescription({ type: 'answer', sdp: parsed.sdp })
    this.setStatus('connecting')
    this.startIceTimeout()
  }

  /** Aparelho de controle: aceita o offer do prompter e devolve o código (answer). */
  async acceptOffer(code: string): Promise<string> {
    this.destroy()
    this.role = 'control'
    this.setStatus('signaling')
    const parsed = parseCode(code)
    if (parsed.type !== 'offer') {
      throw new Error('Cole o CÓDIGO gerado no aparelho do prompter.')
    }
    this.pc = new RTCPeerConnection()
    this.pc.ondatachannel = (e) => {
      const channel = e.channel
      this.ch = channel
      channel.onopen = () => {
        if (this.ch !== channel) return
        this.setStatus('connected')
      }
      channel.onmessage = (ev) => this.handleMessage(String(ev.data))
      channel.onclose = () => {
        if (this.ch !== channel) return
        this.setStatus('idle')
      }
    }
    await this.pc.setRemoteDescription({ type: 'offer', sdp: parsed.sdp })
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    await this.waitForGathering()
    return formatCode('answer', this.pc.localDescription!.sdp)
  }

  send(msg: CxMessage) {
    if (this.ch?.readyState === 'open') {
      this.ch.send(JSON.stringify(msg))
    }
  }

  private startStatusBroadcast() {
    this.stopStatusBroadcast()
    this.statusTimer = window.setInterval(() => {
      if (this.ch?.readyState !== 'open') return
      const st = useAppStore.getState().prompterState
      if (st) {
        this.ch.send(JSON.stringify({ t: 'status', state: st.state, fraction: st.fraction }))
      }
    }, 800)
  }

  private stopStatusBroadcast() {
    if (this.statusTimer != null) {
      window.clearInterval(this.statusTimer)
      this.statusTimer = null
    }
  }

  destroy() {
    window.clearTimeout(this.iceTimer ?? undefined)
    this.iceTimer = null
    this.stopStatusBroadcast()
    if (this.ch) {
      this.ch.onopen = null
      this.ch.onmessage = null
      this.ch.onclose = null
      this.ch.close()
    }
    this.ch = null
    if (this.pc) {
      this.pc.ondatachannel = null
      this.pc.close()
    }
    this.pc = null
    this.role = null
    this.setStatus('idle')
  }
}

export const controlRoom = new ControlRoom()

/** Comandos recebidos no aparelho do prompter → aplica no app local. */
function handleHostCommand(msg: CxMessage) {
  const store = useAppStore.getState()
  switch (msg.t) {
    case 'script':
      store.selectScript({
        title: msg.title || 'Roteiro remoto',
        content: msg.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      store.setView('prompter')
      break
    case 'play':
    case 'pause': {
      if (!store.currentScript) break
      const wantRunning = msg.t === 'play'
      const st = store.prompterState
      const isRunning = st?.state === 'running'
      if (isRunning === wantRunning) break
      store.setView('prompter')
      window.setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      }, 300)
      break
    }
    case 'seek':
      if (!store.currentScript) break
      store.setView('prompter')
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent<number>('pf-seek', { detail: msg.f }))
      }, 300)
      break
    case 'mirror':
      store.updateSettings({ mirror: msg.on })
      break
    case 'openMic':
      store.updateSettings({ openMic: msg.on })
      break
    default:
      break
  }
}

controlRoom.onCommand(handleHostCommand)
