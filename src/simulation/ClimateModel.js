// ─────────────────────────────────────────────────────────────────────────────
// ClimateModel.js — Insolation, Heat Redistribution & Tidal Libration
// Computes physics-based surface temperatures from stellar flux, local albedo,
// optical libration, and atmospheric/oceanic heat redistribution.
// ─────────────────────────────────────────────────────────────────────────────

export class ClimateModel {
  /**
   * Calculates local surface temperature distribution for a tidally locked world.
   * @param {object} params
   * @param {number} params.fluxRelativeEarth - Current stellar insolation (Earth = 1.0)
   * @param {number} params.albedo - Planetary Bond albedo [0..1]
   * @param {number} params.redistributionEfficiency - Atmospheric transport [0..1]
   * @param {number} params.opticalLibrationDeg - Current libration angle
   * @returns {object} Thermal climate telemetry
   */
  static calculateClimate({
    fluxRelativeEarth = 1.0,
    albedo = 0.3,
    redistributionEfficiency = 0.4,
    opticalLibrationDeg = 0.0,
  }) {
    // Solar constant at Earth = 1361 W/m^2
    const S_0 = 1361.0 * fluxRelativeEarth
    const sigma = 5.670374e-8 // Stefan-Boltzmann constant (W / (m^2 * K^4))

    // Theoretical maximum substellar temperature (zero redistribution):
    // F_abs = S_0 * (1 - albedo) = sigma * T_sub^4
    const F_abs_sub = S_0 * (1.0 - albedo)
    const T_substellar_K = Math.round(Math.pow(F_abs_sub / sigma, 0.25))

    // Atmospheric heat redistribution (epsilon):
    // If epsilon = 0 (bare rock): dayside boils, nightside drops to near 0 K.
    // If epsilon > 0: equatorial winds transport heat to nightside and terminator.
    const eps = Math.max(0.0, Math.min(1.0, redistributionEfficiency))

    // Dayside mean temperature:
    const T_dayside_K = Math.round(T_substellar_K * Math.pow((1.0 - 0.5 * eps) / 2.0, 0.25))

    // Nightside minimum temperature (heat advected from dayside):
    // Minimum radiative equilibrium baseline (~35K cosmic microwave / geothermal background)
    const T_nightside_K = Math.round(Math.max(35, T_substellar_K * Math.pow(Math.max(0.005, eps * 0.25), 0.25)))

    // Twilight terminator temperature:
    const T_terminator_K = Math.round((T_dayside_K + T_nightside_K) / 2.0)

    // Equatorial superrotation hot spot offset:
    // With atmosphere, peak temperature is advected eastward by ~8° to 22°
    const hotSpotOffsetDeg = eps > 0.1 ? (12.0 + eps * 10.0) : 0.0
    const apparentStellarLongitudeDeg = opticalLibrationDeg
    const thermalPeakLongitudeDeg = apparentStellarLongitudeDeg + hotSpotOffsetDeg

    return {
      T_substellar_K,
      T_dayside_K,
      T_terminator_K,
      T_nightside_K,
      apparentStellarLongitudeDeg,
      thermalPeakLongitudeDeg,
      hotSpotOffsetDeg,
      redistributionEfficiency: eps,
    }
  }
}
