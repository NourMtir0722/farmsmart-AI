'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Ruler, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

interface MeasurementResult {
  height: number
  width: number
  area: number
  unit: string
  referenceObject: string
  confidence: number
}

export default function MeasurePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeasurementResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [referenceObject, setReferenceObject] = useState('coin')

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
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    multiple: false,
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to measure plant')
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
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Measure</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Measure plant dimensions using computer vision</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
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
                    Supports: JPEG, PNG, WebP
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
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reference Object
                      </label>
                      <select
                        value={referenceObject}
                        onChange={(e) => setReferenceObject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="coin">Coin (2.4cm)</option>
                        <option value="phone">Phone (15cm)</option>
                        <option value="hand">Hand (18cm)</option>
                        <option value="credit-card">Credit Card (8.5cm)</option>
                        <option value="ruler">Ruler (30cm)</option>
                      </select>
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
                          <Ruler className="h-4 w-4" />
                          <span>Measure Plant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
                    <p className="text-red-600 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Ruler className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Measurement Results</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {result.height.toFixed(1)} {result.unit}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Width</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {result.width.toFixed(1)} {result.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Area</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {result.area.toFixed(1)} {result.unit}²
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Reference Object:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{result.referenceObject}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Confidence:</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {result.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 