// Simple build verification script
// Ensures the named exports and types resolve correctly

import { VisionDetector } from '../../lib/measure/vision-detector'
import { SensorFusion } from '../../lib/measure/sensor-fusion'

function runBuildSmokeTest() {
  // Instantiate classes to validate types and default constructors
  const vision = new VisionDetector()
  const fusion = new SensorFusion()

  // Use the instances in a trivial way to avoid unused warnings in some toolchains
  if (!vision || !fusion) {
    // eslint-disable-next-line no-console
    console.error('Initialization failed')
    return
  }

  // eslint-disable-next-line no-console
  console.log('Build successful!')
}

runBuildSmokeTest()


