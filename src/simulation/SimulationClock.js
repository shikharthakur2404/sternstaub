// ─────────────────────────────────────────────────────────────────────────────
// SimulationClock.js — Unified Astronomical Simulation Clock & Epoch Engine
// Manages reference epoch (BJD), variable simulation rates, and precise
// chronological propagation across all exoplanet orbital and climate systems.
// ─────────────────────────────────────────────────────────────────────────────

export const TIME_SCALES = {
  REALTIME: { id: 'realtime', label: '1s / s', daysPerSec: 1 / 86400 },
  MINUTE_SEC: { id: 'min_sec', label: '1m / s', daysPerSec: 60 / 86400 },
  HOUR_SEC: { id: 'hour_sec', label: '1h / s', daysPerSec: 3600 / 86400 },
  DAY_SEC: { id: 'day_sec', label: '1d / s', daysPerSec: 1.0 },
  TEN_DAYS_SEC: { id: '10d_sec', label: '10d / s', daysPerSec: 10.0 },
  HUNDRED_DAYS_SEC: { id: '100d_sec', label: '100d / s', daysPerSec: 100.0 },
  YEAR_SEC: { id: 'year_sec', label: '1yr / s', daysPerSec: 365.25 },
}

export class SimulationClock {
  constructor(referenceEpochBJD = 2458000.0) {
    this.epochBJD = referenceEpochBJD // Reference Barycentric Julian Date
    this.simDays = 0.0 // Elapsed simulation days since reference epoch
    this.timeScaleKey = 'day_sec'
    this.daysPerSec = TIME_SCALES.DAY_SEC.daysPerSec
    this.isPaused = false
    this.listeners = new Set()
  }

  /**
   * Set simulation speed preset.
   * @param {string} scaleKey - Key matching TIME_SCALES
   */
  setTimeScale(scaleKey) {
    const scale = TIME_SCALES[scaleKey]
    if (scale) {
      this.timeScaleKey = scaleKey
      this.daysPerSec = scale.daysPerSec
      this.notify()
    }
  }

  /**
   * Toggle pause state.
   */
  togglePause() {
    this.isPaused = !this.isPaused
    this.notify()
    return this.isPaused
  }

  /**
   * Advance simulation clock by real-world delta seconds.
   * @param {number} deltaSeconds
   * @returns {number} Delta simulation days advanced
   */
  tick(deltaSeconds) {
    if (this.isPaused || deltaSeconds <= 0) return 0.0
    // Clamp delta to avoid temporal teleportation during window defocus
    const safeDelta = Math.min(deltaSeconds, 0.25)
    const deltaDays = safeDelta * this.daysPerSec
    this.simDays += deltaDays
    return deltaDays
  }

  /**
   * Manually step forward or backward by N simulation days.
   * @param {number} days
   */
  step(days) {
    this.simDays += days
    this.notify()
  }

  /**
   * Reset clock to initial epoch.
   */
  reset() {
    this.simDays = 0.0
    this.notify()
  }

  /**
   * Returns the current Barycentric Julian Date.
   */
  getBJD() {
    return this.epochBJD + this.simDays
  }

  /**
   * Returns formatted telemetry string.
   */
  getTelemetry() {
    const bjd = this.getBJD().toFixed(3)
    const days = this.simDays.toFixed(2)
    const rate = TIME_SCALES[this.timeScaleKey]?.label || '1d / s'
    const status = this.isPaused ? 'PAUSED' : 'PROPAGATING'
    return `BJD ${bjd} • T+${days}d [${rate} • ${status}]`
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify() {
    this.listeners.forEach(cb => cb(this))
  }
}
