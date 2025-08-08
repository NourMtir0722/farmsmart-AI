// src/lib/measure/inclinometer.ts

export type OrientationSample = {
  timestamp: number;      // ms since epoch
  pitchRad: number;       // device pitch in radians (forward/back tilt)
  rollRad: number;        // device roll in radians (left/right tilt)
  yawRad?: number;        // optional compass/yaw in radians
};

export type OrientationStream = {
  stop: () => void;
  calibrateZero: () => void; // sets the current pitch as 0 for relative reads
  getZeroOffset: () => number; // radians
};

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

// Internal helpers (kept file-local)
function isSSR(): boolean {
  return typeof window === 'undefined';
}

function isLocalhost(): boolean {
  if (isSSR()) return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1'
  );
}

function isSecureAllowed(): boolean {
  if (isSSR()) return false;
  // Allow insecure only on localhost for development
  return (window.isSecureContext === true) || isLocalhost();
}

export function hasDeviceOrientationSupport(): boolean {
  if (isSSR()) return false;
  if (!isSecureAllowed()) return false;
  const w = window as Window & typeof globalThis;
  const hasInterface = typeof w.DeviceOrientationEvent !== 'undefined';
  const hasHandler = 'ondeviceorientation' in w;
  return !!(hasInterface || hasHandler);
}

export async function requestMotionPermission(): Promise<PermissionState> {
  if (isSSR()) return 'unsupported';
  if (!isSecureAllowed()) return 'unsupported';

  try {
    // iOS 13+ may expose requestPermission on DeviceMotionEvent first
    const w = window as Window & typeof globalThis;
    const DeviceMotion = w.DeviceMotionEvent as unknown;
    const hasRequestPermission = (o: unknown): o is { requestPermission: () => Promise<'granted' | 'denied' | 'prompt'> } =>
      typeof o === 'function' && typeof (o as { requestPermission?: unknown }).requestPermission === 'function';
    if (hasRequestPermission(DeviceMotion)) {
      const res = await DeviceMotion.requestPermission();
      return res === 'granted' ? 'granted' : 'denied';
    }

    // Some iOS versions expose it on DeviceOrientationEvent
    const DeviceOrientation = w.DeviceOrientationEvent as unknown;
    if (hasRequestPermission(DeviceOrientation)) {
      const res = await DeviceOrientation.requestPermission();
      return res === 'granted' ? 'granted' : 'denied';
    }

    // Non-iOS browsers typically do not require explicit permission
    return 'granted';
  } catch {
    return 'denied';
  }
}

export function startOrientationStream(
  onSample: (sample: OrientationSample) => void
): OrientationStream {
  // If unsupported or insecure, return a no-op stream.
  if (!hasDeviceOrientationSupport()) {
    let zero = 0;
    return {
      stop: () => {},
      calibrateZero: () => { zero = 0; },
      getZeroOffset: () => zero,
    };
  }

  let zeroOffsetRad = 0; // Calibration offset in radians
  let filteredPitchRad: number | null = null; // Exponential smoothing state
  let isVisible = typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true;
  const alpha = 0.2; // Low-pass filter coefficient

  // Handler for page visibility to pause processing in background
  const onVisibility: () => void = () => {
    isVisible = document.visibilityState === 'visible';
  };

  // Main device orientation handler
  const onOrientation: (e: DeviceOrientationEvent) => void = (event) => {
    if (!isVisible) return;

    // Ignore if both are null — Safari may do this until user interaction
    const { beta, gamma } = event; // beta: front/back (pitch), gamma: left/right (roll)
    if (beta == null && gamma == null) return;

    // Assume portrait-only for v1. Ignore samples if not portrait.
    try {
      const orientation = (screen as Screen & { orientation?: { type?: string } }).orientation?.type;
      if (orientation && !orientation.toLowerCase().includes('portrait')) {
        return; // Not portrait, ignore for now
      }
    } catch {
      // no-op: older browsers may not support screen.orientation
    }

    // Clamp pitch to avoid extreme values that could explode later trig use
    let pitchDeg = typeof beta === 'number' ? beta : 0;
    if (pitchDeg > 179) pitchDeg = 89;
    if (pitchDeg < -179) pitchDeg = -89;

    const rollDeg = typeof gamma === 'number' ? gamma : 0;

    // Convert to radians
    const pitchRad = degToRad(pitchDeg);
    const rollRad = degToRad(rollDeg);

    // Exponential smoothing for pitch
    if (filteredPitchRad === null) {
      filteredPitchRad = pitchRad; // seed with first sample
    } else {
      filteredPitchRad = alpha * pitchRad + (1 - alpha) * filteredPitchRad;
    }

    // Some Android devices invert beta sign; calibration handles relative zeroing
    const relativePitch = (filteredPitchRad - zeroOffsetRad);

    onSample({
      timestamp: Date.now(),
      pitchRad: relativePitch,
      rollRad,
    });
  };

  // Attach listeners
  window.addEventListener('deviceorientation', onOrientation as EventListener, { passive: true });
  document.addEventListener('visibilitychange', onVisibility as EventListener);

  return {
    stop: () => {
      window.removeEventListener('deviceorientation', onOrientation as EventListener);
      document.removeEventListener('visibilitychange', onVisibility as EventListener);
    },
    calibrateZero: () => {
      if (filteredPitchRad !== null) {
        zeroOffsetRad = filteredPitchRad;
      }
    },
    getZeroOffset: () => zeroOffsetRad,
  };
}

export function degToRad(d: number): number { return (d * Math.PI) / 180; }
export function radToDeg(r: number): number { return (r * 180) / Math.PI; }

export function computeTreeHeight(params: {
  eyeHeightM: number;          // h0
  baseAngleRad: number;        // θ1
  topAngleRad: number;         // θ2
}): number {
  // Using d' = h0 / tan(|θ1|), then h = h0 + d' * tan(θ2)
  const { eyeHeightM, baseAngleRad, topAngleRad } = params;
  const dPrime = eyeHeightM / Math.tan(Math.abs(baseAngleRad));
  return eyeHeightM + dPrime * Math.tan(topAngleRad);
}

export function computeHeightFromDistance(params: {
  cameraHeightM: number; // phone camera height
  distanceM: number;     // paced/measured distance to trunk
  topAngleRad: number;   // θ2
}): number {
  const { cameraHeightM, distanceM, topAngleRad } = params;
  return cameraHeightM + distanceM * Math.tan(topAngleRad);
}

export function estimateHeightUncertainty(params: {
  eyeHeightM: number;
  baseAngleRad: number; baseSdRad?: number;
  topAngleRad: number;  topSdRad?: number;
  samples?: number;
}): { heightM: number; p10: number; p90: number } {
  const { eyeHeightM, baseAngleRad, topAngleRad } = params;
  const n = Math.max(50, params.samples ?? 300);
  const sdBase = params.baseSdRad ?? degToRad(0.5);
  const sdTop  = params.topSdRad  ?? degToRad(0.5);

  // Box–Muller normal sampler
  const normal = (mu: number, sigma: number): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mu + sigma * z;
  };

  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
  const minBase = degToRad(1); // avoid tan(0)
  const heights: number[] = [];
  heights.length = 0;

  for (let i = 0; i < n; i++) {
    const b = normal(baseAngleRad, sdBase);
    const t = normal(topAngleRad,  sdTop);
    const safeBase = Math.sign(b) * Math.max(Math.abs(b), minBase);
    const h = computeTreeHeight({ eyeHeightM, baseAngleRad: safeBase, topAngleRad: t });
    if (Number.isFinite(h)) heights.push(h);
  }

  if (heights.length === 0) {
    // Fallback: deterministic compute with a tiny jitter guard
    const safeBase = Math.sign(baseAngleRad) * Math.max(Math.abs(baseAngleRad), minBase);
    const h = computeTreeHeight({ eyeHeightM, baseAngleRad: safeBase, topAngleRad });
    return { heightM: h, p10: h, p90: h };
  }

  heights.sort((a, b) => a - b);
  const pick = (p: number): number => {
    const idx = clamp(Math.floor(p * (heights.length - 1)), 0, heights.length - 1);
    const value = heights[idx];
    return (typeof value === 'number' ? value : heights[heights.length - 1]!);
  };

  const p10 = pick(0.10);
  const median = pick(0.50);
  const p90 = pick(0.90);
  return { heightM: median, p10, p90 };
}


