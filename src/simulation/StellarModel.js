// ─────────────────────────────────────────────────────────────────────────────
// StellarModel.js — Photosphere Physics, Limb Darkening & Stochastic Flares
// Simulates TRAPPIST-1's active M8V photosphere: quadratic limb darkening,
// cool starspot coverage, and energetic stochastic magnetic reconnection flares.
// ─────────────────────────────────────────────────────────────────────────────

export class StellarFlare {
  constructor({
    startTimeDays,
    durationDays = 0.02, // ~30 minutes
    peakEnergyErgs = 5e31, // Typical M-dwarf energetic flare
    peakTempK = 11000,
    regionLat = 15,
    regionLon = 45,
  }) {
    this.startTimeDays = startTimeDays
    this.durationDays = durationDays
    this.peakEnergyErgs = peakEnergyErgs
    this.peakTempK = peakTempK
    this.regionLat = regionLat
    this.regionLon = regionLon
  }

  /**
   * Calculates instantaneous flare luminosity multiplier.
   * Impulsive rise (15% of duration) + exponential cooling decay.
   * @param {number} currentSimDays
   * @returns {number} Fractional flare excess flux [0..1]
   */
  getInstantaneousIntensity(currentSimDays) {
    const elapsed = currentSimDays - this.startTimeDays
    if (elapsed < 0 || elapsed > this.durationDays) return 0.0

    const riseTime = this.durationDays * 0.15
    if (elapsed <= riseTime) {
      // Impulsive rise
      return Math.sin((elapsed / riseTime) * (Math.PI / 2))
    } else {
      // Exponential cooling decay
      const decayTime = elapsed - riseTime
      const decayDuration = this.durationDays - riseTime
      return Math.exp(-3.5 * (decayTime / decayDuration))
    }
  }

  isFinished(currentSimDays) {
    return currentSimDays > this.startTimeDays + this.durationDays
  }
}

export class StellarModel {
  constructor() {
    this.teffQuiescentK = 2566
    this.starspotFraction = 0.12 // 12% heterogeneous cold starspot coverage
    this.starspotTempK = 2150 // ~400K cooler than photosphere

    // Quadratic limb darkening coefficients for M8V in Kepler/Optical passband:
    // I(mu) = I(0) * [1 - u1*(1-mu) - u2*(1-mu)^2]
    this.limbDarkening = {
      u1: 0.62,
      u2: 0.18,
    }

    this.activeFlares = []
    this.lastFlareCheckDays = 0.0
    this.flareMeanRatePerDay = 1.8 // ~1-2 significant flares per day for TRAPPIST-1
  }

  /**
   * Evaluates limb darkening profile at normalized radius or mu = cos(theta).
   * @param {number} mu - cos(theta) where 1.0 is center of disk, 0.0 is limb
   * @returns {number} Relative intensity [0..1]
   */
  getLimbDarkening(mu) {
    const clampedMu = Math.max(0.0, Math.min(1.0, mu))
    const oneMinusMu = 1.0 - clampedMu
    return 1.0 - this.limbDarkening.u1 * oneMinusMu - this.limbDarkening.u2 * oneMinusMu * oneMinusMu
  }

  /**
   * Trigger a manual or stochastic flare.
   * @param {number} simDays
   * @param {object} customParams
   */
  triggerFlare(simDays, customParams = {}) {
    // Power-law energy distribution (dN/dE ~ E^-1.8)
    const u = Math.random()
    const energy = 1e30 * Math.pow(1.0 - u * 0.98, -1.25)
    const durationDays = (15 + Math.random() * 45) / 1440.0 // 15 to 60 minutes in days

    const flare = new StellarFlare({
      startTimeDays: simDays,
      durationDays: customParams.durationDays || durationDays,
      peakEnergyErgs: customParams.peakEnergyErgs || energy,
      peakTempK: 9000 + Math.random() * 5000,
      regionLat: (Math.random() - 0.5) * 60,
      regionLon: Math.random() * 360,
      ...customParams,
    })

    this.activeFlares.push(flare)
    return flare
  }

  /**
   * Updates stellar state, flaring activity, and prunes expired flares.
   * @param {number} currentSimDays
   * @param {number} deltaDays
   */
  update(currentSimDays, deltaDays) {
    // Check for stochastic flare event:
    const flareProbability = this.flareMeanRatePerDay * deltaDays
    if (Math.random() < flareProbability && this.activeFlares.length < 3) {
      this.triggerFlare(currentSimDays)
    }

    // Prune finished flares
    this.activeFlares = this.activeFlares.filter(f => !f.isFinished(currentSimDays))

    // Calculate composite flare intensity
    let totalFlareIntensity = 0.0
    let maxFlareTemp = this.teffQuiescentK

    this.activeFlares.forEach(f => {
      const intensity = f.getInstantaneousIntensity(currentSimDays)
      totalFlareIntensity += intensity
      if (intensity > 0.05 && f.peakTempK > maxFlareTemp) {
        maxFlareTemp = f.peakTempK
      }
    })

    // Flare radiation multipliers
    const uvMultiplier = 1.0 + totalFlareIntensity * 45.0
    const xrayMultiplier = 1.0 + totalFlareIntensity * 120.0
    const bolometricMultiplier = 1.0 + totalFlareIntensity * 0.45

    return {
      currentSimDays,
      activeFlareCount: this.activeFlares.length,
      totalFlareIntensity,
      bolometricMultiplier,
      uvMultiplier,
      xrayMultiplier,
      maxFlareTemp,
      isFlaring: totalFlareIntensity > 0.02,
      starspotFraction: this.starspotFraction,
      limbDarkening: this.limbDarkening,
    }
  }
}
