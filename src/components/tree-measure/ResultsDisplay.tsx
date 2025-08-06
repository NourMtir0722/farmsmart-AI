'use client'

interface ResultsDisplayProps {
  treeHeight: number | null
  baseAngle: number | null
  topAngle: number | null
  onCalculate: () => void
  onSave: () => void
}

export function ResultsDisplay({
  treeHeight,
  baseAngle,
  topAngle,
  onCalculate,
  onSave
}: ResultsDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Results
      </h2>
      
      {/* Calculate Button */}
      <div className="mb-6">
        <button
          onClick={onCalculate}
          disabled={!baseAngle || !topAngle}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            baseAngle && topAngle
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Calculate Tree Height
        </button>
      </div>

      {/* Results Display */}
      {treeHeight !== null && (
        <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-4xl mb-2">🌳</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {treeHeight.toFixed(1)} meters
          </div>
          <div className="text-xl font-semibold text-green-700 dark:text-green-300 mb-3">
            {(treeHeight * 3.281).toFixed(1)} feet
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            ±5% margin of error
          </p>
          <button
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Save Measurement
          </button>
        </div>
      )}

      {/* Instructions */}
      {!treeHeight && (
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Capture both base and top angles to calculate tree height
        </p>
      )}
    </div>
  )
} 