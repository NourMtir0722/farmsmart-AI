'use client'

import React from 'react'
import { radToDeg } from '@/lib/measure/inclinometer'
import { fuseMeasurements } from '@/lib/measure/sensor-fusion'
import type { TreeBoundaryResult } from '@/lib/measure/vision-detector'

type Props = {
  eyeHeightM: number
  baseAngleRad: number | null
  topAngleRad: number | null
  baseSdRad: number | null
  topSdRad: number | null
  resultM: number | null
  rangeM: { p10: number; p90: number } | null
  units: 'm' | 'ft'
  setUnits: (u: 'm' | 'ft') => void
  estimatedDistanceM: number | null
  basePhoto: string | null
  topPhoto: string | null
  visionConfidence: number | null
  pxPerMeter: number | null
  boundary: TreeBoundaryResult | null
  fusedVisionHeightM: number | null
  onBack: () => void
  onReset: () => void
  onSaveHistory: () => void
}

export default function ResultStep({
  eyeHeightM,
  baseAngleRad,
  topAngleRad,
  baseSdRad,
  topSdRad,
  resultM,
  rangeM,
  units,
  setUnits,
  estimatedDistanceM,
  basePhoto,
  topPhoto,
  visionConfidence,
  pxPerMeter,
  boundary,
  fusedVisionHeightM,
  onBack,
  onReset,
  onSaveHistory,
}: Props) {
  const sensorHeight = resultM
  const sensorSd = rangeM ? Math.max(0, (rangeM.p90 - rangeM.p10) / 2.563) : undefined
  const visionInput = fusedVisionHeightM != null && typeof visionConfidence === 'number' ? { heightM: fusedVisionHeightM, confidence: visionConfidence } : null
  const sensorInput = sensorHeight != null ? (sensorSd != null ? { heightM: sensorHeight, sdM: sensorSd } : { heightM: sensorHeight }) : null
  const fused = fuseMeasurements(visionInput, sensorInput)
  const fmt = (m: number | null) => (m == null ? '-' : units === 'm' ? `${m.toFixed(2)} m` : `${(m * 3.28084).toFixed(2)} ft`)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {(basePhoto || topPhoto) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {basePhoto && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={basePhoto} alt="Base capture" className="w-full h-48 object-cover" />
              <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Base angle: {baseAngleRad != null ? radToDeg(baseAngleRad).toFixed(1) + '°' : '-'}</div>
            </div>
          )}
          {topPhoto && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={topPhoto} alt="Top capture" className="w-full h-48 object-cover" />
              <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Top angle: {topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) + '°' : '-'}</div>
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
          {baseSdRad != null && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SD: {radToDeg(baseSdRad).toFixed(2)}°</div>}
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">Top angle (°)</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{topAngleRad != null ? radToDeg(topAngleRad).toFixed(1) : '-'}</div>
          {topSdRad != null && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SD: {radToDeg(topSdRad).toFixed(2)}°</div>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Vision</div>
            <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{fmt(fusedVisionHeightM)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Confidence: {typeof visionConfidence === 'number' ? `${Math.round(visionConfidence * 100)}%` : '-'}</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">{fusedVisionHeightM != null ? 'Calibrated ✓' : ''}</div>
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
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-800 dark:text-green-200">Estimated tree height (sensor)</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">Units:</span>
              <button onClick={() => setUnits('m')} className={`px-2 py-1 rounded ${units === 'm' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>m</button>
              <button onClick={() => setUnits('ft')} className={`px-2 py-1 rounded ${units === 'ft' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>ft</button>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-green-700 dark:text-green-300 mt-1">{fmt(sensorHeight)}</div>
          {rangeM && (
            <div className="text-sm text-green-800 dark:text-green-200">
              Range (≈80%): {units === 'm' ? `${rangeM.p10.toFixed(2)}–${rangeM.p90.toFixed(2)} m` : `${(rangeM.p10 * 3.28084).toFixed(2)}–${(rangeM.p90 * 3.28084).toFixed(2)} ft`}
            </div>
          )}
          <div className="text-xs text-gray-600 dark:text-gray-400">Note: Range reflects sensor jitter during capture.</div>
        </div>
      </div>

      {estimatedDistanceM != null && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
            Estimated distance: ~{units === 'm' ? `${estimatedDistanceM.toFixed(1)} m` : `${(estimatedDistanceM * 3.28084).toFixed(1)} ft`}.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
          Back
        </button>
        <button onClick={onReset} className="px-4 py-2 rounded-lg bg-red-600 text-white">
          Reset
        </button>
        <button onClick={onSaveHistory} className="px-4 py-2 rounded-lg bg-green-600 text-white">
          Save to history
        </button>
      </div>
    </div>
  )
}


