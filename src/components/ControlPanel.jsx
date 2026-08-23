// ─────────────────────────────────────────────────────────────────────────────
// ControlPanel.jsx — the floating UI for tuning sternstaub in real time
//
// Features:
//   - Dispersion slider (how spread out particles are)
//   - Drift speed slider (how fast they animate)
//   - Particle count slider (how dense the cloud is)
//   - Palette selector (color theme)
//   - Save preset / Load preset buttons
//   - Collapse/expand toggle so it stays out of the way
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PALETTES } from '../config/palettes'
import './ControlPanel.css'

export default function ControlPanel({
  // Current values
  dispersion,
  driftSpeed,
  particleCount,
  palette,
  // Setters from parent App state
  setDispersion,
  setDriftSpeed,
  setParticleCount,
  setPalette,
}) {

  // Whether the panel is fully open or minimized
  const [isOpen, setIsOpen] = useState(true)

  // ── Save current settings as a JSON preset file ───────────────────────────
  const savePreset = () => {
    const preset = {
      name: `Preset ${new Date().toLocaleTimeString()}`,
      dispersion,
      driftSpeed,
      particleCount,
      palette,
    }

    // Trigger a browser download of the JSON
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `sternstaub-preset-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Load a preset from a JSON file ────────────────────────────────────────
  const loadPreset = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const preset = JSON.parse(e.target.result)
        // Apply each value if it exists in the file
        if (preset.dispersion    !== undefined) setDispersion(preset.dispersion)
        if (preset.driftSpeed    !== undefined) setDriftSpeed(preset.driftSpeed)
        if (preset.particleCount !== undefined) setParticleCount(preset.particleCount)
        if (preset.palette       !== undefined) setPalette(preset.palette)
      } catch {
        alert('Invalid preset file — must be a sternstaub JSON preset.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>

      {/* ── Header row with title + collapse button ── */}
      <div className="panel-header">
        <span className="panel-title">✦ sternstaub</span>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {/* ── Controls — only visible when panel is open ── */}
      {isOpen && (
        <div className="panel-body">

          {/* Dispersion */}
          <label>
            <span>Dispersion</span>
            <span className="value-badge">{dispersion.toFixed(2)}</span>
          </label>
          <input
            type="range" min="0" max="1" step="0.01"
            value={dispersion}
            onChange={e => setDispersion(parseFloat(e.target.value))}
          />

          {/* Drift Speed */}
          <label>
            <span>Drift Speed</span>
            <span className="value-badge">{driftSpeed.toFixed(2)}</span>
          </label>
          <input
            type="range" min="0" max="2" step="0.05"
            value={driftSpeed}
            onChange={e => setDriftSpeed(parseFloat(e.target.value))}
          />

          {/* Particle Count — note: changing this rebuilds the geometry */}
          <label>
            <span>Particles</span>
            <span className="value-badge">{particleCount.toLocaleString()}</span>
          </label>
          <input
            type="range" min="1000" max="20000" step="500"
            value={particleCount}
            onChange={e => setParticleCount(parseInt(e.target.value))}
          />

          {/* Palette */}
          <label><span>Palette</span></label>
          <div className="palette-grid">
            {Object.entries(PALETTES).map(([key, pal]) => (
              <button
                key={key}
                className={`palette-btn ${palette === key ? 'active' : ''}`}
                onClick={() => setPalette(key)}
                title={pal.label}
                style={{
                  background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary}, ${pal.core})`
                }}
              >
                <span>{pal.label}</span>
              </button>
            ))}
          </div>

          {/* Preset buttons */}
          <div className="preset-row">
            <button className="preset-btn" onClick={savePreset}>
              ↓ Save Preset
            </button>
            <label className="preset-btn load-btn">
              ↑ Load Preset
              <input type="file" accept=".json" onChange={loadPreset} hidden />
            </label>
          </div>

        </div>
      )}
    </div>
  )
}
