// Pure calculation function - no state, no side effects
export function calculateTreeHeight(
  distance: number,
  baseAngle: number,
  topAngle: number,
  userHeight: number
): number {
  console.log('🧮 [Calc] Starting calculation:', {
    distance,
    baseAngle,
    topAngle,
    userHeight
  })
  
  const baseAngleRad = baseAngle * Math.PI / 180
  const topAngleRad = topAngle * Math.PI / 180
  
  console.log('🧮 [Calc] Angles in radians:', {
    baseAngleRad: baseAngleRad.toFixed(4),
    topAngleRad: topAngleRad.toFixed(4)
  })
  
  const heightDiff = distance * (Math.tan(topAngleRad) - Math.tan(baseAngleRad))
  const totalHeight = Math.abs(heightDiff) + userHeight
  
  console.log('🧮 [Calc] Intermediate values:', {
    heightDiff: heightDiff.toFixed(2),
    totalHeight: totalHeight.toFixed(2)
  })
  
  console.log('✅ [Calc] Final tree height:', totalHeight.toFixed(1), 'm')
  
  return totalHeight
}

export function metersToFeet(meters: number): number {
  const feet = meters * 3.281
  console.log('📏 [Calc] Converting', meters, 'm to', feet.toFixed(1), 'ft')
  return feet
}

export function validateDistance(distance: number): boolean {
  const isValid = distance > 0 && distance <= 1000
  console.log('✅ [Validation] Distance', distance, 'm:', isValid ? 'valid' : 'invalid')
  return isValid
}

export function validateHeight(height: number): boolean {
  const isValid = height >= 0.5 && height <= 3
  console.log('✅ [Validation] Height', height, 'm:', isValid ? 'valid' : 'invalid')
  return isValid
}

export function formatAngle(angle: number): string {
  const formatted = angle.toFixed(1) + '°'
  console.log('📐 [Format] Angle', angle, 'formatted as', formatted)
  return formatted
}

export function formatMeasurementDate(timestamp: number): string {
  const date = new Date(timestamp)
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  console.log('📅 [Format] Date', timestamp, 'formatted as', formatted)
  return formatted
} 