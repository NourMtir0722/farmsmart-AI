// src/lib/measure/vision-detector.ts
// A lightweight utility to initialize TensorFlow.js models and OpenCV.js in the browser

// Type-only imports so the models aren't bundled into the client by default
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

// --- New types for auto scale calibration ---

export type KnownObjectType = 'door' | 'person' | 'window' | 'car';

export type KnownObject = {
  type: KnownObjectType;
  bbox: [number, number, number, number];
  confidence: number; // detector confidence 0..1
  // Expected real-world height range (meters)
  expectedHeightMRange: [number, number];
  // Estimated real-world height chosen within the typical range, used for calibration
  estimatedHeightM: number;
  // Aggregate score 0..1 combining detection confidence, edge clarity, and reference availability
  score: number;
  // Optional edge clarity score for the current frame 0..1
  edgeClarity?: number;
};

export type CalibrationData = {
  // Pixels per one meter at the current camera configuration
  pxPerMeter: number;
  // Object used for calibration
  object: KnownObject;
  // Aggregate confidence/quality score for this calibration 0..1
  score: number;
  // Epoch ms when calibration was computed
  timestamp: number;
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
  private calibrationData: CalibrationData | undefined;
  private lastVerticalLines: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }> = [];
  private lastVanishingPoint: { x: number; y: number } | null = null;
  private perspectiveGridEnabled = false;

  getState(): VisionDetectorState { return this.state; }
  getLastError(): Error | undefined { return this.lastError; }
  isReady(): boolean { return this.state === 'ready'; }
  get tf(): typeof TF | undefined { return this.tfModule; }
  get cv(): unknown | undefined { return this.cvModule; }
  get calibration(): CalibrationData | undefined { return this.calibrationData; }
  setPerspectiveGridEnabled(on: boolean): void { this.perspectiveGridEnabled = !!on; }
  getLastPerspectiveInfo(): { lines: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }>; vanishingPoint: { x: number; y: number } | null } {
    return { lines: this.lastVerticalLines, vanishingPoint: this.lastVanishingPoint };
  }

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
          const imported = await import('@tensorflow/tfjs');
          // Normalize between default and named exports without re-importing
          const tf = (imported as unknown as { default?: typeof TF })?.default ?? (imported as unknown as typeof TF);
          this.tfModule = tf as unknown as typeof import('@tensorflow/tfjs');
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
    try {
      const predictions = await this.cocoModel.detect(input as unknown as TF.Tensor3D);
      return predictions
        .filter(p => (p.score ?? 0) >= minScore)
        .map(p => ({ bbox: p.bbox as [number, number, number, number], class: p.class, score: p.score ?? 0 }));
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error(String(err));
      return [];
    }
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
      // OpenCV WASM heap cleanup if available
      try {
        const cvAny = this.cvModule as unknown as { destroy?: () => void } | undefined;
        if (cvAny && typeof cvAny.destroy === 'function') {
          cvAny.destroy();
        }
      } catch {
        // best-effort; ignore errors
      }
      // Ensure TF variables and internal tensors are released to prevent GPU memory leaks
      if (this.tfModule && typeof this.tfModule.disposeVariables === 'function') {
        this.tfModule.disposeVariables();
      }
      // Fully reset / dispose the TFJS backend to reclaim GPU/WASM resources
      if (this.tfModule) {
        const tfAny = this.tfModule as unknown as {
          backend?: (() => { dispose?: () => void }) | unknown;
          disposeVariables?: () => void;
        };
        try {
          if (typeof tfAny.backend === 'function') {
            const backendInstance = tfAny.backend();
            if (backendInstance && typeof (backendInstance as { dispose?: () => void }).dispose === 'function') {
              (backendInstance as { dispose: () => void }).dispose();
            }
          }
        } catch {
          // Best-effort cleanup; ignore backend disposal errors
        }
      }
    } finally {
      this.cocoModel = undefined;
      this.mobilenetModel = undefined;
      this.cvModule = undefined;
      this.state = 'idle';
      this.calibrationData = undefined;
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

      // Optional perspective correction if OpenCV is available and vertical lines are detected
      const correction = await this.correctPerspective(canvas);
      const sourceForEdge = correction?.correctedCanvas ?? canvas;
      const srcCtx = sourceForEdge.getContext('2d');
      if (!srcCtx) throw new Error('Canvas 2D context not available');
      const imageData = srcCtx.getImageData(0, 0, sourceForEdge.width, sourceForEdge.height);

      // Grayscale
      const gray = new Float32Array(sourceForEdge.width * sourceForEdge.height);
      const src = imageData.data;
      for (let i = 0, p = 0; i < src.length; i += 4, p++) {
        const r = src[i] ?? 0;
        const g = src[i + 1] ?? 0;
        const b = src[i + 2] ?? 0;
        gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      // Sobel kernels
      const sobelGx = new Float32Array(sourceForEdge.width * sourceForEdge.height);
      const sobelGy = new Float32Array(sourceForEdge.width * sourceForEdge.height);
      const mag = new Float32Array(sourceForEdge.width * sourceForEdge.height);

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
        if (x < 0) x = 0; else if (x >= sourceForEdge.width) x = sourceForEdge.width - 1;
        if (y < 0) y = 0; else if (y >= sourceForEdge.height) y = sourceForEdge.height - 1;
        return (y * sourceForEdge.width + x);
      };

      for (let y = 0; y < sourceForEdge.height; y++) {
        for (let x = 0; x < sourceForEdge.width; x++) {
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
          const idx = y * sourceForEdge.width + x;
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
      const edge = new Uint8Array(sourceForEdge.width * sourceForEdge.height);
      for (let i = 0; i < edge.length; i++) {
        const verticalMag = Math.abs(sobelGx[i] ?? 0);
        edge[i] = verticalMag >= threshold ? 1 : 0;
      }

      // Row-wise edge density
      const rowCounts = new Float32Array(sourceForEdge.height);
      for (let y = 0; y < sourceForEdge.height; y++) {
        let cnt = 0;
        const rowOff = y * sourceForEdge.width;
        for (let x = 0; x < sourceForEdge.width; x++) cnt += (edge[rowOff + x] ?? 0);
        rowCounts[y] = cnt / sourceForEdge.width; // density 0..1
      }

      // Find the longest contiguous band of rows with density >= 5%
      const minDensity = 0.05;
      let bestStart = 0, bestEnd = -1, curStart = -1;
      for (let y = 0; y < sourceForEdge.height; y++) {
        if ((rowCounts[y] ?? 0) >= minDensity) {
          if (curStart === -1) curStart = y;
        } else {
          if (curStart !== -1) {
            if (y - 1 - curStart > bestEnd - bestStart) { bestStart = curStart; bestEnd = y - 1; }
            curStart = -1;
          }
        }
      }
      if (curStart !== -1 && (sourceForEdge.height - 1 - curStart > bestEnd - bestStart)) {
        bestStart = curStart; bestEnd = sourceForEdge.height - 1;
      }

      if (bestEnd <= bestStart) {
        return { top: { x: 0, y: 0 }, base: { x: 0, y: 0 }, confidence: 0 };
      }

      // Compute representative x at top and base as average x of edge pixels within a small window
      const window = Math.max(3, Math.floor((bestEnd - bestStart + 1) * 0.05));
      const computeAvgX = (yFrom: number, yTo: number): number => {
        let sumX = 0, n = 0;
        for (let y = yFrom; y <= yTo; y++) {
          const rowOff = y * sourceForEdge.width;
          for (let x = 0; x < sourceForEdge.width; x++) {
            if (edge[rowOff + x]) { sumX += x; n++; }
          }
        }
        return n > 0 ? sumX / n : sourceForEdge.width / 2;
      };

      const topY = bestStart;
      const baseY = bestEnd;
      const topX = computeAvgX(topY, Math.min(height - 1, topY + window));
      const baseX = computeAvgX(Math.max(0, baseY - window), baseY);

      // Confidence: combination of band coverage and average density
      let densitySum = 0;
      for (let y = bestStart; y <= bestEnd; y++) densitySum += (rowCounts[y] ?? 0);
      const avgDensity = densitySum / Math.max(1, bestEnd - bestStart + 1);
      const coverage = (bestEnd - bestStart + 1) / sourceForEdge.height;
      const confidence = Math.max(0, Math.min(1, 0.5 * coverage + 0.5 * (avgDensity / 0.2)));

      return {
        top:  { x: topX * scaleX,  y: topY * scaleY },
        base: { x: baseX * scaleX, y: baseY * scaleY },
        confidence: Math.max(0, Math.min(1, this.boostConfidenceWithCalibration(confidence))),
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

  /**
   * Correct perspective by detecting near-vertical lines and warping the image so those lines become parallel.
   * Uses OpenCV.js when available. Returns the corrected canvas and overlay information.
   */
  async correctPerspective(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<{
    correctedCanvas: HTMLCanvasElement;
    transform: number[]; // 3x3 homography row-major
    lines: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }>;
    vanishingPoint: { x: number; y: number } | null;
  } | null> {
    const cv: any = this.cvModule;
    if (!cv) return null;

    // Normalize input to canvas
    let srcCanvas: HTMLCanvasElement;
    if (input instanceof HTMLCanvasElement) {
      srcCanvas = input;
    } else {
      const { canvas, width, height } = this.createWorkingCanvas(input, 320);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(input, 0, 0, width, height);
      srcCanvas = canvas;
    }

    // Prepare mats
    const srcMat = cv.imread(srcCanvas);
    try {
      const gray = new cv.Mat();
      cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
      const edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150, 3, false);
      const linesP = new cv.Mat();
      // Hough parameters tuned for small canvas
      cv.HoughLinesP(edges, linesP, 1, Math.PI / 180, 40, 40, 10);

      const height = srcCanvas.height, width = srcCanvas.width;
      const nearVertical: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }> = [];
      for (let i = 0; i < linesP.rows; ++i) {
        const [x1, y1, x2, y2] = linesP.intPtr(i) as unknown as [number, number, number, number];
        const dx = x2 - x1; const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        if (length < 30) continue;
        const slope = Math.abs(dx) / Math.max(1, Math.abs(dy));
        if (slope < Math.tan(15 * Math.PI / 180)) { // within ~15° of vertical
          const score = length / Math.max(width, height);
          nearVertical.push({ x1, y1, x2, y2, score });
        }
      }

      // Keep top two by score
      nearVertical.sort((a, b) => b.score - a.score);
      const selected = nearVertical.slice(0, 2);
      this.lastVerticalLines = selected;

      // Compute vanishing point from all pairs
      this.lastVanishingPoint = this.computeVanishingPoint(selected);

      if (selected.length < 2) {
        gray.delete(); edges.delete(); linesP.delete();
        return null; // not enough info to rectify
      }

      // Intersections with top (y=0) and bottom (y=H-1)
      if (selected.length < 2) {
        gray.delete(); edges.delete(); linesP.delete();
        return null;
      }
      const [L, R] = selected[0].x1 < selected[1].x1 ? [selected[0], selected[1]] : [selected[1], selected[0]];
      const leftTop = this.lineIntersectY(L, 0);
      const leftBottom = this.lineIntersectY(L, height - 1);
      const rightTop = this.lineIntersectY(R, 0);
      const rightBottom = this.lineIntersectY(R, height - 1);

      // Validate coordinates fall within extended bounds
      if (!leftTop || !leftBottom || !rightTop || !rightBottom) {
        gray.delete(); edges.delete(); linesP.delete();
        return null;
      }

      // Perspective transform from trapezoid -> rectangle (width x height)
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        leftTop.x, leftTop.y,
        rightTop.x, rightTop.y,
        rightBottom.x, rightBottom.y,
        leftBottom.x, leftBottom.y,
      ]);
      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        width - 1, 0,
        width - 1, height - 1,
        0, height - 1,
      ]);
      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      const dst = new cv.Mat();
      const dsize = new cv.Size(width, height);
      cv.warpPerspective(srcMat, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_REPLICATE, new cv.Scalar());

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width; outCanvas.height = height;
      cv.imshow(outCanvas, dst);

      // Extract homography matrix values (row-major)
      const transform: number[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) transform.push(M.doubleAt(r, c));
      }

      // Cleanup
      gray.delete(); edges.delete(); linesP.delete(); srcTri.delete(); dstTri.delete(); M.delete(); dst.delete();

      return { correctedCanvas: outCanvas, transform, lines: selected, vanishingPoint: this.lastVanishingPoint };
    } catch {
      return null;
    } finally {
      srcMat.delete();
    }
  }

  private lineIntersectY(line: { x1: number; y1: number; x2: number; y2: number }, y: number): { x: number; y: number } | null {
    const { x1, y1, x2, y2 } = line;
    const dy = y2 - y1; const dx = x2 - x1;
    if (Math.abs(dy) < 1e-6) return null;
    const t = (y - y1) / dy;
    const x = x1 + t * dx;
    return { x, y };
  }

  private computeVanishingPoint(lines: Array<{ x1: number; y1: number; x2: number; y2: number }>): { x: number; y: number } | null {
    if (lines.length < 2) return null;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const p = this.lineIntersection(lines[i], lines[j]);
        if (p) pts.push(p);
      }
    }
    if (pts.length === 0) return null;
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    return { x, y };
  }

  private lineIntersection(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }): { x: number; y: number } | null {
    const x1 = a.x1, y1 = a.y1, x2 = a.x2, y2 = a.y2;
    const x3 = b.x1, y3 = b.y1, x4 = b.x2, y4 = b.y2;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-6) return null;
    const px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
    const py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;
    return { x: px, y: py };
  }

  /** Draw detected vertical lines and an optional perspective grid overlay on a canvas context. */
  renderPerspectiveOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options?: { showGrid?: boolean }
  ): void {
    const lines = this.lastVerticalLines;
    const vp = this.lastVanishingPoint;
    ctx.save();
    try {
      // Draw lines
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.95)';
      ctx.lineWidth = 2;
      for (const ln of lines) {
        ctx.beginPath();
        ctx.moveTo(ln.x1, ln.y1);
        ctx.lineTo(ln.x2, ln.y2);
        ctx.stroke();
      }
      // Draw vanishing point
      if (vp) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
        ctx.beginPath(); ctx.arc(vp.x, vp.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Optional grid
      const showGrid = options?.showGrid ?? this.perspectiveGridEnabled;
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        const cols = 8, rows = 6;
        for (let i = 1; i < cols; i++) {
          const x = (i * width) / cols;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let j = 1; j < rows; j++) {
          const y = (j * height) / rows;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
      }
    } finally {
      ctx.restore();
    }
  }

  // --- New helpers and APIs: known objects and calibration ---

  /**
   * Detect known objects with typical real-world heights and compute an aggregate score per object.
   * Combines object detection confidence, edge clarity, and reference availability.
   */
  async detectKnownObjects(
    imageElement: HTMLImageElement | HTMLVideoElement
  ): Promise<KnownObject[]> {
    // Ensure COCO-SSD loaded
    if (!this.cocoModel) {
      await this.loadModels();
    }
    const detections = await this.detectObjects(imageElement, 0.2);
    const edgeClarity = this.computeEdgeClarity(imageElement);
    const references = this.detectReferenceObjects(detections);
    const hasRefs = references.length > 0;

    const mapped: KnownObject[] = [];
    for (const d of detections) {
      const label = (d.class || '').toLowerCase();
      let type: KnownObjectType | null = null;
      let range: [number, number] | null = null;
      if (label.includes('door')) {
        type = 'door'; range = [2.0, 2.1];
      } else if (label === 'person' || label.includes('person')) {
        type = 'person'; range = [1.6, 1.8];
      } else if (label.includes('window')) {
        type = 'window'; range = [1.2, 1.5];
      } else if (label === 'car' || label.includes('car')) {
        type = 'car'; range = [1.4, 1.5];
      }
      if (!type || !range) continue;

      const estimatedHeight = (range[0] + range[1]) / 2;
      // Score weights: 0.6 detector confidence, 0.3 edge clarity, 0.1 reference availability
      const score = Math.max(0, Math.min(1, 0.6 * (d.score ?? 0) + 0.3 * edgeClarity + 0.1 * (hasRefs ? 1 : 0)));
      mapped.push({
        type,
        bbox: d.bbox,
        confidence: d.score,
        expectedHeightMRange: range,
        estimatedHeightM: estimatedHeight,
        score,
        edgeClarity,
      });
    }

    // Sort by score desc
    mapped.sort((a, b) => (b.score - a.score));
    return mapped;
  }

  /**
   * Calculate and store a pixels-per-meter calibration factor using a detected object.
   * Prefers a door if available; falls back to person, car, window.
   */
  async calculateScaleFactor(
    imageElement: HTMLImageElement | HTMLVideoElement,
  ): Promise<CalibrationData | undefined> {
    const objects = await this.detectKnownObjects(imageElement);
    if (objects.length === 0) return undefined;

    const pickOrder: KnownObjectType[] = ['door', 'person', 'car', 'window'];
    let chosen: KnownObject | undefined;
    for (const t of pickOrder) {
      const found = objects.find(o => o.type === t);
      if (found) { chosen = found; break; }
    }
    if (!chosen) return undefined;

    const [, , , h] = chosen.bbox;
    const heightPx = Math.max(1, h);
    const pxPerMeter = heightPx / chosen.estimatedHeightM;
    const score = chosen.score;
    const calib: CalibrationData = {
      pxPerMeter,
      object: chosen,
      score,
      timestamp: Date.now(),
    };
    this.calibrationData = calib;
    return calib;
  }

  /** Return current pixels-per-meter if calibrated. */
  getPixelsPerMeter(): number | undefined { return this.calibrationData?.pxPerMeter; }

  /**
   * Edge clarity metric 0..1 for the frame using Sobel magnitude distribution.
   * Best-effort fast estimate; independent of tree detection.
   */
  private computeEdgeClarity(imageElement: HTMLImageElement | HTMLVideoElement): number {
    try {
      const { canvas, width, height } = this.createWorkingCanvas(imageElement, 320);
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.drawImage(imageElement, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const gray = new Float32Array(width * height);
      const src = imageData.data;
      for (let i = 0, p = 0; i < src.length; i += 4, p++) {
        const r = src[i] ?? 0; const g = src[i + 1] ?? 0; const b = src[i + 2] ?? 0;
        gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const sobelGx = new Float32Array(width * height);
      const sobelGy = new Float32Array(width * height);
      const mag = new Float32Array(width * height);
      const kx = [ -1, 0, 1, -2, 0, 2, -1, 0, 1 ];
      const ky = [ -1, -2, -1, 0, 0, 0, 1, 2, 1 ];
      const clampXY = (x: number, y: number) => {
        if (x < 0) x = 0; else if (x >= width) x = width - 1;
        if (y < 0) y = 0; else if (y >= height) y = height - 1;
        return (y * width + x);
      };
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let gx = 0, gy = 0;
          for (let kyIdx = -1; kyIdx <= 1; kyIdx++) {
            for (let kxIdx = -1; kxIdx <= 1; kxIdx++) {
              const pIdx = clampXY(x + kxIdx, y + kyIdx);
              const kIndex = (kyIdx + 1) * 3 + (kxIdx + 1);
              const val = gray[pIdx] ?? 0;
              const kxVal = (kIndex >= 0 && kIndex < kx.length) ? (kx[kIndex] ?? 0) : 0;
              const kyVal = (kIndex >= 0 && kIndex < ky.length) ? (ky[kIndex] ?? 0) : 0;
              gx += val * kxVal; gy += val * kyVal;
            }
          }
          const idx = y * width + x;
          sobelGx[idx] = gx; sobelGy[idx] = gy;
          mag[idx] = Math.hypot(gx, gy);
        }
      }
      // Threshold at 75th percentile of non-zero magnitudes
      let nonZero = 0, maxMag = 0;
      for (let i = 0; i < mag.length; i++) { const m = mag[i] ?? 0; if (m > 0) { nonZero++; if (m > maxMag) maxMag = m; } }
      if (nonZero === 0 || maxMag <= 0) return 0;
      const hist = new Uint32Array(256);
      const scale = 255 / maxMag;
      for (let i = 0; i < mag.length; i++) {
        const m = mag[i] ?? 0; if (m <= 0) continue; const bin = Math.max(0, Math.min(255, Math.floor(m * scale))); hist[bin] = ((hist[bin] ?? 0) + 1) >>> 0;
      }
      const target = Math.floor(nonZero * 0.75);
      let acc = 0; let thresholdBin = 255;
      for (let b = 0; b < 256; b++) { acc += (hist[b] ?? 0); if (acc >= target) { thresholdBin = b; break; } }
      const threshold = thresholdBin / 255 * maxMag;
      let strong = 0;
      for (let i = 0; i < mag.length; i++) { if ((mag[i] ?? 0) >= threshold) strong++; }
      const clarity = Math.max(0, Math.min(1, strong / Math.max(1, nonZero)));
      return clarity;
    } catch {
      return 0;
    }
  }

  private boostConfidenceWithCalibration(baseConfidence: number): number {
    if (!this.calibrationData) return baseConfidence;
    // Modest boost up to +0.1 based on calibration quality
    const boost = 0.1 * Math.max(0, Math.min(1, this.calibrationData.score));
    return Math.max(0, Math.min(1, baseConfidence + boost));
  }
}


