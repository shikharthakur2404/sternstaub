// ─────────────────────────────────────────────────────────────────────────────
// ParticleCloud.jsx — the actual 3D particle system
//
// This component does 3 things:
//   1. Generates the particle positions (on a sphere surface, randomized)
//   2. Writes a custom GLSL shader that animates them
//   3. Updates shader uniforms every frame via useFrame()
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'
import { PALETTES }        from '../config/palettes'

// Import GLSL shader source files as raw strings
// Vite handles this via the ?raw suffix
import vertexShader   from '../shaders/vertex.glsl?raw'
import fragmentShader from '../shaders/fragment.glsl?raw'

// ─── Props ────────────────────────────────────────────────────────────────────
// dispersion    : 0–1   how spread out particles are from the origin
// driftSpeed    : 0–2   how fast the organic drift animation moves
// particleCount : number how many particles to spawn
// palette       : string key from PALETTES object
// ─────────────────────────────────────────────────────────────────────────────

export default function ParticleCloud({
  dispersion    = 0.4,
  driftSpeed    = 0.6,
  particleCount = 8000,
  palette       = 'cosmicBlue',
}) {

  // Refs to the Three.js objects so we can mutate them in useFrame
  const pointsRef   = useRef()
  const materialRef = useRef()

  // ── Generate particle data ────────────────────────────────────────────────
  // useMemo ensures this only re-runs when particleCount changes,
  // not on every render (which would be very slow).
  const { positions, scales, offsets } = useMemo(() => {

    const positions = new Float32Array(particleCount * 3)  // x, y, z per particle
    const scales    = new Float32Array(particleCount)      // size per particle
    const offsets   = new Float32Array(particleCount * 3)  // drift direction per particle

    for (let i = 0; i < particleCount; i++) {
      // Place particles on the surface of a sphere using spherical coordinates.
      // This gives the characteristic "human body shaped cloud" when dispersed.
      const radius = 1.0 + Math.random() * 0.5   // slight radius variation for depth
      const theta  = Math.random() * Math.PI * 2  // horizontal angle 0–360°
      const phi    = Math.acos(2 * Math.random() - 1) // vertical angle, uniform distribution

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Random scale — some particles are bigger for visual variation
      scales[i] = Math.random() * 2.5 + 0.5

      // Offset is a random unit vector — used as the drift direction in the shader
      // This ensures each particle drifts in a unique direction
      const ox = (Math.random() - 0.5) * 2
      const oy = (Math.random() - 0.5) * 2
      const oz = (Math.random() - 0.5) * 2
      const len = Math.sqrt(ox*ox + oy*oy + oz*oz)
      offsets[i * 3]     = ox / len
      offsets[i * 3 + 1] = oy / len
      offsets[i * 3 + 2] = oz / len
    }

    return { positions, scales, offsets }
  }, [particleCount])

  // ── Shader uniforms ───────────────────────────────────────────────────────
  // These are the "variables" we pass to GLSL. They update every frame.
  // useMemo so the object isn't recreated on every render.
  const uniforms = useMemo(() => ({
    uTime:           { value: 0 },
    uDispersion:     { value: dispersion },
    uDriftSpeed:     { value: driftSpeed },
    uColorPrimary:   { value: new THREE.Color(PALETTES[palette].primary) },
    uColorSecondary: { value: new THREE.Color(PALETTES[palette].secondary) },
    uColorCore:      { value: new THREE.Color(PALETTES[palette].core) },
  }), []) // intentionally empty — we update values imperatively in useFrame

  // ── Animation loop ────────────────────────────────────────────────────────
  // useFrame runs every frame (60fps). We update uniforms here instead of
  // re-rendering React, which keeps the animation smooth.
  useFrame(({ clock }) => {
    if (!materialRef.current) return

    const mat = materialRef.current.uniforms

    // Push current time into shader so it can animate
    mat.uTime.value         = clock.getElapsedTime()

    // Sync slider values from React state into shader
    mat.uDispersion.value   = dispersion
    mat.uDriftSpeed.value   = driftSpeed

    // Sync palette colors
    const colors = PALETTES[palette]
    mat.uColorPrimary.value.set(colors.primary)
    mat.uColorSecondary.value.set(colors.secondary)
    mat.uColorCore.value.set(colors.core)

    // Slowly rotate the entire particle cloud for a living feel
    if (pointsRef.current) {
      const t = clock.getElapsedTime()
      pointsRef.current.rotation.y = t * 0.04 * driftSpeed
      pointsRef.current.rotation.x = t * 0.015 * driftSpeed
    }
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <points ref={pointsRef}>

      {/* The geometry: just a bag of points in 3D space */}
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale"   args={[scales, 1]} />
        <bufferAttribute attach="attributes-aOffset"  args={[offsets, 3]} />
      </bufferGeometry>

      {/* The material: our custom GLSL shaders */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}  // overlapping particles get brighter, like real light
      />

    </points>
  )
}
