'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Layout } from '@/components/Layout'
import {
  type OrientationStream,
  type PermissionState,
  hasDeviceOrientationSupport,
  requestMotionPermission,
  startOrientationStream,
  radToDeg,
  computeTreeHeight,
} from '@/lib/measure/inclinometer'

type Step = 'setup' | 'base' | 'top' | 'result'

export default function TreeMeasureWizardPage() {
  const [supported, setSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [streaming, setStreaming] = useState<boolean>(false)

  const [step, setStep] = useState<Step>('setup')
  const [eyeHeightM, setEyeHeightM] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.6
    const fromStorage = window.localStorage.getItem('eyeHeightM')
    const parsed = fromStorage ? parseFloat(fromStorage) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.6
  })

  const [livePitchDeg, setLivePitchDeg] = useState<number>(0)
  const [baseAngleRad, setBaseAngleRad] = useState<number | null>(null)
  const [topAngleRad, setTopAngleRad] = useState<number | null>(null)
  // Standard deviation (radians) captured alongside angles (reserved for future use)
  const [baseSdRad, setBaseSdRad] = useState<number | null>(null)
  const [topSdRad, setTopSdRad] = useState<number | null>(null)
  const [warning, setWarning] = useState<string>('')
  const [resultM, setResultM] = useState<number | null>(null)

  const streamRef = useRef<OrientationStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastUiTsRef = useRef<number>(0)
  const lastPitchRadRef = useRef<number>(0)
  const sampleBufferRef = useRef<Array<{ t: number; pitchRad: number }>>([])

  // support check
  useEffect(() => {
    try {
      setSupported(hasDeviceOrientationSupport())
    } catch {
      setSupported(false)
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const startUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) return
    const loop = () => {
      const now = Date.now()
      if (now - lastUiTsRef.current >= 100) {
        lastUiTsRef.current = now
        let deg = radToDeg(lastPitchRadRef.current)
        // clamp for display
        if (deg > 89) deg = 89
        if (deg < -89) deg = -89
        setLivePitchDeg(Number(deg.toFixed(1)))
      }
      rafIdRef.current = requestAnimationFrame(loop)
    }
    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  // Note: explicit UI loop stopper reserved for future use

  const ensureStreaming = useCallback(async () => {
    if (!supported) return
    const res = await requestMotionPermission()
    setPermission(res)
    if (res !== 'granted') return

    if (streamRef.current) {
      streamRef.current.stop()
      streamRef.current = null
    }
    const stream = startOrientationStream((s) => {
      const now = Date.now()
      // push post-zero pitch sample into 1s buffer
      const pitch = typeof s.pitchRad === 'number' ? s.pitchRad : 0
      sampleBufferRef.current.push({ t: now, pitchRad: pitch })
      // purge older than 1000ms
      const cutoff = now - 1000
      while (sampleBufferRef.current.length > 0) {
        const head = sampleBufferRef.current[0]!
        if (head.t < cutoff) {
          sampleBufferRef.current.shift()
        } else {
          break
        }
      }
      // update live value for UI
      lastPitchRadRef.current = pitch
    })
    streamRef.current = stream
    setStreaming(true)
    startUiLoop()
  }, [supported, startUiLoop])

  // step actions
  const onSaveSetup = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eyeHeightM', String(eyeHeightM))
    }
    setStep('base')
  }

  const onCalibrate = () => {
    if (streamRef.current) {
      streamRef.current.calibrateZero()
      // clear buffer after recalibration to avoid mixing old baseline
      sampleBufferRef.current = []
    }
  }

  const onCaptureBase = () => {
    setWarning('')
    // require at least 10 samples within buffer (~1s)
    const buf = sampleBufferRef.current
    if (buf.length < 10) {
      setWarning('Hold steady for a second, then tap capture.')
      return
    }
    // compute median and sample SD from buffer (radians)
    const values = buf.map((s) => s.pitchRad).slice().sort((a, b) => a - b)
    const n = values.length
    const mid = Math.floor(n / 2)
    const medianRad: number = n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!
    const mean = values.reduce((acc, v) => acc + v, 0) / n
    const variance = n > 1 ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0
    const sdRad = Math.sqrt(variance)
    const baseDeg = livePitchDeg
    // block if |base| < 1°
    if (Math.abs(baseDeg) < 1) {
      setWarning('Angle to base too shallow; step back a few meters and recapture.')
      return // remain on step 2
    }
    // warn if |base| < 2° but allow proceed
    if (Math.abs(baseDeg) < 2) {
      setWarning('Angle to base too shallow; step back a few meters and recapture.')
    }
    setBaseAngleRad(medianRad)
    setBaseSdRad(sdRad)
    setStep('top')
  }

  const onCaptureTop = () => {
    if (baseAngleRad == null) return
    // require at least 10 samples within buffer (~1s)
    const buf = sampleBufferRef.current
    if (buf.length < 10) {
      setWarning('Hold steady for a second, then tap capture.')
      return
    }
    const values = buf.map((s) => s.pitchRad).slice().sort((a, b) => a - b)
    const n = values.length
    const mid = Math.floor(n / 2)
    const medianRad: number = n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!
    const mean = values.reduce((acc, v) => acc + v, 0) / n
    const variance = n > 1 ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0
    const sdRad = Math.sqrt(variance)
    setTopAngleRad(medianRad)
    setTopSdRad(sdRad)
    // compute result (guard tiny tan base)
    const baseAbsDeg = Math.abs(radToDeg(baseAngleRad))
    if (baseAbsDeg < 1) {
      setWarning('Angle to base too shallow; step back a few meters and recapture.')
      setStep('base')
      return
    }
    const h = computeTreeHeight({ eyeHeightM, baseAngleRad, topAngleRad: medianRad })
    setResultM(Number(h.toFixed(2)))
    setStep('result')
  }

  const onReset = () => {
    setBaseAngleRad(null)
    setTopAngleRad(null)
    setBaseSdRad(null)
    setTopSdRad(null)
    setResultM(null)
    setWarning('')
    setStep('setup')
  }

  // UI helpers
  const SupportedPill = (
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

  const PermissionPill = (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      Permission: {permission}
    </span>
  )
  
  return (
    <Layout title="Tree Measure (Inclinometer)">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Portrait only for now. Use HTTPS or localhost. iOS needs a user gesture to grant motion permissions.
        </div>
        
        <div className="flex items-center gap-3">
          {SupportedPill}
          {PermissionPill}
          {streaming && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Streaming
            </span>
          )}
        </div>
        
        {step === 'setup' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eye height (m)</label>
              <input
                type="number"
                value={eyeHeightM}
                min={0.5}
                max={2.5}
                step={0.01}
                onChange={(e) => setEyeHeightM(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
            <div className="flex items-center justify-between">
              <button
                onClick={onSaveSetup}
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {step === 'base' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('setup')}
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                Back
              </button>
              <div className="flex-1" />
              {!streaming && (
                <button
                  onClick={ensureStreaming}
                  disabled={!supported}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
                >
                  Enable sensors
                </button>
              )}
              {streaming && (
                <button
                  onClick={onCalibrate}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white"
                >
                  Calibrate level
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Live pitch (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{livePitchDeg.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Base captured</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) + '°' : '-'}</div>
              </div>
            </div>

            {warning && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
                {warning}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCaptureBase}
                disabled={!streaming}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
              >
                Capture base angle
              </button>
            </div>
          </div>
        )}

        {step === 'top' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('base')}
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                Back
              </button>
              <div className="flex-1" />
              {streaming && (
                <button
                  onClick={onCalibrate}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white"
                >
                  Calibrate level
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Live pitch (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{livePitchDeg.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Top captured</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) + '°' : '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCaptureTop}
                disabled={!streaming || baseAngleRad == null}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
              >
                Capture top angle
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Eye height (m)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{eyeHeightM.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Base angle (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) : '-'}</div>
                {baseSdRad != null && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SD: {radToDeg(baseSdRad).toFixed(2)}°</div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Top angle (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) : '-'}</div>
                {topSdRad != null && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SD: {radToDeg(topSdRad).toFixed(2)}°</div>
                )}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <div className="text-sm text-green-800 dark:text-green-200">Estimated tree height</div>
              <div className="text-4xl font-extrabold text-green-700 dark:text-green-300 mt-1">{resultM != null ? `${resultM.toFixed(2)} m` : '-'}</div>
        </div>
        
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('top')}
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                Back
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Reset
              </button>
            </div>
        </div>
        )}
      </div>
    </Layout>
  )
} 


