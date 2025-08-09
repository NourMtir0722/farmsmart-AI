'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type OrientationStream,
  type PermissionState,
  hasDeviceOrientationSupport,
  requestMotionPermission,
  startOrientationStream,
  radToDeg,
} from '@/lib/measure/inclinometer'
import { Layout } from '@/components/Layout'

export default function DebugInclinometerPage() {
  const [supported, setSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [streaming, setStreaming] = useState<boolean>(false)
  const [pitchDeg, setPitchDeg] = useState<number>(0)
  const [rollDeg, setRollDeg] = useState<number>(0)
  const [zeroDeg, setZeroDeg] = useState<number>(0)

  const streamRef = useRef<OrientationStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastUiTsRef = useRef<number>(0)
  const lastSampleRef = useRef<{ pitchRad: number; rollRad: number }>({ pitchRad: 0, rollRad: 0 })
  const isMountedRef = useRef<boolean>(true)

  // SSR-safe support check
  useEffect(() => {
    isMountedRef.current = true
    try {
      setSupported(hasDeviceOrientationSupport())
    } catch {
      setSupported(false)
    }
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      isMountedRef.current = false
    }
  }, [])

  const startUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) return
    const loop = () => {
      // Exit early if the component has unmounted; do not schedule further frames
      if (!isMountedRef.current) {
        rafIdRef.current = null
        return
      }
      const now = Date.now()
      const elapsed = now - lastUiTsRef.current
      // Throttle to ~10 fps
      if (elapsed >= 100) {
        lastUiTsRef.current = now
        const p = Number(radToDeg(lastSampleRef.current.pitchRad).toFixed(1))
        const r = Number(radToDeg(lastSampleRef.current.rollRad).toFixed(1))
        const z = Number(
          radToDeg(streamRef.current ? streamRef.current.getZeroOffset() : 0).toFixed(1)
        )
        setPitchDeg(p)
        setRollDeg(r)
        setZeroDeg(z)
      }
      // Schedule next frame only if still mounted
      if (isMountedRef.current) {
        rafIdRef.current = requestAnimationFrame(loop)
      } else {
        rafIdRef.current = null
      }
    }
    if (!isMountedRef.current) return
    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  const stopUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const handleEnable = async () => {
    if (!supported) return
    let res: PermissionState
    try {
      res = await requestMotionPermission()
    } catch (error) {
      if (!isMountedRef.current) return
      // Treat errors as denied to avoid ambiguous UI state
      setPermission('denied')
      return
    }
    if (!isMountedRef.current) return
    setPermission(res)
    if (res === 'granted') {
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
      }
      try {
        const stream = await startOrientationStream((sample) => {
          // Store latest radians; UI loop will throttle update
          lastSampleRef.current.pitchRad = sample.pitchRad
          lastSampleRef.current.rollRad = sample.rollRad
        })
        if (!isMountedRef.current) {
          // Component unmounted during setup; stop the stream to avoid leaks
          stream.stop()
          return
        }
        streamRef.current = stream
        setStreaming(true)
        startUiLoop()
      } catch (error) {
        if (!isMountedRef.current) return
        // Avoid further setup; keep UI consistent and log for debugging
        console.error('Failed to start orientation stream', error)
        setStreaming(false)
      }
    }
  }

  const handleCalibrate = () => {
    if (streamRef.current) {
      streamRef.current.calibrateZero()
    }
  }

  const handleStop = () => {
    if (streamRef.current) {
      streamRef.current.stop()
      streamRef.current = null
    }
    setStreaming(false)
    stopUiLoop()
  }

  const supportedPill = (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        supported
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      }`}
    >
      {supported ? 'Supported' : 'Not supported'}
    </span>
  )

  const permissionPill = (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      Permission: {permission}
    </span>
  )

  const barPercent = Math.min(100, Math.round((Math.min(30, Math.abs(pitchDeg)) / 30) * 100))

  return (
    <Layout title="Inclinometer Debug">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Portrait only for now. Use HTTPS or localhost. iOS needs a user gesture to grant motion permissions.
        </div>

        <div className="flex items-center gap-3">
          {supportedPill}
          {permissionPill}
          {streaming && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Streaming
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleEnable}
            disabled={!supported || streaming}
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
          >
            Enable sensors
          </button>
          <button
            onClick={handleCalibrate}
            disabled={!streaming}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white disabled:bg-gray-400"
          >
            Calibrate level
          </button>
          <button
            onClick={handleStop}
            disabled={!streaming}
            className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:bg-gray-400"
          >
            Stop
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pitch (°)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{pitchDeg.toFixed(1)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Roll (°)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{rollDeg.toFixed(1)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Zero offset (°)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{zeroDeg.toFixed(1)}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Level indicator (0°–30°)</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{barPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}


