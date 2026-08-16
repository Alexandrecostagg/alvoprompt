import { useEffect, useRef, useState } from 'react'

export type GamepadAction = 'primary' | 'stop' | 'nudge-up' | 'nudge-down'

export function useGamepad(onAction: (action: GamepadAction) => void) {
  const [connected, setConnected] = useState(false)
  const cbRef = useRef(onAction)
  cbRef.current = onAction
  const pressedRef = useRef<Record<number, boolean>>({})

  useEffect(() => {
    const onConnect = (_e: GamepadEvent) => setConnected(true)
    const onDisconnect = (_e: GamepadEvent) => setConnected(false)
    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)

    let raf = 0
    const poll = () => {
      const pad = navigator.getGamepads?.().find((p) => p)
      if (pad) {
        pad.buttons.forEach((btn, i) => {
          const was = pressedRef.current[i] ?? false
          const now = btn.pressed
          if (now && !was) {
            if (i === 0) cbRef.current('primary')
            else if (i === 1) cbRef.current('stop')
            else if (i === 2) cbRef.current('nudge-up')
            else if (i === 3) cbRef.current('nudge-down')
          }
          pressedRef.current[i] = now
        })
      }
      raf = requestAnimationFrame(poll)
    }
    if (navigator.getGamepads?.().some((p) => p)) setConnected(true)
    raf = requestAnimationFrame(poll)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [])

  return connected
}
