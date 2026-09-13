// ─────────────────────────────────────────────────────────────────────────────
// SimulationCore.js — Unified Astrophysics Engine for TRAPPIST-1
// Decouples physical state evaluation from Three.js rendering.
// ─────────────────────────────────────────────────────────────────────────────

import { SimulationClock } from './SimulationClock.js'
import { OrbitalModel, TRAPPIST_PLANETS, TRAPPIST_STAR } from './OrbitalModel.js'
import { ResonanceModel } from './ResonanceModel.js'
import { StellarModel } from './StellarModel.js'
import { RadiationModel } from './RadiationModel.js'
import { PlanetModel } from './PlanetModel.js'
import { ClimateModel } from './ClimateModel.js'
import { AtmosphereModel } from './AtmosphereModel.js'
import { SpaceWeatherModel } from './SpaceWeatherModel.js'
import { ObservationModel } from './ObservationModel.js'

export class SimulationCore {
  constructor() {
    this.clock = new SimulationClock()
    this.orbitalModel = new OrbitalModel(TRAPPIST_PLANETS)
    this.resonanceModel = new ResonanceModel()
    this.stellarModel = new StellarModel()
    this.radiationModel = new RadiationModel()
    this.observationModel = new ObservationModel()

    this.starData = TRAPPIST_STAR
    this.planetsData = TRAPPIST_PLANETS

    // Current selected model for TRAPPIST-1e ('MODEL_A' | 'MODEL_B' | 'MODEL_C')
    this.selected1eModel = 'MODEL_C'

    // Cached physics state
    this.planetStates = new Map()
    this.stellarState = null
    this.laplaceTriplets = []

    // Decoupled tick timer (sim updates at 30 Hz regardless of render FPS)
    this.accumulatedTime = 0
    this.physicsTickInterval = 1 / 30.0 // 30 Hz

    // Initialize state at epoch
    this.updatePhysics(0.0)
  }

  set1eModel(modelKey) {
    this.selected1eModel = modelKey
  }

  setEccentricityExaggeration(factor) {
    this.orbitalModel.setEccentricityExaggeration(factor)
  }

  setSpectralBand(bandKey) {
    this.radiationModel.setSpectralBand(bandKey)
  }

  /**
   * Main simulation frame tick.
   * @param {number} deltaRealSeconds
   */
  tick(deltaRealSeconds) {
    const deltaSimDays = this.clock.tick(deltaRealSeconds)
    this.accumulatedTime += deltaRealSeconds

    if (this.accumulatedTime >= this.physicsTickInterval || deltaSimDays > 0) {
      this.updatePhysics(deltaSimDays)
      this.accumulatedTime = 0
    }

    return {
      clock: this.clock,
      stellarState: this.stellarState,
      planetStates: this.planetStates,
      laplaceTriplets: this.laplaceTriplets,
      activeSpectralBand: this.radiationModel.getActiveBand(),
    }
  }

  updatePhysics(deltaSimDays) {
    const simDays = this.clock.simDays

    // 1. Update Stellar Model & Activity
    this.stellarState = this.stellarModel.update(simDays, deltaSimDays)

    // 2. Propagate All Keplerian Planetary Orbits
    this.planetsData.forEach(p => {
      const state = this.orbitalModel.calculatePlanetState(p, simDays)

      // 3. Evaluate Radiation, Atmosphere, Space Weather & Climate
      const irradiance = this.radiationModel.calculatePlanetIrradiance(state.rAU, this.stellarState)
      const atmo = AtmosphereModel.getAtmosphericState(p, this.selected1eModel)
      const spaceWeather = SpaceWeatherModel.evaluateSpaceWeather(p, state.rAU, this.stellarState)

      const climate = ClimateModel.calculateClimate({
        fluxRelativeEarth: state.fluxRelativeEarth,
        albedo: p.id === 'trappist_1e' && this.selected1eModel === 'MODEL_A' ? 0.12 : 0.30,
        redistributionEfficiency: atmo.hasAtmosphere ? 0.45 : 0.05,
        opticalLibrationDeg: state.opticalLibrationDeg,
      })

      const threeLayers = PlanetModel.getThreeLayersOfTruth(p, state, this.selected1eModel)

      this.planetStates.set(p.id, {
        ...state,
        irradiance,
        atmo,
        spaceWeather,
        climate,
        threeLayers,
      })
    })

    // 4. Evaluate Laplace Resonant Chain
    this.laplaceTriplets = this.resonanceModel.evaluateLaplaceChain(this.planetStates)
  }

  /**
   * Evaluates transit photometer telemetry for a selected planet.
   * @param {string} planetId
   */
  getTransitPhotometry(planetId) {
    const pData = this.planetsData.find(p => p.id === planetId)
    const pState = this.planetStates.get(planetId)
    if (!pData || !pState) return null
    return this.observationModel.evaluateTransitPhotometry(pData, pState, this.starData.visualRadius)
  }

  /**
   * Evaluates transmission spectrum for a selected planet.
   * @param {string} planetId
   */
  getTransmissionSpectrum(planetId) {
    const pData = this.planetsData.find(p => p.id === planetId)
    if (!pData) return []
    return this.observationModel.getObservedTransmissionSpectrum(pData, this.selected1eModel, this.stellarState)
  }
}
