// src/hooks/useMotion.ts
"use client";

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  hasDeviceOrientationSupport,
  requestMotionPermission,
  startOrientationStream,
  type OrientationStream,
  type PermissionState,
} from '@/lib/measure/inclinometer'
import { elevationFromPitchRoll } from '@/lib/measure/elevation'

export type MotionSample = {
  ts: number
  pitchRad: number
  rollRad: number
}

export function useMotion() {
  const [supported] = useState<boolean>(() => hasDeviceOrientationSupport())
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [streaming, setStreaming] = useState<boolean>(false)
  const [sample, setSample] = useState<MotionSample | null>(null)
  const [elevRad, setElevRad] = useState<number>(0)
  const streamRef = useRef<OrientationStream | null>(null)
  const zeroOffsetRef = useRef<number>(0)

  const calibrateZero = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.calibrateZero()
      zeroOffsetRef.current = streamRef.current.getZeroOffset()
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.stop()
      streamRef.current = null
    }
    setStreaming(false)
  }, [])

  const start = useCallback(async () => {
    if (!supported) return
    try {
      const res = await requestMotionPermission()
      setPermission(res)
      if (res !== 'granted') return

      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
      }

      // Throttle state updates using requestAnimationFrame to reduce re-render frequency
      let pending: { ts: number; rawPitch: number; rawRoll: number; elev: number } | null = null
      let rafId: number | null = null
      const pump = () => {
        if (pending) {
          const { ts, rawPitch, rawRoll, elev } = pending
          setSample({ ts, pitchRad: rawPitch, rollRad: rawRoll })
          setElevRad(elev)
          pending = null
        }
        rafId = null
      }

      const stream = await startOrientationStream((s) => {
        const ts = Date.now()
        const rawPitch = s.pitchRad
        const rawRoll = s.rollRad
        const elev = elevationFromPitchRoll(rawPitch, rawRoll)
        pending = { ts, rawPitch, rawRoll, elev }
        if (rafId == null) {
          rafId = requestAnimationFrame(pump)
        }
      })

      // Initialize zero offset immediately after permission, before events flow
      stream.calibrateZero()
      zeroOffsetRef.current = stream.getZeroOffset()

      streamRef.current = stream
      setStreaming(true)
    } catch (err) {
      // Swallow errors to keep UI responsive; mark as not streaming
      // eslint-disable-next-line no-console
      console.error('Failed to start motion stream:', err)
      setStreaming(false)
    }
  }, [supported])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    supported,
    permission,
    streaming,
    sample,
    elevRad,
    start,
    stop,
    calibrateZero,
    getZeroOffset: () => zeroOffsetRef.current,
  }
}


