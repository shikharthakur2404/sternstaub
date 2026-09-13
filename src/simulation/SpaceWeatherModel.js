// ─────────────────────────────────────────────────────────────────────────────
// SpaceWeatherModel.js — Stellar Wind, Magnetospheres & Auroral Precipitation
// Simulates TRAPPIST-1 stellar wind dynamic pressure, planetary magnetopause
// standoff radius, flare-induced auroral arcs, and atmospheric escape rates.
// ─────────────────────────────────────────────────────────────────────────────

export class SpaceWeatherModel {
  /**
   * Evaluates space weather interaction at a planet's orbital location.
   * @param {object} planetData
   * @param {number} rAU - Distance in AU
   * @param {object} stellarState - Output from StellarModel.update()
   * @returns {object} Space weather telemetry
   */
  static evaluateSpaceWeather(planetData, rAU, stellarState) {
    // Stellar wind base dynamic pressure (n * m_p * v^2):
    // In ultracool dwarfs, wind density at close-in orbits is 100x to 1000x higher than Earth:
    const baseDynamicPressureNanoPa = (4.5 / (rAU * rAU)) * 1.5

    // Flare pressure spike:
    const flarePressureMultiplier = stellarState.isFlaring
      ? (1.0 + stellarState.totalFlareIntensity * 35.0)
      : 1.0
    const dynamicPressureNanoPa = baseDynamicPressureNanoPa * flarePressureMultiplier

    // Planetary magnetic field estimate:
    // Tidally locked slow rotators typically possess weaker convective dynamos:
    const baseDipoleGauss = planetData.id === 'trappist_1e' ? 0.22 : planetData.id === 'trappist_1d' ? 0.15 : 0.08

    // Magnetopause standoff radius R_mp / R_p:
    // R_mp / R_p = (B_p^2 / (2 * mu_0 * P_sw))^(1/6)
    // Scale factor normalized so Earth = ~10 R_p under 1 AU solar wind:
    const magneticStandoffRp = Math.max(
      0.95,
      baseDipoleGauss * 4.5 * Math.pow(10.0 / Math.max(1.0, dynamicPressureNanoPa), 1.0 / 6.0)
    )

    const isMagnetosphereCompressed = magneticStandoffRp < 1.4
    const isAtmosphereDirectlyStripped = magneticStandoffRp <= 1.05

    // Auroral precipitation intensity [0..1]:
    // Flares compress magnetosphere, driving energetic particle precipitation into polar cusps:
    const auroralActivity = Math.min(1.0, Math.max(0.05, stellarState.totalFlareIntensity * 1.8 + (isMagnetosphereCompressed ? 0.45 : 0.0)))

    // Atmospheric hydrodynamic escape loss rate (kg/s estimate via energy-limited escape):
    // M_dot ~ (epsilon * pi * R^3 * F_XUV) / (G * M)
    const xuvFluxRelative = (0.000553 / (rAU * rAU)) * 0.015 * stellarState.xrayMultiplier
    const escapeRateKgPerSec = Math.round(180.0 * xuvFluxRelative * (planetData.radiusEarth / planetData.massEarth))

    return {
      dynamicPressureNanoPa: parseFloat(dynamicPressureNanoPa.toFixed(2)),
      magneticStandoffRp: parseFloat(magneticStandoffRp.toFixed(2)),
      isMagnetosphereCompressed,
      isAtmosphereDirectlyStripped,
      auroralActivity: parseFloat(auroralActivity.toFixed(2)),
      escapeRateKgPerSec,
      spaceWeatherAlert: stellarState.isFlaring
        ? '⚠️ CORONAL RECONNECTION PULSE // MAGNETOSPHERE SEVERELY COMPRESSED'
        : isMagnetosphereCompressed
          ? '✦ HIGH DYNAMIC PRESSURE // SUB-STELLAR COMPRESSION'
          : '✦ QUIESCENT MAGNETOSPHERIC STANDOFF',
    }
  }
}
