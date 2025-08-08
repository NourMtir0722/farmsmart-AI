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
  const w = window as unknown as Record<string, unknown>;
  const hasInterface = typeof (window as any).DeviceOrientationEvent !== 'undefined';
  const hasHandler = 'ondeviceorientation' in w;
  return !!(hasInterface || hasHandler);
}

export async function requestMotionPermission(): Promise<PermissionState> {
  if (isSSR()) return 'unsupported';
  if (!isSecureAllowed()) return 'unsupported';

  try {
    // iOS 13+ may expose requestPermission on DeviceMotionEvent first
    const DeviceMotion: any = (window as any).DeviceMotionEvent;
    if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
      const res = await DeviceMotion.requestPermission();
      return res === 'granted' ? 'granted' : 'denied';
    }

    // Some iOS versions expose it on DeviceOrientationEvent
    const DeviceOrientation: any = (window as any).DeviceOrientationEvent;
    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
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
  const onVisibilityChange = () => {
    isVisible = document.visibilityState === 'visible';
  };

  // Main device orientation handler
  const onDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (!isVisible) return;

    // Ignore if both are null — Safari may do this until user interaction
    const { beta, gamma } = event; // beta: front/back (pitch), gamma: left/right (roll)
    if (beta == null && gamma == null) return;

    // Assume portrait-only for v1. Ignore samples if not portrait.
    try {
      const orientation = (screen as any)?.orientation?.type as string | undefined;
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
  window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true } as AddEventListenerOptions);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    stop: () => {
      window.removeEventListener('deviceorientation', onDeviceOrientation as EventListener);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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

export function estimateHeightUncertainty(params: {
  eyeHeightM: number;
  baseAngleRad: number; baseSdRad?: number | undefined;
  topAngleRad: number;  topSdRad?: number | undefined;
  samples?: number | undefined; // default 300
}): { heightM: number; p10: number; p90: number } {
  const {
    eyeHeightM,
    baseAngleRad,
    baseSdRad,
    topAngleRad,
    topSdRad,
    samples = 300,
  } = params;

  // fallback SD = 0.5 degree in radians if not provided
  const fallbackSd = (0.5 * Math.PI) / 180;
  const sdBase = baseSdRad ?? fallbackSd;
  const sdTop = topSdRad ?? fallbackSd;

  function randn(mean: number, sd: number): number {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + sd * z;
  }

  const heights: number[] = [];
  for (let i = 0; i < samples; i++) {
    const b = randn(baseAngleRad, sdBase);
    const t = randn(topAngleRad, sdTop);
    const h = computeTreeHeight({ eyeHeightM, baseAngleRad: b, topAngleRad: t });
    if (Number.isFinite(h)) heights.push(h);
  }
  if (heights.length === 0) {
    const h0 = computeTreeHeight({ eyeHeightM, baseAngleRad, topAngleRad });
    return { heightM: h0, p10: h0, p90: h0 };
  }
  heights.sort((a, b) => a - b);
  const n = heights.length;
  const idx = (p: number) => Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))));
  const p10 = heights[idx(0.10)];
  const p90 = heights[idx(0.90)];
  const median = heights[idx(0.50)];
  return { heightM: median, p10, p90 };
}


