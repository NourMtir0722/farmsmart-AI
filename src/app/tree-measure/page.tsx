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
    elevationFromPitchRoll,
  // computeTreeHeight,
  estimateHeightUncertainty,
  computeHeightFromDistance,
    computeHeightTwoStops,
} from '@/lib/measure/inclinometer'
import type { VisionDetector as VisionDetectorClass, TreeBoundaryResult, KnownObject } from '@/lib/measure/vision-detector'
import { fuseMeasurements } from '@/lib/measure/sensor-fusion'

type Step = 'setup' | 'distance' | 'base' | 'top' | 'top2' | 'result'

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
  const [mode, setMode] = useState<'paced' | 'baseAngle' | 'twoStop'>('paced')
  const [distanceM, setDistanceM] = useState<number>(8.0)
  const [stepsCount, setStepsCount] = useState<number>(0)
  const [stepLengthM, setStepLengthM] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.75
    const s = window.localStorage.getItem('stepLengthM')
    const v = s ? Number(s) : NaN
    return Number.isFinite(v) && v > 0 ? v : 0.75
  })
  const [distanceError, setDistanceError] = useState<string>('')
  const [stepForwardM, setStepForwardM] = useState<number>(() => {
    if (typeof window === 'undefined') return 5.0
    const s = window.localStorage.getItem('stepForwardM')
    const v = s ? Number(s) : NaN
    return Number.isFinite(v) && v > 0 ? v : 5.0
  })
  const [twoStopAngle1Rad, setTwoStopAngle1Rad] = useState<number | null>(null)
  // Auto-capture when steady
  const [autoCapture, setAutoCapture] = useState<boolean>(true)
  const [isSteady, setIsSteady] = useState<boolean>(false)
  const steadySinceRef = useRef<number | null>(null)
  const [captureCooldown, setCaptureCooldown] = useState<boolean>(false)
  const captureCooldownRef = useRef<boolean>(false)
  useEffect(() => {
    captureCooldownRef.current = captureCooldown
  }, [captureCooldown])

  // Photo receipts
  const [basePhoto, setBasePhoto] = useState<string | null>(null)
  const [topPhoto, setTopPhoto] = useState<string | null>(null)

  // Local history
  type TreeMeasureRecord = {
    timestamp: number
    mode: 'paced' | 'baseAngle' | 'twoStop'
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
  const [history, setHistory] = useState<TreeMeasureRecord[]>([])

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

  // Vision mode state
  const [visionMode, setVisionMode] = useState<boolean>(false)
  const [visionLoading, setVisionLoading] = useState<boolean>(false)
  const [visionError, setVisionError] = useState<string | null>(null)
  const [visionConfidence, setVisionConfidence] = useState<number | null>(null)
  // Calibration state
  const [calibrationMsg, setCalibrationMsg] = useState<string>('')
  const [calibrated, setCalibrated] = useState<boolean>(false)
  const [pxPerMeter, setPxPerMeter] = useState<number | null>(null)
  const [calibrationScore, setCalibrationScore] = useState<number | null>(null)
  const [knownObjects, setKnownObjects] = useState<KnownObject[] | null>(null)
  const visionRef = useRef<VisionDetectorClass | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const visionRafRef = useRef<number | null>(null)
  const lastVisionTsRef = useRef<number>(0)
  const lastBoundaryRef = useRef<TreeBoundaryResult | null>(null)
  // Quick calibration constants (door reference)
  const DOOR_ACTUAL_HEIGHT = 2.0 // meters
  const DOOR_MEASURED_HEIGHT = 2.43 // from test
  const CALIBRATION_FACTOR = DOOR_ACTUAL_HEIGHT / DOOR_MEASURED_HEIGHT // ≈0.823
  // Track component mounted state to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
      stopUiLoop()
    }
  }, [stopUiLoop])

  const [liveRollDeg, setLiveRollDeg] = useState<number>(0)

  const startUiLoop = useCallback(() => {
    if (rafIdRef.current !== null) return
    const loop = () => {
      const now = Date.now()
      if (now - lastUiTsRef.current >= 100) {
        lastUiTsRef.current = now
        let deg = radToDeg(lastPitchRadRef.current)
        let rdeg = radToDeg(lastRollRadRef.current)
        // clamp for display
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
      // compute elevation from pitch+roll (post-zero)
      const rawPitch = typeof s.pitchRad === 'number' ? s.pitchRad : 0
      const rawRoll = typeof s.rollRad === 'number' ? s.rollRad : 0
      const elevRad = elevationFromPitchRoll(rawPitch, rawRoll)
      sampleBufferRef.current.push({ t: now, pitchRad: elevRad })
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
      // update live values for UI
      lastPitchRadRef.current = elevRad
      lastRollRadRef.current = rawRoll
    })
    streamRef.current = stream
    setStreaming(true)
    startUiLoop()
  }, [supported, startUiLoop])

  // Load local history
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('treeMeasureHistory') : null
      if (raw) {
        const parsed = JSON.parse(raw) as TreeMeasureRecord[]
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

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

  // Vision: initialize models
  const ensureVision = useCallback(async () => {
    try {
      // Indicate loading if still mounted
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
      console.error(err)
      if (!isMountedRef.current) return
      setVisionError(err instanceof Error ? err.message : String(err))
      setVisionMode(false)
    } finally {
      if (!isMountedRef.current) return
      setVisionLoading(false)
    }
  }, [])

  // Vision: draw overlay
  const drawVisionOverlay = useCallback((boundary: TreeBoundaryResult | null) => {
    const canvas = overlayCanvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const rect = video.getBoundingClientRect()
    const displayW = Math.max(1, Math.floor(rect.width))
    const displayH = Math.max(1, Math.floor(rect.height))
    if (canvas.width !== displayW) canvas.width = displayW
    if (canvas.height !== displayH) canvas.height = displayH

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!boundary) return

    const natW = (video.videoWidth || video.clientWidth || displayW)
    const natH = (video.videoHeight || video.clientHeight || displayH)
    const sx = displayW / natW
    const sy = displayH / natH

    const topX = boundary.top.x * sx
    const topY = boundary.top.y * sy
    const baseX = boundary.base.x * sx
    const baseY = boundary.base.y * sy

    // Line
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(topX, topY)
    ctx.lineTo(baseX, baseY)
    ctx.stroke()

    // Points
    const drawDot = (x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    drawDot(topX, topY, 'rgba(59,130,246,0.95)')
    drawDot(baseX, baseY, 'rgba(244,63,94,0.95)')

    // Confidence
    const conf = Math.round((boundary.confidence ?? 0) * 100)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    const label = `Vision confidence: ${conf}%`
    ctx.font = 'bold 14px ui-sans-serif, system-ui, -apple-system'
    const textW = ctx.measureText(label).width
    const pad = 6
    ctx.fillRect(10, displayH - 26, textW + pad * 2, 20)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, 10 + pad, displayH - 12)

    // Show detected reference objects (from latest calibration scan)
    if (knownObjects && knownObjects.length > 0) {
      ctx.lineWidth = 2
      for (const obj of knownObjects) {
        const [bx, by, bw, bh] = obj.bbox
        const rx = bx * sx
        const ry = by * sy
        const rw = Math.max(1, Math.round(bw * sx))
        const rh = Math.max(1, Math.round(bh * sy))
        ctx.strokeStyle = obj.type === 'door' ? 'rgba(234,179,8,0.95)' : 'rgba(255,255,255,0.85)'
        ctx.strokeRect(rx, ry, rw, rh)
        const txt = `${obj.type} ${(obj.confidence * 100).toFixed(0)}%`
        ctx.font = 'bold 12px ui-sans-serif, system-ui, -apple-system'
        const tw = ctx.measureText(txt).width
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(rx, ry - 18, tw + 8, 16)
        ctx.fillStyle = '#fff'
        ctx.fillText(txt, rx + 4, ry - 6)
      }
    }
  }, [knownObjects])

  // Vision: processing loop
  const stopVisionLoop = useCallback(() => {
    if (visionRafRef.current != null) {
      cancelAnimationFrame(visionRafRef.current)
      visionRafRef.current = null
    }
  }, [])

  const visionLoop = useCallback(async () => {
    if (!visionMode || visionLoading) return
    const video = videoRef.current
    const det = visionRef.current
    if (!video || !det) return

    const now = performance.now()
    const throttleMs = 300
    if (now - lastVisionTsRef.current >= throttleMs) {
      lastVisionTsRef.current = now
      try {
        const res = await det.findTreeBoundaries(video)
        lastBoundaryRef.current = res
        setVisionConfidence(res.confidence)
        drawVisionOverlay(res)
      } catch (err) {
        // Draw nothing on failure
      }
    } else if (lastBoundaryRef.current) {
      drawVisionOverlay(lastBoundaryRef.current)
    }

    visionRafRef.current = requestAnimationFrame(() => { void visionLoop() })
  }, [visionMode, visionLoading, drawVisionOverlay])

  // Manage starting/stopping vision loop based on UI state
  useEffect(() => {
    const activeStep = step === 'base' || step === 'top' || step === 'top2'
    if (visionMode && cameraOn && activeStep) {
      // ensure models
      void (async () => {
        await ensureVision()
        stopVisionLoop()
        lastBoundaryRef.current = null
        lastVisionTsRef.current = 0
        visionRafRef.current = requestAnimationFrame(() => { void visionLoop() })
      })()
    } else {
      stopVisionLoop()
      // clear overlay
      const c = overlayCanvasRef.current
      if (c) {
        const g = c.getContext('2d')
        if (g) g.clearRect(0, 0, c.width, c.height)
      }
      setVisionConfidence(null)
    }
    return () => stopVisionLoop()
  }, [visionMode, cameraOn, step, ensureVision, visionLoop, stopVisionLoop])

  // Start/stop camera when step or toggle changes
  useEffect(() => {
    if (!cameraOn) {
      stopCamera()
      return
    }
    if (step === 'base' || step === 'top' || step === 'top2') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, cameraOn])

  // Steadiness detection and auto-capture loop (runs while in base/top)
  useEffect(() => {
    const interval = setInterval(() => {
      const active = step === 'base' || step === 'top'
      if (!active) {
        setIsSteady(false)
        steadySinceRef.current = null
        return
      }
      const now = Date.now()
      const windowSamples = sampleBufferRef.current.filter((s) => s.t >= now - 600)
      if (windowSamples.length >= 12) {
        const n = windowSamples.length
        const mean = windowSamples.reduce((acc, s) => acc + s.pitchRad, 0) / n
        const variance = n > 1 ? windowSamples.reduce((acc, s) => acc + Math.pow(s.pitchRad - mean, 2), 0) / (n - 1) : 0
        const sdRad = Math.sqrt(variance)
        const sdDeg = radToDeg(sdRad)
        const steady = sdDeg < 0.3
        setIsSteady(steady)
        if (steady && autoCapture && !captureCooldownRef.current) {
          if (steadySinceRef.current == null) {
            steadySinceRef.current = now
          } else if (now - steadySinceRef.current >= 800) {
            // trigger capture
            if (step === 'base') {
              onCaptureBase()
            } else if (step === 'top') {
              onCaptureTop()
            }
            setCaptureCooldown(true)
            setTimeout(() => setCaptureCooldown(false), 1000)
            steadySinceRef.current = null
          }
        } else {
          steadySinceRef.current = null
        }
      } else {
        setIsSteady(false)
        steadySinceRef.current = null
      }
    }, 100)
    return () => clearInterval(interval)
  }, [step, autoCapture])

  // Auto-start motion stream when entering Top step if permission is granted
  useEffect(() => {
    if (step === 'top' && supported && permission === 'granted' && !streamRef.current) {
      // ensure streaming; idempotent if already granted
      void (async () => {
        await ensureStreaming()
      })()
    }
  }, [step, supported, permission, ensureStreaming])

  // Stop motion stream when leaving measurement steps (base/top) or on unmount
  useEffect(() => {
    if (step !== 'base' && step !== 'top') {
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
        setStreaming(false)
        stopUiLoop()
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.stop()
        streamRef.current = null
        setStreaming(false)
        stopUiLoop()
      }
    }
  }, [step, stopUiLoop])

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
    setStep(mode === 'paced' ? 'distance' : mode === 'twoStop' ? 'distance' : 'base')
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
    // roll guard
    if (Math.abs(liveRollDeg) > 5) {
      setWarning('Keep phone upright (reduce side tilt).')
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
    // guard rails: block if |base| outside [2°, 35°]
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
    // photo receipt if camera available
    try {
      if (cameraOn && videoRef.current) {
        const v = videoRef.current
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
      // ignore camera failures
    }
    // Update estimated horizontal distance d' = h0 / tan(|θ1|)
    const dPrime = eyeHeightM / Math.tan(Math.abs(medianRad))
    setEstimatedDistanceM(Number.isFinite(dPrime) ? dPrime : null)
    setStep('top')
  }

  const onCaptureTop = (): number | null => {
    if (mode === 'baseAngle' && baseAngleRad == null) return null
    // require at least 10 samples within buffer (~1s)
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
    // photo receipt if camera available
    try {
      if (cameraOn && videoRef.current) {
        const v = videoRef.current
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
      // ignore camera failures
    }

    // In two-stop mode, only capture and return the angle; navigation and compute happen elsewhere
    if (mode === 'twoStop') {
      return medianRad
    }

    if (mode === 'paced') {
      // validate distance
      if (!(distanceM >= 3 && distanceM <= 25)) {
        setWarning('Distance must be between 3 m and 25 m.')
        setStep('distance')
        return null
      }
      // top angle guard for paced mode
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

    // base-angle mode
    if (mode === 'baseAngle') {
      // additional guard rail (top - base) >= 5°
      const diffDeg = radToDeg(medianRad) - radToDeg(baseAngleRad!)
      if (diffDeg < 5) {
        setWarning('Angle difference too small. Aim higher or move closer, then recapture the top.')
        return null
      }
      // compute uncertainty in base-angle mode
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
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'twoStop'} onChange={() => setMode('twoStop')} />
            <span>Two-stop (no distance)</span>
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

        {step === 'distance' && mode !== 'twoStop' && (
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

        {step === 'distance' && mode === 'twoStop' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">Enter your forward step length L between stops.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forward step L (m)</label>
                <input type="number" min={1} step={0.1} value={stepForwardM}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setStepForwardM(v)
                    if (typeof window !== 'undefined') localStorage.setItem('stepForwardM', String(v))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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
                  setStepForwardM(calc)
                  if (typeof window !== 'undefined') localStorage.setItem('stepForwardM', String(calc))
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Calculate L
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setStep('top')}
                disabled={!(stepForwardM >= 1 && stepForwardM <= 25)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
              >
                Continue to Stop 1
              </button>
            </div>
          </div>
        )}

        {step === 'base' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Stand 5–10 m from the trunk (or enter paced distance). Hold phone at camera height ≈ eye height. Tap Calibrate level when level. Align crosshair with where the trunk meets the ground.
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
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  Math.abs(livePitchDeg) < 0.5
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Level: ±{Math.abs(livePitchDeg).toFixed(1)}°
              </span>
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
                  {/* Vision overlay canvas */}
                  <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0" />
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
            {/* Quick calibration based on known door height (applies to vision estimate) */}
            {(() => {
              // This block does not change state directly; it documents constants and feeds later display logic
              void DOOR_ACTUAL_HEIGHT; void DOOR_MEASURED_HEIGHT; void CALIBRATION_FACTOR;
              return null
            })()}
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={(e) => setCameraOn(e.target.checked)}
                />
                <span>Show camera view</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visionMode}
                  onChange={async (e) => {
                    const on = e.target.checked
                    setVisionMode(on)
                    if (on) await ensureVision()
                  }}
                />
                <span>Enhanced Vision Mode</span>
              </label>
              <button
                onClick={async () => {
                  try {
                    setCalibrationMsg('Aim at a door or known object…')
                    await ensureVision()
                    const det = visionRef.current
                    const video = videoRef.current
                    if (!det || !video) return
                    const objs = await det.detectKnownObjects(video)
                    setKnownObjects(objs)
                    const door = objs.find(o => o.type === 'door')
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
                  } catch (err) {
                    setCalibrationMsg('Calibration failed')
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs"
              >
                Calibrate with Reference
              </button>
              {visionLoading && <span className="text-xs text-blue-600 dark:text-blue-300">Loading vision models…</span>}
              {visionError && <span className="text-xs text-red-600 dark:text-red-400">{visionError}</span>}
              {calibrationMsg && <span className="text-xs text-amber-600 dark:text-amber-300">{calibrationMsg}</span>}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoCapture}
                  onChange={(e) => setAutoCapture(e.target.checked)}
                />
                <span>Auto-capture when steady</span>
              </label>
              {isSteady && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  ✓ Steady
                </span>
              )}
              {cameraError && <span className="text-amber-400 text-sm">{cameraError}</span>}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">Hold phone at camera height ≈ eye height. Tap Calibrate level when level. Align the crosshair with the base, hold steady ~1 s, then capture.</div>
            {(calibrated || pxPerMeter != null) && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                {calibrated && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Calibrated ✓</span>
                )}
                {typeof pxPerMeter === 'number' && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Scale: {pxPerMeter.toFixed(1)} px/m</span>
                )}
                {typeof calibrationScore === 'number' && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Accuracy boost: {(Math.max(0, Math.min(1, calibrationScore)) * 100).toFixed(0)}%</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Live pitch (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{livePitchDeg.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Base captured</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) + '°' : '-'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Roll (°)</div>
                <div className={`text-2xl font-bold mt-1 ${
                  Math.abs(liveRollDeg) < 3 ? 'text-green-600 dark:text-green-400' : Math.abs(liveRollDeg) < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>{liveRollDeg.toFixed(1)}</div>
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
                disabled={!streaming || captureCooldown}
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
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${supported ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                {supported ? 'Supported' : 'Not supported'}
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Permission: {permission}
              </span>
              {permission !== 'granted' && (
                <button
                  onClick={async () => {
                    const res = await requestMotionPermission()
                    setPermission(res)
                    if (res === 'granted') {
                      await ensureStreaming()
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs"
                >
                  Enable sensors
                </button>
              )}
              {streaming && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Streaming
                </span>
              )}
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  Math.abs(livePitchDeg) < 0.5
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Level: ±{Math.abs(livePitchDeg).toFixed(1)}°
              </span>
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
                  {/* Vision overlay canvas */}
                  <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0" />
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visionMode}
                  onChange={async (e) => {
                    const on = e.target.checked
                    setVisionMode(on)
                    if (on) await ensureVision()
                  }}
                />
                <span>Enhanced Vision Mode</span>
              </label>
              {visionLoading && <span className="text-xs text-blue-600 dark:text-blue-300">Loading vision models…</span>}
              {typeof visionConfidence === 'number' && (
                <span className="text-xs text-green-600 dark:text-green-300">Vision confidence: {Math.round(visionConfidence * 100)}%</span>
              )}
              {visionError && <span className="text-xs text-red-600 dark:text-red-400">{visionError}</span>}
              <button
                onClick={async () => {
                  try {
                    setCalibrationMsg('Aim at a door or known object…')
                    await ensureVision()
                    const det = visionRef.current
                    const video = videoRef.current
                    if (!det || !video) return
                    const objs = await det.detectKnownObjects(video)
                    setKnownObjects(objs)
                    const door = objs.find(o => o.type === 'door')
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
                  } catch (err) {
                    setCalibrationMsg('Calibration failed')
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs"
              >
                Calibrate with Reference
              </button>
              {calibrationMsg && <span className="text-xs text-amber-600 dark:text-amber-300">{calibrationMsg}</span>}
              {cameraError && <span className="text-amber-400 text-sm">{cameraError}</span>}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
              {mode === 'twoStop' ? 'Stop 1: Align the crosshair with the tree top, hold steady ~1 s, then capture.' : 'Hold phone at camera height ≈ eye height. Tap Calibrate level when level. Align the crosshair with the tree top, hold steady ~1 s, then capture.'}
            </div>

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
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Roll (°)</div>
                <div className={`text-2xl font-bold mt-1 ${
                  Math.abs(liveRollDeg) < 3 ? 'text-green-600 dark:text-green-400' : Math.abs(liveRollDeg) < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>{liveRollDeg.toFixed(1)}</div>
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
                onClick={() => {
                  if (mode === 'twoStop' && twoStopAngle1Rad == null) {
                    const captured = onCaptureTop()
                    if (captured == null) return
                    setTwoStopAngle1Rad(captured)
                    setStep('top2')
                  } else if (mode === 'twoStop' && twoStopAngle1Rad != null) {
                    setStep('top2')
                  } else {
                    onCaptureTop()
                  }
                }}
                disabled={!streaming || (mode === 'baseAngle' && (baseAngleRad == null || baseTooShallow)) || captureCooldown}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
              >
                {mode === 'twoStop' ? (twoStopAngle1Rad == null ? 'Capture Stop 1' : 'Go to Stop 2') : 'Capture top angle'}
              </button>
            </div>
          </div>
        )}

        {step === 'top2' && mode === 'twoStop' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('top')}
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
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  Math.abs(livePitchDeg) < 0.5
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Level: ±{Math.abs(livePitchDeg).toFixed(1)}°
              </span>
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
                  {/* Vision overlay canvas */}
                  <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0" />
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

            <div className="text-xs text-gray-600 dark:text-gray-400">Stop 2: Align the crosshair with the tree top, hold steady ~1 s, then capture.</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Live pitch (°)</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{livePitchDeg.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">Stop 1 angle (°)</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{twoStopAngle1Rad != null ? radToDeg(twoStopAngle1Rad).toFixed(1) + '°' : '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  // capture fresh A2 and compute using stored A1
                  const captured = onCaptureTop()
                  if (captured == null) return
                  const A1 = twoStopAngle1Rad
                  const A2 = captured
                  if (A1 != null && A2 != null) {
                    const sep = Math.abs(radToDeg(A2) - radToDeg(A1))
                    if (sep < 3) {
                      setWarning('Angles too similar—walk farther and recapture.')
                      return
                    }
                    const { heightM, distanceM } = computeHeightTwoStops({ eyeHeightM, stepForwardM, angle1Rad: A1, angle2Rad: A2 })
                    if (!Number.isFinite(heightM) || !Number.isFinite(distanceM)) {
                      setWarning('Angles too similar—walk farther and recapture.')
                      return
                    }
                    setResultM(Number(heightM.toFixed(2)))
                    setEstimatedDistanceM(Number(distanceM.toFixed(2)))
                    setRangeM(null)
                    setStep('result')
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Capture Stop 2 & Compute
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            {(basePhoto || topPhoto) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {basePhoto && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={basePhoto} alt="Base capture" className="w-full h-48 object-cover" />
                    <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                      Base angle: {baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) + '°' : '-'}
                    </div>
                  </div>
                )}
                {topPhoto && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={topPhoto} alt="Top capture" className="w-full h-48 object-cover" />
                    <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                      Top angle: {topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) + '°' : '-'}
                    </div>
                  </div>
                )}
              </div>
            )}
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

            {(() => {
              const boundary = lastBoundaryRef.current
              let visionHeight: number | null = null
              if (boundary && typeof pxPerMeter === 'number' && pxPerMeter > 0) {
                const dx = boundary.base.x - boundary.top.x
                const dy = boundary.base.y - boundary.top.y
                const pixels = Math.hypot(dx, dy)
                const rawVisionHeight = pixels / pxPerMeter
                // Apply quick calibration factor if vision is enabled and present
                visionHeight = rawVisionHeight * CALIBRATION_FACTOR
              }
              const sensorHeight = resultM
              const sensorSd = rangeM ? Math.max(0, (rangeM.p90 - rangeM.p10) / 2.563) : undefined
              const visionInput = (visionHeight != null && typeof visionConfidence === 'number')
                ? { heightM: visionHeight, confidence: visionConfidence }
                : null
              const sensorInput = (sensorHeight != null)
                ? (sensorSd != null ? { heightM: sensorHeight, sdM: sensorSd } : { heightM: sensorHeight })
                : null
              const fused = fuseMeasurements(visionInput, sensorInput)
              const fmt = (m: number | null) => (m == null ? '-' : (units === 'm' ? `${m.toFixed(2)} m` : `${(m * 3.28084).toFixed(2)} ft`))
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Vision</div>
                      <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{fmt(visionHeight)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Confidence: {typeof visionConfidence === 'number' ? `${Math.round(visionConfidence * 100)}%` : '-'}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">{visionHeight != null ? 'Calibrated ✓' : ''}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sensor</div>
                      <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{fmt(sensorHeight)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Uncertainty: {sensorSd != null ? `${(units === 'm' ? sensorSd : sensorSd * 3.28084).toFixed(2)} ${units}` : '-'}</div>
                    </div>
                    <div className="rounded-xl border-2 border-green-400 dark:border-green-600 p-4 bg-green-50 dark:bg-green-900/20">
                      <div className="text-xs uppercase tracking-wide text-green-700 dark:text-green-300">Fused</div>
                      <div className="text-3xl font-extrabold mt-1 text-green-700 dark:text-green-300">{fmt(fused.heightM)}</div>
                      <div className="text-xs text-green-800 dark:text-green-200">Confidence: {`${Math.round((fused.confidence ?? 0) * 100)}%`} • Uncertainty ±{units === 'm' ? fused.uncertaintyM.toFixed(2) : (fused.uncertaintyM * 3.28084).toFixed(2)} {units}</div>
                    </div>
                  </div>
                  {/* Keep original sensor card for compatibility */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-green-800 dark:text-green-200">Estimated tree height (sensor)</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Units:</span>
                        <button onClick={() => setUnits('m')} className={`px-2 py-1 rounded ${units === 'm' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>m</button>
                        <button onClick={() => setUnits('ft')} className={`px-2 py-1 rounded ${units === 'ft' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>ft</button>
                      </div>
                    </div>
                    <div className="text-4xl font-extrabold text-green-700 dark:text-green-300 mt-1">
                      {fmt(sensorHeight)}
                    </div>
                    {rangeM && (
                      <div className="text-sm text-green-800 dark:text-green-200">
                        Range (≈80%): {units === 'm' ? `${rangeM.p10.toFixed(2)}–${rangeM.p90.toFixed(2)} m` : `${(rangeM.p10 * 3.28084).toFixed(2)}–${(rangeM.p90 * 3.28084).toFixed(2)} ft`}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-400">Note: Range reflects sensor jitter during capture.</div>
                  </div>
                </div>
              )
            })()}

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
              <button
                onClick={() => {
                  const record: TreeMeasureRecord = {
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
                  } catch {}
                }}
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                Save to history
              </button>
            </div>
        </div>
        )}

        {/* Local History */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">History</h3>
              <button
                onClick={() => {
                  setHistory([])
                  try {
                    if (typeof window !== 'undefined') {
                      window.localStorage.removeItem('treeMeasureHistory')
                    }
                  } catch {}
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                Clear history
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((r, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {(r.topImg || r.baseImg) ? (
                    <img src={(r.topImg || r.baseImg)!} alt="thumb" className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 grid place-items-center text-gray-500 dark:text-gray-400 text-sm">No photo</div>
                  )}
                  <div className="p-3 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <div>{new Date(r.timestamp).toLocaleString()}</div>
                    <div>Mode: {r.mode}</div>
                    {'distanceM' in r && r.distanceM != null && (
                      <div>Distance: {r.distanceM.toFixed(1)} m</div>
                    )}
                    <div>Height: {r.resultM.toFixed(2)} m{(r.p10 != null && r.p90 != null) ? ` (≈${r.p10.toFixed(2)}–${r.p90.toFixed(2)} m)` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 


