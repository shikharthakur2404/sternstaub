// ─────────────────────────────────────────────────────────────────────────────
// exosystemGenerator.js — TRAPPIST-1 Numerical Simulation & Observational System
// Driven by the underlying SimulationCore: Keplerian state vectors, Laplace
// resonance chain, quadratic limb darkening, stochastic flares, and scale heights.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { SimulationCore } from '../../simulation/SimulationCore.js'
import { createAtmosphereMesh } from './atmosphereShader.js'
import {
  createRedDwarfTexture,
  createTrappist1bTexture,
  createTrappist1cTexture,
  createTrappist1dTexture,
  createTrappist1eTexture,
  createTrappist1eModelATexture,
  createTrappist1eModelBTexture,
  createTrappist1fTexture,
  createTrappist1gTexture,
  createTrappist1hTexture,
} from './proceduralTextures.js'

export const EXOPLANET_CONFIG = [
  {
    id: 'trappist_1b',
    name: 'TRAPPIST-1b',
    type: 'Ultra-Hot Volcanic Basalt',
    desc: 'Period: 1.511 d • Temp: ~400K (750K Sub-stellar) • Tidally locked volcanic lava caldera & magma fissures',
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
    name: 'TRAPPIST-1c',
    type: 'Super-Venusian Regolith',
    desc: 'Period: 2.422 d • Temp: ~340K (580K Sub-stellar) • Scorched silicate crust, deep tectonic rifts & dust dunes',
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
    name: 'TRAPPIST-1d',
    type: 'Habitable Zone Inner Transition',
    desc: 'Period: 4.049 d • Temp: ~286K • Sub-stellar desert, narrow twilight ocean & dark-side frost',
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
    name: 'TRAPPIST-1e',
    type: 'Habitable Eyeball Candidate',
    desc: 'Period: 6.101 d • Temp: ~249K • Earth-sized rocky world, tidal libration ±0.58°, multi-model climate testbed',
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
    name: 'TRAPPIST-1f',
    type: 'Habitable Zone Ocean World',
    desc: 'Period: 9.208 d • Temp: ~217K • Deep global sapphire ocean, island archipelagos & creeping ice caps',
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
    name: 'TRAPPIST-1g',
    type: 'Glacial Super-Earth',
    desc: 'Period: 12.352 d • Temp: ~197K • Pack-ice shelves, slush waterways, cryo-rifts & cyan haze',
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
    name: 'TRAPPIST-1h',
    type: 'Outer Nitrogen Ice Dwarf',
    desc: 'Period: 18.77 d (NASA Archive) • Temp: ~171K • Resonant 7-body chain terminus, nitrogen/methane ice sheets',
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
 * Constructs the authentic numerical TRAPPIST-1 Exoplanetary System.
 */
export function createExosystem() {
  const simulationCore = new SimulationCore()

  const exosystemGroup = new THREE.Group()
  exosystemGroup.name = 'trappist-exosystem'

  const EXOSYSTEM_POS = new THREE.Vector3(-6500, 600, 5800)
  exosystemGroup.position.copy(EXOSYSTEM_POS)

  const raycastTargets = []
  const exoplanetObjects = []
  const texturesToDispose = []
  const geometriesToDispose = []
  const materialsToDispose = []

  // ── 1. Host Star with Quadratic Limb Darkening & Starspots ────────────────
  const starTexture = createRedDwarfTexture()
  texturesToDispose.push(starTexture)

  const starGeo = new THREE.SphereGeometry(16, 64, 64)
  geometriesToDispose.push(starGeo)

  // Custom Limb-Darkening Shader for M8V Photosphere
  const starShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: starTexture },
      uBaseColor: { value: new THREE.Color(0xef4444) },
      uLimbU1: { value: 0.62 },
      uLimbU2: { value: 0.18 },
      uFlareIntensity: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uTexture;
      uniform vec3 uBaseColor;
      uniform float uLimbU1;
      uniform float uLimbU2;
      uniform float uFlareIntensity;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // mu = cos(theta) where 1.0 is disk center, 0.0 is limb
        float mu = max(0.0, dot(normal, viewDir));

        // Quadratic limb darkening law: I(mu) = I(0) * [1 - u1*(1-mu) - u2*(1-mu)^2]
        float oneMinusMu = 1.0 - mu;
        float limbProfile = 1.0 - uLimbU1 * oneMinusMu - uLimbU2 * oneMinusMu * oneMinusMu;

        vec4 texColor = texture2D(uTexture, vUv);

        // Photospheric granulation & starspot tinting
        vec3 starColor = texColor.rgb * uBaseColor * limbProfile * 1.5;

        // Flare brightening burst
        starColor += vec3(1.0, 0.85, 0.6) * uFlareIntensity * 2.5;

        gl_FragColor = vec4(starColor, 1.0);
      }
    `,
  })
  materialsToDispose.push(starShaderMat)

  const starMesh = new THREE.Mesh(starGeo, starShaderMat)
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

  // Dynamic Magnetic Coronal Prominence Loops
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

  // Local M-dwarf PointLight
  const localLight = new THREE.PointLight(0xff6b6b, 3.4, 2800, 0.35)
  localLight.position.set(0, 0, 0)
  exosystemGroup.add(localLight)

  starMesh.userData = {
    id: 'trappist_star',
    name: '2MASS J23062928-0502285 (TRAPPIST-1)',
    desc: 'M8V Ultra-Cool Red Dwarf • Teff: 2566 K • Quadratic Limb Darkening & Active Magnetic Prominences',
    radius: 16,
    mesh: starMesh,
    systemGroup: exosystemGroup,
  }
  raycastTargets.push(starMesh)

  // ── 2. The 7 Terrestrial Worlds Driven by Keplerian Orbital Engine ─────────
  const orbitLines = []
  const model1eTextures = {
    MODEL_A: createTrappist1eModelATexture(),
    MODEL_B: createTrappist1eModelBTexture(),
    MODEL_C: createTrappist1eTexture(),
  }
  texturesToDispose.push(...Object.values(model1eTextures))

  EXOPLANET_CONFIG.forEach(p => {
    // 1. Keplerian Orbit Path Polyline
    const orbitPoints = simulationCore.orbitalModel.generateOrbitPath(p, 128)
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map(pt => new THREE.Vector3(pt.x, pt.y, pt.z))
    )
    geometriesToDispose.push(orbitGeo)

    const orbitMat = new THREE.LineBasicMaterial({
      color: p.orbitColor || 0x38bdf8,
      transparent: true,
      opacity: p.id === 'trappist_1e' ? 0.45 : 0.22,
    })
    materialsToDispose.push(orbitMat)
    const orbitLine = new THREE.Line(orbitGeo, orbitMat)
    exosystemGroup.add(orbitLine)
    orbitLines.push({ id: p.id, line: orbitLine, config: p })

    // 2. Planet Mesh
    const pTex = p.id === 'trappist_1e' ? model1eTextures.MODEL_C : p.getTexture()
    if (p.id !== 'trappist_1e') texturesToDispose.push(pTex)

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
    exosystemGroup.add(pMesh)

    pMesh.userData = {
      id: p.id,
      name: p.name,
      desc: p.desc,
      radius: p.r,
      mesh: pMesh,
      systemGroup: exosystemGroup,
    }
    raycastTargets.push(pMesh)

    // 3. Physical Rayleigh/Mie Scattering Shell
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

    // 4. Clouds (1e & 1f)
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

    // 5. Polar Auroral Arcs (1e & 1d)
    let auroraMesh = null
    if (p.id === 'trappist_1e' || p.id === 'trappist_1d') {
      const auroraGeo = new THREE.RingGeometry(p.r * 0.45, p.r * 0.85, 32)
      geometriesToDispose.push(auroraGeo)
      const auroraMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
      materialsToDispose.push(auroraMat)
      auroraMesh = new THREE.Mesh(auroraGeo, auroraMat)
      auroraMesh.rotation.x = Math.PI / 2
      auroraMesh.position.y = p.r * 0.88
      pMesh.add(auroraMesh)
    }

    exoplanetObjects.push({
      data: p,
      mesh: pMesh,
      material: pMat,
      atmoObj,
      cloudMesh,
      auroraMesh,
      moons: [],
    })
  })

  // ── 3. Redraw Orbits on Eccentricity Exaggeration Change ──────────────────
  const updateOrbitExaggeration = (factor) => {
    simulationCore.setEccentricityExaggeration(factor)
    orbitLines.forEach(item => {
      const newPts = simulationCore.orbitalModel.generateOrbitPath(item.config, 128)
      item.line.geometry.dispose()
      item.line.geometry = new THREE.BufferGeometry().setFromPoints(
        newPts.map(pt => new THREE.Vector3(pt.x, pt.y, pt.z))
      )
    })
  }

  // ── 4. Apply Selected TRAPPIST-1e Scientific Model ────────────────────────
  const apply1eModel = (modelKey) => {
    simulationCore.set1eModel(modelKey)
    const obj1e = exoplanetObjects.find(po => po.data.id === 'trappist_1e')
    if (!obj1e) return

    const tex = model1eTextures[modelKey] || model1eTextures.MODEL_C
    obj1e.material.map = tex
    obj1e.material.needsUpdate = true

    if (modelKey === 'MODEL_A') {
      if (obj1e.atmoObj) obj1e.atmoObj.mesh.visible = false
      if (obj1e.cloudMesh) obj1e.cloudMesh.visible = false
    } else if (modelKey === 'MODEL_B') {
      if (obj1e.atmoObj) {
        obj1e.atmoObj.mesh.visible = true
        obj1e.atmoObj.material.uniforms.uDayColor.value.setHex(0x38bdf8)
      }
      if (obj1e.cloudMesh) obj1e.cloudMesh.visible = true
    } else {
      // Model C: Ocean Eyeball
      if (obj1e.atmoObj) {
        obj1e.atmoObj.mesh.visible = true
        obj1e.atmoObj.material.uniforms.uDayColor.value.setHex(0x0284c7)
      }
      if (obj1e.cloudMesh) obj1e.cloudMesh.visible = true
    }
  }

  // ── 5. Set Spectral Passband (Visible, NIR, UV, X-Ray) ───────────────────
  const applySpectralBand = (bandKey) => {
    simulationCore.setSpectralBand(bandKey)
    const band = simulationCore.radiationModel.getActiveBand()
    const color = new THREE.Color(band.baseColorHex)
    starShaderMat.uniforms.uBaseColor.value.copy(color)
    innerCoronaMat.color.copy(color)
    outerCoronaMat.color.set(band.coronaColorHex)
    localLight.color.copy(color)
    localLight.intensity = 3.4 * band.ambientGain
  }

  // ── 6. Physics Animation Loop Handler ────────────────────────────────────
  let flareTimer = 0

  const updateExosystem = (delta, speedMult) => {
    // 1. Advance Numerical Simulation Core
    const simResult = simulationCore.tick(delta * speedMult)
    const { stellarState, planetStates } = simResult

    // 2. Star Convection, Limb Darkening & Flares
    starMesh.rotation.y += 0.0015 * speedMult
    starShaderMat.uniforms.uTime.value += delta * speedMult
    starShaderMat.uniforms.uFlareIntensity.value = stellarState.totalFlareIntensity

    // Corona & Prominences respond to flare events
    const flareGain = 1.0 + stellarState.totalFlareIntensity * 3.0
    innerCoronaMat.opacity = Math.min(0.85, 0.40 * flareGain)
    outerCoronaMat.opacity = Math.min(0.65, 0.22 * flareGain)

    flareTimer += delta * speedMult
    prominenceLoops.forEach(l => {
      l.group.rotation.x = Math.sin(flareTimer * l.speed) * (0.12 + stellarState.totalFlareIntensity * 0.25)
    })

    // 3. Update Planets from Keplerian State Vectors
    exoplanetObjects.forEach(po => {
      const pState = planetStates.get(po.data.id)
      if (!pState) return

      // Position from true Keplerian orbit:
      po.mesh.position.set(pState.position.x, pState.position.y, pState.position.z)

      // Authentic 1:1 Tidal Locking + Optical Libration:
      // Star-facing meridian oscillates by delta theta = 2*e*sin(M)
      const librationRad = (pState.opticalLibrationDeg * Math.PI) / 180.0
      po.mesh.rotation.y = -pState.trueLongitude + Math.PI / 2.0 + librationRad

      // Scale height drives atmosphere mesh expansion:
      if (po.atmoObj && pState.atmo) {
        const atmoScale = pState.atmo.visualAtmosphereScale || 1.04
        po.atmoObj.mesh.scale.set(atmoScale, atmoScale, atmoScale)
      }

      // Auroral intensity spikes during stellar flares:
      if (po.auroraMesh && pState.spaceWeather) {
        po.auroraMesh.material.opacity = pState.spaceWeather.auroralActivity * 0.75
        po.auroraMesh.rotation.z += 0.02 * speedMult
      }

      // Clouds move independently from tidally locked surface:
      if (po.cloudMesh) {
        po.cloudMesh.rotation.y += 0.003 * speedMult
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
    simulationCore,
    updateExosystem,
    updateOrbitExaggeration,
    apply1eModel,
    applySpectralBand,
    dispose,
    position: EXOSYSTEM_POS,
  }
}
