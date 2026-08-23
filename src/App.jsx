// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — root component, wires everything together
//
// State lives here and flows down as props to:
//   - ControlPanel (reads + sets state via sliders)
//   - CosmicScene → ParticleCloud (reads state to render the 3D scene)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, Suspense } from 'react'
import { Canvas }             from '@react-three/fiber'
import { OrbitControls }      from '@react-three/drei'
import ParticleCloud          from './components/ParticleCloud'
import ControlPanel           from './components/ControlPanel'
import './App.css'

// Load the default preset to initialize state
import defaultPreset from './presets/default.json'

export default function App() {

  // ── All tunable parameters live here ─────────────────────────────────────
  const [dispersion,    setDispersion]    = useState(defaultPreset.dispersion)
  const [driftSpeed,    setDriftSpeed]    = useState(defaultPreset.driftSpeed)
  const [particleCount, setParticleCount] = useState(defaultPreset.particleCount)
  const [palette,       setPalette]       = useState(defaultPreset.palette)

  return (
    <div className="app">

      {/* ── 3D Canvas — fills the entire screen ── */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 60 }}
        style={{ background: '#000008' }}  // deep space near-black
        gl={{ antialias: true, alpha: false }}
      >
        {/* Suspense while shaders/geometry load */}
        <Suspense fallback={null}>
          <ParticleCloud
            dispersion={dispersion}
            driftSpeed={driftSpeed}
            particleCount={particleCount}
            palette={palette}
          />
        </Suspense>

        {/* Let the user orbit/zoom the particle cloud with mouse */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>

      {/* ── Floating control panel overlay ── */}
      <ControlPanel
        dispersion={dispersion}
        driftSpeed={driftSpeed}
        particleCount={particleCount}
        palette={palette}
        setDispersion={setDispersion}
        setDriftSpeed={setDriftSpeed}
        setParticleCount={setParticleCount}
        setPalette={setPalette}
      />

    </div>
  )
}
