'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type OrientationStream,
  type PermissionState,
  hasDeviceOrientationSupport,
  requestMotionPermission,
  startOrientationStream,
  radToDeg,
  elevationFromPitchRoll,
  estimateHeightUncertainty,
  computeHeightFromDistance,
  computeHeightTwoStops,
} from '@/lib/measure/inclinometer'
import type { VisionDetector as VisionDetectorClass, TreeBoundaryResult, KnownObject } from '@/lib/measure/vision-detector'

export type Step = 'setup' | 'distance' | 'base' | 'top' | 'top2' | 'result'

export type Mode = 'paced' | 'baseAngle' | 'twoStop'

export type TreeMeasureHistoryRecord = {
  timestamp: number
  mode: Mode
  eyeHeightM: number
  distanceM?: number
  baseAngleRad?: number
  topAngleRad: number
  resultM: number
  p10?: number
  p90?: number
  baseImg?: string
  topImg?: string
}

export type UseTreeMeasure = ReturnType<typeof useTreeMeasure>

export function useTreeMeasure() {
  // Support and motion permission
  const [supported, setSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [streaming, setStreaming] = useState<boolean>(false)

  // Wizard
  const [step, setStep] = useState<Step>('setup')
  const [mode, setMode] = useState<Mode>('paced')

  // User configuration
  const [eyeHeightM, setEyeHeightM] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.65
    const fromStorage = window.localStorage.getItem('eyeHeightM')
    const parsed = fromStorage ? Number(fromStorage) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.65
  })
  const [setupError, setSetupError] = useState<string>('')

  // Distance inputs
  const [distanceM, setDistanceM] = useState<number>(8.0)
  const [stepsCount, setStepsCount] = useState<number>(0)
  const [stepLengthM, setStepLengthM] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.75
    const s = window.localStorage.getItem('stepLengthM')
    const v = s ? Number(s) : NaN
    return Number.isFinite(v) && v > 0 ? v : 0.75
  })
  const [stepForwardM, setStepForwardM] = useState<number>(() => {
    if (typeof window === 'undefined') return 5.0
    const s = window.localStorage.getItem('stepForwardM')
    const v = s ? Number(s) : NaN
    return Number.isFinite(v) && v > 0 ? v : 5.0
  })
  const [distanceError, setDistanceError] = useState<string>('')

  // Live sensor UI
  const [livePitchDeg, setLivePitchDeg] = useState<number>(0)
  const [liveRollDeg, setLiveRollDeg] = useState<number>(0)

  // Captured values, SD
  const [baseAngleRad, setBaseAngleRad] = useState<number | null>(null)
  const [topAngleRad, setTopAngleRad] = useState<number | null>(null)
  const [baseSdRad, setBaseSdRad] = useState<number | null>(null)
  const [topSdRad, setTopSdRad] = useState<number | null>(null)

  // Warnings and guards
  const [warning, setWarning] = useState<string>('')
  const [baseTooShallow, setBaseTooShallow] = useState<boolean>(false)

  // Results and units
  const [resultM, setResultM] = useState<number | null>(null)
  const [rangeM, setRangeM] = useState<{ p10: number; p90: number } | null>(null)
  const [estimatedDistanceM, setEstimatedDistanceM] = useState<number | null>(null)
  const [units, setUnits] = useState<'m' | 'ft'>('m')

  // Two-stop mode
  const [twoStopAngle1Rad, setTwoStopAngle1Rad] = useState<number | null>(null)

  // Auto-capture steadiness
  const [autoCapture, setAutoCapture] = useState<boolean>(true)
  const [autoCapturePaused, setAutoCapturePaused] = useState<boolean>(false)
  const [isSteady, setIsSteady] = useState<boolean>(false)
  const steadySinceRef = useRef<number | null>(null)
  const [captureCooldown, setCaptureCooldown] = useState<boolean>(false)
  const captureCooldownRef = useRef<boolean>(false)
  useEffect(() => {
    captureCooldownRef.current = captureCooldown
  }, [captureCooldown])

  // Stability UI state
  const [stabilityState, setStabilityState] = useState<'shaky' | 'getting' | 'ready'>('shaky')
  const [stabilizationProgress, setStabilizationProgress] = useState<number>(0)
  const [stabilizationSecondsRemaining, setStabilizationSecondsRemaining] = useState<number>(0)
  const [setupModeActive, setSetupModeActive] = useState<boolean>(false)
  const [setupSecondsRemaining, setSetupSecondsRemaining] = useState<number>(0)
  const setupUntilRef = useRef<number | null>(null)

  // Photos
  const [basePhoto, setBasePhoto] = useState<string | null>(null)
  const [topPhoto, setTopPhoto] = useState<string | null>(null)

  // Camera state (UI toggle and error). Camera stream is managed by CameraPreview component.
  const detectMobileDefault = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  }
  const [cameraOn, setCameraOn] = useState<boolean>(() => detectMobileDefault())
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Vision state handled here; drawing is delegated to VisionOverlay
  const [visionMode, setVisionMode] = useState<boolean>(false)
  const [visionLoading, setVisionLoading] = useState<boolean>(false)
  const [visionError, setVisionError] = useState<string | null>(null)
  const [visionConfidence, setVisionConfidence] = useState<number | null>(null)
  const [knownObjects, setKnownObjects] = useState<KnownObject[] | null>(null)
  const [pxPerMeter, setPxPerMeter] = useState<number | null>(null)
  const [calibrationScore, setCalibrationScore] = useState<number | null>(null)
  const [calibrated, setCalibrated] = useState<boolean>(false)
  const [calibrationMsg, setCalibrationMsg] = useState<string>('')

  // Quick calibration constants (door reference)
  const DOOR_ACTUAL_HEIGHT = 2.0 // meters
  const DOOR_MEASURED_HEIGHT = 2.43 // from test
  const CALIBRATION_FACTOR = DOOR_ACTUAL_HEIGHT / DOOR_MEASURED_HEIGHT

  // Vision detector and refs
  const visionRef = useRef<VisionDetectorClass | null>(null)
  const lastBoundaryRef = useRef<TreeBoundaryResult | null>(null)
  const [boundary, setBoundary] = useState<TreeBoundaryResult | null>(null)
  const visionRafRef = useRef<number | null>(null)
  const lastVisionTsRef = useRef<number>(0)

  // External video element attachment (provided by CameraPreview via CaptureStep)
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const attachVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el
  }, [])

  // Mounted flag
  const isMountedRef = useRef<boolean>(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Motion streaming state
  const streamRef = useRef<OrientationStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastUiTsRef = useRef<number>(0)
  const lastPitchRadRef = useRef<number>(0)
  const lastRollRadRef = useRef<number>(0)
  const sampleBufferRef = useRef<Array<{ t: number; pitchRad: number }>>([])

  const stopUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // support check and cleanup
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
      stopUiLoop()
      if (visionRafRef.current != null) {
        cancelAnimationFrame(visionRafRef.current)
        visionRafRef.current = null
      }
    }
  }, [stopUiLoop])

  const startUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) return
    const loop = () => {
      const now = Date.now()
      if (now - lastUiTsRef.current >= 100) {
        lastUiTsRef.current = now
        let deg = radToDeg(lastPitchRadRef.current)
        let rdeg = radToDeg(lastRollRadRef.current)
        if (deg > 89) deg = 89
        if (deg < -89) deg = -89
        if (rdeg > 89) rdeg = 89
        if (rdeg < -89) rdeg = -89
        setLivePitchDeg(Number(deg.toFixed(1)))
        setLiveRollDeg(Number(rdeg.toFixed(1)))
      }
      rafIdRef.current = requestAnimationFrame(loop)
    }
    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  const ensureStreaming = useCallback(async () => {
    if (!supported) return
    const res = await requestMotionPermission()
    setPermission(res)
    if (res !== 'granted') return

    if (streamRef.current) {
      streamRef.current.stop()
      streamRef.current = null
      setStreaming(false)
      stopUiLoop()
    }
    const stream = await startOrientationStream((s) => {
      const now = Date.now()
      const rawPitch = typeof s.pitchRad === 'number' ? s.pitchRad : 0
      const rawRoll = typeof s.rollRad === 'number' ? s.rollRad : 0
      const elevRad = elevationFromPitchRoll(rawPitch, rawRoll)
      sampleBufferRef.current.push({ t: now, pitchRad: elevRad })
      const cutoff = now - 1000
      while (sampleBufferRef.current.length > 0) {
        const head = sampleBufferRef.current[0]!
        if (head.t < cutoff) sampleBufferRef.current.shift()
        else break
      }
      lastPitchRadRef.current = elevRad
      lastRollRadRef.current = rawRoll
    })
    streamRef.current = stream
    setStreaming(true)
    startUiLoop()
  }, [supported, startUiLoop, stopUiLoop])

  // Auto-start motion stream when entering top if already granted
  useEffect(() => {
    if (step === 'top' && supported && permission === 'granted' && !streamRef.current) {
      void ensureStreaming()
    }
  }, [step, supported, permission, ensureStreaming])

  // Stop motion stream when leaving capture steps
  useEffect(() => {
    if (step !== 'base' && step !== 'top' && step !== 'top2') {
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
        setStreaming(false)
        stopUiLoop()
      }
    }
  }, [step, stopUiLoop])

  const onCalibrate = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.calibrateZero()
      sampleBufferRef.current = []
    }
  }, [])

  // Steadiness and auto-capture (more conservative)
  useEffect(() => {
    const interval = setInterval(() => {
      const active = step === 'base' || step === 'top'
      if (!active) {
        setIsSteady(false)
        setStabilityState('shaky')
        setStabilizationProgress(0)
        setStabilizationSecondsRemaining(0)
        steadySinceRef.current = null
        return
      }
      const now = Date.now()
      // Analyze last 3 seconds
      const windowMs = 3000
      const windowSamples = sampleBufferRef.current.filter((s) => s.t >= now - windowMs)
      if (windowSamples.length >= 30) {
        const n = windowSamples.length
        const mean = windowSamples.reduce((acc, s) => acc + s.pitchRad, 0) / n
        const variance = n > 1 ? windowSamples.reduce((acc, s) => acc + Math.pow(s.pitchRad - mean, 2), 0) / (n - 1) : 0
        const sdRad = Math.sqrt(variance)
        const sdDeg = radToDeg(sdRad)

        // Tight threshold 0.1°
        const steady = sdDeg < 0.1
        setIsSteady(steady)
        if (sdDeg >= 0.2) setStabilityState('shaky')
        else if (sdDeg >= 0.1) setStabilityState('getting')
        else setStabilityState('ready')

        const requiredStableMs = 2500
        if (steady) {
          if (steadySinceRef.current == null) steadySinceRef.current = now
          const elapsed = now - (steadySinceRef.current ?? now)
          const progress = Math.max(0, Math.min(1, elapsed / requiredStableMs))
          setStabilizationProgress(progress)
          const remainingMs = Math.max(0, requiredStableMs - elapsed)
          setStabilizationSecondsRemaining(Math.ceil(remainingMs / 1000))

          // Respect setup mode and pause
          if (setupUntilRef.current != null) {
            const setupRemaining = Math.max(0, setupUntilRef.current - now)
            setSetupSecondsRemaining(Math.ceil(setupRemaining / 1000))
            if (setupRemaining <= 0) {
              setupUntilRef.current = null
              setSetupModeActive(false)
              setSetupSecondsRemaining(0)
            }
          }

          const autoAllowed = autoCapture && !autoCapturePaused && !setupModeActive
          if (autoAllowed && !captureCooldownRef.current && progress >= 1) {
            if (step === 'base') onCaptureBase()
            else if (step === 'top') onCaptureTop()
            setCaptureCooldown(true)
            setTimeout(() => setCaptureCooldown(false), 1000)
            steadySinceRef.current = null
            setStabilizationProgress(0)
            setStabilizationSecondsRemaining(0)
          }
        } else {
          steadySinceRef.current = null
          setStabilizationProgress(0)
          setStabilizationSecondsRemaining(0)
        }
      } else {
        setIsSteady(false)
        setStabilityState('shaky')
        setStabilizationProgress(0)
        setStabilizationSecondsRemaining(0)
        steadySinceRef.current = null
      }

      // Update setup remaining when not steady
      if (setupUntilRef.current != null) {
        const setupRemaining = Math.max(0, setupUntilRef.current - now)
        setSetupSecondsRemaining(Math.ceil(setupRemaining / 1000))
        if (setupRemaining <= 0) {
          setupUntilRef.current = null
          setSetupModeActive(false)
          setSetupSecondsRemaining(0)
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [step, autoCapture])

  // Setup save
  const onSaveSetup = useCallback(() => {
    if (eyeHeightM < 0.5 || eyeHeightM > 2.2) {
      setSetupError('Eye height should be between 0.5 m and 2.2 m.')
      return
    }
    setSetupError('')
    if (typeof window !== 'undefined') {
      localStorage.setItem('eyeHeightM', String(eyeHeightM))
    }
    setStep(mode === 'paced' ? 'distance' : mode === 'twoStop' ? 'distance' : 'base')
  }, [eyeHeightM, mode])

  // Capture base
  const onCaptureBase = useCallback(() => {
    setWarning('')
    const buf = sampleBufferRef.current
    if (buf.length < 10) {
      setWarning('Hold steady for a second, then tap capture.')
      return
    }
    if (Math.abs(liveRollDeg) > 5) {
      setWarning('Keep phone upright (reduce side tilt).')
      return
    }
    const values = buf.map((s) => s.pitchRad).slice().sort((a, b) => a - b)
    const n = values.length
    const mid = Math.floor(n / 2)
    const medianRad: number = n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!
    const mean = values.reduce((acc, v) => acc + v, 0) / n
    const variance = n > 1 ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0
    const sdRad = Math.sqrt(variance)
    const baseAbsDeg = Math.abs(radToDeg(medianRad))
    if (baseAbsDeg < 2) {
      setWarning('Base angle too small. Move farther and recapture.')
      setBaseTooShallow(true)
      return
    }
    if (baseAbsDeg > 35) {
      setWarning('Base angle too large. Move closer and recapture.')
      return
    }
    setBaseTooShallow(false)
    setBaseAngleRad(medianRad)
    setBaseSdRad(sdRad)
    // photo receipt
    try {
      if (cameraOn && videoElRef.current) {
        const v = videoElRef.current
        const w = v.videoWidth || v.clientWidth
        const h = v.videoHeight || v.clientHeight
        if (w && h) {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(v, 0, 0, w, h)
            const url = canvas.toDataURL('image/jpeg', 0.8)
            setBasePhoto(url)
          }
        }
      }
    } catch {
      // ignore
    }

    // Update estimated horizontal distance d' = h0 / tan(|θ1|)
    const dPrime = eyeHeightM / Math.tan(Math.abs(medianRad))
    setEstimatedDistanceM(Number.isFinite(dPrime) ? dPrime : null)
    setStep('top')
  }, [eyeHeightM, liveRollDeg])

  // Capture top
  const onCaptureTop = useCallback((): number | null => {
    if (mode === 'baseAngle' && baseAngleRad == null) return null
    const buf = sampleBufferRef.current
    if (buf.length < 10) {
      setWarning('Hold steady for a second, then tap capture.')
      return null
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
    // photo receipt
    try {
      if (cameraOn && videoElRef.current) {
        const v = videoElRef.current
        const w = v.videoWidth || v.clientWidth
        const h = v.videoHeight || v.clientHeight
        if (w && h) {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(v, 0, 0, w, h)
            const url = canvas.toDataURL('image/jpeg', 0.8)
            setTopPhoto(url)
          }
        }
      }
    } catch {
      // ignore
    }

    if (mode === 'twoStop') {
      return medianRad
    }

    if (mode === 'paced') {
      if (!(distanceM >= 3 && distanceM <= 25)) {
        setWarning('Distance must be between 3 m and 25 m.')
        setStep('distance')
        return null
      }
      if (Math.abs(radToDeg(medianRad)) < 5) {
        setWarning('Angle too small; move closer or lower the phone.')
        return null
      }
      const h = computeHeightFromDistance({ cameraHeightM: eyeHeightM, distanceM, topAngleRad: medianRad })
      setResultM(Number(h.toFixed(2)))
      setRangeM(null)
      setStep('result')
      return medianRad
    }

    if (mode === 'baseAngle') {
      const diffDeg = radToDeg(medianRad) - radToDeg(baseAngleRad!)
      if (diffDeg < 5) {
        setWarning('Angle difference too small. Aim higher or move closer, then recapture the top.')
        return null
      }
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
      return medianRad
    }

    return medianRad
  }, [mode, baseAngleRad, baseSdRad, distanceM, eyeHeightM, cameraOn])

  const finalizeTwoStop = useCallback((angle2Rad: number | null) => {
    if (angle2Rad == null) return
    const A1 = twoStopAngle1Rad
    const A2 = angle2Rad
    if (A1 != null && A2 != null) {
      const sep = Math.abs(radToDeg(A2) - radToDeg(A1))
      if (sep < 3) {
        setWarning('Angles too similar—walk farther and recapture.')
        return
      }
      const { heightM, distanceM: dist } = computeHeightTwoStops({ eyeHeightM, stepForwardM, angle1Rad: A1, angle2Rad: A2 })
      if (!Number.isFinite(heightM) || !Number.isFinite(dist)) {
        setWarning('Angles too similar—walk farther and recapture.')
        return
      }
      setResultM(Number(heightM.toFixed(2)))
      setEstimatedDistanceM(Number(dist.toFixed(2)))
      setRangeM(null)
      setStep('result')
    }
  }, [twoStopAngle1Rad, eyeHeightM, stepForwardM])

  const onReset = useCallback(() => {
    setBaseAngleRad(null)
    setTopAngleRad(null)
    setBaseSdRad(null)
    setTopSdRad(null)
    setResultM(null)
    setRangeM(null)
    setEstimatedDistanceM(null)
    setWarning('')
    setTwoStopAngle1Rad(null)
    setStep('setup')
  }, [])

  // History
  const [history, setHistory] = useState<TreeMeasureHistoryRecord[]>([])
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('treeMeasureHistory') : null
      if (raw) {
        const parsed = JSON.parse(raw) as TreeMeasureHistoryRecord[]
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const saveToHistory = useCallback(() => {
    const record: TreeMeasureHistoryRecord = {
      timestamp: Date.now(),
      mode,
      eyeHeightM,
      ...(mode === 'paced' ? { distanceM } : {}),
      ...(baseAngleRad != null ? { baseAngleRad } : {}),
      topAngleRad: topAngleRad ?? 0,
      resultM: resultM ?? 0,
      ...(rangeM ? { p10: rangeM.p10, p90: rangeM.p90 } : {}),
      ...(basePhoto ? { baseImg: basePhoto } : {}),
      ...(topPhoto ? { topImg: topPhoto } : {}),
    }
    const next = [record, ...history].slice(0, 20)
    setHistory(next)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('treeMeasureHistory', JSON.stringify(next))
      }
    } catch {
      // ignore
    }
  }, [history, mode, eyeHeightM, distanceM, baseAngleRad, topAngleRad, resultM, rangeM, basePhoto, topPhoto])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('treeMeasureHistory')
      }
    } catch {
      // ignore
    }
  }, [])

  // Vision
  const ensureVision = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setVisionLoading(true)
        setVisionError(null)
      }

      if (!visionRef.current) {
        const { VisionDetector } = await import('@/lib/measure/vision-detector')
        if (!isMountedRef.current) return
        visionRef.current = new VisionDetector()
      }

      const det = visionRef.current
      if (det) {
        await det.loadModels()
        if (!isMountedRef.current) return
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      if (!isMountedRef.current) return
      setVisionError(err instanceof Error ? err.message : String(err))
      setVisionMode(false)
    } finally {
      if (!isMountedRef.current) return
      setVisionLoading(false)
    }
  }, [])

  const stopVisionLoop = useCallback(() => {
    if (visionRafRef.current != null) {
      cancelAnimationFrame(visionRafRef.current)
      visionRafRef.current = null
    }
  }, [])

  const visionLoop = useCallback(async () => {
    if (!visionMode || visionLoading) return
    const video = videoElRef.current
    const det = visionRef.current
    if (!video || !det) return

    const now = performance.now()
    const throttleMs = 300
    if (now - lastVisionTsRef.current >= throttleMs) {
      lastVisionTsRef.current = now
      try {
        const res = await det.findTreeBoundaries(video)
        lastBoundaryRef.current = res
        setBoundary(res)
        setVisionConfidence(res.confidence)
      } catch {
        // ignore
      }
    } else if (lastBoundaryRef.current) {
      setBoundary(lastBoundaryRef.current)
    }

    visionRafRef.current = requestAnimationFrame(() => { void visionLoop() })
  }, [visionMode, visionLoading])

  // Manage starting/stopping vision loop
  useEffect(() => {
    const activeStep = step === 'base' || step === 'top' || step === 'top2'
    if (visionMode && cameraOn && activeStep) {
      void (async () => {
        await ensureVision()
        stopVisionLoop()
        lastBoundaryRef.current = null
        lastVisionTsRef.current = 0
        visionRafRef.current = requestAnimationFrame(() => { void visionLoop() })
      })()
    } else {
      stopVisionLoop()
      setVisionConfidence(null)
      setBoundary(null)
    }
    return () => stopVisionLoop()
  }, [visionMode, cameraOn, step, ensureVision, visionLoop, stopVisionLoop])

  // Calibration with reference objects
  const calibrateWithReference = useCallback(async () => {
    try {
      setCalibrationMsg('Aim at a door or known object…')
      await ensureVision()
      const det = visionRef.current
      const video = videoElRef.current
      if (!det || !video) return
      const objs = await det.detectKnownObjects(video)
      setKnownObjects(objs)
      const door = objs.find((o) => o.type === 'door')
      if (door) setCalibrationMsg('Door detected — calibrating…')
      const calib = await det.calculateScaleFactor(video)
      if (calib) {
        setPxPerMeter(calib.pxPerMeter)
        setCalibrationScore(calib.score)
        setCalibrated(true)
        setCalibrationMsg('Calibrated ✓')
      } else {
        setCalibrationMsg('No suitable reference found')
      }
    } catch {
      setCalibrationMsg('Calibration failed')
    }
  }, [ensureVision])

  // Derived vision height (quick-calibrated)
  const visionHeightM = useMemo(() => {
    const b = lastBoundaryRef.current
    if (!b || typeof pxPerMeter !== 'number' || pxPerMeter <= 0) return null
    const dx = b.base.x - b.top.x
    const dy = b.base.y - b.top.y
    const pixels = Math.hypot(dx, dy)
    const rawVisionHeight = pixels / pxPerMeter
    return rawVisionHeight * CALIBRATION_FACTOR
  }, [pxPerMeter])

  // Public API
  return {
    // wizard
    step,
    setStep,
    mode,
    setMode,

    // config
    eyeHeightM,
    setEyeHeightM,
    setupError,
    setSetupError,
    onSaveSetup,

    // distance inputs
    distanceM,
    setDistanceM,
    stepsCount,
    setStepsCount,
    stepLengthM,
    setStepLengthM,
    stepForwardM,
    setStepForwardM,
    distanceError,
    setDistanceError,

    // motion state
    supported,
    permission,
    streaming,
    livePitchDeg,
    liveRollDeg,
    ensureStreaming,
    onCalibrate,

    // capture state
    baseAngleRad,
    topAngleRad,
    baseSdRad,
    topSdRad,
    baseTooShallow,
    isSteady,
    autoCapture,
    setAutoCapture,
    captureCooldown,
    autoCapturePaused,
    setAutoCapturePaused,
    setupModeActive,
    setupSecondsRemaining,
    stabilityState,
    stabilizationProgress,
    stabilizationSecondsRemaining,
    onCaptureBase,
    onCaptureTop,
    finalizeTwoStop,
    twoStopAngle1Rad,
    setTwoStopAngle1Rad,
    warning,
    setWarning,

    // results
    resultM,
    rangeM,
    estimatedDistanceM,
    units,
    setUnits,
    onReset,

    // photos
    basePhoto,
    topPhoto,
    setBasePhoto,
    setTopPhoto,

    // vision
    visionMode,
    setVisionMode,
    visionLoading,
    visionError,
    visionConfidence,
    boundary,
    knownObjects,
    calibrationMsg,
    calibrated,
    pxPerMeter,
    calibrationScore,
    calibrateWithReference,
    ensureVision,
    attachVideoElement,
    visionHeightM,

    // camera UI state
    cameraOn,
    setCameraOn,
    cameraError,
    setCameraError,

    // history
    history,
    saveToHistory,
    clearHistory,
  }
}


