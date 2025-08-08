// src/lib/measure/elevation.ts

export function elevationFromPitchRoll(pitchRad: number, rollRad: number): number {
  // elevation = atan( tan(pitch) * cos(roll) )
  return Math.atan(Math.tan(pitchRad) * Math.cos(rollRad));
}


