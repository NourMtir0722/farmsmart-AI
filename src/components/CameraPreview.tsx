'use client'

import { useCallback, useEffect, useRef } from 'react'

export type CameraPreviewProps = {
  active: boolean
  className?: string
  onVideoRef?: (el: HTMLVideoElement | null) => void
  onError?: (message: string | null) => void
}

export function CameraPreview({ active, className, onVideoRef, onError }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
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
  }, [])

  const startCamera = useCallback(async () => {
    try {
      onError?.(null)
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
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
        } catch {}
      }
      if (video.readyState >= 2) {
        await tryPlay()
      } else {
        video.onloadedmetadata = async () => {
          await tryPlay()
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('camera error', err)
      onError?.('Camera unavailable or permission denied.')
    }
  }, [onError, stopCamera])

  useEffect(() => {
    if (onVideoRef) onVideoRef(videoRef.current)
  }, [onVideoRef])

  useEffect(() => {
    if (active) {
      void startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [active, startCamera, stopCamera])

  return (
    <video ref={videoRef} className={className ?? ''} playsInline muted autoPlay />
  )
}

export default CameraPreview


