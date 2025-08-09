import { describe, it, expect } from 'vitest'
import { degToRad, computeTreeHeight, computeHeightTwoStops, elevationFromPitchRoll } from '../../measure/inclinometer'

describe('geometry helpers', () => {
  it('computeTreeHeight: 45° base and 45° top doubles eye height', () => {
    const eyeHeightM = 1.6
    const baseAngle = degToRad(45)
    const topAngle = degToRad(45)
    const h = computeTreeHeight({ eyeHeightM, baseAngleRad: baseAngle, topAngleRad: topAngle })
    // With base at 45°, d' = h0 / tan(45°) = h0, so H = h0 + h0 = 2*h0
    expect(h).toBeCloseTo(eyeHeightM * 2, 6)
  })

  it('computeHeightTwoStops: synthetic case consistent with formula', () => {
    const eyeHeightM = 1.7
    const L = 5 // meters forward
    // Choose a distance D and true top elevation, then derive A1,A2
    const trueD = 12
    const trueTopAngle = Math.atan((10 - eyeHeightM) / trueD) // suppose tree height 10m
    // Ensures value is computed; suppress unused variable warning by using it in an assertion
    const t = Math.tan(trueTopAngle)
    expect(t).toBeGreaterThan(0)
    const A1 = trueTopAngle
    const A2 = Math.atan((10 - eyeHeightM) / (trueD - L))
    const { heightM, distanceM } = computeHeightTwoStops({ eyeHeightM, stepForwardM: L, angle1Rad: A1, angle2Rad: A2 })
    expect(distanceM).toBeCloseTo(trueD, 3)
    expect(heightM).toBeCloseTo(10, 3)
  })

  it('elevationFromPitchRoll: equals pitch when roll=0 and shrinks by cos(roll)', () => {
    const pitch = degToRad(20)
    const roll0 = 0
    const rollTilt = degToRad(30)
    const elev0 = elevationFromPitchRoll(pitch, roll0)
    const elev30 = elevationFromPitchRoll(pitch, rollTilt)
    expect(elev0).toBeCloseTo(pitch, 6)
    // For moderate angles, atan(tan(p)*cos(r)) ≈ p * cos(r)
    expect(elev30).toBeLessThan(pitch)
    expect(elev30).toBeCloseTo(Math.atan(Math.tan(pitch) * Math.cos(rollTilt)), 6)
  })
})


