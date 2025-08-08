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

export function hasDeviceOrientationSupport(): boolean {
  // TODO: replace stub with feature detection in Step 2b
  return true;
}

export async function requestMotionPermission(): Promise<PermissionState> {
  // TODO: real iOS/Android permission flow in Step 2b
  return 'unknown';
}

export function startOrientationStream(
  onSample: (sample: OrientationSample) => void
): OrientationStream {
  // TODO: wire up DeviceOrientation in Step 2b
  let zero = 0;
  // Stub: emit nothing; return controls
  return {
    stop: () => {},
    calibrateZero: () => { zero = 0; },
    getZeroOffset: () => zero,
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


