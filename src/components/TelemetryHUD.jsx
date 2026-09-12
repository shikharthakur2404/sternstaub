// ─────────────────────────────────────────────────────────────────────────────
// TelemetryHUD.jsx — Left Astrometric Dossier & System Diagnostics
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import './TelemetryHUD.css'

const DOSSIERS = {
  solar: {
    tag: 'ORRERY KINEMATICS',
    title: 'Keplerian Solar System',
    metrics: [
      { label: 'Primary Star', value: 'Sol (G2V · Core R=26)' },
      { label: 'Planetary Array', value: '8 Orbits (Mercury → Neptune)' },
      { label: 'Main Belt', value: 'Toroidal Asteroid Swarm' },
      { label: 'Ring System', value: 'Saturnian Planar Disc (28° Tilt)' },
      { label: 'Eccentric Probe', value: 'Parabolic Comet (e=0.84)' },
      { label: 'Orbital Law', value: 'Harmonic Velocity (ω ∝ r⁻¹˙³)' },
    ],
  },
  silhouette: {
    tag: 'BI-HARMONIC FIELD',
    title: 'Astral Silhouette',
    metrics: [
      { label: 'Anatomical Form', value: 'Parametric Human Contour' },
      { label: 'Cranial Crown', value: 'Halo Ring (R=32px)' },
      { label: 'Energy Axis', value: 'Dense Spinal Chakra Line' },
      { label: 'Deltoid Span', value: 'Sculpted Clavicle & Waist' },
      { label: 'Extremities', value: 'Ascending Stardust Vapor' },
      { label: 'Drift Physics', value: 'Dual Sin/Cos Trig Oscillator' },
    ],
  },
  singularity: {
    tag: 'RELATIVISTIC METRIC',
    title: 'Cosmic Singularity',
    metrics: [
      { label: 'Central Core', value: 'Schwarzschild Event Horizon' },
      { label: 'Photon Sphere', value: 'Relativistic Ring (R=32px)' },
      { label: 'Accretion Disk', value: 'Doppler-Shifted Plasma Spiral' },
      { label: 'Relativistic Jets', value: 'Bipolar Vertical Beam Outflow' },
      { label: 'Spacetime Curvature', value: 'Gravitational Frame Dragging' },
      { label: 'Singularity State', value: 'Zero Density Abyss' },
    ],
  },
  galaxy: {
    tag: 'MILKY WAY MORPHOLOGY',
    title: 'Spiral Galaxy',
    metrics: [
      { label: 'Morphology', value: 'Dual-Arm Logarithmic (Sb Type)' },
      { label: 'Spiral Law', value: 'r = 30 · exp(0.42 · θ)' },
      { label: 'Galactic Bulge', value: 'Supermassive Stellar Nucleus' },
      { label: 'Disk Inclination', value: '62° Oblique Perspective' },
      { label: 'Stellar Halo', value: 'Dispersed Globular Clusters' },
      { label: 'Rotational Velocity', value: 'Non-Keplerian Flat Curve' },
    ],
  },
  torus: {
    tag: 'MAGNETOHYDRODYNAMICS',
    title: 'Quantum Magnetic Torus',
    metrics: [
      { label: 'Field Geometry', value: 'Toroidal Magnetic Flux Knot' },
      { label: 'Major Radius', value: 'R = 115 px' },
      { label: 'Minor Radius', value: 'r = 48 px' },
      { label: 'Projection', value: 'Isometric 3D Euler Space' },
      { label: 'Field Continuity', value: 'Closed-Loop Dynamo Vector' },
      { label: 'Harmonic Knot', value: 'Dual-Frequency Circulation' },
    ],
  },
}

export default function TelemetryHUD({ shape, particleCount, exposure }) {
  const [isOpen, setIsOpen] = useState(true)

  const dossier = DOSSIERS[shape] || DOSSIERS.silhouette

  return (
    <aside className={`telemetry-hud ${isOpen ? 'open' : 'closed'}`} aria-label="Astrometric Telemetry">
      <div className="telemetry-header">
        <div className="telemetry-brand">
          <span className="telemetry-radar" aria-hidden="true" />
          <span className="telemetry-title">ASTROMETRIC TELEMETRY</span>
        </div>
        <button
          className={`telemetry-toggle-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse Telemetry' : 'Expand Telemetry'}
        >
          <span className="telemetry-chevron">‹</span>
        </button>
      </div>

      <div className={`telemetry-collapse ${isOpen ? 'expanded' : ''}`}>
        <div className="telemetry-inner">
          <div className="telemetry-body">
            {/* Active Celestial Object Dossier */}
            <div className="dossier-card">
              <div className="dossier-tag">{dossier.tag}</div>
              <div className="dossier-title">{dossier.title}</div>
              <div className="dossier-grid">
                {dossier.metrics.map((m, i) => (
                  <div key={i} className="dossier-item">
                    <span className="dossier-label">{m.label}</span>
                    <span className="dossier-val">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engine Core Diagnostics */}
            <div className="diagnostics-card">
              <div className="diag-header">
                <span>SYSTEM ARCHITECTURE</span>
                <span className="status-pill">NOMINAL</span>
              </div>
              <div className="diag-grid">
                <div className="diag-item">
                  <span className="diag-label">PIPELINE</span>
                  <span className="diag-val">OffscreenCanvas</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">RENDER THREAD</span>
                  <span className="diag-val">Web Worker (0% UI Lag)</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">BLIT MODE</span>
                  <span className="diag-val">Additive ("lighter")</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">ACTIVE NODES</span>
                  <span className="diag-val">{particleCount.toLocaleString()}</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">EXPOSURE</span>
                  <span className="diag-val">{exposure.toFixed(2)}x Dynamic HDR</span>
                </div>
              </div>
            </div>

            {/* Keybindings Footer */}
            <div className="telemetry-hotkeys">
              <span>KEYBINDINGS</span>
              <div className="hotkey-list">
                <span className="hotkey-item"><kbd>CLICK</kbd> Supernova Nova</span>
                <span className="hotkey-item"><kbd>H</kbd> Toggle HUD</span>
                <span className="hotkey-item"><kbd>F</kbd> Fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
