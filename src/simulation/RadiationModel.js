// ─────────────────────────────────────────────────────────────────────────────
// RadiationModel.js — Multi-Spectral Bands & Spectral Energy Distribution (SED)
// Simulates TRAPPIST-1 radiation across Visible, Near-IR, UV, and X-Ray bands,
// driving multi-wavelength observatory views and exoplanet atmospheric inputs.
// ─────────────────────────────────────────────────────────────────────────────

export const SPECTRAL_BANDS = {
  VISIBLE: {
    id: 'visible',
    label: 'Visible Optical (400–700 nm)',
    description: 'Human eye perception. Deep ruby/crimson ultracool dwarf with dark convective starspots.',
    baseColorHex: '#ef4444',
    coronaColorHex: '#f97316',
    ambientGain: 1.0,
    flareSensitivity: 1.2,
    starOpacity: 1.0,
  },
  NEAR_IR: {
    id: 'near_ir',
    label: 'Near-Infrared (0.8–2.5 µm)',
    description: 'Peak Planck emission of M8V dwarf (Teff ≈ 2566K). Brilliant incandescent golden photosphere.',
    baseColorHex: '#fbbf24',
    coronaColorHex: '#fef08a',
    ambientGain: 1.8,
    flareSensitivity: 0.8,
    starOpacity: 1.0,
  },
  UV: {
    id: 'uv',
    label: 'Far & Near UV (100–380 nm)',
    description: 'Quiescent photosphere is faint; active magnetic plages and stochastic flares blaze in violet.',
    baseColorHex: '#8b5cf6',
    coronaColorHex: '#c084fc',
    ambientGain: 0.35,
    flareSensitivity: 12.0,
    starOpacity: 0.85,
  },
  X_RAY: {
    id: 'x_ray',
    label: 'Soft X-Ray (0.1–10 keV)',
    description: 'Cold surface darkens; coronal magnetic reconnection loops and explosive superflares shine in cyan.',
    baseColorHex: '#06b6d4',
    coronaColorHex: '#67e8f9',
    ambientGain: 0.15,
    flareSensitivity: 35.0,
    starOpacity: 0.70,
  },
}

export class RadiationModel {
  constructor() {
    this.activeBandKey = 'visible'
  }

  setSpectralBand(bandKey) {
    if (SPECTRAL_BANDS[bandKey]) {
      this.activeBandKey = bandKey
    }
  }

  getActiveBand() {
    return SPECTRAL_BANDS[this.activeBandKey]
  }

  /**
   * Calculates multi-band radiation environment for a planet at distance rAU.
   * @param {number} rAU - Orbital distance in Astronomical Units
   * @param {object} stellarState - Output from StellarModel.update()
   */
  calculatePlanetIrradiance(rAU, stellarState) {
    const distSq = Math.max(0.005, rAU * rAU)

    // Quiescent relative flux (Earth = 1.0 at 1 AU from Sun):
    // L_star = 0.000553 L_sun
    const bolometricBase = 0.000553 / distSq
    const bolometricFlux = bolometricBase * stellarState.bolometricMultiplier

    // Wavelength-specific fluxes:
    const uvFlux = bolometricBase * 0.025 * stellarState.uvMultiplier
    const xrayFlux = bolometricBase * 0.004 * stellarState.xrayMultiplier
    const nirFlux = bolometricBase * 0.82 // ~82% in near-IR for M8V
    const opticalFlux = bolometricBase * 0.15

    return {
      rAU,
      bolometricFlux,
      uvFlux,
      xrayFlux,
      nirFlux,
      opticalFlux,
      isHighRadiationEvent: stellarState.totalFlareIntensity > 0.1,
    }
  }
}
