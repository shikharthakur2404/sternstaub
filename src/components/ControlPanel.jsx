// ─────────────────────────────────────────────────────────────────────────────
// ControlPanel.jsx — floating glassmorphism control panel
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PALETTES } from '../config/palettes'
import './ControlPanel.css'

export default function ControlPanel({
  dispersion,    setDispersion,
  driftSpeed,    setDriftSpeed,
  particleCount, setParticleCount,
  palette,       setPalette,
  onReset,
}) {
  const [isOpen, setIsOpen] = useState(true)

  const savePreset = () => {
    const preset = { dispersion, driftSpeed, particleCount, palette }
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `sternstaub-${Date.now()}.json`
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
        if (p.dispersion    != null) setDispersion(p.dispersion)
        if (p.driftSpeed    != null) setDriftSpeed(p.driftSpeed)
        if (p.particleCount != null) setParticleCount(p.particleCount)
        if (p.palette       != null) setPalette(p.palette)
      } catch { alert('Invalid preset file.') }
    }
    reader.readAsText(file)
  }

  return (
    <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="panel-header">
        <span className="panel-title">✦ sternstaub</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="icon-btn" onClick={onReset} title="Reset">↺</button>
          <button className="icon-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '−' : '+'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="panel-body">

          <label>
            <span>Dispersion</span>
            <span className="value-badge">{dispersion.toFixed(1)}</span>
          </label>
          <input type="range" min="0" max="3" step="0.1"
            value={dispersion}
            onChange={e => setDispersion(parseFloat(e.target.value))} />

          <label>
            <span>Drift Speed</span>
            <span className="value-badge">{driftSpeed.toFixed(1)}</span>
          </label>
          <input type="range" min="0.1" max="5" step="0.1"
            value={driftSpeed}
            onChange={e => setDriftSpeed(parseFloat(e.target.value))} />

          <label>
            <span>Particles</span>
            <span className="value-badge">{particleCount.toLocaleString()}</span>
          </label>
          <input type="range" min="500" max="5000" step="100"
            value={particleCount}
            onChange={e => setParticleCount(parseInt(e.target.value))} />

          <label><span>Palette</span></label>
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

          <div className="preset-row">
            <button className="preset-btn" onClick={savePreset}>↓ Save</button>
            <label className="preset-btn load-btn">
              ↑ Load
              <input type="file" accept=".json" onChange={loadPreset} hidden />
            </label>
          </div>

        </div>
      )}
    </div>
  )
}
