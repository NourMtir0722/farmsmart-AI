"use client"

import React from 'react'
import { Layout } from '@/components/Layout'
import { useTreeMeasure } from '@/hooks/useTreeMeasure'
import SetupStep from './SetupStep'
import DistanceStep from './DistanceStep'
import CaptureStep from './CaptureStep'
import ResultStep from './ResultStep'

export default function TreeMeasureWizardPage() {
  const tm = useTreeMeasure()

  return (
    <Layout title="Tree Measure (Inclinometer)">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">Portrait only for now. Use HTTPS or localhost. iOS needs a user gesture to grant motion permissions.</div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Mode:</span>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={tm.mode === 'paced'} onChange={() => tm.setMode('paced')} />
            <span>Paced distance (recommended)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={tm.mode === 'baseAngle'} onChange={() => tm.setMode('baseAngle')} />
            <span>Estimate distance from base angle (beta)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={tm.mode === 'twoStop'} onChange={() => tm.setMode('twoStop')} />
            <span>Two-stop (no distance)</span>
          </label>
        </div>

        {tm.step === 'setup' && (
          <SetupStep eyeHeightM={tm.eyeHeightM} setEyeHeightM={tm.setEyeHeightM} error={tm.setupError} setError={tm.setSetupError} onSave={tm.onSaveSetup} />
        )}

        {tm.step === 'distance' && (
          <DistanceStep
            mode={tm.mode}
            distanceM={tm.distanceM}
            setDistanceM={tm.setDistanceM}
            stepsCount={tm.stepsCount}
            setStepsCount={tm.setStepsCount}
            stepLengthM={tm.stepLengthM}
            setStepLengthM={tm.setStepLengthM}
            stepForwardM={tm.stepForwardM}
            setStepForwardM={tm.setStepForwardM}
            distanceError={tm.distanceError}
            setDistanceError={tm.setDistanceError}
            onContinue={() => tm.setStep('top')}
          />
        )}

        {tm.step === 'base' && (
          <CaptureStep
            variant="base"
            supported={tm.supported}
            permission={tm.permission}
            streaming={tm.streaming}
            livePitchDeg={tm.livePitchDeg}
            liveRollDeg={tm.liveRollDeg}
            ensureStreaming={tm.ensureStreaming}
            onCalibrate={tm.onCalibrate}
            baseAngleRad={tm.baseAngleRad}
            topAngleRad={tm.topAngleRad}
            onCaptureBase={tm.onCaptureBase}
            onCaptureTop={tm.onCaptureTop}
            baseTooShallow={tm.baseTooShallow}
            isSteady={tm.isSteady}
            autoCapture={tm.autoCapture}
            setAutoCapture={tm.setAutoCapture}
            captureCooldown={tm.captureCooldown}
            cameraOn={tm.cameraOn}
            setCameraOn={tm.setCameraOn}
            cameraError={tm.cameraError}
            setCameraError={tm.setCameraError}
            onVideoRef={tm.attachVideoElement}
            visionMode={tm.visionMode}
            setVisionMode={tm.setVisionMode}
            visionLoading={tm.visionLoading}
            visionError={tm.visionError}
            visionConfidence={tm.visionConfidence}
            boundary={tm.boundary}
            onCalibrateWithRef={tm.calibrateWithReference}
            onBack={() => tm.setStep('setup')}
          />
        )}

        {tm.step === 'top' && (
          <CaptureStep
            variant="top"
            supported={tm.supported}
            permission={tm.permission}
            streaming={tm.streaming}
            livePitchDeg={tm.livePitchDeg}
            liveRollDeg={tm.liveRollDeg}
            ensureStreaming={tm.ensureStreaming}
            onCalibrate={tm.onCalibrate}
            baseAngleRad={tm.baseAngleRad}
            topAngleRad={tm.topAngleRad}
            onCaptureBase={tm.onCaptureBase}
            onCaptureTop={tm.onCaptureTop}
            baseTooShallow={tm.baseTooShallow}
            isSteady={tm.isSteady}
            autoCapture={tm.autoCapture}
            setAutoCapture={tm.setAutoCapture}
            captureCooldown={tm.captureCooldown}
            cameraOn={tm.cameraOn}
            setCameraOn={tm.setCameraOn}
            cameraError={tm.cameraError}
            setCameraError={tm.setCameraError}
            onVideoRef={tm.attachVideoElement}
            visionMode={tm.visionMode}
            setVisionMode={tm.setVisionMode}
            visionLoading={tm.visionLoading}
            visionError={tm.visionError}
            visionConfidence={tm.visionConfidence}
            boundary={tm.boundary}
            onCalibrateWithRef={tm.calibrateWithReference}
            onBack={() => tm.setStep(tm.mode === 'paced' ? 'distance' : 'base')}
            onContinueTwoStop={(captured) => {
              if (tm.mode === 'twoStop') {
                if (tm.twoStopAngle1Rad == null && captured != null) {
                  tm.setTwoStopAngle1Rad(captured)
                  tm.setStep('top2')
                } else {
                  tm.setStep('top2')
                }
              }
            }}
          />
        )}

        {tm.step === 'top2' && tm.mode === 'twoStop' && (
          <CaptureStep
            variant="top2"
            supported={tm.supported}
            permission={tm.permission}
            streaming={tm.streaming}
            livePitchDeg={tm.livePitchDeg}
            liveRollDeg={tm.liveRollDeg}
            ensureStreaming={tm.ensureStreaming}
            onCalibrate={tm.onCalibrate}
            baseAngleRad={tm.baseAngleRad}
            topAngleRad={tm.topAngleRad}
            onCaptureBase={tm.onCaptureBase}
            onCaptureTop={() => {
              const angle = tm.onCaptureTop()
              tm.finalizeTwoStop(angle)
              return angle
            }}
            baseTooShallow={tm.baseTooShallow}
            isSteady={tm.isSteady}
            autoCapture={tm.autoCapture}
            setAutoCapture={tm.setAutoCapture}
            captureCooldown={tm.captureCooldown}
            cameraOn={tm.cameraOn}
            setCameraOn={tm.setCameraOn}
            cameraError={tm.cameraError}
            setCameraError={tm.setCameraError}
            onVideoRef={tm.attachVideoElement}
            visionMode={tm.visionMode}
            setVisionMode={tm.setVisionMode}
            visionLoading={tm.visionLoading}
            visionError={tm.visionError}
            visionConfidence={tm.visionConfidence}
            boundary={tm.boundary}
            onBack={() => tm.setStep('top')}
          />
        )}

        {tm.step === 'result' && (
          <ResultStep
            eyeHeightM={tm.eyeHeightM}
            baseAngleRad={tm.baseAngleRad}
            topAngleRad={tm.topAngleRad}
            baseSdRad={tm.baseSdRad}
            topSdRad={tm.topSdRad}
            resultM={tm.resultM}
            rangeM={tm.rangeM}
            units={tm.units}
            setUnits={tm.setUnits}
            estimatedDistanceM={tm.estimatedDistanceM}
            basePhoto={tm.basePhoto}
            topPhoto={tm.topPhoto}
            visionConfidence={tm.visionConfidence}
            pxPerMeter={tm.pxPerMeter}
            boundary={tm.boundary}
            fusedVisionHeightM={tm.visionHeightM}
            onBack={() => tm.setStep('top')}
            onReset={tm.onReset}
            onSaveHistory={tm.saveToHistory}
          />
        )}

        {tm.history.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">History</h3>
              <button onClick={tm.clearHistory} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm">Clear history</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tm.history.map((r, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {r.topImg || r.baseImg ? (
                    <img src={(r.topImg || r.baseImg)!} alt="thumb" className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 grid place-items-center text-gray-500 dark:text-gray-400 text-sm">No photo</div>
                  )}
                  <div className="p-3 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <div>{new Date(r.timestamp).toLocaleString()}</div>
                    <div>Mode: {r.mode}</div>
                    {'distanceM' in r && r.distanceM != null && <div>Distance: {r.distanceM.toFixed(1)} m</div>}
                    <div>
                      Height: {r.resultM.toFixed(2)} m
                      {r.p10 != null && r.p90 != null ? ` (≈${r.p10.toFixed(2)}–${r.p90.toFixed(2)} m)` : ''}
                    </div>
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


