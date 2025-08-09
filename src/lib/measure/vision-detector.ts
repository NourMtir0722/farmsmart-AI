// src/lib/measure/vision-detector.ts
// A lightweight utility to initialize TensorFlow.js models and OpenCV.js in the browser

import type * as TF from '@tensorflow/tfjs';
import type * as CocoSsdNS from '@tensorflow-models/coco-ssd';
import type * as MobilenetNS from '@tensorflow-models/mobilenet';
// Avoid importing OpenCV at build-time on the server; load dynamically in browser.

export type VisionDetectorState = 'idle' | 'loading' | 'ready' | 'error';

export type VisionInitOptions = {
  loadCocoSsd?: boolean;
  loadMobilenet?: boolean;
  loadOpenCV?: boolean;
  // coco-ssd specific options
  cocoSsdBase?: 'lite_mobilenet_v2' | 'mobilenet_v1' | 'mobilenet_v2';
};

export type DetectionResult = {
  bbox: [number, number, number, number];
  class: string;
  score: number;
};

export type ClassificationResult = {
  className: string;
  probability: number;
};

export type Point2D = { x: number; y: number };

export type TreeBoundaryResult = {
  top: Point2D;
  base: Point2D;
  confidence: number; // 0..1
};

export type ReferenceObject = {
  class: 'person' | 'car' | 'bicycle';
  bbox: [number, number, number, number];
  score: number;
};

/**
 * VisionDetector is a thin orchestrator around TensorFlow.js models and OpenCV.js.
 * - Lazy-loads tfjs, coco-ssd, mobilenet on demand in the browser only
 * - Initializes OpenCV.js and waits for WASM runtime
 * - Provides simple detect/classify APIs with robust state and error handling
 */
export class VisionDetector {
  private state: VisionDetectorState = 'idle';
  private lastError: Error | undefined;

  private tfModule: typeof TF | undefined;
  private cocoModule: typeof CocoSsdNS | undefined;
  private mobilenetModule: typeof MobilenetNS | undefined;

  private cocoModel: CocoSsdNS.ObjectDetection | undefined;
  private mobilenetModel: MobilenetNS.MobileNet | undefined;

  private cvModule: unknown | undefined;
  private loadingPromise: Promise<void> | undefined;

  getState(): VisionDetectorState { return this.state; }
  getLastError(): Error | undefined { return this.lastError; }
  isReady(): boolean { return this.state === 'ready'; }
  get tf(): typeof TF | undefined { return this.tfModule; }
  get cv(): unknown | undefined { return this.cvModule; }

  /** Initialize requested components. Safe to call multiple times. */
  async initialize(options?: VisionInitOptions): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;

    const opts: Required<VisionInitOptions> = {
      loadCocoSsd: options?.loadCocoSsd ?? true,
      loadMobilenet: options?.loadMobilenet ?? true,
      loadOpenCV: options?.loadOpenCV ?? true,
      cocoSsdBase: options?.cocoSsdBase ?? 'lite_mobilenet_v2',
    } as const;

    // If everything requested is already loaded, exit early
    const needsWork = (!this.tfModule)
      || (opts.loadCocoSsd && !this.cocoModel)
      || (opts.loadMobilenet && !this.mobilenetModel)
      || (opts.loadOpenCV && !this.cvModule);
    if (!needsWork) return;

    this.state = 'loading';
    this.lastError = undefined;

    this.loadingPromise = (async () => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('VisionDetector can only be initialized in the browser');
        }

        // 1) Load TensorFlow.js core first
        if (!this.tfModule) {
          const tf = (await import('@tensorflow/tfjs')).default ?? (await import('@tensorflow/tfjs'));
          // Some bundlers exporttf both default and named; normalize
          // eslint-disable-next-line @typescript-eslint/consistent-type-imports
          this.tfModule = (tf as unknown as typeof import('@tensorflow/tfjs'));
          await this.tfModule.ready();
        }

        // 2) Load requested TF models in parallel
        const modelLoads: Array<Promise<unknown>> = [];

        if (opts.loadCocoSsd && !this.cocoModel) {
          const p = (async () => {
            this.cocoModule = await import('@tensorflow-models/coco-ssd');
            this.cocoModel = await this.cocoModule.load({ base: opts.cocoSsdBase });
          })();
          modelLoads.push(p);
        }

        if (opts.loadMobilenet && !this.mobilenetModel) {
          const p = (async () => {
            this.mobilenetModule = await import('@tensorflow-models/mobilenet');
            // version/alpha left default for now
            this.mobilenetModel = await this.mobilenetModule.load();
          })();
          modelLoads.push(p);
        }

        // 3) Initialize OpenCV.js (optional)
        if (opts.loadOpenCV && !this.cvModule) {
          const cv = (await import('@techstark/opencv-js')).default as unknown;
          // Prefer cv.ready promise if available; otherwise fallback to onRuntimeInitialized
          const readyPromise: Promise<void> = (cv as { ready?: Promise<void> }).ready
            ? (cv as { ready: Promise<void> }).ready
            : new Promise<void>((resolve) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (cv as any).onRuntimeInitialized = () => resolve();
              });
          await readyPromise;
          this.cvModule = cv;
        }

        // Wait for model loads if any
        if (modelLoads.length > 0) {
          await Promise.all(modelLoads);
        }

        this.state = 'ready';
      } catch (err) {
        this.state = 'error';
        this.lastError = err instanceof Error ? err : new Error(String(err));
        throw this.lastError;
      } finally {
        this.loadingPromise = undefined;
      }
    })();

    return this.loadingPromise;
  }

  /** Run object detection with COCO-SSD. Returns empty array if model not loaded. */
  async detect(
    input: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | TF.Tensor3D,
    minScore = 0.2
  ): Promise<DetectionResult[]> {
    if (!this.cocoModel) return [];
    const predictions = await this.cocoModel.detect(input as unknown as TF.Tensor3D);
    return predictions
      .filter(p => (p.score ?? 0) >= minScore)
      .map(p => ({ bbox: p.bbox as [number, number, number, number], class: p.class, score: p.score ?? 0 }));
  }

  /** Run image classification with MobileNet. Returns empty array if model not loaded. */
  async classify(
    input: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | TF.Tensor3D,
    topK = 5
  ): Promise<ClassificationResult[]> {
    if (!this.mobilenetModel) return [];
    const results = await this.mobilenetModel.classify(input as unknown as TF.Tensor3D, topK);
    return results.map(r => ({ className: r.className, probability: r.probability }));
  }

  /** Dispose loaded models to free GPU/CPU memory. */
  dispose(): void {
    try {
      if (this.cocoModel && (this.cocoModel as unknown as { dispose?: () => void }).dispose) {
        (this.cocoModel as unknown as { dispose: () => void }).dispose();
      }
      // mobilenet model exposes dispose
      if (this.mobilenetModel && (this.mobilenetModel as unknown as { dispose?: () => void }).dispose) {
        (this.mobilenetModel as unknown as { dispose: () => void }).dispose();
      }
      // Ensure TF variables and internal tensors are released to prevent GPU memory leaks
      if (this.tfModule && typeof this.tfModule.disposeVariables === 'function') {
        this.tfModule.disposeVariables();
      }
    } finally {
      this.cocoModel = undefined;
      this.mobilenetModel = undefined;
    }
  }

  // --- API required by spec ---

  /**
   * Explicitly load COCO-SSD model. Safe to call multiple times.
   */
  async loadModels(): Promise<void> {
    // Delegate to initialize with specific flags to avoid duplication
    return this.initialize({ loadCocoSsd: true, loadMobilenet: false, loadOpenCV: false });
  }

  /**
   * Run object detection on an image or video element using COCO-SSD.
   */
  async detectObjects(
    imageElement: HTMLImageElement | HTMLVideoElement,
    minScore = 0.2
  ): Promise<DetectionResult[]> {
    if (!this.cocoModel) {
      await this.loadModels();
    }
    try {
      const preds = await this.cocoModel!.detect(imageElement as unknown as TF.Tensor3D);
      return preds
        .filter(p => (p.score ?? 0) >= minScore)
        .map(p => ({ bbox: p.bbox as [number, number, number, number], class: p.class, score: p.score ?? 0 }));
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error(String(err));
      throw this.lastError;
    }
  }

  /**
   * Estimate tree top and base using simple canvas-based edge detection (Sobel) and band analysis.
   */
  async findTreeBoundaries(
    imageElement: HTMLImageElement | HTMLVideoElement
  ): Promise<TreeBoundaryResult> {
    try {
      const { canvas, width, height, scaleX, scaleY } = this.createWorkingCanvas(imageElement, 320);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.drawImage(imageElement, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Grayscale
      const gray = new Float32Array(width * height);
      const src = imageData.data;
      for (let i = 0, p = 0; i < src.length; i += 4, p++) {
        const r = src[i] ?? 0;
        const g = src[i + 1] ?? 0;
        const b = src[i + 2] ?? 0;
        gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      // Sobel kernels
      const sobelGx = new Float32Array(width * height);
      const sobelGy = new Float32Array(width * height);
      const mag = new Float32Array(width * height);

      const kx = [
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1,
      ];
      const ky = [
        -1, -2, -1,
         0,  0,  0,
         1,  2,  1,
      ];

      const clampXY = (x: number, y: number) => {
        if (x < 0) x = 0; else if (x >= width) x = width - 1;
        if (y < 0) y = 0; else if (y >= height) y = height - 1;
        return (y * width + x);
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let gx = 0;
          let gy = 0;
          // 3x3 neighborhood
          for (let kyIdx = -1; kyIdx <= 1; kyIdx++) {
            for (let kxIdx = -1; kxIdx <= 1; kxIdx++) {
              const pIdx = clampXY(x + kxIdx, y + kyIdx);
              const kIndex = (kyIdx + 1) * 3 + (kxIdx + 1);
              const val = gray[pIdx] ?? 0;
              const kxVal = (kIndex >= 0 && kIndex < kx.length) ? (kx[kIndex] ?? 0) : 0;
              const kyVal = (kIndex >= 0 && kIndex < ky.length) ? (ky[kIndex] ?? 0) : 0;
              gx += val * kxVal;
              gy += val * kyVal;
            }
          }
          const idx = y * width + x;
          sobelGx[idx] = gx;
          sobelGy[idx] = gy;
          mag[idx] = Math.hypot(gx, gy);
        }
      }

      // Compute threshold as ~75th percentile of non-zero magnitudes
      const hist = new Uint32Array(256);
      let nonZeroCount = 0;
      let maxMag = 0;
      for (let i = 0; i < mag.length; i++) {
        const m = mag[i] ?? 0;
        if (m <= 0) continue;
        nonZeroCount++;
        if (m > maxMag) maxMag = m;
      }
      const scale = maxMag > 0 ? 255 / maxMag : 0;
      for (let i = 0; i < mag.length; i++) {
        const m = mag[i] ?? 0;
        if (m <= 0) continue;
        const bin = Math.max(0, Math.min(255, Math.floor(m * scale)));
        hist[bin] = ((hist[bin] ?? 0) + 1) >>> 0;
      }
      const target = Math.floor(nonZeroCount * 0.75);
      let acc = 0;
      let thresholdBin = 128;
      for (let b = 0; b < 256; b++) {
        acc += (hist[b] ?? 0);
        if (acc >= target) { thresholdBin = b; break; }
      }
      const threshold = thresholdBin / 255 * maxMag;

      // Edge map boolean, using vertical-edge emphasis via |Gx|
      const edge = new Uint8Array(width * height);
      for (let i = 0; i < edge.length; i++) {
        const verticalMag = Math.abs(sobelGx[i] ?? 0);
        edge[i] = verticalMag >= threshold ? 1 : 0;
      }

      // Row-wise edge density
      const rowCounts = new Float32Array(height);
      for (let y = 0; y < height; y++) {
        let cnt = 0;
        const rowOff = y * width;
        for (let x = 0; x < width; x++) cnt += (edge[rowOff + x] ?? 0);
        rowCounts[y] = cnt / width; // density 0..1
      }

      // Find the longest contiguous band of rows with density >= 5%
      const minDensity = 0.05;
      let bestStart = 0, bestEnd = -1, curStart = -1;
      for (let y = 0; y < height; y++) {
        if ((rowCounts[y] ?? 0) >= minDensity) {
          if (curStart === -1) curStart = y;
        } else {
          if (curStart !== -1) {
            if (y - 1 - curStart > bestEnd - bestStart) { bestStart = curStart; bestEnd = y - 1; }
            curStart = -1;
          }
        }
      }
      if (curStart !== -1 && (height - 1 - curStart > bestEnd - bestStart)) {
        bestStart = curStart; bestEnd = height - 1;
      }

      if (bestEnd <= bestStart) {
        return { top: { x: 0, y: 0 }, base: { x: 0, y: 0 }, confidence: 0 };
      }

      // Compute representative x at top and base as average x of edge pixels within a small window
      const window = Math.max(3, Math.floor((bestEnd - bestStart + 1) * 0.05));
      const computeAvgX = (yFrom: number, yTo: number): number => {
        let sumX = 0, n = 0;
        for (let y = yFrom; y <= yTo; y++) {
          const rowOff = y * width;
          for (let x = 0; x < width; x++) {
            if (edge[rowOff + x]) { sumX += x; n++; }
          }
        }
        return n > 0 ? sumX / n : width / 2;
      };

      const topY = bestStart;
      const baseY = bestEnd;
      const topX = computeAvgX(topY, Math.min(height - 1, topY + window));
      const baseX = computeAvgX(Math.max(0, baseY - window), baseY);

      // Confidence: combination of band coverage and average density
      let densitySum = 0;
      for (let y = bestStart; y <= bestEnd; y++) densitySum += (rowCounts[y] ?? 0);
      const avgDensity = densitySum / Math.max(1, bestEnd - bestStart + 1);
      const coverage = (bestEnd - bestStart + 1) / height;
      const confidence = Math.max(0, Math.min(1, 0.5 * coverage + 0.5 * (avgDensity / 0.2)));

      return {
        top:  { x: topX * scaleX,  y: topY * scaleY },
        base: { x: baseX * scaleX, y: baseY * scaleY },
        confidence,
      };
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error(String(err));
      return { top: { x: 0, y: 0 }, base: { x: 0, y: 0 }, confidence: 0 };
    }
  }

  /**
   * Filter predictions to return known reference objects for relative sizing.
   */
  detectReferenceObjects(predictions: DetectionResult[]): ReferenceObject[] {
    const allowed: Array<ReferenceObject['class']> = ['person', 'car', 'bicycle'];
    return predictions
      .filter(p => allowed.includes(p.class as ReferenceObject['class']))
      .map(p => ({ class: p.class as ReferenceObject['class'], bbox: p.bbox, score: p.score }));
  }

  // Helpers
  private createWorkingCanvas(
    src: HTMLImageElement | HTMLVideoElement,
    maxWidth: number
  ): { canvas: HTMLCanvasElement; width: number; height: number; scaleX: number; scaleY: number } {
    const naturalWidth = 'videoWidth' in src ? (src as HTMLVideoElement).videoWidth : (src as HTMLImageElement).naturalWidth || src.width;
    const naturalHeight = 'videoHeight' in src ? (src as HTMLVideoElement).videoHeight : (src as HTMLImageElement).naturalHeight || src.height;
    const scale = naturalWidth > maxWidth ? maxWidth / naturalWidth : 1;
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const scaleX = naturalWidth / width;
    const scaleY = naturalHeight / height;
    return { canvas, width, height, scaleX, scaleY };
  }
}


