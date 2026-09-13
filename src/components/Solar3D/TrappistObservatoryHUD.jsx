// ─────────────────────────────────────────────────────────────────────────────
// TrappistObservatoryHUD.jsx — Astronomical Observatory & Numerical Telemetry
// Houses the Simulation Clock controller, Three Layers of Truth cards,
// Transit Photometer oscilloscope, and JWST Transmission Spectrometer.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react'
import { TIME_SCALES } from '../../simulation/SimulationClock.js'
import { SPECTRAL_BANDS } from '../../simulation/RadiationModel.js'
import { TRAPPIST_1E_MODELS } from '../../simulation/PlanetModel.js'

export default function TrappistObservatoryHUD({
  simulationCore,
  selectedPlanetId,
  onSelect1eModel,
  onSetEccentricityExaggeration,
  onSetSpectralBand,
  isObservatoryMode,
  onToggleObservatoryMode,
}) {
  const [truthTab, setTruthTab] = useState('observed') // 'observed' | 'inferred' | 'hypothetical'
  const [active1eModel, setActive1eModel] = useState('MODEL_C')
  const [activeBandKey, setActiveBandKey] = useState('visible')
  const [eccentricityFactor, setEccentricityFactor] = useState(1)
  const [timeScaleKey, setTimeScaleKey] = useState('day_sec')
  const [isPaused, setIsPaused] = useState(false)
  const [clockTelemetry, setClockTelemetry] = useState('')

  // Stellar contamination toggles for JWST spectrometer
  const [enableStarspots, setEnableStarspots] = useState(false)
  const [enableFlares, setEnableFlares] = useState(false)
  const [enableShotNoise, setEnableShotNoise] = useState(true)

  const photometerCanvasRef = useRef(null)
  const spectrometerCanvasRef = useRef(null)

  // Sync clock telemetry every 150ms
  useEffect(() => {
    if (!simulationCore) return
    const interval = setInterval(() => {
      setClockTelemetry(simulationCore.clock.getTelemetry())
      setIsPaused(simulationCore.clock.isPaused)
    }, 150)
    return () => clearInterval(interval)
  }, [simulationCore])

  // Handle 1e model switch
  const handleModelChange = (modelKey) => {
    setActive1eModel(modelKey)
    onSelect1eModel?.(modelKey)
  }

  // Handle spectral band change
  const handleBandChange = (bandKey) => {
    setActiveBandKey(bandKey)
    onSetSpectralBand?.(bandKey)
  }

  // Handle eccentricity exaggeration change
  const handleEccentricityChange = (factor) => {
    setEccentricityFactor(factor)
    onSetEccentricityExaggeration?.(factor)
  }

  // Handle time scale change
  const handleTimeScaleChange = (key) => {
    setTimeScaleKey(key)
    simulationCore?.clock.setTimeScale(key)
  }

  const handleTogglePause = () => {
    if (!simulationCore) return
    const next = simulationCore.clock.togglePause()
    setIsPaused(next)
  }

  const handleStepDays = (days) => {
    simulationCore?.clock.step(days)
  }

  // ── Render Real-Time Transit Photometer Light Curve ────────────────────────
  useEffect(() => {
    if (!simulationCore || !photometerCanvasRef.current || !selectedPlanetId) return
    const canvas = photometerCanvasRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    const photometer = simulationCore.getTransitPhotometry(selectedPlanetId)
    if (!photometer) return

    ctx.clearRect(0, 0, w, h)

    // Background grid
    ctx.fillStyle = '#060b13'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.lineWidth = 1
    // Horizontal baseline lines
    for (let y = 15; y < h; y += 22) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // 1.0000 baseline
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'
    ctx.beginPath()
    ctx.moveTo(0, 20)
    ctx.lineTo(w, 20)
    ctx.stroke()

    // Draw circular buffer light curve
    const history = photometer.lightCurveHistory
    if (history.length > 1) {
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = photometer.isTransiting ? '#f43f5e' : '#38bdf8'

      history.forEach((pt, idx) => {
        const x = (idx / (history.length - 1)) * (w - 20) + 10
        // Scale delta flux: 1.000 -> y=20, 0.990 -> y=h-15
        const dip = (1.0 - pt.flux) / 0.012
        const y = Math.min(h - 8, Math.max(18, 20 + dip * (h - 35)))
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // Live telemetry text overlay
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px monospace'
    ctx.fillText('FLUX: 1.000', 8, 14)
    ctx.fillText(`ΔF: -${photometer.transitDepthPercent}`, 8, h - 8)

    ctx.fillStyle = photometer.isTransiting ? '#fb7185' : '#38bdf8'
    ctx.textAlign = 'right'
    ctx.fillText(photometer.transitPhase, w - 8, 14)
    ctx.fillText(`CURRENT: ${photometer.relativeFlux.toFixed(6)}`, w - 8, h - 8)
    ctx.textAlign = 'left'
  }, [simulationCore, selectedPlanetId, clockTelemetry])

  // ── Render JWST Transmission Spectrometer Plot ─────────────────────────────
  useEffect(() => {
    if (!simulationCore || !spectrometerCanvasRef.current || !selectedPlanetId) return
    const canvas = spectrometerCanvasRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    simulationCore.observationModel.setContaminationOption('enableStarspots', enableStarspots)
    simulationCore.observationModel.setContaminationOption('enableFlares', enableFlares)
    simulationCore.observationModel.setContaminationOption('enableShotNoise', enableShotNoise)

    const spectrum = simulationCore.getTransmissionSpectrum(selectedPlanetId)
    if (!spectrum || spectrum.length === 0) return

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#060b13'
    ctx.fillRect(0, 0, w, h)

    // Spectrum bounds
    const depths = spectrum.map(s => s.depthPpm)
    const minD = Math.min(...depths) * 0.98
    const maxD = Math.max(...depths) * 1.02
    const rangeD = Math.max(100, maxD - minD)

    // Grid lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)'
    ctx.lineWidth = 1
    for (let x = 30; x < w; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }

    // Absorption curve
    ctx.beginPath()
    ctx.lineWidth = 2.2
    ctx.strokeStyle = enableStarspots ? '#f59e0b' : '#38bdf8'

    spectrum.forEach((pt, idx) => {
      const x = (idx / (spectrum.length - 1)) * (w - 30) + 15
      const y = h - 22 - ((pt.depthPpm - minD) / rangeD) * (h - 45)
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)

      // Molecular line labels
      if (pt.label && idx % 4 === 0) {
        ctx.fillStyle = '#c084fc'
        ctx.font = '9px monospace'
        ctx.fillText(pt.label, x - 8, Math.max(12, y - 6))
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#e879f9'
        ctx.fill()
      }
    })
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#64748b'
    ctx.font = '9px monospace'
    ctx.fillText('0.6 µm', 10, h - 6)
    ctx.fillText('5.2 µm (JWST NIRSpec)', w - 120, h - 6)
    ctx.fillText(`${Math.round(maxD)} ppm`, 6, 14)
  }, [simulationCore, selectedPlanetId, active1eModel, enableStarspots, enableFlares, enableShotNoise, clockTelemetry])

  const currentPlanetState = simulationCore?.planetStates.get(selectedPlanetId)
  const threeLayers = currentPlanetState?.threeLayers
  const is1e = selectedPlanetId === 'trappist_1e'

  return (
    <div className="trappist-observatory-wrapper">
      {/* ── 1. Real-Time Astronomical Time & Epoch Control Bar ─────────────── */}
      <div className="simulation-clock-strip">
        <div className="clock-telemetry-badge">
          <span className={`clock-pulse ${isPaused ? 'paused' : 'live'}`} />
          <span className="clock-bjd-text">{clockTelemetry || 'PROPAGATING KEPLERIAN ORBITS'}</span>
        </div>

        <div className="clock-controls-group">
          <button
            className={`clock-pause-btn ${isPaused ? 'active' : ''}`}
            onClick={handleTogglePause}
            title={isPaused ? 'Resume Simulation Clock (Space)' : 'Pause Simulation Clock (Space)'}
          >
            {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
          </button>

          <div className="clock-presets">
            {Object.entries(TIME_SCALES).map(([_key, val]) => (
              <button
                key={val.id}
                className={`clock-preset-chip ${timeScaleKey === val.id ? 'active' : ''}`}
                onClick={() => handleTimeScaleChange(val.id)}
              >
                {val.label}
              </button>
            ))}
          </div>

          <div className="clock-step-group">
            <button className="clock-step-btn" onClick={() => handleStepDays(1.0)} title="Advance 1 Day">
              +1d
            </button>
            <button className="clock-step-btn" onClick={() => handleStepDays(10.0)} title="Advance 10 Days">
              +10d
            </button>
            <button className="clock-step-btn" onClick={() => simulationCore?.clock.reset()} title="Reset to Reference Epoch">
              ↺ EPOCH
            </button>
          </div>
        </div>

        <div className="observatory-mode-toggles">
          {/* Eccentricity Exaggeration */}
          <div className="eccentricity-toggle-group" title="Exaggerate Keplerian Ellipse to visualize non-circularity">
            <span className="toggle-label">ECCENTRICITY:</span>
            {[1, 10, 50].map(f => (
              <button
                key={f}
                className={`ecc-chip ${eccentricityFactor === f ? 'active' : ''}`}
                onClick={() => handleEccentricityChange(f)}
              >
                {f === 1 ? '1x (TRUE)' : `${f}x`}
              </button>
            ))}
          </div>

          {/* Multi-Spectral Band Selector */}
          <div className="spectral-band-group" title="Select Observatory Spectral Passband">
            <span className="toggle-label">BAND:</span>
            {Object.entries(SPECTRAL_BANDS).map(([_key, band]) => (
              <button
                key={band.id}
                className={`spectral-chip ${activeBandKey === band.id ? 'active' : ''}`}
                onClick={() => handleBandChange(band.id)}
                title={band.description}
              >
                {band.id.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Virtual Observatory Instrument Mode Toggle */}
          <button
            className={`observatory-mode-btn ${isObservatoryMode ? 'active' : ''}`}
            onClick={onToggleObservatoryMode}
            title="Switch between Cinematic 3D Orbit and Virtual Astronomical Laboratory"
          >
            <span>{isObservatoryMode ? '🔭 OBSERVATORY: ON' : '🪐 CINEMATIC 3D'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Three Layers of Truth Card & Observatory Instruments ─────────── */}
      {selectedPlanetId && threeLayers && (
        <div className="observatory-telemetry-panel">
          <div className="telemetry-panel-header">
            <div className="planet-identity">
              <span className="planet-dot" />
              <h3>{threeLayers.planetName.toUpperCase()}</h3>
              <span className="telemetry-epoch-tag">KEPLERIAN STATE SOLVER</span>
            </div>

            <div className="truth-tabs">
              <button
                className={`truth-tab ${truthTab === 'observed' ? 'active' : ''}`}
                onClick={() => setTruthTab('observed')}
              >
                1. OBSERVED DATA
              </button>
              <button
                className={`truth-tab ${truthTab === 'inferred' ? 'active' : ''}`}
                onClick={() => setTruthTab('inferred')}
              >
                2. INFERRED DYNAMICS
              </button>
              <button
                className={`truth-tab ${truthTab === 'hypothetical' ? 'active' : ''}`}
                onClick={() => setTruthTab('hypothetical')}
              >
                3. HYPOTHETICAL MODEL
              </button>
            </div>
          </div>

          <div className="telemetry-panel-content">
            {/* ── TAB 1: OBSERVED REALITY (NASA EXOPLANET ARCHIVE) ── */}
            {truthTab === 'observed' && (
              <div className="truth-content-grid">
                <div className="data-box">
                  <span className="data-title">ORBITAL PERIOD</span>
                  <span className="data-value highlight">{threeLayers.observed.orbitalPeriodDays} d</span>
                  <span className="data-note">NASA Exoplanet Archive</span>
                </div>
                <div className="data-box">
                  <span className="data-title">SEMI-MAJOR AXIS</span>
                  <span className="data-value">{threeLayers.observed.semiMajorAxisAU} AU</span>
                  <span className="data-note">Keplerian separation</span>
                </div>
                <div className="data-box">
                  <span className="data-title">PLANETARY RADIUS</span>
                  <span className="data-value">{threeLayers.observed.radiusEarth} R⊕</span>
                  <span className="data-note">Empirical transit size</span>
                </div>
                <div className="data-box">
                  <span className="data-title">PLANETARY MASS</span>
                  <span className="data-value">{threeLayers.observed.massEarth} M⊕</span>
                  <span className="data-note">TTV Dynamic Solution</span>
                </div>
                <div className="data-box">
                  <span className="data-title">TRANSIT DEPTH (ΔF)</span>
                  <span className="data-value">{threeLayers.observed.transitDepthPercent}</span>
                  <span className="data-note">(R_p / R_star)² geometric</span>
                </div>
                <div className="data-box">
                  <span className="data-title">STELLAR INSOLATION</span>
                  <span className="data-value">{threeLayers.observed.stellarInsolationEarth} S⊕</span>
                  <span className="data-note">Relative to Earth</span>
                </div>
              </div>
            )}

            {/* ── TAB 2: INFERRED ASTROPHYSICAL DYNAMICS ── */}
            {truthTab === 'inferred' && (
              <div className="truth-content-grid">
                <div className="data-box">
                  <span className="data-title">SURFACE GRAVITY</span>
                  <span className="data-value highlight">{threeLayers.inferred.surfaceGravity}</span>
                  <span className="data-note">g = GM / R²</span>
                </div>
                <div className="data-box">
                  <span className="data-title">ESCAPE VELOCITY</span>
                  <span className="data-value">{threeLayers.inferred.escapeVelocity}</span>
                  <span className="data-note">v_esc = √(2GM / R)</span>
                </div>
                <div className="data-box">
                  <span className="data-title">BULK DENSITY</span>
                  <span className="data-value">{threeLayers.inferred.bulkDensity}</span>
                  <span className="data-note">Terrestrial basalt composition</span>
                </div>
                <div className="data-box">
                  <span className="data-title">CORE IRON FRACTION</span>
                  <span className="data-value">{threeLayers.inferred.ironCoreFraction}</span>
                  <span className="data-note">Mass-radius relationship</span>
                </div>
                <div className="data-box">
                  <span className="data-title">OPTICAL LIBRATION</span>
                  <span className="data-value">{threeLayers.inferred.opticalLibration}</span>
                  <span className="data-note">Δθ ≈ 2e · sin(M) wobble</span>
                </div>
                <div className="data-box">
                  <span className="data-title">ATMOSPHERIC RETENTION</span>
                  <span className="data-value highlight">{threeLayers.inferred.atmosphericRetentionEstimate}</span>
                  <span className="data-note">Jeans escape stability</span>
                </div>
              </div>
            )}

            {/* ── TAB 3: HYPOTHETICAL SIMULATION & CLIMATE VARIANTS ── */}
            {truthTab === 'hypothetical' && (
              <div className="truth-hypothetical-container">
                <div className="hypothetical-badge-strip">
                  <span className="badge-alert">⚠️ {threeLayers.hypothetical.badge}</span>
                  <span className="badge-interest">{threeLayers.hypothetical.habitabilityRating}</span>
                </div>

                {is1e ? (
                  <div className="model-selector-box">
                    <span className="model-header-title">TRAPPIST-1e SCIENTIFIC CLIMATE HYPOTHESES:</span>
                    <div className="model-cards-grid">
                      {Object.entries(TRAPPIST_1E_MODELS).map(([key, m]) => (
                        <div
                          key={m.id}
                          className={`model-card ${active1eModel === key ? 'active' : ''}`}
                          onClick={() => handleModelChange(key)}
                        >
                          <div className="model-card-header">
                            <span className="model-radio">{active1eModel === key ? '◉' : '○'}</span>
                            <span className="model-name">{m.title}</span>
                          </div>
                          <span className="model-sub">{m.subtitle}</span>
                          <p className="model-desc">{m.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="standard-hypothetical-box">
                    <h4>{threeLayers.hypothetical.modelTitle}</h4>
                    <p>{threeLayers.hypothetical.modelDescription}</p>
                    <div className="climate-readout">
                      <span>Sub-Stellar Temp: {currentPlanetState?.climate?.T_substellar_K || '—'} K</span>
                      <span>Nightside Cold Trap: {currentPlanetState?.climate?.T_nightside_K || '—'} K</span>
                      <span>Terminator Meridian: {currentPlanetState?.climate?.T_terminator_K || '—'} K</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. VIRTUAL OBSERVATORY INSTRUMENTS (LIGHT CURVE & SPECTROMETER) ── */}
            <div className="observatory-instruments-row">
              {/* Transit Photometer Oscilloscope */}
              <div className="instrument-card">
                <div className="instrument-header">
                  <span className="instrument-pulse" />
                  <span>TRANSIT PHOTOMETER // MANDEL & AGOL LIGHT CURVE</span>
                </div>
                <canvas
                  ref={photometerCanvasRef}
                  width={340}
                  height={110}
                  className="instrument-canvas"
                />
              </div>

              {/* JWST Transmission Spectrometer */}
              <div className="instrument-card">
                <div className="instrument-header">
                  <span className="instrument-pulse" />
                  <span>JWST TRANSMISSION SPECTROMETER (NIRSpec/NIRISS)</span>
                  <div className="contamination-toggles">
                    <label title="Simulate unocculted starspots mimicking atmospheric slopes">
                      <input
                        type="checkbox"
                        checked={enableStarspots}
                        onChange={e => setEnableStarspots(e.target.checked)}
                      />
                      SPOTS
                    </label>
                    <label title="Simulate flare emissions">
                      <input
                        type="checkbox"
                        checked={enableFlares}
                        onChange={e => setEnableFlares(e.target.checked)}
                      />
                      FLARES
                    </label>
                    <label title="Photon counting shot noise (28 ppm)">
                      <input
                        type="checkbox"
                        checked={enableShotNoise}
                        onChange={e => setEnableShotNoise(e.target.checked)}
                      />
                      NOISE
                    </label>
                  </div>
                </div>
                <canvas
                  ref={spectrometerCanvasRef}
                  width={380}
                  height={110}
                  className="instrument-canvas"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
