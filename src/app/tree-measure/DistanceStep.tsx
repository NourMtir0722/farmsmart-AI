'use client'

import React from 'react'
import type { Mode } from '@/hooks/useTreeMeasure'

type Props = {
  mode: Mode
  distanceM: number
  setDistanceM: (v: number) => void
  stepsCount: number
  setStepsCount: (v: number) => void
  stepLengthM: number
  setStepLengthM: (v: number) => void
  stepForwardM: number
  setStepForwardM: (v: number) => void
  distanceError: string
  setDistanceError: (v: string) => void
  onContinue: () => void
}

export default function DistanceStep({
  mode,
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
  onContinue,
}: Props) {
  if (mode === 'twoStop') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">Enter your forward step length L between stops.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forward step L (m)</label>
            <input
              type="number"
              min={1}
              step={0.1}
              value={stepForwardM}
              onChange={(e) => {
                const v = Number(e.target.value)
                setStepForwardM(v)
                if (typeof window !== 'undefined') localStorage.setItem('stepForwardM', String(v))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps (count)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={stepsCount}
              onChange={(e) => setStepsCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Step length (m)</label>
            <input
              type="number"
              min={0.2}
              step={0.01}
              value={stepLengthM}
              onChange={(e) => {
                const v = Number(e.target.value)
                setStepLengthM(v)
                if (typeof window !== 'undefined') localStorage.setItem('stepLengthM', String(v))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
            onClick={onContinue}
            disabled={!(stepForwardM >= 1 && stepForwardM <= 25)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
          >
            Continue to Stop 1
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="text-sm text-gray-700 dark:text-gray-300">Pace or enter the distance from your standing point to the tree trunk.</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distance (m)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={distanceM}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDistanceM(v)
              setDistanceError(v >= 3 && v <= 25 ? '' : 'Must be between 3 and 25 m')
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {distanceError && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{distanceError}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps (count)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={stepsCount}
            onChange={(e) => setStepsCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Step length (m)</label>
          <input
            type="number"
            min={0.2}
            step={0.01}
            value={stepLengthM}
            onChange={(e) => {
              const v = Number(e.target.value)
              setStepLengthM(v)
              if (typeof window !== 'undefined') localStorage.setItem('stepLengthM', String(v))
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
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
        <button onClick={onContinue} disabled={!(distanceM >= 3 && distanceM <= 25)} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400">
          Continue
        </button>
      </div>
    </div>
  )
}


