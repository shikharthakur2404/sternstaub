// ─────────────────────────────────────────────────────────────────────────────
// asteroidBelt.js — Photorealistic Main Asteroid Belt Engine (Ceres & Vesta)
// 2,800-body multi-archetype irregular asteroid field with 4 distinct boulder
// geometries, C/S/M mineral classes, independent tumbling rotations, faint
// zodiacal debris dust, and prominent major bodies: Dwarf Planet Ceres & Vesta.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

// ── 1. Procedural Irregular Asteroid Geometries ──────────────────────────────

/**
 * Archetype A: Elongated Potato Asteroid (Stretched irregular ellipsoid)
 */
function createPotatoGeometry() {
  const geo = new THREE.IcosahedronGeometry(1.0, 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * 1.45
    const y = pos.getY(i) * 0.85
    const z = pos.getZ(i) * 0.95
    const noise = Math.sin(x * 3.4 + y * 2.8) * 0.24 + Math.cos(z * 4.2) * 0.18 + Math.sin(x * 7.0) * 0.08
    pos.setXYZ(i, x * (1 + noise), y * (1 + noise), z * (1 + noise))
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Archetype B: Contact Binary Peanut Asteroid (Dual-lobed fused body)
 */
function createContactBinaryGeometry() {
  const geo1 = new THREE.IcosahedronGeometry(0.72, 2)
  const geo2 = new THREE.IcosahedronGeometry(0.55, 2)
  geo1.translate(-0.52, 0, 0)
  geo2.translate(0.48, 0.08, 0)

  // Merge geometries into a single contact binary
  const pos1 = geo1.attributes.position
  const pos2 = geo2.attributes.position
  const totalCount = pos1.count + pos2.count
  const mergedPositions = new Float32Array(totalCount * 3)

  mergedPositions.set(pos1.array, 0)
  mergedPositions.set(pos2.array, pos1.array.length)

  const mergedGeo = new THREE.BufferGeometry()
  mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3))

  // Perturb neck & surface
  const mPos = mergedGeo.attributes.position
  for (let i = 0; i < mPos.count; i++) {
    const x = mPos.getX(i)
    const y = mPos.getY(i)
    const z = mPos.getZ(i)
    const noise = Math.sin(x * 4.0 + z * 3.5) * 0.15 + Math.cos(y * 5.0) * 0.12
    mPos.setXYZ(i, x + noise * 0.15, y + noise * 0.15, z + noise * 0.15)
  }
  mergedGeo.computeVertexNormals()
  geo1.dispose()
  geo2.dispose()
  return mergedGeo
}

/**
 * Archetype C: Angular Impact Shard (Sharp planar fractured boulder)
 */
function createAngularShardGeometry() {
  const geo = new THREE.DodecahedronGeometry(0.9, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Sharp faceted distortion
    const facet = Math.sign(x) * Math.pow(Math.abs(x), 1.2) * 0.3
    pos.setXYZ(i, x + facet, y * 0.8, z * 1.1)
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Archetype D: Cratered Chondrite Boulder (Irregular pitted rock)
 */
function createCrateredRockGeometry() {
  const geo = new THREE.IcosahedronGeometry(0.95, 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Multiscale crater dimpling
    const craterNoise = Math.sin(x * 5.5) * Math.cos(y * 5.5) * 0.16 + Math.sin(z * 6.5) * 0.12
    pos.setXYZ(i, x * (1 + craterNoise), y * (1 + craterNoise), z * (1 + craterNoise))
  }
  geo.computeVertexNormals()
  return geo
}

// ── 2. Procedural Textures for Major Bodies (Ceres & Vesta) ──────────────────

function createCeresTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Dark carbonaceous clay mantle (#262e38 base)
  ctx.fillStyle = '#262e38'
  ctx.fillRect(0, 0, 512, 256)

  // Surface cratering noise
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 256
    const r = Math.random() * 6 + 1
    ctx.fillStyle = Math.random() > 0.5 ? '#1a202c' : '#334155'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Occator Crater with glowing white sodium carbonate salt faculae (Cerealia Facula)
  // Located near equator
  const occX = 256
  const occY = 128
  // Dark rim
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(occX, occY, 18, 0, Math.PI * 2)
  ctx.fill()

  // Bright central salt spots (Faculae)
  const saltGrad = ctx.createRadialGradient(occX, occY, 0, occX, occY, 12)
  saltGrad.addColorStop(0.0, '#ffffff')
  saltGrad.addColorStop(0.3, '#f8fafc')
  saltGrad.addColorStop(0.7, '#94a3b8')
  saltGrad.addColorStop(1.0, 'rgba(38, 46, 56, 0)')
  ctx.fillStyle = saltGrad
  ctx.beginPath()
  ctx.arc(occX, occY, 12, 0, Math.PI * 2)
  ctx.fill()

  // Surrounding Vinalia Faculae clusters
  for (let j = 0; j < 5; j++) {
    const fx = occX + (Math.random() - 0.5) * 22
    const fy = occY + (Math.random() - 0.5) * 16
    ctx.fillStyle = '#f1f5f9'
    ctx.beginPath()
    ctx.arc(fx, fy, Math.random() * 2 + 1, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createVestaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Dusty ochre basaltic crust
  ctx.fillStyle = '#64748b'
  ctx.fillRect(0, 0, 512, 256)

  // Basaltic lava plains & diogenite mineral variations
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 256
    const r = Math.random() * 8 + 1
    ctx.fillStyle = Math.random() > 0.4 ? '#475569' : '#78716c'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // South-Polar Rheasilvia Impact Basin (giant impact crater covering south hemisphere)
  const rheaY = 220
  const rheaGrad = ctx.createRadialGradient(256, rheaY, 4, 256, rheaY, 65)
  rheaGrad.addColorStop(0.0, '#94a3b8') // Central peak
  rheaGrad.addColorStop(0.4, '#334155') // Basin floor
  rheaGrad.addColorStop(0.85, '#1e293b') // Escarpment rim
  rheaGrad.addColorStop(1.0, 'rgba(100, 116, 139, 0)')
  ctx.fillStyle = rheaGrad
  ctx.beginPath()
  ctx.arc(256, rheaY, 65, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// ── 3. Main Asteroid Belt Generator ──────────────────────────────────────────

export function createAsteroidBelt() {
  const beltGroup = new THREE.Group()
  beltGroup.name = 'photorealistic-asteroid-belt'

  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []
  const raycastTargets = []

  // ── A. Mineral Class Materials ────────────────────────────────────────────
  const asteroidUniforms = {
    uTime: { value: 0 },
  }

  const setupAsteroidMaterial = (mat) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = asteroidUniforms.uTime
      shader.vertexShader = `
        attribute vec3 aTumbleAxis;
        attribute float aTumbleSpeed;
        attribute float aTumblePhase;
        uniform float uTime;

        vec3 rotateAroundAxis(vec3 v, vec3 axis, float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
        }
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          float tumbleAngle = uTime * aTumbleSpeed + aTumblePhase;
          transformed = rotateAroundAxis(transformed, aTumbleAxis, tumbleAngle);
        #endif
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          float tumbleAngleNorm = uTime * aTumbleSpeed + aTumblePhase;
          objectNormal = rotateAroundAxis(objectNormal, aTumbleAxis, tumbleAngleNorm);
        #endif
        `
      )
    }
  }

  // 1. C-type: Carbonaceous Chondrite (Dark Charcoal/Slate, 70% frequency)
  const cTypeMat = new THREE.MeshStandardMaterial({
    color: 0x222a36,
    roughness: 0.96,
    metalness: 0.05,
  })
  setupAsteroidMaterial(cTypeMat)
  materialsToDispose.push(cTypeMat)

  // 2. S-type: Stony Silicate / Basalt (Warm Dusty Ochre/Grey, 20% frequency)
  const sTypeMat = new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    roughness: 0.88,
    metalness: 0.12,
  })
  setupAsteroidMaterial(sTypeMat)
  materialsToDispose.push(sTypeMat)

  // 3. M-type: Metallic Nickel-Iron (Reflective Silvery Sheen, 10% frequency)
  const mTypeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.38,
    metalness: 0.82,
  })
  setupAsteroidMaterial(mTypeMat)
  materialsToDispose.push(mTypeMat)

  // ── B. Instanced Multi-Archetype Asteroid Swarm (2,800 bodies) ─────────────
  const TOTAL_ASTEROIDS = 2800

  // 4 Archetype Geometries
  const geoPotato = createPotatoGeometry()
  const geoContact = createContactBinaryGeometry()
  const geoShard = createAngularShardGeometry()
  const geoCratered = createCrateredRockGeometry()
  geometriesToDispose.push(geoPotato, geoContact, geoShard, geoCratered)

  // Create 4 InstancedMeshes (one for each geometry archetype)
  // Each handles a subset of the 2,800 asteroids
  const BATCH_SIZE = Math.floor(TOTAL_ASTEROIDS / 4) // 700 per geometry

  const createBatch = (geo, mat) => {
    // Bake GPU per-instance tumbling attributes
    const tumbleAxes = new Float32Array(BATCH_SIZE * 3)
    const tumbleSpeeds = new Float32Array(BATCH_SIZE)
    const tumblePhases = new Float32Array(BATCH_SIZE)

    for (let i = 0; i < BATCH_SIZE; i++) {
      const i3 = i * 3
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.max(0, 1 - u * u))
      tumbleAxes[i3]     = r * Math.cos(theta)
      tumbleAxes[i3 + 1] = r * Math.sin(theta)
      tumbleAxes[i3 + 2] = u

      tumbleSpeeds[i] = (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 1.25)
      tumblePhases[i] = Math.random() * Math.PI * 2
    }

    geo.setAttribute('aTumbleAxis', new THREE.InstancedBufferAttribute(tumbleAxes, 3))
    geo.setAttribute('aTumbleSpeed', new THREE.InstancedBufferAttribute(tumbleSpeeds, 1))
    geo.setAttribute('aTumblePhase', new THREE.InstancedBufferAttribute(tumblePhases, 1))

    const mesh = new THREE.InstancedMesh(geo, mat, BATCH_SIZE)
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    mesh.castShadow = true
    mesh.receiveShadow = true
    beltGroup.add(mesh)
    return mesh
  }

  // 4 Batches with varied mineral classes
  const batch1 = createBatch(geoPotato, cTypeMat)
  const batch2 = createBatch(geoCratered, cTypeMat)
  const batch3 = createBatch(geoShard, sTypeMat)
  const batch4 = createBatch(geoContact, mTypeMat)
  const batches = [batch1, batch2, batch3, batch4]

  const dummy = new THREE.Object3D()

  // Radial distribution: 218 to 284 (Kirkwood Gaps modeled)
  for (let b = 0; b < 4; b++) {
    for (let i = 0; i < BATCH_SIZE; i++) {
      // Avoid Kirkwood resonance gaps (3:1 at r ≈ 250, 5:2 at r ≈ 282)
      let dist = 218 + Math.random() * 66
      if (Math.abs(dist - 250) < 3.2 && Math.random() > 0.15) {
        dist += (Math.random() > 0.5 ? 4.5 : -4.5)
      }

      const angle = Math.random() * Math.PI * 2
      // Gaussian vertical dispersion with slight inclination
      const y = (Math.random() - 0.5) * (Math.random() - 0.5) * 24
      // Power-law size distribution (mostly small boulders, rare big rocks)
      const sizeRandom = Math.random()
      const baseScale = sizeRandom > 0.94
        ? 1.4 + Math.random() * 1.6  // Large asteroid (1.4 - 3.0 units)
        : 0.35 + Math.random() * 0.65 // Common boulder (0.35 - 1.0 units)

      const scaleX = baseScale * (0.8 + Math.random() * 0.4)
      const scaleY = baseScale * (0.8 + Math.random() * 0.4)
      const scaleZ = baseScale * (0.8 + Math.random() * 0.4)

      // Initial orientation & position
      dummy.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist)
      dummy.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
      dummy.scale.set(scaleX, scaleY, scaleZ)
      dummy.updateMatrix()

      batches[b].setMatrixAt(i, dummy.matrix)
    }
    batches[b].instanceMatrix.needsUpdate = true
  }

  // ── C. Major Belt Body 1: Dwarf Planet Ceres (with Occator Salt Spots) ──────
  const ceresOrbitRadius = 252
  const ceresOrbitPivot = new THREE.Group()
  ceresOrbitPivot.rotation.x = THREE.MathUtils.degToRad(10.6) // 10.6° inclination
  beltGroup.add(ceresOrbitPivot)

  // Ceres Orbit Line
  const ceresCurve = new THREE.EllipseCurve(0, 0, ceresOrbitRadius, ceresOrbitRadius, 0, Math.PI * 2)
  const ceresPoints = ceresCurve.getPoints(140)
  const ceresOrbitGeo = new THREE.BufferGeometry().setFromPoints(
    ceresPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(ceresOrbitGeo)
  const ceresOrbitMat = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.18,
  })
  materialsToDispose.push(ceresOrbitMat)
  ceresOrbitPivot.add(new THREE.Line(ceresOrbitGeo, ceresOrbitMat))

  // Ceres Mesh Root
  const ceresVessel = new THREE.Group()
  ceresVessel.position.x = ceresOrbitRadius
  ceresOrbitPivot.add(ceresVessel)

  const ceresTex = createCeresTexture()
  texturesToDispose.push(ceresTex)

  const ceresGeo = new THREE.SphereGeometry(2.4, 48, 48)
  geometriesToDispose.push(ceresGeo)
  const ceresMat = new THREE.MeshStandardMaterial({
    map: ceresTex,
    roughness: 0.94,
    metalness: 0.06,
  })
  materialsToDispose.push(ceresMat)
  const ceresMesh = new THREE.Mesh(ceresGeo, ceresMat)
  ceresVessel.add(ceresMesh)

  ceresVessel.userData = {
    id: 'ceres',
    name: 'Ceres (Dwarf Planet)',
    radius: 2.4,
    mesh: ceresVessel,
    isDwarfPlanet: true,
  }
  ceresMesh.userData = ceresVessel.userData
  raycastTargets.push(ceresMesh)

  // ── D. Major Belt Body 2: Protoplanet Vesta (with Rheasilvia Crater) ─────────
  const vestaOrbitRadius = 236
  const vestaOrbitPivot = new THREE.Group()
  vestaOrbitPivot.rotation.x = THREE.MathUtils.degToRad(7.1) // 7.1° inclination
  vestaOrbitPivot.rotation.z = THREE.MathUtils.degToRad(18.0)
  beltGroup.add(vestaOrbitPivot)

  // Vesta Orbit Line
  const vestaCurve = new THREE.EllipseCurve(0, 0, vestaOrbitRadius, vestaOrbitRadius, 0, Math.PI * 2)
  const vestaPoints = vestaCurve.getPoints(120)
  const vestaOrbitGeo = new THREE.BufferGeometry().setFromPoints(
    vestaPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(vestaOrbitGeo)
  const vestaOrbitMat = new THREE.LineBasicMaterial({
    color: 0xa8a29e,
    transparent: true,
    opacity: 0.15,
  })
  materialsToDispose.push(vestaOrbitMat)
  vestaOrbitPivot.add(new THREE.Line(vestaOrbitGeo, vestaOrbitMat))

  // Vesta Mesh Root (Oblong triaxial ellipsoid)
  const vestaVessel = new THREE.Group()
  vestaVessel.position.x = vestaOrbitRadius
  vestaOrbitPivot.add(vestaVessel)

  const vestaTex = createVestaTexture()
  texturesToDispose.push(vestaTex)

  // Oblong proto-planet shape (2.1 x 1.8 x 1.6 units)
  const vestaGeo = new THREE.SphereGeometry(1.8, 36, 36)
  vestaGeo.scale(1.15, 0.92, 0.88)
  geometriesToDispose.push(vestaGeo)
  const vestaMat = new THREE.MeshStandardMaterial({
    map: vestaTex,
    roughness: 0.90,
    metalness: 0.10,
  })
  materialsToDispose.push(vestaMat)
  const vestaMesh = new THREE.Mesh(vestaGeo, vestaMat)
  vestaVessel.add(vestaMesh)

  vestaVessel.userData = {
    id: 'vesta',
    name: 'Vesta (Protoplanet)',
    radius: 2.0,
    mesh: vestaVessel,
    isAsteroid: true,
  }
  vestaMesh.userData = vestaVessel.userData
  raycastTargets.push(vestaMesh)

  // ── E. Ambient Zodiacal Dust Cloud ─────────────────────────────────────────
  const DUST_PARTICLES = 1200
  const dustGeo = new THREE.BufferGeometry()
  const dustPositions = new Float32Array(DUST_PARTICLES * 3)

  for (let i = 0; i < DUST_PARTICLES; i++) {
    const r = 215 + Math.random() * 70
    const a = Math.random() * Math.PI * 2
    const y = (Math.random() - 0.5) * 14
    dustPositions[i * 3] = Math.cos(a) * r
    dustPositions[i * 3 + 1] = y
    dustPositions[i * 3 + 2] = Math.sin(a) * r
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  geometriesToDispose.push(dustGeo)

  const dustMat = new THREE.PointsMaterial({
    size: 1.1,
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(dustMat)
  const dustCloud = new THREE.Points(dustGeo, dustMat)
  beltGroup.add(dustCloud)

  // ── F. Animation & Tumbling Physics Loop ───────────────────────────────────
  let ceresAngle = 1.2
  let vestaAngle = 3.6

  const updateAsteroidBelt = (delta, simSpeed) => {
    // 1. Advance Major Belt Bodies (Ceres & Vesta)
    ceresAngle += delta * 0.0085 * simSpeed
    ceresVessel.position.x = Math.cos(ceresAngle) * ceresOrbitRadius
    ceresVessel.position.z = Math.sin(ceresAngle) * ceresOrbitRadius
    ceresMesh.rotation.y += 0.024 * simSpeed // 9.07h rotation period

    vestaAngle += delta * 0.0098 * simSpeed
    vestaVessel.position.x = Math.cos(vestaAngle) * vestaOrbitRadius
    vestaVessel.position.z = Math.sin(vestaAngle) * vestaOrbitRadius
    vestaMesh.rotation.y += 0.038 * simSpeed // 5.34h rotation period
    vestaMesh.rotation.x += 0.012 * simSpeed

    // 2. Advance GPU Time Uniform (Drives 2,800-asteroid tumbling in vertex shader with 0 CPU overhead)
    asteroidUniforms.uTime.value += delta * simSpeed

    // 3. Continuous Orbital Revolution of the Main Asteroid Belt
    beltGroup.rotation.y += 0.00075 * delta * simSpeed

    // 4. Slowly Rotate Zodiacal Dust Cloud
    dustCloud.rotation.y += 0.0003 * simSpeed
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: beltGroup,
    ceresVessel,
    vestaVessel,
    raycastTargets,
    updateAsteroidBelt,
    dispose,
  }
}
