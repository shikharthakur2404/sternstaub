// ─────────────────────────────────────────────────────────────────────────────
// ControlPanel.jsx — Floating Glassmorphism Feature Selection HUD
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PALETTES } from '../config/palettes'
import './ControlPanel.css'

const SHAPES = [
  { id: 'silhouette',  label: '✦ Astral' },
  { id: 'solar',       label: '☀️ Solar' },
  { id: 'singularity', label: '⦿ Singularity' },
  { id: 'galaxy',      label: '🌀 Galaxy' },
  { id: 'torus',       label: '⊚ Torus' },
]

export default function ControlPanel({
  shape,         setShape,
  palette,       setPalette,
  exposure,      setExposure,
  dispersion,    setDispersion,
  driftSpeed,    setDriftSpeed,
  particleCount, setParticleCount,
  gravity,       setGravity,
  onReset,
  onPulseNova,
  fpsBadgeRef,
}) {
  const [isOpen, setIsOpen] = useState(true)

  // Collapsible accordion state
  const [openGeom,     setOpenGeom]     = useState(true)
  const [openDynamics, setOpenDynamics] = useState(true)
  const [openSpectra,  setOpenSpectra]  = useState(true)
  const [openPresets,  setOpenPresets]  = useState(false)

  const savePreset = () => {
    const preset = { shape, palette, exposure, dispersion, driftSpeed, particleCount, gravity }
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `sternstaub-${shape}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadPreset = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const p = JSON.parse(ev.target.result)
        if (p.shape         != null) setShape(p.shape)
        if (p.palette       != null) setPalette(p.palette)
        if (p.exposure      != null) setExposure(p.exposure)
        if (p.dispersion    != null) setDispersion(p.dispersion)
        if (p.driftSpeed    != null) setDriftSpeed(p.driftSpeed)
        if (p.particleCount != null) setParticleCount(p.particleCount)
        if (p.gravity       != null) setGravity(p.gravity)
      } catch { alert('Invalid preset file.') }
    }
    reader.readAsText(file)
  }

  // Floating minimal pill when collapsed
  if (!isOpen) {
    return (
      <button
        className="hud-collapsed-pill"
        onClick={() => setIsOpen(true)}
        title="Open Feature Control Panel"
      >
        <span className="pill-pulse" />
        <span className="pill-title">✦ TUNE HUD</span>
        <span ref={fpsBadgeRef} className="fps-indicator">60 FPS</span>
      </button>
    )
  }

  return (
    <div className="control-panel open">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="panel-title">✦ FEATURE SELECTION</span>
          <span ref={fpsBadgeRef} className="fps-indicator">60 FPS</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="icon-btn" onClick={onReset} title="Reset to Defaults">↺</button>
          <button className="icon-btn" onClick={() => setIsOpen(false)} title="Collapse Panel">
            −
          </button>
        </div>
      </div>

      <div className="panel-body">

        {/* ── Accordion 1: Celestial Geometries ── */}
        <div className="accordion-section">
          <button
            className="accordion-header"
            onClick={() => setOpenGeom(!openGeom)}
          >
            <span>CELESTIAL GEOMETRIES</span>
            <span className="accordion-chevron">{openGeom ? '▾' : '▸'}</span>
          </button>

          {openGeom && (
            <div className="accordion-content">
              <div className="shape-grid">
                {SHAPES.map(s => (
                  <button
                    key={s.id}
                    className={`shape-btn ${shape === s.id ? 'active' : ''}`}
                    onClick={() => setShape(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Accordion 2: Optical & Dynamics ── */}
        <div className="accordion-section">
          <button
            className="accordion-header"
            onClick={() => setOpenDynamics(!openDynamics)}
          >
            <span>OPTICAL & DYNAMICS</span>
            <span className="accordion-chevron">{openDynamics ? '▾' : '▸'}</span>
          </button>

          {openDynamics && (
            <div className="accordion-content">
              <label>
                <span>Radiance Exposure</span>
                <span className="value-badge">{exposure.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min="0.3"
                max="2.2"
                step="0.05"
                value={exposure}
                onChange={e => setExposure(parseFloat(e.target.value))}
              />

              <label>
                <span>Dispersion Field</span>
                <span className="value-badge">{dispersion.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={dispersion}
                onChange={e => setDispersion(parseFloat(e.target.value))}
              />

              <label>
                <span>Orbital Velocity</span>
                <span className="value-badge">{driftSpeed.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={driftSpeed}
                onChange={e => setDriftSpeed(parseFloat(e.target.value))}
              />

              <label>
                <span>Node Density</span>
                <span className="value-badge">{particleCount.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="600"
                max="6000"
                step="100"
                value={particleCount}
                onChange={e => setParticleCount(parseInt(e.target.value))}
              />

              <div className="physics-row">
                <button
                  className={`toggle-btn ${gravity ? 'active' : ''}`}
                  onClick={() => setGravity(!gravity)}
                  title="Toggle cursor gravitational wake"
                >
                  {gravity ? '◎ Gravity On' : '◌ Gravity Off'}
                </button>
                <button
                  className="action-btn nova-btn"
                  onClick={onPulseNova}
                  title="Detonate Supernova Shockwave"
                >
                  ✦ Pulse Nova
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Accordion 3: Chromatic Spectra ── */}
        <div className="accordion-section">
          <button
            className="accordion-header"
            onClick={() => setOpenSpectra(!openSpectra)}
          >
            <span>CHROMATIC SPECTRA</span>
            <span className="accordion-chevron">{openSpectra ? '▾' : '▸'}</span>
          </button>

          {openSpectra && (
            <div className="accordion-content">
              <div className="palette-grid">
                {Object.entries(PALETTES).map(([key, pal]) => (
                  <button
                    key={key}
                    className={`palette-btn ${palette === key ? 'active' : ''}`}
                    onClick={() => setPalette(key)}
                    style={{ background: `linear-gradient(135deg, ${pal.bgStart}, ${pal.glow[0]}, ${pal.glow[2]})` }}
                  >
                    {pal.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Accordion 4: Presets & Memory ── */}
        <div className="accordion-section">
          <button
            className="accordion-header"
            onClick={() => setOpenPresets(!openPresets)}
          >
            <span>PRESETS & MEMORY</span>
            <span className="accordion-chevron">{openPresets ? '▾' : '▸'}</span>
          </button>

          {openPresets && (
            <div className="accordion-content">
              <div className="preset-row">
                <button className="preset-btn" onClick={savePreset}>↓ Save JSON</button>
                <label className="preset-btn load-btn">
                  ↑ Load JSON
                  <input type="file" accept=".json" onChange={loadPreset} hidden />
                </label>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
