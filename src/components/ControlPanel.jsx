// ─────────────────────────────────────────────────────────────────────────────
// ControlPanel.jsx — Floating Glassmorphism Feature Selection HUD
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PALETTES } from '../config/palettes'
import './ControlPanel.css'

const SHAPES = [
  { id: 'silhouette',  label: '✦ Astral' },
  { id: 'solar',       label: '☉ Solar' },
  { id: 'singularity', label: '⦿ Singularity' },
  { id: 'galaxy',      label: '⊛ Galaxy' },
  { id: 'torus',       label: '⊚ Torus' },
]

export default function ControlPanel({
  isOpen,        setIsOpen,
  shape,         setShape,
  palette,       setPalette,
  exposure,      setExposure,
  dispersion,    setDispersion,
  driftSpeed,    setDriftSpeed,
  particleCount, setParticleCount,
  gravity,       setGravity,
  pulseNova,     setPulseNova,
  onReset,
  onWormhole,
  fpsBadgeRef,
}) {
  // Collapsible accordion state
  const [openGeom,     setOpenGeom]     = useState(true)
  const [openDynamics, setOpenDynamics] = useState(true)
  const [openSpectra,  setOpenSpectra]  = useState(true)
  const [openPresets,  setOpenPresets]  = useState(false)

  const savePreset = () => {
    const preset = { shape, palette, exposure, dispersion, driftSpeed, particleCount, gravity, pulseNova }
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
        if (p.pulseNova     != null) setPulseNova(p.pulseNova)
      } catch { alert('Invalid preset file.') }
    }
    reader.readAsText(file)
  }

  return (
    <>
      {/* Floating minimal launcher button when collapsed */}
      {!isOpen && (
        <button
          className="hud-collapsed-pill"
          onClick={() => setIsOpen(true)}
          title="Open Feature Control Panel"
        >
          <span className="pill-pulse" />
          <span className="pill-title">✦ TUNE HUD</span>
          <span ref={fpsBadgeRef} className="fps-indicator">60 FPS</span>
        </button>
      )}

      {/* Main feature container */}
      <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="panel-title">✦ FEATURE SELECTION</span>
            {isOpen && <span ref={fpsBadgeRef} className="fps-indicator">60 FPS</span>}
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
              className={`accordion-header ${openGeom ? 'active' : ''}`}
              onClick={() => setOpenGeom(!openGeom)}
            >
              <span>CELESTIAL GEOMETRIES</span>
              <span className="accordion-chevron">›</span>
            </button>

            <div className={`accordion-collapse ${openGeom ? 'expanded' : ''}`}>
              <div className="accordion-inner">
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
              </div>
            </div>
          </div>

          {/* ── Accordion 2: Optical & Dynamics ── */}
          <div className="accordion-section">
            <button
              className={`accordion-header ${openDynamics ? 'active' : ''}`}
              onClick={() => setOpenDynamics(!openDynamics)}
            >
              <span>OPTICAL & DYNAMICS</span>
              <span className="accordion-chevron">›</span>
            </button>

            <div className={`accordion-collapse ${openDynamics ? 'expanded' : ''}`}>
              <div className="accordion-inner">
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
                      className={`toggle-btn nova-btn ${pulseNova ? 'active' : ''}`}
                      onClick={() => setPulseNova(!pulseNova)}
                      title="Toggle periodic Supernova pulse waves (Space)"
                    >
                      {pulseNova ? '✦ Nova On' : '✦ Nova Off'}
                    </button>
                  </div>
                  <button
                    className="action-btn wormhole-btn"
                    onClick={onWormhole}
                    title="Traverse Einstein-Rosen Wormhole Bridge (W)"
                  >
                    ⦿ Traverse Wormhole (W)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Accordion 3: Chromatic Spectra ── */}
          <div className="accordion-section">
            <button
              className={`accordion-header ${openSpectra ? 'active' : ''}`}
              onClick={() => setOpenSpectra(!openSpectra)}
            >
              <span>CHROMATIC SPECTRA</span>
              <span className="accordion-chevron">›</span>
            </button>

            <div className={`accordion-collapse ${openSpectra ? 'expanded' : ''}`}>
              <div className="accordion-inner">
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
              </div>
            </div>
          </div>

          {/* ── Accordion 4: Presets & Memory ── */}
          <div className="accordion-section">
            <button
              className={`accordion-header ${openPresets ? 'active' : ''}`}
              onClick={() => setOpenPresets(!openPresets)}
            >
              <span>PRESETS & MEMORY</span>
              <span className="accordion-chevron">›</span>
            </button>

            <div className={`accordion-collapse ${openPresets ? 'expanded' : ''}`}>
              <div className="accordion-inner">
                <div className="accordion-content">
                  <div className="preset-row">
                    <button className="preset-btn" onClick={savePreset}>↓ Save JSON</button>
                    <label className="preset-btn load-btn">
                      ↑ Load JSON
                      <input type="file" accept=".json" onChange={loadPreset} hidden />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
