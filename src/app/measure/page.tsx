'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Ruler, Calculator } from 'lucide-react'
import { MeasurementResult } from '@/types/plant-measure'

export default function MeasurePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [referenceObject, setReferenceObject] = useState<string>('Coin')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeasurementResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const referenceObjects = [
    { value: 'Coin', label: 'Coin (2.4cm)', description: 'Standard coin diameter' },
    { value: 'Phone', label: 'Phone (15cm)', description: 'Average smartphone length' },
    { value: 'Hand', label: 'Hand (18cm)', description: 'Average adult hand length' },
    { value: 'Credit Card', label: 'Credit Card (8.5cm)', description: 'Standard credit card length' },
    { value: 'Ruler', label: 'Ruler (30cm)', description: 'Standard ruler length' }
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const handleMeasure = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('referenceObject', referenceObject)

      const response = await fetch('/api/plant-measure', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to measure plant')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (preview) {
      URL.revokeObjectURL(preview)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Size Measurement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Measure your plants accurately using computer vision</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Image</h2>
            
            {!preview ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  or click to select a file
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Place a reference object next to the plant for scale
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Reference Object Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Object
                  </label>
                  <select
                    value={referenceObject}
                    onChange={(e) => setReferenceObject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {referenceObjects.map((obj) => (
                      <option key={obj.value} value={obj.value}>
                        {obj.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {referenceObjects.find(obj => obj.value === referenceObject)?.description}
                  </p>
                </div>

                <button
                  onClick={handleMeasure}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Measuring...</span>
                    </>
                  ) : (
                    <>
                      <Ruler size={16} />
                      <span>Measure Plant</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 dark:text-red-400 font-medium">Error</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Measurement Results</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Height</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {result.height.toFixed(1)} {result.unit}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Width</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {result.width.toFixed(1)} {result.unit}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Estimated Area</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {result.area.toFixed(1)} {result.unit}²
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.referenceObject}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Tips for Better Accuracy</h4>
                  <ul className="space-y-1">
                    <li className="text-green-700 dark:text-green-300 text-sm flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Place the reference object close to the plant</span>
                    </li>
                    <li className="text-green-700 dark:text-green-300 text-sm flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Ensure good lighting and clear visibility</span>
                    </li>
                    <li className="text-green-700 dark:text-green-300 text-sm flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Keep the camera perpendicular to the plant</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 