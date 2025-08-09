'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import type { TreeBoundaryResult, ReferenceObject } from '@/lib/measure/vision-detector'

export type VisionOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  boundary?: TreeBoundaryResult | null
  treeBBox?: [number, number, number, number] | null
  referenceObjects?: ReferenceObject[] | null
  confidence?: number | null
  className?: string
}

function getVideoNaturalSize(video: HTMLVideoElement): { width: number; height: number } {
  const width = video.videoWidth || video.clientWidth || 1
  const height = video.videoHeight || video.clientHeight || 1
  return { width, height }
}

// Stable helper outside the component to avoid stale closures and re-creations
function computeBBoxFromBoundary(boundary?: TreeBoundaryResult | null): [number, number, number, number] | null {
  if (!boundary) return null
  const minX = Math.min(boundary.top.x, boundary.base.x)
  const maxX = Math.max(boundary.top.x, boundary.base.x)
  const minY = Math.min(boundary.top.y, boundary.base.y)
  const maxY = Math.max(boundary.top.y, boundary.base.y)
  const padding = Math.max(10, (maxY - minY) * 0.1)
  return [minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2]
}

export function VisionOverlay({
  videoRef,
  boundary,
  treeBBox,
  referenceObjects,
  confidence,
  className,
}: VisionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const dpr = useMemo(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), [])

  const draw = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
 
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)
 
    // Compute scales from natural video to canvas
    const { width: natW, height: natH } = getVideoNaturalSize(video)
    const scaleX = (canvas.width / dpr) / natW
    const scaleY = (canvas.height / dpr) / natH
    const toCanvasX = (x: number) => Math.round(x * scaleX * dpr)
    const toCanvasY = (y: number) => Math.round(y * scaleY * dpr)
 
    // Draw tree bbox
    const bbox = treeBBox ?? computeBBoxFromBoundary(boundary)
    if (bbox) {
      const [x, y, w, h] = bbox
      ctx.strokeStyle = 'rgba(16,185,129,0.95)'
      ctx.lineWidth = 2 * dpr
      ctx.strokeRect(toCanvasX(x), toCanvasY(y), Math.max(1, Math.round(w * scaleX * dpr)), Math.max(1, Math.round(h * scaleY * dpr)))
    }
 
    // Draw top/base points
    if (boundary) {
      drawDot(ctx, toCanvasX(boundary.top.x), toCanvasY(boundary.top.y), 6 * dpr, 'rgba(244,63,94,0.95)') // red
      drawDot(ctx, toCanvasX(boundary.base.x), toCanvasY(boundary.base.y), 6 * dpr, 'rgba(59,130,246,0.95)') // blue
    }
 
    // Draw reference objects
    if (referenceObjects && referenceObjects.length > 0) {
      ctx.lineWidth = 2 * dpr
      for (const ref of referenceObjects) {
        const [x, y, w, h] = ref.bbox
        ctx.strokeStyle = 'rgba(234,179,8,0.95)'
        ctx.strokeRect(toCanvasX(x), toCanvasY(y), Math.max(1, Math.round(w * scaleX * dpr)), Math.max(1, Math.round(h * scaleY * dpr)))
        // Label
        const label = `${ref.class} ${(ref.score * 100).toFixed(0)}%`
        drawLabel(ctx, toCanvasX(x), toCanvasY(y) - 6 * dpr, label)
      }
    }
 
    // Confidence label
    const conf = typeof confidence === 'number' ? confidence : boundary?.confidence
    if (typeof conf === 'number') {
      const text = `Confidence: ${(conf * 100).toFixed(0)}%`
      drawCornerLabel(ctx, text)
    }
  }, [videoRef, dpr, boundary, treeBBox, referenceObjects, confidence])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ensureSize = () => {
      const rect = video.getBoundingClientRect()
      const displayW = Math.max(1, Math.floor(rect.width))
      const displayH = Math.max(1, Math.floor(rect.height))
      const targetW = Math.floor(displayW * dpr)
      const targetH = Math.floor(displayH * dpr)
      const needsResize = canvas.width !== targetW || canvas.height !== targetH
      if (needsResize) {
        canvas.width = targetW
        canvas.height = targetH
        canvas.style.width = `${displayW}px`
        canvas.style.height = `${displayH}px`
      }
      return { displayW, displayH }
    }

    // Initial size
    ensureSize()

    // Observe size changes of the video element
    const obs = new ResizeObserver(() => {
      ensureSize()
      draw()
    })
    obs.observe(video)
    resizeObserverRef.current = obs

    const onWindowResize = () => {
      ensureSize()
      draw()
    }
    window.addEventListener('resize', onWindowResize)

    // draw when video metadata becomes available
    const onLoaded = () => {
      ensureSize()
      draw()
    }
    if (video.readyState >= 2) {
      onLoaded()
    } else {
      video.addEventListener('loadedmetadata', onLoaded, { once: true })
    }

    return () => {
      window.removeEventListener('resize', onWindowResize)
      obs.disconnect()
      resizeObserverRef.current = null
    }
  }, [videoRef, dpr, draw])

  useEffect(() => {
    draw()
  }, [draw])

  function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system`
    const pad = 4 * dpr
    const metrics = ctx.measureText(text)
    const w = metrics.width + pad * 2
    const h = 16 * dpr
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(x, y - h, w, h)
    ctx.fillStyle = '#fff'
    ctx.fillText(text, x + pad, y - 4 * dpr)
  }

  function drawCornerLabel(ctx: CanvasRenderingContext2D, text: string) {
    ctx.font = `${14 * dpr}px ui-sans-serif, system-ui, -apple-system`
    const pad = 6 * dpr
    const metrics = ctx.measureText(text)
    const w = metrics.width + pad * 2
    const h = 22 * dpr
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(pad, ctx.canvas.height - h - pad, w, h)
    ctx.fillStyle = '#fff'
    ctx.fillText(text, pad * 2, ctx.canvas.height - pad - 6 * dpr)
  }

  //

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
    />
  )
}

export default VisionOverlay


