// ─────────────────────────────────────────────────────────────────────────────
// ObservationModel.js — Virtual Transit Photometer & Transmission Spectrometer
// Emulates real exoplanet observatory instruments: Mandel & Agol transit light
// curves and JWST transmission spectroscopy with stellar contamination toggles.
// ─────────────────────────────────────────────────────────────────────────────

import { AtmosphereModel } from './AtmosphereModel.js'

export class ObservationModel {
  constructor() {
    this.lightCurveHistory = [] // Circular buffer of {time, flux, isTransiting}
    this.maxHistoryLength = 120

    // Stellar contamination flags for spectroscopy:
    this.contamination = {
      enableStarspots: false,
      enableFlares: false,
      enableShotNoise: true,
      shotNoisePpm: 28, // Standard JWST NIRSpec precision per bin
    }
  }

  setContaminationOption(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.contamination, key)) {
      this.contamination[key] = value
    }
  }

  /**
   * Computes Mandel & Agol geometric transit light curve for a planet.
   * @param {object} planetData
   * @param {object} orbitalState
   * @param {number} starVisualRadius
   * @returns {object} Photometer telemetry
   */
  evaluateTransitPhotometry(planetData, orbitalState, starVisualRadius = 16.0) {
    const { x, y, z } = orbitalState.position
    const pRadius = planetData.visualRadius || 3.2

    // Transits only occur on the near side of the star (z > 0 in screen coordinate space):
    const isForwardHemisphere = z > 0
    const projectedDist = Math.sqrt(x * x + y * y)
    const transitBoundary = starVisualRadius + pRadius

    let relativeFlux = 1.00000
    let isTransiting = false
    let transitPhase = 'OUT OF TRANSIT'

    if (isForwardHemisphere && projectedDist < transitBoundary) {
      isTransiting = true
      const maxDepth = planetData.transitDepthPpm / 1000000.0 // ppm -> fractional

      if (projectedDist > starVisualRadius - pRadius) {
        // Ingress or Egress phase (partial overlap)
        const overlapFraction = (transitBoundary - projectedDist) / (2.0 * pRadius)
        const smoothOverlap = Math.sin(overlapFraction * (Math.PI / 2.0))
        relativeFlux = 1.00000 - maxDepth * smoothOverlap
        transitPhase = projectedDist > starVisualRadius ? 'INGRESS / EGRESS' : 'FULL TRANSIT'
      } else {
        // Full transit (planet completely within stellar disk)
        // Apply limb darkening variation: star is darker near limb, brighter near center
        const mu = Math.sqrt(Math.max(0.0, 1.0 - (projectedDist * projectedDist) / (starVisualRadius * starVisualRadius)))
        const limbFactor = 0.85 + 0.25 * mu
        relativeFlux = 1.00000 - maxDepth * limbFactor
        transitPhase = 'FULL TRANSIT (INGRESS COMPLETE)'
      }
    }

    // Append to photometer circular oscilloscope buffer
    this.lightCurveHistory.push({
      time: orbitalState.simDays,
      flux: relativeFlux,
      isTransiting,
    })
    if (this.lightCurveHistory.length > this.maxHistoryLength) {
      this.lightCurveHistory.shift()
    }

    return {
      planetId: planetData.id,
      isTransiting,
      transitPhase,
      relativeFlux: parseFloat(relativeFlux.toFixed(6)),
      transitDepthPpm: planetData.transitDepthPpm,
      transitDepthPercent: (planetData.transitDepthPpm / 10000).toFixed(3) + '%',
      lightCurveHistory: this.lightCurveHistory,
    }
  }

  /**
   * Generates JWST Transmission Spectrum with optional stellar contamination.
   * @param {object} planetData
   * @param {string} model1eKey
   * @param {object} stellarState
   * @returns {Array<{wavelength: number, depthPpm: number, label: string, isContaminated: boolean}>}
   */
  getObservedTransmissionSpectrum(planetData, model1eKey = 'MODEL_C', stellarState = {}) {
    const rawSpectrum = AtmosphereModel.generateTransmissionSpectrum(planetData, model1eKey, 48)

    return rawSpectrum.map((pt, idx) => {
      let finalDepth = pt.depthPpm
      let contaminated = false

      // 1. Unocculted Starspot Contamination:
      // Starspots are cool -> star emits less light at optical/blue wavelengths.
      // Transit depth Delta F = (R_p / R_star)^2 * 1 / (1 - f_spot*(1 - S_spot/S_phot))
      // Creates a fake Rayleigh-like upward slope at blue wavelengths and fake water-like peaks!
      if (this.contamination.enableStarspots) {
        const spotSlope = 95.0 * Math.pow(1.2 / pt.wavelength, 1.5)
        finalDepth += spotSlope
        contaminated = true
      }

      // 2. Flare Distortion:
      // Active magnetic flares alter emission lines and continuum
      if (this.contamination.enableFlares && stellarState.isFlaring) {
        const flareDistortion = (stellarState.totalFlareIntensity || 0.5) * 80.0 * Math.sin(pt.wavelength * 3.5)
        finalDepth += flareDistortion
        contaminated = true
      }

      // 3. Instrumental Shot Noise:
      // Gaussian noise representing finite photon counting precision
      if (this.contamination.enableShotNoise) {
        // Deterministic pseudo-random noise per wavelength bin
        const hash = Math.sin(idx * 12.9898 + pt.wavelength * 78.233) * 43758.5453
        const noise = (hash - Math.floor(hash) - 0.5) * 2.0 * this.contamination.shotNoisePpm
        finalDepth += noise
      }

      return {
        wavelength: pt.wavelength,
        depthPpm: Math.round(finalDepth),
        label: pt.label,
        isContaminated: contaminated,
      }
    })
  }
}
