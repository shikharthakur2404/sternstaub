// ─────────────────────────────────────────────────────────────────────────────
// exosystemGenerator.js — TRAPPIST-1 Red Dwarf Exoplanetary System
// Authentic astrophysical simulation of the famous 7 Earth-sized rocky planets
// (b, c, d, e, f, g, h) in Laplace orbital resonance orbiting an ultra-cool
// M8V red dwarf host star featuring magnetic coronal prominence loops.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { createAtmosphereMesh } from './atmosphereShader.js'
import {
  createRedDwarfTexture,
  createTrappist1bTexture,
  createTrappist1cTexture,
  createTrappist1dTexture,
  createTrappist1eTexture,
  createTrappist1fTexture,
  createTrappist1gTexture,
  createTrappist1hTexture,
} from './proceduralTextures.js'

export const EXOPLANET_CONFIG = [
  {
    id: 'trappist_1b',
    name: 'TRAPPIST-1b (Molten Furnace)',
    type: 'Ultra-Hot Volcanic Basalt',
    desc: 'Period: 1.51 d • Temp: 750 K • Tidally locked volcanic lava caldera & magma fissures',
    r: 3.6,
    dist: 44,
    speed: 0.046,
    tilt: 0.01,
    roughness: 0.95,
    metalness: 0.1,
    hasAtmosphere: false,
    orbitColor: 0xef4444,
    getTexture: createTrappist1bTexture,
    moons: [],
  },
  {
    id: 'trappist_1c',
    name: 'TRAPPIST-1c (Scorched Desert)',
    type: 'Super-Venusian Regolith',
    desc: 'Period: 2.42 d • Temp: 580 K • Scorched silicate crust, deep tectonic rifts & dust dunes',
    r: 3.5,
    dist: 60,
    speed: 0.034,
    tilt: 0.02,
    roughness: 0.85,
    metalness: 0.15,
    hasAtmosphere: true,
    atmoColor: 0xf59e0b,
    atmoOpacity: 0.16,
    orbitColor: 0xf97316,
    getTexture: createTrappist1cTexture,
    moons: [],
  },
  {
    id: 'trappist_1d',
    name: 'TRAPPIST-1d (Twilight Borderland)',
    type: 'Habitable Zone Inner Transition',
    desc: 'Period: 4.05 d • Temp: 288 K • Sub-stellar desert, narrow twilight ocean & dark-side frost',
    r: 2.8,
    dist: 84,
    speed: 0.024,
    tilt: 0.04,
    roughness: 0.50,
    metalness: 0.18,
    hasAtmosphere: true,
    atmoColor: 0x38bdf8,
    atmoOpacity: 0.22,
    orbitColor: 0x38bdf8,
    getTexture: createTrappist1dTexture,
    moons: [],
  },
  {
    id: 'trappist_1e',
    name: 'TRAPPIST-1e (Habitable Eyeball Earth)',
    type: 'Prime Habitable Eyeball World',
    desc: 'Period: 6.10 d • Temp: 251 K • Deep liquid ocean, infrared crimson flora, hurricane & ice shield',
    r: 3.2,
    dist: 114,
    speed: 0.018,
    tilt: 0.05,
    roughness: 0.32,
    metalness: 0.22,
    hasAtmosphere: true,
    atmoColor: 0x0284c7,
    atmoOpacity: 0.30,
    hasClouds: true,
    orbitColor: 0x22c55e,
    getTexture: createTrappist1eTexture,
    moons: [],
  },
  {
    id: 'trappist_1f',
    name: 'TRAPPIST-1f (Volatile Oceanus)',
    type: 'Habitable Zone Ocean World',
    desc: 'Period: 9.21 d • Temp: 219 K • Deep global sapphire ocean, island archipelagos & creeping ice caps',
    r: 3.4,
    dist: 152,
    speed: 0.013,
    tilt: 0.06,
    roughness: 0.28,
    metalness: 0.12,
    hasAtmosphere: true,
    atmoColor: 0x0ea5e9,
    atmoOpacity: 0.25,
    hasClouds: true,
    orbitColor: 0x06b6d4,
    getTexture: createTrappist1fTexture,
    moons: [],
  },
  {
    id: 'trappist_1g',
    name: 'TRAPPIST-1g (Glacial Super-Earth)',
    type: 'Glacial Ocean / Sub-Neptune Border',
    desc: 'Period: 12.35 d • Temp: 198 K • Pack-ice shelves, slush waterways, cryo-rifts & cyan haze',
    r: 3.7,
    dist: 194,
    speed: 0.010,
    tilt: 0.08,
    roughness: 0.25,
    metalness: 0.25,
    hasAtmosphere: true,
    atmoColor: 0xa5f3fc,
    atmoOpacity: 0.20,
    orbitColor: 0xa855f7,
    getTexture: createTrappist1gTexture,
    moons: [],
  },
  {
    id: 'trappist_1h',
    name: 'TRAPPIST-1h (Frigid Snowball)',
    type: 'Outer Nitrogen Ice Dwarf',
    desc: 'Period: 20.00 d • Temp: 173 K • Perpetual nitrogen/methane ice sheets & cryo-frost dunes',
    r: 2.6,
    dist: 242,
    speed: 0.007,
    tilt: 0.12,
    roughness: 0.20,
    metalness: 0.30,
    inclination: 0.04,
    orbitColor: 0xc084fc,
    getTexture: createTrappist1hTexture,
    moons: [],
  },
]

/**
 * Constructs the authentic TRAPPIST-1 Exoplanetary System.
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
  const geometriesToDispose = []
  const materialsToDispose = []

  // ── 1. Central Host Star (TRAPPIST-1 M8V Ultra-Cool Red Dwarf) ────────────
  const starTexture = createRedDwarfTexture()
  texturesToDispose.push(starTexture)

  const starGeo = new THREE.SphereGeometry(16, 48, 48)
  geometriesToDispose.push(starGeo)
  const starMat = new THREE.MeshBasicMaterial({ map: starTexture })
  materialsToDispose.push(starMat)
  const starMesh = new THREE.Mesh(starGeo, starMat)
  exosystemGroup.add(starMesh)

  // Inner Ruby Plasma Corona Shell
  const innerCoronaGeo = new THREE.SphereGeometry(17.8, 32, 32)
  geometriesToDispose.push(innerCoronaGeo)
  const innerCoronaMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.40,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  materialsToDispose.push(innerCoronaMat)
  const innerCoronaMesh = new THREE.Mesh(innerCoronaGeo, innerCoronaMat)
  starMesh.add(innerCoronaMesh)

  // Outer Flaring Atmosphere Halo
  const outerCoronaGeo = new THREE.SphereGeometry(21.5, 32, 32)
  geometriesToDispose.push(outerCoronaGeo)
  const outerCoronaMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  materialsToDispose.push(outerCoronaMat)
  const outerCoronaMesh = new THREE.Mesh(outerCoronaGeo, outerCoronaMat)
  starMesh.add(outerCoronaMesh)

  // Dynamic Magnetic Coronal Prominence Loops (Arched Plasma Jets)
  const prominenceLoops = []
  const prominenceMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
  })
  materialsToDispose.push(prominenceMat)

  const createProminenceLoop = (angle, h, span) => {
    const loopGroup = new THREE.Group()
    loopGroup.rotation.y = angle
    loopGroup.rotation.z = (Math.random() - 0.5) * 0.6

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(15.5, -span, 0),
      new THREE.Vector3(15.5 + h, 0, (Math.random() - 0.5) * 2),
      new THREE.Vector3(15.5, span, 0)
    )
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.45, 8, false)
    geometriesToDispose.push(tubeGeo)
    const tube = new THREE.Mesh(tubeGeo, prominenceMat)
    loopGroup.add(tube)
    starMesh.add(loopGroup)
    prominenceLoops.push({ group: loopGroup, speed: 0.3 + Math.random() * 0.4 })
  }

  createProminenceLoop(0.4, 4.2, 3.2)
  createProminenceLoop(1.8, 5.5, 4.0)
  createProminenceLoop(3.4, 3.8, 2.8)
  createProminenceLoop(4.9, 4.8, 3.6)

  // Local M-dwarf Red/Warm PointLight (dimmer, deep warm crimson-orange)
  const localLight = new THREE.PointLight(0xff6b6b, 3.4, 2800, 0.35)
  localLight.position.set(0, 0, 0)
  exosystemGroup.add(localLight)

  starMesh.userData = {
    id: 'trappist_star',
    name: '2MASS J23062928-0502285 (TRAPPIST-1)',
    desc: 'M8V Ultra-Cool Red Dwarf • Teff: 2566 K • Intense Magnetic Prominences & Flares',
    radius: 16,
    mesh: starMesh,
    systemGroup: exosystemGroup,
  }
  raycastTargets.push(starMesh)

  // ── 2. The 7 Terrestrial Worlds in Laplace Resonance ───────────────────────
  EXOPLANET_CONFIG.forEach(p => {
    // Crisp Orbital Trace Ring
    const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, Math.PI * 2, false, 0)
    const points = orbitCurve.getPoints(120)
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
    )
    geometriesToDispose.push(orbitGeo)
    const orbitMat = new THREE.LineBasicMaterial({
      color: p.orbitColor || 0x38bdf8,
      transparent: true,
      opacity: p.id === 'trappist_1e' ? 0.35 : 0.18,
    })
    materialsToDispose.push(orbitMat)
    const orbitLine = new THREE.Line(orbitGeo, orbitMat)
    if (p.inclination) orbitLine.rotation.x = p.inclination
    exosystemGroup.add(orbitLine)

    // Orbital Pivot
    const pivot = new THREE.Group()
    if (p.inclination) pivot.rotation.x = p.inclination
    exosystemGroup.add(pivot)

    // Planet Sphere Mesh
    const pTex = p.getTexture()
    texturesToDispose.push(pTex)

    const pGeo = new THREE.SphereGeometry(p.r, 48, 48)
    geometriesToDispose.push(pGeo)
    const pMat = new THREE.MeshStandardMaterial({
      map: pTex,
      roughness: p.roughness,
      metalness: p.metalness,
    })
    materialsToDispose.push(pMat)
    const pMesh = new THREE.Mesh(pGeo, pMat)
    pMesh.rotation.z = p.tilt
    pMesh.position.x = p.dist

    pMesh.userData = {
      id: p.id,
      name: p.name,
      desc: p.desc,
      radius: p.r,
      mesh: pMesh,
      systemGroup: exosystemGroup,
    }
    pivot.add(pMesh)
    raycastTargets.push(pMesh)

    // Physical Rayleigh + Mie Atmospheric Scattering Shell
    let atmoObj = null
    if (p.hasAtmosphere) {
      atmoObj = createAtmosphereMesh({
        radius: p.r,
        atmosphereScale: 1.04,
        dayColor: p.atmoColor,
        sunsetTint: 0xf59e0b,
        density: p.id === 'trappist_1e' ? 1.5 : 1.1,
        rimPower: 3.0,
      })
      atmoObj.updateSunPosition(EXOSYSTEM_POS)
      materialsToDispose.push(atmoObj.material)
      geometriesToDispose.push(atmoObj.mesh.geometry)
      pMesh.add(atmoObj.mesh)
    }

    // Swirling Cloud Shell for Habitable Worlds (1e & 1f)
    let cloudMesh = null
    if (p.hasClouds) {
      const cloudGeo = new THREE.SphereGeometry(p.r * 1.015, 36, 36)
      geometriesToDispose.push(cloudGeo)
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.9,
      })
      materialsToDispose.push(cloudMat)
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
      pMesh.add(cloudMesh)
    }

    exoplanetObjects.push({
      data: p,
      pivot,
      mesh: pMesh,
      cloudMesh,
      moons: [],
      angle: Math.random() * Math.PI * 2,
    })
  })

  // ── 3. Animation Loop Handler ─────────────────────────────────────────────
  let flareTimer = 0

  const updateExosystem = (delta, speedMult) => {
    // Star Convective Rotation & Corona
    starMesh.rotation.y += 0.002 * speedMult
    innerCoronaMesh.rotation.y -= 0.003 * speedMult
    outerCoronaMesh.rotation.y += 0.001 * speedMult

    // Coronal Prominence Loop Flutter
    flareTimer += delta * speedMult
    prominenceLoops.forEach(l => {
      l.group.rotation.x = Math.sin(flareTimer * l.speed) * 0.12
    })

    // Advance 7 Resonant Terrestrial Planets
    exoplanetObjects.forEach(po => {
      // Advance Keplerian resonance orbit
      po.angle += po.data.speed * delta * 2.2 * speedMult
      po.mesh.position.x = Math.cos(po.angle) * po.data.dist
      po.mesh.position.z = Math.sin(po.angle) * po.data.dist

      // Authentic 1:1 Tidal Locking: sub-stellar hemisphere permanently faces host star
      po.mesh.rotation.y = -po.angle + Math.PI / 2

      // Cloud drift relative to locked surface
      if (po.cloudMesh) {
        po.cloudMesh.rotation.y += 0.004 * speedMult
      }
    })
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
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
