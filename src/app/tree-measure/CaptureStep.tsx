'use client'

import React, { useRef } from 'react'
import { radToDeg } from '@/lib/measure/inclinometer'
import CameraPreview from '@/components/CameraPreview'
import VisionOverlay from '@/components/VisionOverlay'
import type { TreeBoundaryResult } from '@/lib/measure/vision-detector'

type Props = {
  variant: 'base' | 'top' | 'top2'
  // motion
  supported: boolean
  permission: string
  streaming: boolean
  livePitchDeg: number
  liveRollDeg: number
  ensureStreaming: () => Promise<void>
  onCalibrate: () => void
  // capture
  baseAngleRad: number | null
  topAngleRad: number | null
  onCaptureBase: () => void
  onCaptureTop: () => number | null
  baseTooShallow: boolean
  isSteady: boolean
  autoCapture: boolean
  setAutoCapture: (v: boolean) => void
  captureCooldown: boolean
  warning?: string
  // camera and vision
  cameraOn: boolean
  setCameraOn: (v: boolean) => void
  cameraError: string | null
  setCameraError: (v: string | null) => void
  onVideoRef: (el: HTMLVideoElement | null) => void
  visionMode: boolean
  setVisionMode: (v: boolean) => void
  visionLoading: boolean
  visionError: string | null
  visionConfidence: number | null
  boundary: TreeBoundaryResult | null
  onCalibrateWithRef?: () => void
  // UI controls
  onBack: () => void
  onContinueTwoStop?: (capturedAngle1?: number | null) => void
}

export default function CaptureStep({
  variant,
  supported,
  permission,
  streaming,
  livePitchDeg,
  liveRollDeg,
  ensureStreaming,
  onCalibrate,
  baseAngleRad,
  topAngleRad,
  onCaptureBase,
  onCaptureTop,
  baseTooShallow,
  isSteady,
  autoCapture,
  setAutoCapture,
  captureCooldown,
  warning,
  cameraOn,
  setCameraOn,
  cameraError,
  setCameraError,
  onVideoRef,
  visionMode,
  setVisionMode,
  visionLoading,
  visionError,
  visionConfidence,
  boundary,
  onCalibrateWithRef,
  onBack,
  onContinueTwoStop,
}: Props) {
  const videoProxyRef = useRef<HTMLVideoElement | null>(null)

  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoProxyRef.current = el
    onVideoRef(el)
  }
  const isBase = variant === 'base'
  const isTop = variant === 'top'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
          Back
        </button>
        <div className="flex-1" />
        {!streaming && (
          <button onClick={ensureStreaming} disabled={!supported} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400">
            Enable sensors
          </button>
        )}
        {streaming && (
          <button onClick={onCalibrate} className="px-4 py-2 rounded-lg bg-amber-600 text-white">
            Calibrate level
          </button>
        )}
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${supported ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
          {supported ? 'Supported' : 'Not supported'}
        </span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Permission: {permission}</span>
        {streaming && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Streaming
          </span>
        )}
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${Math.abs(livePitchDeg) < 0.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
        >
          Level: ±{Math.abs(livePitchDeg).toFixed(1)}°
        </span>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
        {cameraOn ? (
          <>
            <CameraPreview active={true} className="block w-full h-[45vh] object-cover" onVideoRef={handleVideoRef} onError={setCameraError} />
            <VisionOverlay videoRef={videoProxyRef} boundary={boundary ?? null} confidence={visionConfidence ?? null} className="" />
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
          <input type="checkbox" checked={cameraOn} onChange={(e) => setCameraOn(e.target.checked)} />
          <span>Show camera view</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visionMode}
            onChange={async (e) => {
              const on = e.target.checked
              setVisionMode(on)
            }}
          />
          <span>Enhanced Vision Mode</span>
        </label>
        {visionLoading && <span className="text-xs text-blue-600 dark:text-blue-300">Loading vision models…</span>}
        {typeof visionConfidence === 'number' && (
          <span className="text-xs text-green-600 dark:text-green-300">Vision confidence: {Math.round(visionConfidence * 100)}%</span>
        )}
        {visionError && <span className="text-xs text-red-600 dark:text-red-400">{visionError}</span>}
        {onCalibrateWithRef && (
          <button onClick={onCalibrateWithRef} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs">
            Calibrate with Reference
          </button>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoCapture} onChange={(e) => setAutoCapture(e.target.checked)} />
          <span>Auto-capture when steady</span>
        </label>
        {isSteady && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">✓ Steady</span>
        )}
        {cameraError && <span className="text-amber-400 text-sm">{cameraError}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">Live pitch (°)</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{livePitchDeg.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">{isBase ? 'Base captured' : 'Top captured'}</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
            {isBase ? (baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) + '°' : '-') : (topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) + '°' : '-')}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">Roll (°)</div>
          <div className={`${Math.abs(liveRollDeg) < 3 ? 'text-green-600 dark:text-green-400' : Math.abs(liveRollDeg) < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'} text-2xl font-bold mt-1`}>{liveRollDeg.toFixed(1)}</div>
        </div>
      </div>

      {isTop && baseTooShallow && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          Base angle is very shallow (&lt;2°). Step back to increase distance and recapture the base.
        </div>
      )}

      {warning && (
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
          {warning}
        </div>
      )}

      {isBase && (
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCaptureBase} disabled={!streaming || captureCooldown} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400">
            Capture base angle
          </button>
        </div>
      )}

      {isTop && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              const captured = onCaptureTop()
              if (onContinueTwoStop) onContinueTwoStop(captured)
            }}
            disabled={!streaming || captureCooldown}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
          >
            Capture top angle
          </button>
        </div>
      )}
    </div>
  )
}


