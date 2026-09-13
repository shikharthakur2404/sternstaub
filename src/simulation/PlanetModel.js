// ─────────────────────────────────────────────────────────────────────────────
// PlanetModel.js — Gravity Physics, Scale Heights & Three Layers of Truth
// Computes physical variables (g, v_esc, density, H) from mass and radius,
// structuring data strictly into Observed, Inferred, and Hypothetical layers.
// ─────────────────────────────────────────────────────────────────────────────

export const TRAPPIST_1E_MODELS = {
  MODEL_A: {
    id: 'model_a',
    title: 'Model A: Desiccated Bare Rock',
    subtitle: 'JWST High-Loss Scenario',
    description: 'Complete atmospheric loss via early stellar XUV stripping. Desiccated impact-cratered basalt with extreme day-night thermal gradient (380K substellar / 40K nightside).',
    albedo: 0.12,
    hasAtmosphere: false,
    hasClouds: false,
    hasOcean: false,
    meanMolecularWeight: 0,
    surfacePressureBar: 0.0,
    atmoOpacity: 0.0,
  },
  MODEL_B: {
    id: 'model_b',
    title: 'Model B: Dense CO₂/N₂ Envelope',
    subtitle: 'Secondary Degassed Scenario',
    description: 'Post-volcanic outgassed secondary atmosphere (0.8–1.5 bar CO₂/N₂). High heat redistribution warming the twilight terminator; heavy cloud decks and acid haze.',
    albedo: 0.35,
    hasAtmosphere: true,
    hasClouds: true,
    hasOcean: false,
    meanMolecularWeight: 42.0, // CO2-dominated
    surfacePressureBar: 1.2,
    atmoColor: 0x38bdf8,
    atmoOpacity: 0.22,
  },
  MODEL_C: {
    id: 'model_c',
    title: 'Model C: Ocean-Bearing Eyeball World',
    subtitle: 'Volatile-Rich Retention Scenario',
    description: 'Water-rich planet retaining a global hydrological cycle. Circular substellar liquid ocean (65°C), surrounding sea-ice margin, and permanent cryogenic ice shield across nightside.',
    albedo: 0.28,
    hasAtmosphere: true,
    hasClouds: true,
    hasOcean: true,
    meanMolecularWeight: 28.5, // N2/H2O/CO2 mix
    surfacePressureBar: 1.0,
    atmoColor: 0x0284c7,
    atmoOpacity: 0.30,
  },
}

export class PlanetModel {
  /**
   * Calculates gravity-derived physical quantities for a planet.
   * @param {object} planetData - Basic planet config
   * @returns {object} Derived physical parameters
   */
  static calculatePhysics(planetData) {
    const M_earth = planetData.massEarth
    const R_earth = planetData.radiusEarth

    // Surface gravity (g = GM / R^2):
    // g_earth = 9.80665 m/s^2
    const gRelativeEarth = M_earth / (R_earth * R_earth)
    const surfaceGravityMps2 = 9.80665 * gRelativeEarth

    // Escape velocity (v_esc = sqrt(2GM / R)):
    // v_esc_earth = 11.186 km/s
    const escapeVelocityKps = 11.186 * Math.sqrt(M_earth / R_earth)

    // Bulk density (rho = M / (4/3 * pi * R^3)):
    // rho_earth = 5.515 g/cm^3
    const bulkDensityGcm3 = 5.515 * (M_earth / Math.pow(R_earth, 3))

    // Estimated core mass fraction (pure iron core = ~8 g/cm^3, silicates = ~3.2 g/cm^3):
    const ironMassFractionPercent = Math.max(10, Math.min(65, (bulkDensityGcm3 - 3.2) * 12.0 + 20.0))

    // Jeans escape parameter for molecular nitrogen (N2) at Teq:
    // lambda_esc = (G * M * m) / (k_B * T * R)
    const teq = planetData.teqK || 250
    const jeansParameterN2 = (1.66e-27 * 28.0 * (6.674e-11 * M_earth * 5.972e24)) /
      (1.38e-23 * teq * (R_earth * 6.371e6))

    // Atmospheric retention index [0..100%]:
    // High gravity + low Teq -> high retention
    const retentionIndex = Math.max(5, Math.min(98, Math.round((jeansParameterN2 / 35.0) * 85.0)))

    return {
      surfaceGravityMps2,
      gRelativeEarth,
      escapeVelocityKps,
      bulkDensityGcm3,
      ironMassFractionPercent,
      jeansParameterN2,
      retentionIndex,
    }
  }

  /**
   * Calculates atmospheric scale height H = (k_B * T) / (mu * m_u * g).
   * @param {number} tempK - Atmospheric temperature
   * @param {number} meanMolWeightAmu - Mean molecular weight in amu (e.g. 28 for N2, 44 for CO2)
   * @param {number} surfaceGravityMps2 - Surface gravity in m/s^2
   * @returns {number} Scale height in kilometers
   */
  static calculateScaleHeightKm(tempK, meanMolWeightAmu, surfaceGravityMps2) {
    if (!meanMolWeightAmu || meanMolWeightAmu <= 0 || !surfaceGravityMps2 || surfaceGravityMps2 <= 0) {
      return 0.0
    }
    // H = (R_universal * T) / (mu_kg * g)
    // R_universal = 8314.46 J / (kmol * K)
    const H_meters = (8314.46 * tempK) / (meanMolWeightAmu * surfaceGravityMps2)
    return H_meters / 1000.0 // meters -> km
  }

  /**
   * Generates the structured "Three Layers of Truth" card.
   * @param {object} planetData
   * @param {object} orbitalState
   * @param {string} selected1eModelKey
   */
  static getThreeLayersOfTruth(planetData, orbitalState, selected1eModelKey = 'MODEL_C') {
    const phys = this.calculatePhysics(planetData)
    const is1e = planetData.id === 'trappist_1e'
    const model1e = is1e ? TRAPPIST_1E_MODELS[selected1eModelKey] || TRAPPIST_1E_MODELS.MODEL_C : null

    return {
      planetId: planetData.id,
      planetName: planetData.name,

      // ── 1. OBSERVED DATA (Established Empirical Reality from NASA/JWST) ────
      observed: {
        radiusEarth: planetData.radiusEarth.toFixed(3),
        massEarth: planetData.massEarth.toFixed(3),
        orbitalPeriodDays: planetData.periodDays.toFixed(6),
        semiMajorAxisAU: planetData.semiMajorAxisAU.toFixed(5),
        transitDepthPercent: (planetData.transitDepthPpm / 10000).toFixed(3) + '%',
        stellarInsolationEarth: orbitalState?.fluxRelativeEarth?.toFixed(3) || '—',
        eccentricityObserved: planetData.eccentricity.toFixed(5),
        discoverySource: 'Spitzer / K2 / VLT / TRAPPIST (2016–2017)',
      },

      // ── 2. INFERRED DATA (Physical & Numerical Deductions) ─────────────────
      inferred: {
        surfaceGravity: `${phys.surfaceGravityMps2.toFixed(2)} m/s² (${phys.gRelativeEarth.toFixed(2)} g⊕)`,
        escapeVelocity: `${phys.escapeVelocityKps.toFixed(2)} km/s`,
        bulkDensity: `${phys.bulkDensityGcm3.toFixed(2)} g/cm³`,
        ironCoreFraction: `~${phys.ironMassFractionPercent.toFixed(0)}%`,
        equilibriumTemp: `~${planetData.teqK} K (Zero-Albedo)`,
        tidalState: 'Tidally Synchronous (P_rot = P_orb)',
        opticalLibration: `±${orbitalState?.opticalLibrationDeg?.toFixed(2) || '0.00'}°`,
        atmosphericRetentionEstimate: `${phys.retentionIndex}% Index`,
      },

      // ── 3. HYPOTHETICAL SIMULATION (Speculative Surface / Climate Model) ───
      hypothetical: {
        badge: 'MODEL: HYPOTHETICAL SURFACE',
        modelTitle: is1e ? model1e.title : planetData.type,
        modelDescription: is1e ? model1e.description : planetData.desc,
        selectedModelKey: is1e ? selected1eModelKey : null,
        available1eModels: is1e ? Object.keys(TRAPPIST_1E_MODELS) : null,
        habitabilityRating: is1e ? 'HIGH INTEREST // PRIMARY TARGET' : planetData.id === 'trappist_1d' || planetData.id === 'trappist_1f' ? 'MODERATE INTEREST // HABITABLE MARGIN' : 'LOW // EXTREME ENVIRONMENT',
      },
    }
  }
}
