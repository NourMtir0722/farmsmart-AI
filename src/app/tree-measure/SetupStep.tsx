'use client'

import React from 'react'

type Props = {
  eyeHeightM: number
  setEyeHeightM: (v: number) => void
  error: string
  setError: (v: string) => void
  onSave: () => void
}

export default function SetupStep({ eyeHeightM, setEyeHeightM, error, setError, onSave }: Props) {
  return (
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
            if (v >= 0.5 && v <= 2.2) setError('')
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {error && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onSave} disabled={eyeHeightM < 0.5 || eyeHeightM > 2.2} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400">
          Save & Continue
        </button>
      </div>
    </div>
  )
}


