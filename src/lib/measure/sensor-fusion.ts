// src/lib/measure/sensor-fusion.ts

export type VisionMeasurementInput = {
  // Estimated height derived from vision (meters)
  heightM: number;
  // Confidence in 0..1 (will be clamped); thresholds use 0.70 and 0.85
  confidence: number;
  // Optional standard deviation (meters) for vision estimate; if omitted, inferred from confidence
  sdM?: number;
};

export type InclinometerMeasurementInput = {
  // Estimated height derived from inclinometer/geometry (meters)
  heightM: number;
  // Optional standard deviation (meters) for sensor estimate
  sdM?: number;
};

export type FusionResult = {
  heightM: number;
  // Aggregate 0..1 confidence for the fused estimate
  confidence: number;
  // 1-sigma uncertainty (± meters)
  uncertaintyM: number;
};

export type SensorFusionOptions = {
  // Process noise standard deviation (meters) controlling how fast the state can evolve
  processNoiseSdM?: number; // default 0.25 m
  // Baseline measurement noise standard deviation when confidence is 0 (meters)
  baseMeasurementSdM?: number; // default 0.75 m
  // Max history items to keep
  maxHistory?: number; // default 50
};

type FusionHistoryEntry = {
  timestamp: number;
  fusedHeightM: number;
  fusedUncertaintyM: number;
  vision?: VisionMeasurementInput | null;
  sensor?: InclinometerMeasurementInput | null;
};

/**
 * SensorFusion fuses vision-based and inclinometer-based height estimates using
 * rule-based weighting followed by a 1D Kalman filter for smoothing.
 */
export class SensorFusion {
  private stateEstimateM: number | null = null; // x
  private stateVarianceM2: number = 1.0; // P
  private readonly processNoiseVarM2: number; // Q
  private readonly baseMeasurementSdM: number;
  private readonly history: FusionHistoryEntry[] = [];
  private readonly maxHistory: number;

  constructor(options?: SensorFusionOptions) {
    const processNoiseSdM = options?.processNoiseSdM ?? 0.25; // m
    this.processNoiseVarM2 = processNoiseSdM * processNoiseSdM;
    this.baseMeasurementSdM = options?.baseMeasurementSdM ?? 0.75; // m
    this.maxHistory = Math.max(1, options?.maxHistory ?? 50);
  }

  /** Determine weights based on vision confidence. */
  private determineWeights(visionConfidence01: number | null): { wVision: number; wSensor: number } {
    if (visionConfidence01 == null || !(visionConfidence01 >= 0)) {
      return { wVision: 0, wSensor: 1 };
    }
    const conf = Math.max(0, Math.min(1, visionConfidence01));
    const confPct = conf * 100;
    if (confPct > 85) return { wVision: 0.7, wSensor: 0.3 };
    if (confPct >= 70) return { wVision: 0.5, wSensor: 0.5 };
    return { wVision: 0.3, wSensor: 0.7 };
  }

  /** Infer measurement standard deviation from confidence (0..1). */
  private sdFromConfidence(confidence01: number | undefined, fallbackSdM: number): number {
    const c = typeof confidence01 === 'number' ? Math.max(0, Math.min(1, confidence01)) : 0;
    // As confidence increases, uncertainty decreases linearly towards 40% of base
    const minFactor = 0.4; // do not drop below 40% of base sd
    const factor = minFactor + (1 - c) * (1 - minFactor);
    return Math.max(1e-6, factor * fallbackSdM);
  }

  /**
   * Fuse current measurements. Either measurement can be omitted; the remaining one will be used.
   */
  fuse(
    vision: VisionMeasurementInput | null,
    sensor: InclinometerMeasurementInput | null
  ): FusionResult {
    // Validate inputs
    if ((!vision || !Number.isFinite(vision.heightM)) && (!sensor || !Number.isFinite(sensor.heightM))) {
      return { heightM: Number.NaN, confidence: 0, uncertaintyM: Number.NaN };
    }

    // Weights per rule
    const visConf = vision ? Math.max(0, Math.min(1, vision.confidence)) : null;
    const { wVision, wSensor } = this.determineWeights(visConf);

    // Build combined measurement z and measurement variance R
    let z = 0;
    let R_var = 0; // variance of measurement noise
    let weightSum = 0;

    const includeVision = vision && Number.isFinite(vision.heightM) && wVision > 0;
    const includeSensor = sensor && Number.isFinite(sensor.heightM) && wSensor > 0;

    if (includeVision) {
      const sdVision = vision!.sdM ?? this.sdFromConfidence(visConf ?? 0, this.baseMeasurementSdM);
      const varVision = sdVision * sdVision;
      z += wVision * vision!.heightM;
      R_var += (wVision * wVision) * varVision;
      weightSum += wVision;
    }

    if (includeSensor) {
      const sdSensor = sensor!.sdM ?? this.baseMeasurementSdM;
      const varSensor = sdSensor * sdSensor;
      z += wSensor * sensor!.heightM;
      R_var += (wSensor * wSensor) * varSensor;
      weightSum += wSensor;
    }

    if (weightSum <= 0) {
      // Fallback: pick whichever is available
      const fallback = vision ?? sensor!;
      z = fallback.heightM;
      const sd = (fallback as VisionMeasurementInput).sdM ?? (fallback as VisionMeasurementInput).confidence != null
        ? this.sdFromConfidence((fallback as VisionMeasurementInput).confidence, this.baseMeasurementSdM)
        : (fallback as InclinometerMeasurementInput).sdM ?? this.baseMeasurementSdM;
      R_var = sd * sd;
      weightSum = 1;
    } else {
      z = z / weightSum;
    }

    // Kalman predict
    if (this.stateEstimateM == null || !Number.isFinite(this.stateEstimateM)) {
      // initialize filter with first measurement
      this.stateEstimateM = z;
      this.stateVarianceM2 = Math.max(1e-6, R_var);
    } else {
      // x_prior = x; P_prior = P + Q
      this.stateVarianceM2 = this.stateVarianceM2 + this.processNoiseVarM2;
      // Kalman update with measurement z and variance R
      const P_prior = Math.max(1e-12, this.stateVarianceM2);
      const R = Math.max(1e-12, R_var);
      const K = P_prior / (P_prior + R);
      const innovation = z - this.stateEstimateM;
      this.stateEstimateM = this.stateEstimateM + K * innovation;
      this.stateVarianceM2 = (1 - K) * P_prior;
    }

    const fusedHeight = this.stateEstimateM;
    const fusedSd = Math.sqrt(Math.max(0, this.stateVarianceM2));

    // Aggregate confidence: combine vision confidence and inverse of normalized uncertainty
    const invUncertaintyScore = 1 / (1 + fusedSd); // ~1 for tiny sd, ~0.5 for sd=1, ->0 as sd increases
    const confidenceCombined = Math.max(0, Math.min(1, (visConf ?? 0.5) * 0.5 + invUncertaintyScore * 0.5));

    // Track history (bounded)
    this.history.push({
      timestamp: Date.now(),
      fusedHeightM: fusedHeight,
      fusedUncertaintyM: fusedSd,
      vision: vision ?? undefined,
      sensor: sensor ?? undefined,
    });
    if (this.history.length > this.maxHistory) this.history.shift();

    return {
      heightM: fusedHeight,
      confidence: confidenceCombined,
      uncertaintyM: fusedSd,
    };
  }

  getHistory(): ReadonlyArray<FusionHistoryEntry> { return this.history; }
}

// Module-level default instance for convenience across calls
const defaultFusion = new SensorFusion();

/**
 * Fuse measurements using a shared SensorFusion instance. Returns fused height, confidence (0..1), and ±1σ uncertainty.
 */
export function fuseMeasurements(
  vision: VisionMeasurementInput | null,
  sensor: InclinometerMeasurementInput | null,
  options?: SensorFusionOptions
): FusionResult {
  // If custom options are provided, use a short-lived instance to respect caller parameters.
  if (options) {
    const temp = new SensorFusion(options);
    return temp.fuse(vision, sensor);
  }
  return defaultFusion.fuse(vision, sensor);
}


