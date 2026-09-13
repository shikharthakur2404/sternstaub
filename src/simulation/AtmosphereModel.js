// ─────────────────────────────────────────────────────────────────────────────
// AtmosphereModel.js — Wavelength-Dependent Scattering & Transmission Profiles
// Simulates planetary atmospheric composition, scale heights, Rayleigh/Mie
// scattering, and JWST-detectable molecular transmission spectral absorption.
// ─────────────────────────────────────────────────────────────────────────────

import { PlanetModel } from './PlanetModel.js'

export const PLANET_ATMOSPHERE_PROFILES = {
  trappist_1b: {
    hasAtmosphere: false,
    surfacePressureBar: 0.0,
    meanMolecularWeightAmu: 0,
    dominantSpecies: 'Airless / Desiccated Basalt',
    rayleighColor: 0x000000,
    cloudFraction: 0.0,
    absorptionLines: [],
  },
  trappist_1c: {
    hasAtmosphere: true,
    surfacePressureBar: 0.08,
    meanMolecularWeightAmu: 44.0, // CO2 trace
    dominantSpecies: 'Trace CO₂ / Silicate Vapor',
    rayleighColor: 0xf59e0b,
    cloudFraction: 0.05,
    absorptionLines: [{ molecule: 'CO₂', wavelengthMicrons: 4.3, strengthPpm: 45 }],
  },
  trappist_1d: {
    hasAtmosphere: true,
    surfacePressureBar: 0.45,
    meanMolecularWeightAmu: 38.0, // CO2/N2
    dominantSpecies: 'CO₂ / N₂ / Trace H₂O',
    rayleighColor: 0x38bdf8,
    cloudFraction: 0.25,
    absorptionLines: [
      { molecule: 'CO₂', wavelengthMicrons: 2.7, strengthPpm: 55 },
      { molecule: 'CO₂', wavelengthMicrons: 4.3, strengthPpm: 120 },
      { molecule: 'H₂O', wavelengthMicrons: 1.4, strengthPpm: 40 },
    ],
  },
  trappist_1e: {
    hasAtmosphere: true,
    surfacePressureBar: 1.0,
    meanMolecularWeightAmu: 28.8, // N2/H2O/CO2
    dominantSpecies: 'N₂ / CO₂ / H₂O Hydrological Cycle',
    rayleighColor: 0x0284c7,
    cloudFraction: 0.55,
    absorptionLines: [
      { molecule: 'H₂O', wavelengthMicrons: 1.4, strengthPpm: 85 },
      { molecule: 'H₂O', wavelengthMicrons: 1.9, strengthPpm: 110 },
      { molecule: 'H₂O', wavelengthMicrons: 2.7, strengthPpm: 145 },
      { molecule: 'CO₂', wavelengthMicrons: 4.3, strengthPpm: 190 },
      { molecule: 'CH₄', wavelengthMicrons: 3.3, strengthPpm: 50 },
      { molecule: 'O₃', wavelengthMicrons: 9.6, strengthPpm: 35 },
    ],
  },
  trappist_1f: {
    hasAtmosphere: true,
    surfacePressureBar: 2.2,
    meanMolecularWeightAmu: 22.0, // Water-rich steam envelope
    dominantSpecies: 'Super-Critical H₂O / Nitrogen Veil',
    rayleighColor: 0x0ea5e9,
    cloudFraction: 0.70,
    absorptionLines: [
      { molecule: 'H₂O', wavelengthMicrons: 1.15, strengthPpm: 60 },
      { molecule: 'H₂O', wavelengthMicrons: 1.4, strengthPpm: 140 },
      { molecule: 'H₂O', wavelengthMicrons: 1.9, strengthPpm: 175 },
      { molecule: 'H₂O', wavelengthMicrons: 2.7, strengthPpm: 230 },
      { molecule: 'CO₂', wavelengthMicrons: 4.3, strengthPpm: 110 },
    ],
  },
  trappist_1g: {
    hasAtmosphere: true,
    surfacePressureBar: 4.8,
    meanMolecularWeightAmu: 18.0, // Volatile steam / ice envelope
    dominantSpecies: 'Volatile-Rich Steam / Cryogenic Mists',
    rayleighColor: 0xa5f3fc,
    cloudFraction: 0.85,
    absorptionLines: [
      { molecule: 'H₂O', wavelengthMicrons: 1.4, strengthPpm: 190 },
      { molecule: 'H₂O', wavelengthMicrons: 2.7, strengthPpm: 260 },
      { molecule: 'CH₄', wavelengthMicrons: 2.3, strengthPpm: 95 },
      { molecule: 'CH₄', wavelengthMicrons: 3.3, strengthPpm: 125 },
    ],
  },
  trappist_1h: {
    hasAtmosphere: true,
    surfacePressureBar: 0.12,
    meanMolecularWeightAmu: 26.0, // Nitrogen/methane frost
    dominantSpecies: 'Cryogenic N₂ / CH₄ Ice Haze',
    rayleighColor: 0xc084fc,
    cloudFraction: 0.35,
    absorptionLines: [
      { molecule: 'CH₄', wavelengthMicrons: 2.3, strengthPpm: 55 },
      { molecule: 'CH₄', wavelengthMicrons: 3.3, strengthPpm: 75 },
      { molecule: 'N₂-N₂', wavelengthMicrons: 4.1, strengthPpm: 30 },
    ],
  },
}

export class AtmosphereModel {
  /**
   * Evaluates atmospheric state and scale height for a given planet.
   * @param {object} planetData - Base planet config
   * @param {string} overrideModel1eKey - Selected 1e model (optional)
   */
  static getAtmosphericState(planetData, overrideModel1eKey = 'MODEL_C') {
    let profile = PLANET_ATMOSPHERE_PROFILES[planetData.id] || { hasAtmosphere: false }

    // Apply TRAPPIST-1e model overrides
    if (planetData.id === 'trappist_1e') {
      if (overrideModel1eKey === 'MODEL_A') {
        profile = {
          hasAtmosphere: false,
          surfacePressureBar: 0.0,
          meanMolecularWeightAmu: 0,
          dominantSpecies: 'Desiccated Bare Rock (Airless)',
          rayleighColor: 0x000000,
          cloudFraction: 0.0,
          absorptionLines: [],
        }
      } else if (overrideModel1eKey === 'MODEL_B') {
        profile = {
          hasAtmosphere: true,
          surfacePressureBar: 1.2,
          meanMolecularWeightAmu: 42.0,
          dominantSpecies: 'Dense CO₂ / Nitrogen Veil',
          rayleighColor: 0x38bdf8,
          cloudFraction: 0.45,
          absorptionLines: [
            { molecule: 'CO₂', wavelengthMicrons: 2.0, strengthPpm: 60 },
            { molecule: 'CO₂', wavelengthMicrons: 2.7, strengthPpm: 120 },
            { molecule: 'CO₂', wavelengthMicrons: 4.3, strengthPpm: 260 },
          ],
        }
      }
    }

    const phys = PlanetModel.calculatePhysics(planetData)
    const scaleHeightKm = profile.hasAtmosphere
      ? PlanetModel.calculateScaleHeightKm(planetData.teqK, profile.meanMolecularWeightAmu, phys.surfaceGravityMps2)
      : 0.0

    // Visual atmosphere mesh shell scale:
    // 1 planet radius = 6371 km. An 8.5 km scale height corresponds to ~0.00133 R_p.
    // In Three.js visualization, we scale it gracefully:
    const visualAtmosphereScale = profile.hasAtmosphere ? (1.0 + Math.min(0.08, scaleHeightKm / 240.0)) : 1.0

    return {
      ...profile,
      scaleHeightKm,
      visualAtmosphereScale,
      surfaceGravityMps2: phys.surfaceGravityMps2,
    }
  }

  /**
   * Generates transmission spectrum data points across JWST wavelength band [0.6 .. 5.2 microns].
   * @param {object} planetData
   * @param {string} model1eKey
   * @param {number} pointsCount
   * @returns {Array<{wavelength: number, depthPpm: number, label: string}>}
   */
  static generateTransmissionSpectrum(planetData, model1eKey = 'MODEL_C', pointsCount = 64) {
    const atmo = this.getAtmosphericState(planetData, model1eKey)
    const baseDepthPpm = planetData.transitDepthPpm

    const spectrum = []
    const minWl = 0.6
    const maxWl = 5.2
    const step = (maxWl - minWl) / (pointsCount - 1)

    for (let i = 0; i < pointsCount; i++) {
      const wl = minWl + i * step
      let absorptionPpm = 0.0
      let dominantLabel = ''

      if (atmo.hasAtmosphere) {
        // Rayleigh scattering slope: sigma ~ lambda^-4
        const rayleighExcess = 22.0 * Math.pow(0.8 / wl, 4.0)
        absorptionPpm += Math.min(60.0, rayleighExcess)

        // Molecular absorption lines (Gaussian profiles):
        atmo.absorptionLines.forEach(line => {
          const deltaWl = wl - line.wavelengthMicrons
          const sigmaWl = 0.12 // Spectral band half-width
          const lineProfile = Math.exp(-0.5 * Math.pow(deltaWl / sigmaWl, 2.0))
          const signal = line.strengthPpm * lineProfile
          absorptionPpm += signal
          if (signal > 20.0 && Math.abs(deltaWl) < 0.15) {
            dominantLabel = line.molecule
          }
        })
      }

      spectrum.push({
        wavelength: parseFloat(wl.toFixed(3)),
        depthPpm: Math.round(baseDepthPpm + absorptionPpm),
        label: dominantLabel,
      })
    }

    return spectrum
  }
}
