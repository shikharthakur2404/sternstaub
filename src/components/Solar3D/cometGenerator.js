// ─────────────────────────────────────────────────────────────────────────────
// cometGenerator.js — Photorealistic Hyperbolic Interplanetary Comet C/2026
// Dual-lobed irregular nucleus with active sublimation outgassing vents,
// volumetric exponential soft-glow coma, 800-particle electric-blue Type I Ion
// gas tail with magnetic kinks, and 1,600-particle curved Type II golden dust fan.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

// ── 1. Helper Canvas Sprite Generators ───────────────────────────────────────
function createComaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Smooth exponential radial glow with zero hard edges
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)')
  grad.addColorStop(0.08, 'rgba(224, 242, 254, 0.95)')
  grad.addColorStop(0.24, 'rgba(56, 189, 248, 0.65)')
  grad.addColorStop(0.50, 'rgba(2, 132, 199, 0.30)')
  grad.addColorStop(0.78, 'rgba(14, 116, 144, 0.08)')
  grad.addColorStop(1.00, 'rgba(2, 6, 23, 0.0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createParticleSprite() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)')
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createComet() {
  const cometGroup = new THREE.Group()
  cometGroup.name = 'interplanetary-comet'

  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []

  const comaTex = createComaTexture()
  texturesToDispose.push(comaTex)

  const particleTex = createParticleSprite()
  texturesToDispose.push(particleTex)

  // ── 2. Highly Eccentric Keplerian Orbit ────────────────────────────────────
  // Semi-major axis a = 580, eccentricity e = 0.86
  const a = 580
  const e = 0.86
  const b = a * Math.sqrt(1 - e * e)
  const c = a * e // Focus offset (Sol sits at focus 0,0,0)

  const orbitPivot = new THREE.Group()
  orbitPivot.rotation.x = THREE.MathUtils.degToRad(28.0) // 28° inclination
  orbitPivot.rotation.y = THREE.MathUtils.degToRad(42.0)
  cometGroup.add(orbitPivot)

  // Orbit Guide Trace
  const orbitCurve = new THREE.EllipseCurve(-c, 0, a, b, 0, Math.PI * 2, false, 0)
  const orbitPoints = orbitCurve.getPoints(180)
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(orbitGeo)
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.22,
  })
  materialsToDispose.push(orbitMat)
  orbitPivot.add(new THREE.Line(orbitGeo, orbitMat))

  // Comet Vessel Root (moves along the orbit)
  const cometVessel = new THREE.Group()
  orbitPivot.add(cometVessel)

  // ── 3. Irregular Contact-Binary Nucleus (Comet 67P Style) ──────────────────
  const nucleusGroup = new THREE.Group()
  cometVessel.add(nucleusGroup)

  const nucMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    roughness: 0.98,
    metalness: 0.05,
    bumpScale: 0.35,
  })
  materialsToDispose.push(nucMat)

  // Lobe 1 (Head lobe - perturbed irregular geometry)
  const headGeo = new THREE.IcosahedronGeometry(1.3, 2)
  const headPos = headGeo.attributes.position
  for (let i = 0; i < headPos.count; i++) {
    const x = headPos.getX(i)
    const y = headPos.getY(i)
    const z = headPos.getZ(i)
    const noise = Math.sin(x * 4.2 + y * 3.1) * 0.22 + Math.cos(z * 5.0) * 0.15
    headPos.setXYZ(i, x * (1 + noise), y * (1 + noise), z * (1 + noise))
  }
  headGeo.computeVertexNormals()
  geometriesToDispose.push(headGeo)
  const headMesh = new THREE.Mesh(headGeo, nucMat)
  headMesh.position.set(-0.8, 0.2, 0)
  nucleusGroup.add(headMesh)

  // Lobe 2 (Body lobe - larger irregular ellipsoid)
  const bodyGeo = new THREE.IcosahedronGeometry(1.8, 2)
  const bodyPos = bodyGeo.attributes.position
  for (let i = 0; i < bodyPos.count; i++) {
    const x = bodyPos.getX(i)
    const y = bodyPos.getY(i)
    const z = bodyPos.getZ(i)
    const noise = Math.cos(x * 3.6 - z * 4.2) * 0.25 + Math.sin(y * 4.0) * 0.18
    bodyPos.setXYZ(i, x * (1.2 + noise), y * (0.85 + noise), z * (1.0 + noise))
  }
  bodyGeo.computeVertexNormals()
  geometriesToDispose.push(bodyGeo)
  const bodyMesh = new THREE.Mesh(bodyGeo, nucMat)
  bodyMesh.position.set(0.9, -0.15, 0)
  nucleusGroup.add(bodyMesh)

  // ── 4. Active Sublimation Outgassing Geysers ──────────────────────────────
  const JET_COUNT = 90
  const jetGeo = new THREE.BufferGeometry()
  const jetPositions = new Float32Array(JET_COUNT * 3)
  const jetColors = new Float32Array(JET_COUNT * 3)
  const jetVels = []

  for (let i = 0; i < JET_COUNT; i++) {
    // Geyser origins on sunward fissures
    const angle = (Math.random() - 0.5) * 1.2
    const elevation = (Math.random() - 0.5) * 1.2
    const speed = 0.8 + Math.random() * 2.2
    jetVels.push({
      vx: -Math.cos(elevation) * Math.cos(angle) * speed,
      vy: Math.sin(elevation) * speed,
      vz: Math.sin(angle) * speed,
      age: Math.random(),
      maxAge: 0.6 + Math.random() * 0.8,
    })
    jetPositions[i * 3] = (Math.random() - 0.5) * 0.8
    jetPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.8
    jetPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8

    // Cyan-white vapor color
    jetColors[i * 3] = 0.75 + Math.random() * 0.25
    jetColors[i * 3 + 1] = 0.92 + Math.random() * 0.08
    jetColors[i * 3 + 2] = 1.0
  }

  jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3))
  jetGeo.setAttribute('color', new THREE.BufferAttribute(jetColors, 3))
  geometriesToDispose.push(jetGeo)

  const jetMat = new THREE.PointsMaterial({
    size: 0.9,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(jetMat)
  const jetPoints = new THREE.Points(jetGeo, jetMat)
  cometVessel.add(jetPoints)

  // ── 5. Multi-Tier Volumetric Soft Exponential Coma ─────────────────────────
  const comaGroup = new THREE.Group()
  cometVessel.add(comaGroup)

  // Inner Core Glow Sprite (Intense white-cyan sublimation zone)
  const innerComaMat = new THREE.SpriteMaterial({
    map: comaTex,
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(innerComaMat)
  const innerComa = new THREE.Sprite(innerComaMat)
  innerComa.scale.set(16, 16, 1)
  comaGroup.add(innerComa)

  // Outer Diffuse Coma Halo (Expansive gaseous envelope with smooth fade)
  const outerComaMat = new THREE.SpriteMaterial({
    map: comaTex,
    color: 0x0284c7,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(outerComaMat)
  const outerComa = new THREE.Sprite(outerComaMat)
  outerComa.scale.set(42, 42, 1)
  comaGroup.add(outerComa)

  // ── 6. Type I Ion Gas Tail (800 Particle Plasma Streamers) ─────────────────
  // Narrow, straight, electric fluorescent cyan-blue with heliomagnetic wavy kinks
  const ION_COUNT = 850
  const ionGeo = new THREE.BufferGeometry()
  const ionPositions = new Float32Array(ION_COUNT * 3)
  const ionColors = new Float32Array(ION_COUNT * 3)
  const ionSeeds = []

  for (let i = 0; i < ION_COUNT; i++) {
    // Distance along tail from 1.5 to 135 units
    const distT = Math.pow(Math.random(), 0.72) // Denser near the nucleus
    const zDist = 1.5 + distT * 135.0

    // Beam narrow radius expanding slightly with distance
    const spread = 0.8 + zDist * 0.055
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * spread

    ionPositions[i * 3] = Math.cos(angle) * radius
    ionPositions[i * 3 + 1] = Math.sin(angle) * radius
    ionPositions[i * 3 + 2] = zDist

    ionSeeds.push({
      baseX: Math.cos(angle) * radius,
      baseY: Math.sin(angle) * radius,
      zDist,
      kinkSpeed: 2.0 + Math.random() * 2.5,
      kinkPhase: Math.random() * Math.PI * 2,
    })

    // Spectral ionization color gradient:
    // Proximal: Brilliant fluorescent cyan (#38bdf8) -> Distal: Deep plasma blue (#0284c7 -> #1e1b4b)
    const fade = Math.min(1.0, zDist / 135.0)
    ionColors[i * 3]     = 0.22 * (1.0 - fade) + 0.05 * fade
    ionColors[i * 3 + 1] = 0.75 * (1.0 - fade) + 0.35 * fade
    ionColors[i * 3 + 2] = 1.0  * (1.0 - fade) + 0.90 * fade
  }

  ionGeo.setAttribute('position', new THREE.BufferAttribute(ionPositions, 3))
  ionGeo.setAttribute('color', new THREE.BufferAttribute(ionColors, 3))
  geometriesToDispose.push(ionGeo)

  const ionMat = new THREE.PointsMaterial({
    size: 2.2,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(ionMat)

  const ionTailGroup = new THREE.Group()
  cometVessel.add(ionTailGroup)
  const ionTailPoints = new THREE.Points(ionGeo, ionMat)
  ionTailGroup.add(ionTailPoints)

  // ── 7. Type II Curved Dust Tail (1,600 Particle Golden Fan) ────────────────
  // Broad, sweeping Keplerian fan lagging behind the orbital motion
  const DUST_COUNT = 1600
  const dustGeo = new THREE.BufferGeometry()
  const dustPositions = new Float32Array(DUST_COUNT * 3)
  const dustColors = new Float32Array(DUST_COUNT * 3)
  const dustSeeds = []

  for (let i = 0; i < DUST_COUNT; i++) {
    // Longitudinal distance along tail
    const distT = Math.pow(Math.random(), 0.65)
    const zDist = 2.0 + distT * 115.0

    // Keplerian orbital lag: curves toward velocity vector lag
    const lagCurve = (zDist * zDist) * 0.0032
    // Lateral fan spread (substantially wider than ion tail)
    const spread = 1.5 + Math.pow(zDist, 1.15) * 0.24
    const fanAngle = (Math.random() - 0.5) * Math.PI

    const x = Math.cos(fanAngle) * spread + lagCurve
    const y = (Math.random() - 0.5) * (1.2 + zDist * 0.12)
    const z = zDist

    dustPositions[i * 3] = x
    dustPositions[i * 3 + 1] = y
    dustPositions[i * 3 + 2] = z

    dustSeeds.push({
      x,
      y,
      zDist,
      driftSpeed: 0.5 + Math.random() * 0.8,
    })

    // Reflected sunlight spectrum:
    // Creamy solar white -> warm gold -> rich amber -> copper bronze
    const fade = Math.min(1.0, zDist / 115.0)
    dustColors[i * 3]     = 1.0  * (1.0 - fade * 0.4)
    dustColors[i * 3 + 1] = 0.92 * (1.0 - fade * 0.55)
    dustColors[i * 3 + 2] = 0.55 * (1.0 - fade * 0.85)
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3))
  geometriesToDispose.push(dustGeo)

  const dustMat = new THREE.PointsMaterial({
    size: 2.8,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(dustMat)

  const dustTailGroup = new THREE.Group()
  cometVessel.add(dustTailGroup)
  const dustTailPoints = new THREE.Points(dustGeo, dustMat)
  dustTailGroup.add(dustTailPoints)

  // ── 8. Raycast Target & User Data Metadata ────────────────────────────────
  const cometUserData = {
    id: 'comet_c2026',
    name: 'Comet C/2026 P1 (Sternstaub)',
    desc: 'IAU Hyperbolic Visitor • Dual-Lobed Nucleus • Outgassing Ion & Dust Tails',
    radius: 4.8,
    mesh: cometVessel,
    isComet: true,
  }
  cometVessel.userData = cometUserData
  bodyMesh.userData = cometUserData

  // ── 9. Orbital Physics & Heliocentric Alignment Loop ──────────────────────
  let meanAnomaly = 0.5
  let simTime = 0

  const updateComet = (delta, simSpeed) => {
    simTime += delta * simSpeed

    // 1. Keplerian Anomaly Progression (speed proportional to 1/r)
    const currentR = Math.hypot(cometVessel.position.x, cometVessel.position.z)
    const speedFactor = Math.max(0.3, Math.min(3.8, 340 / Math.max(currentR, 35)))

    meanAnomaly += delta * 0.045 * speedFactor * simSpeed
    if (meanAnomaly > Math.PI * 2) meanAnomaly -= Math.PI * 2

    // Approximate eccentric anomaly
    const eccentricAnomaly = meanAnomaly + e * Math.sin(meanAnomaly)
    const posX = -c + a * Math.cos(eccentricAnomaly)
    const posZ = b * Math.sin(eccentricAnomaly)

    // Calculate orbital velocity vector via derivative
    const velX = -a * Math.sin(eccentricAnomaly)
    const velZ = b * Math.cos(eccentricAnomaly)
    const velocityVec = new THREE.Vector3(velX, 0, velZ).normalize()

    cometVessel.position.set(posX, 0, posZ)

    // 2. Nucleus Slow Tumbling Rotation
    nucleusGroup.rotation.x += 0.008 * simSpeed
    nucleusGroup.rotation.y += 0.014 * simSpeed
    nucleusGroup.rotation.z += 0.005 * simSpeed

    // 3. Heliocentric Vector & Solar Wind Direction
    const worldPos = new THREE.Vector3()
    cometVessel.getWorldPosition(worldPos)
    const distToSun = worldPos.length()

    // Type I Ion Tail points strictly radial away from Sol
    const antiSunDir = worldPos.clone().normalize()
    const invPivot = orbitPivot.quaternion.clone().invert()
    const localAntiSun = antiSunDir.clone().applyQuaternion(invPivot)

    // Orient Ion Tail Group along local anti-Sun vector
    ionTailGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), localAntiSun)

    // Type II Dust Tail lags behind anti-Sun vector towards negative velocity
    const localVelocity = velocityVec.clone()
    const dustLagVector = localAntiSun.clone().addScaledVector(localVelocity, -0.45).normalize()
    dustTailGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dustLagVector)

    // 4. Dynamic Heliocentric Intensity & Activity Scaling
    // Sublimation rate scales inversely with solar distance
    const activityScale = Math.max(0.45, Math.min(3.2, 300 / Math.max(distToSun, 55)))
    const pulse = 1.0 + 0.06 * Math.sin(simTime * 4.5)

    // Scale coma volume and intensity
    innerComa.scale.set(16 * activityScale * pulse, 16 * activityScale * pulse, 1)
    outerComa.scale.set(44 * activityScale * pulse, 44 * activityScale * pulse, 1)
    innerComaMat.opacity = Math.min(0.98, 0.70 * activityScale)
    outerComaMat.opacity = Math.min(0.65, 0.35 * activityScale)

    // Scale tail lengths dynamically
    ionTailGroup.scale.set(1.0, 1.0, activityScale)
    dustTailGroup.scale.set(1.0, 1.0, activityScale * 0.85)

    // 5. Animate Ion Tail Solar Wind Alfvén Wave Kinks
    const ionPosAttr = ionGeo.attributes.position
    for (let i = 0; i < ION_COUNT; i++) {
      const seed = ionSeeds[i]
      const wave = Math.sin(simTime * seed.kinkSpeed + seed.zDist * 0.14 + seed.kinkPhase)
      const waveY = Math.cos(simTime * (seed.kinkSpeed * 0.8) + seed.zDist * 0.11)
      const kinkAmp = Math.pow(seed.zDist * 0.038, 1.3)

      ionPosAttr.setX(i, seed.baseX + wave * kinkAmp)
      ionPosAttr.setY(i, seed.baseY + waveY * kinkAmp * 0.6)
    }
    ionPosAttr.needsUpdate = true

    // 6. Animate Active Sublimation Geysers
    const jetPosAttr = jetGeo.attributes.position
    for (let i = 0; i < JET_COUNT; i++) {
      const v = jetVels[i]
      v.age += delta * 1.6 * simSpeed
      if (v.age > v.maxAge) {
        v.age = 0
        jetPosAttr.setXYZ(i, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)
      } else {
        const curX = jetPosAttr.getX(i) + v.vx * delta * 4.0 * activityScale
        const curY = jetPosAttr.getY(i) + v.vy * delta * 4.0 * activityScale
        // Solar radiation pressure curves particles back
        const curZ = jetPosAttr.getZ(i) + (v.vz + v.age * 3.5) * delta * 4.0
        jetPosAttr.setXYZ(i, curX, curY, curZ)
      }
    }
    jetPosAttr.needsUpdate = true
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: cometGroup,
    cometVessel,
    updateComet,
    dispose,
  }
}
