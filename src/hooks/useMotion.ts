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
    const res = await requestMotionPermission()
    setPermission(res)
    if (res !== 'granted') return

    if (streamRef.current) {
      streamRef.current.stop()
      streamRef.current = null
    }
    const stream = startOrientationStream((s) => {
      const ts = Date.now()
      // s.pitchRad is already zero-corrected by the stream (relative to calibrateZero).
      // We still store our own zero for reference via getZeroOffset(), but do not subtract again here.
      const rawPitch = s.pitchRad
      const rawRoll = s.rollRad
      const elev = elevationFromPitchRoll(rawPitch, rawRoll)
      setSample({ ts, pitchRad: rawPitch, rollRad: rawRoll })
      setElevRad(elev)
    })
    streamRef.current = stream
    setStreaming(true)
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


