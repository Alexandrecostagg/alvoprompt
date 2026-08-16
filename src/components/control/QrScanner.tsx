import { useEffect, useRef, useState } from 'react'

export default function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let raf = 0
    let stream: MediaStream | null = null
    let stopped = false

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const { default: jsQR } = await import('jsqr')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        const scan = () => {
          if (stopped || video.readyState < 2 || !ctx) return
          if (video.videoWidth === 0) {
            raf = requestAnimationFrame(scan)
            return
          }
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(img.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })
          if (code?.data) {
            onResultRef.current(code.data)
            return
          }
          raf = requestAnimationFrame(scan)
        }
        raf = requestAnimationFrame(scan)
      } catch (e) {
        setError(`Não foi possível acessar a câmera: ${(e as Error).message}`)
      }
    }

    void start()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--accent)' }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-white">📷 Aponte para o QR code do outro aparelho</p>
        <button
          onClick={onClose}
          className="rounded-lg border px-3 py-1 text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          Fechar
        </button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="mx-auto aspect-video w-full max-w-md rounded-lg bg-black object-cover"
      />
      {error && (
        <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
