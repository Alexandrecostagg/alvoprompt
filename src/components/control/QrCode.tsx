import { QRCodeCanvas } from 'qrcode.react'

export default function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-xl bg-white p-3">
      <QRCodeCanvas
        value={value}
        size={size}
        level="M"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#0e0a1a"
        title="Código de pareamento"
      />
    </div>
  )
}
