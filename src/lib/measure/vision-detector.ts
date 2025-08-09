// src/lib/measure/vision-detector.ts
// A lightweight utility to initialize TensorFlow.js models and OpenCV.js in the browser

import type * as TF from '@tensorflow/tfjs';
import type * as CocoSsdNS from '@tensorflow-models/coco-ssd';
import type * as MobilenetNS from '@tensorflow-models/mobilenet';
import type CVType from '@techstark/opencv-js';

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

  private cvModule: CVType | undefined;
  private loadingPromise: Promise<void> | undefined;

  getState(): VisionDetectorState { return this.state; }
  getLastError(): Error | undefined { return this.lastError; }
  isReady(): boolean { return this.state === 'ready'; }
  get tf(): typeof TF | undefined { return this.tfModule; }
  get cv(): CVType | undefined { return this.cvModule; }

  /** Initialize requested components. Safe to call multiple times. */
  async initialize(options?: VisionInitOptions): Promise<void> {
    if (this.state === 'ready') return;
    if (this.loadingPromise) return this.loadingPromise;

    const opts: Required<VisionInitOptions> = {
      loadCocoSsd: options?.loadCocoSsd ?? true,
      loadMobilenet: options?.loadMobilenet ?? true,
      loadOpenCV: options?.loadOpenCV ?? true,
      cocoSsdBase: options?.cocoSsdBase ?? 'lite_mobilenet_v2',
    } as const;

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
          const cv = (await import('@techstark/opencv-js')).default as unknown as CVType;
          // Prefer cv.ready promise if available; otherwise fallback to onRuntimeInitialized
          const readyPromise: Promise<void> = (cv as unknown as { ready?: Promise<void> }).ready
            ? (cv as unknown as { ready: Promise<void> }).ready
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
      if (this.mobilenetModel) {
        this.mobilenetModel.dispose();
      }
    } finally {
      this.cocoModel = undefined;
      this.mobilenetModel = undefined;
    }
  }
}


