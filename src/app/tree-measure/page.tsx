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
  estimateHeightUncertainty,
  computeHeightFromDistance,
} from '@/lib/measure/inclinometer'

type Step = 'setup' | 'distance' | 'base' | 'top' | 'result'

export default function TreeMeasureWizardPage() {
  const [supported, setSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [streaming, setStreaming] = useState<boolean>(false)

  const [step, setStep] = useState<Step>('setup')
  const [eyeHeightM, setEyeHeightM] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.65
    const fromStorage = window.localStorage.getItem('eyeHeightM')
    const parsed = fromStorage ? Number(fromStorage) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.65
  })

  const [livePitchDeg, setLivePitchDeg] = useState<number>(0)
  const [baseAngleRad, setBaseAngleRad] = useState<number | null>(null)
  const [topAngleRad, setTopAngleRad] = useState<number | null>(null)
  // Standard deviation (radians) captured alongside angles (reserved for future use)
  const [baseSdRad, setBaseSdRad] = useState<number | null>(null)
  const [topSdRad, setTopSdRad] = useState<number | null>(null)
  const [warning, setWarning] = useState<string>('')
  const [setupError, setSetupError] = useState<string>('')
  const [baseTooShallow, setBaseTooShallow] = useState<boolean>(false)
  const [resultM, setResultM] = useState<number | null>(null)
  const [rangeM, setRangeM] = useState<{ p10: number; p90: number } | null>(null)
  const [units, setUnits] = useState<'m' | 'ft'>('m')
  const [estimatedDistanceM, setEstimatedDistanceM] = useState<number | null>(null)
  const [mode, setMode] = useState<'paced' | 'baseAngle'>('paced')
  const [distanceM, setDistanceM] = useState<number>(8.0)
  const [stepsCount, setStepsCount] = useState<number>(0)
  const [stepLengthM, setStepLengthM] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.75
    const s = window.localStorage.getItem('stepLengthM')
    const v = s ? Number(s) : NaN
    return Number.isFinite(v) && v > 0 ? v : 0.75
  })
  const [distanceError, setDistanceError] = useState<string>('')

  // Camera preview state
  const detectMobileDefault = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  }
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraOn, setCameraOn] = useState<boolean>(() => detectMobileDefault())
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

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

  async function startCamera() {
    try {
      setCameraError(null)
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      cameraStreamRef.current = stream

      const video = videoRef.current
      if (!video) return

      video.setAttribute('playsinline', '')
      video.setAttribute('muted', '')
      video.muted = true
      video.autoplay = true
      video.controls = false
      ;(video as HTMLVideoElement & { disablePictureInPicture?: boolean }).disablePictureInPicture = true

      ;(video as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject = stream

      const tryPlay = async () => {
        try {
          await video.play()
        } catch {
          // iOS may require metadata first
        }
      }

      if (video.readyState >= 2) {
        await tryPlay()
      } else {
        video.onloadedmetadata = async () => {
          await tryPlay()
        }
      }
    } catch (err) {
      console.error('camera error', err)
      setCameraError('Camera unavailable or permission denied.')
    }
  }

  function stopCamera() {
    const s = cameraStreamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    const v = videoRef.current as (HTMLVideoElement & { srcObject?: MediaStream | null }) | null
    if (v) {
      try {
        v.srcObject = null
      } catch {
        v.removeAttribute('src')
      }
      v.onloadedmetadata = null
    }
  }

  // Start/stop camera when step or toggle changes
  useEffect(() => {
    if (!cameraOn) {
      stopCamera()
      return
    }
    if (step === 'base' || step === 'top') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, cameraOn])

  // step actions
  const onSaveSetup = () => {
    if (eyeHeightM < 0.5 || eyeHeightM > 2.2) {
      setSetupError('Eye height should be between 0.5 m and 2.2 m.')
      return
    }
    setSetupError('')
    if (typeof window !== 'undefined') {
      localStorage.setItem('eyeHeightM', String(eyeHeightM))
    }
    setStep(mode === 'paced' ? 'distance' : 'base')
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
    const baseAbsDeg = Math.abs(radToDeg(medianRad))
    // guard rails: block if |base| outside [5°, 35°]
    if (baseAbsDeg < 5) {
      setWarning('Base angle too small. Move farther and recapture.')
      return
    }
    if (baseAbsDeg > 35) {
      setWarning('Base angle too large. Move closer and recapture.')
      return
    }
    setBaseTooShallow(false)
    setBaseAngleRad(medianRad)
    setBaseSdRad(sdRad)
    // Update estimated horizontal distance d' = h0 / tan(|θ1|)
    const dPrime = eyeHeightM / Math.tan(Math.abs(medianRad))
    setEstimatedDistanceM(Number.isFinite(dPrime) ? dPrime : null)
    setStep('top')
  }

  const onCaptureTop = () => {
    if (mode === 'baseAngle' && baseAngleRad == null) return
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

    if (mode === 'paced') {
      // validate distance
      if (!(distanceM >= 3 && distanceM <= 25)) {
        setWarning('Distance must be between 3 m and 25 m.')
        setStep('distance')
        return
      }
      const h = computeHeightFromDistance({ cameraHeightM: eyeHeightM, distanceM, topAngleRad: medianRad })
      setResultM(Number(h.toFixed(2)))
      setRangeM(null)
      setStep('result')
      return
    }

    // base-angle mode: additional guard rail (top - base) >= 5°
    const diffDeg = radToDeg(medianRad) - radToDeg(baseAngleRad!)
    if (diffDeg < 5) {
      setWarning('Angle difference too small. Aim higher or move closer, then recapture the top.')
      return
    }
    // compute uncertainty in base-angle mode
    computeTreeHeight({ eyeHeightM, baseAngleRad: baseAngleRad!, topAngleRad: medianRad })
    const estParams = {
      eyeHeightM,
      baseAngleRad: baseAngleRad!,
      topAngleRad: medianRad,
      samples: 400,
      ...(typeof baseSdRad === 'number' ? { baseSdRad } : {}),
      ...(typeof sdRad === 'number' ? { topSdRad: sdRad } : {}),
    } satisfies Parameters<typeof estimateHeightUncertainty>[0]
    const { p10, p90, heightM } = estimateHeightUncertainty(estParams)
    setResultM(Number(heightM.toFixed(2)))
    setRangeM({ p10: Number(p10.toFixed(2)), p90: Number(p90.toFixed(2)) })
    setStep('result')
  }

  const onReset = () => {
    setBaseAngleRad(null)
    setTopAngleRad(null)
    setBaseSdRad(null)
    setTopSdRad(null)
    setResultM(null)
    setRangeM(null)
    setEstimatedDistanceM(null)
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
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Mode:</span>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'paced'} onChange={() => setMode('paced')} />
            <span>Paced distance (recommended)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'baseAngle'} onChange={() => setMode('baseAngle')} />
            <span>Estimate distance from base angle (beta)</span>
          </label>
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
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setEyeHeightM(v)
                  if (v >= 0.5 && v <= 2.2) setSetupError('')
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
              {setupError && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">{setupError}</div>
              )}
        </div>
            <div className="flex items-center justify-between">
              <button
                onClick={onSaveSetup}
                disabled={eyeHeightM < 0.5 || eyeHeightM > 2.2}
                className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {step === 'distance' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">Pace or enter the distance from your standing point to the tree trunk.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distance (m)</label>
                <input type="number" min={0} step={0.1} value={distanceM}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setDistanceM(v)
                    setDistanceError(v >= 3 && v <= 25 ? '' : 'Must be between 3 and 25 m')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                {distanceError && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{distanceError}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps (count)</label>
                <input type="number" min={0} step={1} value={stepsCount}
                  onChange={(e) => setStepsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Step length (m)</label>
                <input type="number" min={0.2} step={0.01} value={stepLengthM}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setStepLengthM(v)
                    if (typeof window !== 'undefined') localStorage.setItem('stepLengthM', String(v))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const calc = Number((stepsCount * stepLengthM).toFixed(2))
                  setDistanceM(calc)
                  setDistanceError(calc >= 3 && calc <= 25 ? '' : 'Must be between 3 and 25 m')
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Calculate distance
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">Then continue to capture the top angle.</div>
              <div className="flex-1" />
              <button
                onClick={() => setStep('top')}
                disabled={!(distanceM >= 3 && distanceM <= 25)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'base' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Stand ~5–10 m from the tree. Hold phone at eye height. Calibrate level. Aim at where trunk meets the ground.
            </div>
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

            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              {cameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    className="block w-full h-[45vh] object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="w-32 h-32 border border-white/60 relative">
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-4 bg-white/70" />
                      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px h-4 bg-white/70" />
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-4 bg-white/70" />
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-px w-4 bg-white/70" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-[45vh] grid place-items-center text-white/70">Camera off</div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={(e) => setCameraOn(e.target.checked)}
                />
                <span>Show camera view</span>
              </label>
              {cameraError && <span className="text-amber-400 text-sm">{cameraError}</span>}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">Align the crosshair with the base, hold steady ~1 s, then capture.</div>

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
                onClick={() => setStep(mode === 'paced' ? 'distance' : 'base')}
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

            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              {cameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    className="block w-full h-[45vh] object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="w-32 h-32 border border-white/60 relative">
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-4 bg-white/70" />
                      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px h-4 bg-white/70" />
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-4 bg-white/70" />
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-px w-4 bg-white/70" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-[45vh] grid place-items-center text-white/70">Camera off</div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={(e) => setCameraOn(e.target.checked)}
                />
                <span>Show camera view</span>
              </label>
              {cameraError && <span className="text-amber-400 text-sm">{cameraError}</span>}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">Align the crosshair with the top, hold steady ~1 s, then capture.</div>

            {baseTooShallow && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                Base angle is very shallow (&lt;2°). Step back to increase distance and recapture the base.
              </div>
            )}

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

            {estimatedDistanceM != null && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                  Estimated distance: ~{(estimatedDistanceM).toFixed(1)} m. {estimatedDistanceM < 3 ? 'If <3 m, step back and recapture.' : ''}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCaptureTop}
                disabled={!streaming || (mode === 'baseAngle' && (baseAngleRad == null || baseTooShallow))}
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

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-800 dark:text-green-200">Estimated tree height</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Units:</span>
                  <button onClick={() => setUnits('m')} className={`px-2 py-1 rounded ${units === 'm' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>m</button>
                  <button onClick={() => setUnits('ft')} className={`px-2 py-1 rounded ${units === 'ft' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>ft</button>
                </div>
              </div>
              <div className="text-4xl font-extrabold text-green-700 dark:text-green-300 mt-1">
                {resultM != null ? (
                  units === 'm' ? `${resultM.toFixed(2)} m` : `${(resultM * 3.28084).toFixed(2)} ft`
                ) : '-'}
              </div>
              {rangeM && (
                <div className="text-sm text-green-800 dark:text-green-200">
                  Range (≈80%): {units === 'm' ? `${rangeM.p10.toFixed(2)}–${rangeM.p90.toFixed(2)} m` : `${(rangeM.p10 * 3.28084).toFixed(2)}–${(rangeM.p90 * 3.28084).toFixed(2)} ft`}
                </div>
              )}
              <div className="text-xs text-gray-600 dark:text-gray-400">Note: Range reflects sensor jitter during capture.</div>
            </div>

            {estimatedDistanceM != null && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                  Estimated distance: ~{units === 'm' ? `${estimatedDistanceM.toFixed(1)} m` : `${(estimatedDistanceM * 3.28084).toFixed(1)} ft`}. {estimatedDistanceM < 3 ? 'If <3 m, step back and recapture.' : ''}
                </div>
              </div>
            )}
        
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


