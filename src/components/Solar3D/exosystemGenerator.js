// ─────────────────────────────────────────────────────────────────────────────
// exosystemGenerator.js — TRAPPIST-1 Red Dwarf Exoplanetary System
// 5 authentic exoplanetary archetypes (Lava World, Eyeball Ocean, Methane Super-Earth,
// Ringed Giant, Cryo-Ice World) orbiting an ultra-cool M-dwarf host star
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import {
  createRedDwarfTexture,
  createLavaWorldTexture,
  createEyeballOceanTexture,
  createMethaneAtmosphereTexture,
  createRingedGasGiantTexture,
  createExoRingTexture,
  createCryoIceTexture,
} from './proceduralTextures.js'

export const EXOPLANET_CONFIG = [
  {
    id: 'pyroclast',
    name: 'Pyroclast (Trappist-1b)',
    type: 'Molten Lava World',
    r: 3.8,
    dist: 52,
    speed: 0.038,
    tilt: 0.02,
    rot: 0.012,
    roughness: 0.95,
    metalness: 0.1,
    getTexture: createLavaWorldTexture,
    moons: [],
  },
  {
    id: 'aethelgard',
    name: 'Aethelgard (Trappist-1d)',
    type: 'Habitable Eyeball Ocean',
    r: 5.0,
    dist: 88,
    speed: 0.024,
    tilt: 0.12,
    rot: 0.010,
    roughness: 0.35,
    metalness: 0.15,
    hasAtmosphere: true,
    atmoColor: 0x38bdf8,
    atmoOpacity: 0.22,
    getTexture: createEyeballOceanTexture,
    moons: [
      { id: 'solis', name: 'Solis (Tidal Moon)', r: 1.1, dist: 12.5, speed: 2.2, color: 0xcbd5e1 },
    ],
  },
  {
    id: 'zephyrus',
    name: 'Zephyrus (Trappist-1e)',
    type: 'Methane Super-Earth',
    r: 5.4,
    dist: 135,
    speed: 0.016,
    tilt: 0.25,
    rot: 0.020,
    roughness: 0.5,
    metalness: 0.05,
    hasAtmosphere: true,
    atmoColor: 0x2dd4bf,
    atmoOpacity: 0.25,
    getTexture: createMethaneAtmosphereTexture,
    moons: [],
  },
  {
    id: 'chronos',
    name: 'Chronos (Trappist-1f)',
    type: 'Ringed Gas Giant',
    r: 12.0,
    dist: 195,
    speed: 0.010,
    tilt: 0.48,
    rot: 0.032,
    roughness: 0.65,
    metalness: 0.0,
    hasRings: true,
    getTexture: createRingedGasGiantTexture,
    moons: [
      { id: 'kore', name: 'Kore (Silicate Moon)', r: 1.2, dist: 24, speed: 2.5, color: 0xe2e8f0 },
      { id: 'styx', name: 'Styx (Captured Asteroid)', r: 0.75, dist: 33, speed: 1.6, color: 0x78716c, scale: [1.3, 0.8, 0.9] },
    ],
  },
  {
    id: 'nix',
    name: 'Nix (Trappist-1g)',
    type: 'Cryo-Ice Dwarf',
    r: 4.2,
    dist: 260,
    speed: 0.007,
    tilt: 0.35,
    rot: 0.009,
    roughness: 0.25,
    metalness: 0.2,
    inclination: 0.12,
    getTexture: createCryoIceTexture,
    moons: [],
  },
]

/**
 * Constructs the secondary exoplanetary system.
 */
export function createExosystem() {
  const exosystemGroup = new THREE.Group()
  exosystemGroup.name = 'trappist-exosystem'

  // Positioned across the local interstellar gulf
  const EXOSYSTEM_POS = new THREE.Vector3(-6500, 600, 5800)
  exosystemGroup.position.copy(EXOSYSTEM_POS)

  const raycastTargets = []
  const exoplanetObjects = []
  const texturesToDispose = []

  // ── 1. Central Host Star (Astraeus / TRAPPIST-1 M-Dwarf) ───────────────────
  const starTexture = createRedDwarfTexture()
  texturesToDispose.push(starTexture)

  const starGeo = new THREE.SphereGeometry(18, 48, 48)
  const starMat = new THREE.MeshBasicMaterial({ map: starTexture })
  const starMesh = new THREE.Mesh(starGeo, starMat)
  exosystemGroup.add(starMesh)

  // Inner Ruby Plasma Corona
  const innerCoronaGeo = new THREE.SphereGeometry(19.6, 32, 32)
  const innerCoronaMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  const innerCoronaMesh = new THREE.Mesh(innerCoronaGeo, innerCoronaMat)
  starMesh.add(innerCoronaMesh)

  // Outer Flaring Halo
  const outerCoronaGeo = new THREE.SphereGeometry(22.8, 32, 32)
  const outerCoronaMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  const outerCoronaMesh = new THREE.Mesh(outerCoronaGeo, outerCoronaMat)
  starMesh.add(outerCoronaMesh)

  // Local M-dwarf Red/Warm PointLight
  const localLight = new THREE.PointLight(0xfca5a5, 2.8, 2400, 0.4)
  localLight.position.set(0, 0, 0)
  exosystemGroup.add(localLight)

  starMesh.userData = {
    id: 'trappist_star',
    name: 'Astraeus (TRAPPIST-1 Star)',
    radius: 18,
    mesh: starMesh,
    systemGroup: exosystemGroup,
  }
  raycastTargets.push(starMesh)

  // ── 2. Exoplanet Assembly ──────────────────────────────────────────────────
  const ringTexture = createExoRingTexture()
  texturesToDispose.push(ringTexture)

  EXOPLANET_CONFIG.forEach(p => {
    // Orbital guide track
    const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, Math.PI * 2, false, 0)
    const points = orbitCurve.getPoints(120)
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
    )
    const orbitMat = new THREE.LineBasicMaterial({
      color: p.id === 'aethelgard' ? 0x38bdf8 : 0xf87171,
      transparent: true,
      opacity: p.id === 'aethelgard' ? 0.28 : 0.14,
    })
    const orbitLine = new THREE.Line(orbitGeo, orbitMat)
    if (p.inclination) orbitLine.rotation.x = p.inclination
    exosystemGroup.add(orbitLine)

    // Orbital Pivot
    const pivot = new THREE.Group()
    if (p.inclination) pivot.rotation.x = p.inclination
    exosystemGroup.add(pivot)

    // Planetary Sphere Mesh
    const pTex = p.getTexture()
    texturesToDispose.push(pTex)

    const pGeo = new THREE.SphereGeometry(p.r, 48, 48)
    const pMat = new THREE.MeshStandardMaterial({
      map: pTex,
      roughness: p.roughness,
      metalness: p.metalness,
    })
    const pMesh = new THREE.Mesh(pGeo, pMat)
    pMesh.rotation.z = p.tilt
    pMesh.position.x = p.dist

    pMesh.userData = {
      id: p.id,
      name: p.name,
      radius: p.r,
      mesh: pMesh,
      systemGroup: exosystemGroup,
    }
    pivot.add(pMesh)
    raycastTargets.push(pMesh)

    // Atmospheric Glow
    if (p.hasAtmosphere) {
      const atmoGeo = new THREE.SphereGeometry(p.r * 1.03, 36, 36)
      const atmoMat = new THREE.MeshBasicMaterial({
        color: p.atmoColor,
        transparent: true,
        opacity: p.atmoOpacity,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      })
      pMesh.add(new THREE.Mesh(atmoGeo, atmoMat))
    }

    // Planetary Rings
    if (p.hasRings) {
      const innerR = p.r * 1.35
      const outerR = p.r * 2.65
      const rGeo = new THREE.RingGeometry(innerR, outerR, 64)
      const pos = rGeo.attributes.position
      const uv = rGeo.attributes.uv
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i)
        const vy = pos.getY(i)
        const d = Math.sqrt(vx * vx + vy * vy)
        const norm = (d - innerR) / (outerR - innerR)
        uv.setXY(i, norm, 0.5)
      }
      rGeo.rotateX(Math.PI / 2)
      const rMat = new THREE.MeshStandardMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        roughness: 0.5,
      })
      const ringMesh = new THREE.Mesh(rGeo, rMat)
      pMesh.add(ringMesh)
    }

    // Exomoon Satellites
    const moonObjects = []
    p.moons.forEach(m => {
      const mOrbitGeo = new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, m.dist, m.dist, 0, Math.PI * 2)
          .getPoints(40)
          .map(pt => new THREE.Vector3(pt.x, 0, pt.y))
      )
      pMesh.add(new THREE.Line(
        mOrbitGeo,
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.12 })
      ))

      const mGeo = new THREE.SphereGeometry(m.r, 24, 24)
      const mMat = new THREE.MeshStandardMaterial({
        color: m.color,
        roughness: 0.85,
        metalness: 0.05,
      })
      const mMesh = new THREE.Mesh(mGeo, mMat)
      if (m.scale) mMesh.scale.set(...m.scale)

      const initialAngle = Math.random() * Math.PI * 2
      mMesh.position.set(Math.cos(initialAngle) * m.dist, 0, Math.sin(initialAngle) * m.dist)

      mMesh.userData = {
        id: m.id,
        name: `${p.name} • ${m.name}`,
        radius: m.r,
        mesh: mMesh,
        isMoon: true,
        systemGroup: exosystemGroup,
      }
      pMesh.add(mMesh)
      raycastTargets.push(mMesh)

      moonObjects.push({
        data: m,
        mesh: mMesh,
        angle: initialAngle,
      })
    })

    exoplanetObjects.push({
      data: p,
      pivot,
      mesh: pMesh,
      moons: moonObjects,
      angle: Math.random() * Math.PI * 2,
    })
  })

  // Update animation loop handler
  const updateExosystem = (delta, speedMult) => {
    starMesh.rotation.y += 0.002 * speedMult
    innerCoronaMesh.rotation.y -= 0.003 * speedMult
    outerCoronaMesh.rotation.y += 0.001 * speedMult

    exoplanetObjects.forEach(po => {
      po.angle += po.data.speed * delta * 2.2 * speedMult
      po.mesh.position.x = Math.cos(po.angle) * po.data.dist
      po.mesh.position.z = Math.sin(po.angle) * po.data.dist
      po.mesh.rotation.y += po.data.rot * speedMult

      po.moons.forEach(mo => {
        mo.angle += mo.data.speed * delta * 2.2 * speedMult
        mo.mesh.position.x = Math.cos(mo.angle) * mo.data.dist
        mo.mesh.position.z = Math.sin(mo.angle) * mo.data.dist
        mo.mesh.rotation.y += 0.015 * speedMult
      })
    })
  }

  const dispose = () => {
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: exosystemGroup,
    starMesh,
    raycastTargets,
    exoplanetObjects,
    updateExosystem,
    dispose,
    position: EXOSYSTEM_POS,
  }
}
