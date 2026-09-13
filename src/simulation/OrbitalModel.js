// ─────────────────────────────────────────────────────────────────────────────
// OrbitalModel.js — Authentic Keplerian Dynamics & NASA Exoplanet Parameters
// Computes high-precision Keplerian orbital state vectors (Mean Anomaly ->
// Eccentric Anomaly -> True Anomaly -> 3D position) for the TRAPPIST-1 system.
// ─────────────────────────────────────────────────────────────────────────────

export const TRAPPIST_STAR = {
  name: 'TRAPPIST-1 (2MASS J23062928-0502285)',
  type: 'M8V Ultra-Cool Red Dwarf',
  massSolar: 0.0898,
  radiusSolar: 0.1192,
  radiusKm: 82950,
  teffK: 2566,
  luminositySolar: 0.000553,
  distanceLightYears: 40.66,
  feH: 0.04,
  visualRadius: 16.0,
}

export const TRAPPIST_PLANETS = [
  {
    id: 'trappist_1b',
    name: 'TRAPPIST-1b',
    periodDays: 1.510876,
    semiMajorAxisAU: 0.01154,
    eccentricity: 0.00622,
    inclinationDeg: 89.728,
    massEarth: 1.017,
    radiusEarth: 1.116,
    teqK: 397,
    transitDepthPpm: 7260, // 0.726%
    argPeriastronRad: 1.25,
    meanAnomalyEpochRad: 0.45,
    visualRadius: 3.6,
    visualBaseDist: 44.0,
    orbitColor: 0xef4444,
  },
  {
    id: 'trappist_1c',
    name: 'TRAPPIST-1c',
    periodDays: 2.421823,
    semiMajorAxisAU: 0.01580,
    eccentricity: 0.00654,
    inclinationDeg: 89.778,
    massEarth: 1.156,
    radiusEarth: 1.097,
    teqK: 339,
    transitDepthPpm: 6870, // 0.687%
    argPeriastronRad: 2.14,
    meanAnomalyEpochRad: 1.82,
    visualRadius: 3.5,
    visualBaseDist: 60.0,
    orbitColor: 0xf97316,
  },
  {
    id: 'trappist_1d',
    name: 'TRAPPIST-1d',
    periodDays: 4.049219,
    semiMajorAxisAU: 0.02227,
    eccentricity: 0.00837,
    inclinationDeg: 89.896,
    massEarth: 0.388,
    radiusEarth: 0.788,
    teqK: 286,
    transitDepthPpm: 3670, // 0.367%
    argPeriastronRad: 0.85,
    meanAnomalyEpochRad: 3.10,
    visualRadius: 2.8,
    visualBaseDist: 84.0,
    orbitColor: 0x38bdf8,
  },
  {
    id: 'trappist_1e',
    name: 'TRAPPIST-1e',
    periodDays: 6.101013,
    semiMajorAxisAU: 0.02925,
    eccentricity: 0.00510,
    inclinationDeg: 89.793,
    massEarth: 0.692,
    radiusEarth: 0.920,
    teqK: 249,
    transitDepthPpm: 4900, // 0.490%
    argPeriastronRad: 3.42,
    meanAnomalyEpochRad: 4.50,
    visualRadius: 3.2,
    visualBaseDist: 114.0,
    orbitColor: 0x22c55e,
  },
  {
    id: 'trappist_1f',
    name: 'TRAPPIST-1f',
    periodDays: 9.207540,
    semiMajorAxisAU: 0.03849,
    eccentricity: 0.01007,
    inclinationDeg: 89.740,
    massEarth: 1.039,
    radiusEarth: 1.045,
    teqK: 217,
    transitDepthPpm: 6350, // 0.635%
    argPeriastronRad: 4.10,
    meanAnomalyEpochRad: 0.12,
    visualRadius: 3.4,
    visualBaseDist: 152.0,
    orbitColor: 0x06b6d4,
  },
  {
    id: 'trappist_1g',
    name: 'TRAPPIST-1g',
    periodDays: 12.352446,
    semiMajorAxisAU: 0.04683,
    eccentricity: 0.00208,
    inclinationDeg: 89.742,
    massEarth: 1.321,
    radiusEarth: 1.129,
    teqK: 197,
    transitDepthPpm: 7440, // 0.744%
    argPeriastronRad: 1.95,
    meanAnomalyEpochRad: 1.45,
    visualRadius: 3.7,
    visualBaseDist: 194.0,
    orbitColor: 0xa855f7,
  },
  {
    id: 'trappist_1h',
    name: 'TRAPPIST-1h',
    periodDays: 18.766255, // NASA Exoplanet Archive ~18.77 d (correcting legacy 20.0 d)
    semiMajorAxisAU: 0.06189,
    eccentricity: 0.00567,
    inclinationDeg: 89.805,
    massEarth: 0.326,
    radiusEarth: 0.755,
    teqK: 171,
    transitDepthPpm: 3340, // 0.334%
    argPeriastronRad: 5.12,
    meanAnomalyEpochRad: 2.95,
    visualRadius: 2.6,
    visualBaseDist: 242.0,
    orbitColor: 0xc084fc,
  },
]

export class OrbitalModel {
  constructor(planetsConfig = TRAPPIST_PLANETS) {
    this.planets = planetsConfig
    this.eccentricityExaggeration = 1.0 // 1x (true physical), 10x, 50x
  }

  setEccentricityExaggeration(factor) {
    this.eccentricityExaggeration = Math.max(1.0, factor)
  }

  /**
   * Solves Kepler's Equation: M = E - e*sin(E) using Newton-Raphson iteration.
   * @param {number} M - Mean anomaly in radians [0..2pi]
   * @param {number} e - Eccentricity [0..1)
   * @returns {number} Eccentric anomaly E in radians
   */
  solveKepler(M, e) {
    let E = M
    for (let iter = 0; iter < 10; iter++) {
      const f = E - e * Math.sin(E) - M
      const fPrime = 1.0 - e * Math.cos(E)
      const deltaE = f / fPrime
      E -= deltaE
      if (Math.abs(deltaE) < 1e-7) break
    }
    return E
  }

  /**
   * Propagates a planet to a given simulation time.
   * @param {object} planet - Planet configuration
   * @param {number} simDays - Elapsed days since reference epoch
   * @returns {object} Calculated Keplerian state vector
   */
  calculatePlanetState(planet, simDays) {
    const meanMotion = (2 * Math.PI) / planet.periodDays
    const M = (planet.meanAnomalyEpochRad + meanMotion * simDays) % (2 * Math.PI)

    const effectiveEccentricity = Math.min(0.85, planet.eccentricity * this.eccentricityExaggeration)
    const E = this.solveKepler(M, effectiveEccentricity)

    // True anomaly nu:
    const sqrtOnePlusE = Math.sqrt(1.0 + effectiveEccentricity)
    const sqrtOneMinusE = Math.sqrt(1.0 - effectiveEccentricity)
    const nu = 2.0 * Math.atan2(
      sqrtOnePlusE * Math.sin(E / 2.0),
      sqrtOneMinusE * Math.cos(E / 2.0)
    )

    // Instantaneous orbital radius in AU:
    const rAU = planet.semiMajorAxisAU * (1.0 - effectiveEccentricity * Math.cos(E))

    // True longitude:
    const trueLongitude = nu + planet.argPeriastronRad

    // Visual distance mapping:
    // Scale visual radius proportionally to actual AU distance variation:
    const visualDistance = planet.visualBaseDist * (rAU / planet.semiMajorAxisAU)

    // 3D position (inclination relative to line of sight ~89.7°):
    const incRad = (planet.inclinationDeg * Math.PI) / 180.0
    const devFromEdgeOn = Math.PI / 2.0 - incRad

    const x = visualDistance * Math.cos(trueLongitude)
    const z = visualDistance * Math.sin(trueLongitude) * Math.cos(devFromEdgeOn)
    const y = visualDistance * Math.sin(trueLongitude) * Math.sin(devFromEdgeOn)

    // Optical libration amplitude (delta theta ~ 2*e*sin(M)):
    // Apparent oscillation of substellar longitude due to non-zero eccentricity
    const opticalLibrationDeg = (2.0 * planet.eccentricity * Math.sin(M) * 180.0) / Math.PI

    // Orbital speed (vis-viva equation: v = sqrt(GM * (2/r - 1/a))):
    const standardGravParam = 4.0 * Math.PI * Math.PI * TRAPPIST_STAR.massSolar // in AU^3 / yr^2
    const rYears = rAU
    const aYears = planet.semiMajorAxisAU
    const vAUperYr = Math.sqrt(Math.max(0, standardGravParam * (2.0 / rYears - 1.0 / aYears)))
    const vKmPerSec = vAUperYr * 4.74047 // AU/yr -> km/s

    // Instantaneous incident stellar flux (F = L_star / (4*pi*r^2)) relative to Earth:
    // Earth receives 1361 W/m^2 at 1 AU from 1 L_sun
    const fluxRelativeEarth = TRAPPIST_STAR.luminositySolar / (rAU * rAU)

    // Geometric transit check (does the planet cross directly in front of the star along the Z axis?):
    // Near z > 0 and |x| < starRadius + planetRadius
    const isTransiting = z > 0 && Math.abs(x) < (TRAPPIST_STAR.visualRadius + planet.visualRadius) && Math.abs(y) < TRAPPIST_STAR.visualRadius

    return {
      planetId: planet.id,
      simDays,
      meanAnomaly: M,
      eccentricAnomaly: E,
      trueAnomaly: nu,
      trueLongitude,
      rAU,
      visualDistance,
      position: { x, y, z },
      opticalLibrationDeg,
      vKmPerSec,
      fluxRelativeEarth,
      isTransiting,
      eccentricity: planet.eccentricity,
      effectiveEccentricity,
    }
  }

  /**
   * Generates a smooth Keplerian ellipse polyline for orbit rendering.
   * @param {object} planet
   * @param {number} segments
   * @returns {Array<object>} Array of {x, y, z} points
   */
  generateOrbitPath(planet, segments = 128) {
    const points = []
    const effectiveEccentricity = Math.min(0.85, planet.eccentricity * this.eccentricityExaggeration)
    const incRad = (planet.inclinationDeg * Math.PI) / 180.0
    const devFromEdgeOn = Math.PI / 2.0 - incRad

    for (let i = 0; i <= segments; i++) {
      const M = (i / segments) * 2.0 * Math.PI
      const E = this.solveKepler(M, effectiveEccentricity)
      const sqrtOnePlusE = Math.sqrt(1.0 + effectiveEccentricity)
      const sqrtOneMinusE = Math.sqrt(1.0 - effectiveEccentricity)
      const nu = 2.0 * Math.atan2(
        sqrtOnePlusE * Math.sin(E / 2.0),
        sqrtOneMinusE * Math.cos(E / 2.0)
      )
      const rAU = planet.semiMajorAxisAU * (1.0 - effectiveEccentricity * Math.cos(E))
      const visualDistance = planet.visualBaseDist * (rAU / planet.semiMajorAxisAU)
      const angle = nu + planet.argPeriastronRad

      const x = visualDistance * Math.cos(angle)
      const z = visualDistance * Math.sin(angle) * Math.cos(devFromEdgeOn)
      const y = visualDistance * Math.sin(angle) * Math.sin(devFromEdgeOn)
      points.push({ x, y, z })
    }
    return points
  }
}
