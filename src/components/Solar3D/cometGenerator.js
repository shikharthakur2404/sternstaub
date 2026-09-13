// ─────────────────────────────────────────────────────────────────────────────
// cometGenerator.js — Hyperbolic Interplanetary Comet C/2026 with Dual Tails
// Eccentric Keplerian orbit, sublimating cyan coma, Type I Ion Gas Tail (radially from Sol)
// and curved Type II Dust Tail lagging along orbital flight path
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

export function createComet() {
  const cometGroup = new THREE.Group()
  cometGroup.name = 'interplanetary-comet'

  const materialsToDispose = []
  const geometriesToDispose = []

  // ── 1. Orbital Geometry & Guide Trace ─────────────────────────────────────
  // Highly eccentric orbit: semi-major axis a = 580, eccentricity e = 0.86
  const a = 580
  const e = 0.86
  const b = a * Math.sqrt(1 - e * e)
  const c = a * e // Focus offset

  const orbitPivot = new THREE.Group()
  orbitPivot.rotation.x = THREE.MathUtils.degToRad(28.0) // 28° inclination
  orbitPivot.rotation.y = THREE.MathUtils.degToRad(42.0)
  cometGroup.add(orbitPivot)

  // Eccentric orbit guide line
  const orbitCurve = new THREE.EllipseCurve(
    -c, 0, // Centered so (0,0) is Sol's focus
    a, b,
    0, Math.PI * 2,
    false,
    0
  )
  const orbitPoints = orbitCurve.getPoints(160)
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(orbitGeo)
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.20,
  })
  materialsToDispose.push(orbitMat)
  orbitPivot.add(new THREE.Line(orbitGeo, orbitMat))

  // Comet Vessel Root
  const cometVessel = new THREE.Group()
  orbitPivot.add(cometVessel)

  // ── 2. Nucleus & Sublimating Cyan Coma ─────────────────────────────────────
  const nucGeo = new THREE.DodecahedronGeometry(1.8, 1)
  geometriesToDispose.push(nucGeo)
  const nucMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.95,
    metalness: 0.05,
  })
  materialsToDispose.push(nucMat)
  const nucMesh = new THREE.Mesh(nucGeo, nucMat)
  cometVessel.add(nucMesh)

  // Glowing Cyan Coma Envelope (Sublimating ice halo)
  const comaGeo = new THREE.SphereGeometry(3.6, 24, 24)
  geometriesToDispose.push(comaGeo)
  const comaMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  })
  materialsToDispose.push(comaMat)
  const comaMesh = new THREE.Mesh(comaGeo, comaMat)
  cometVessel.add(comaMesh)

  // ── 3. Dual Cometary Tails ────────────────────────────────────────────────
  // Type I Ion Gas Tail: Narrow straight electric-blue cone pointed strictly away from Sol
  const ionTailGeo = new THREE.ConeGeometry(3.2, 55, 16, 1, true)
  ionTailGeo.translate(0, 27.5, 0)
  ionTailGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(ionTailGeo)

  const ionTailMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(ionTailMat)
  const ionTailMesh = new THREE.Mesh(ionTailGeo, ionTailMat)
  cometVessel.add(ionTailMesh)

  // Type II Dust Tail: Broader golden fan lagging behind orbital motion
  const dustTailGeo = new THREE.ConeGeometry(5.8, 42, 16, 1, true)
  dustTailGeo.translate(0, 21, 0)
  dustTailGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(dustTailGeo)

  const dustTailMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(dustTailMat)
  const dustTailMesh = new THREE.Mesh(dustTailGeo, dustTailMat)
  cometVessel.add(dustTailMesh)

  cometVessel.userData = {
    id: 'comet_c2026',
    name: 'Comet C/2026 (Hyperbolic Visitor)',
    radius: 3.6,
    mesh: cometVessel,
    isComet: true,
  }

  // ── 4. Orbital Mechanics Loop ─────────────────────────────────────────────
  let meanAnomaly = 0.5

  const updateComet = (delta, simSpeed) => {
    // Keplerian orbital anomaly progression (faster at perihelion)
    // Approximate eccentric motion
    const currentR = Math.hypot(cometVessel.position.x, cometVessel.position.z)
    const speedFactor = Math.max(0.25, Math.min(3.5, 320 / Math.max(currentR, 40)))

    meanAnomaly += delta * 0.042 * speedFactor * simSpeed
    if (meanAnomaly > Math.PI * 2) meanAnomaly -= Math.PI * 2

    // Approximate Kepler's equation solution
    const eccentricAnomaly = meanAnomaly + e * Math.sin(meanAnomaly)

    const posX = -c + a * Math.cos(eccentricAnomaly)
    const posZ = b * Math.sin(eccentricAnomaly)
    cometVessel.position.set(posX, 0, posZ)

    // Nucleus rotation
    nucMesh.rotation.x += 0.015 * simSpeed
    nucMesh.rotation.y += 0.025 * simSpeed

    // ── Align Dual Tails ────────────────────────────────────────────────────
    // Vector from Sol (0,0,0) in world space to Comet
    const worldPos = new THREE.Vector3()
    cometVessel.getWorldPosition(worldPos)
    const distToSun = worldPos.length()

    // Type I Ion Tail points strictly away from Sol in world space
    const antiSunDir = worldPos.clone().normalize()
    // Transform antiSunDir into cometVessel's local coordinate space
    const localAntiSun = antiSunDir.clone().applyQuaternion(orbitPivot.quaternion.clone().invert())
    ionTailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), localAntiSun)

    // Scale tail length inversely with distance to Sol (longer & brighter near Sun)
    const tailScale = Math.max(0.4, Math.min(2.8, 260 / Math.max(distToSun, 60)))
    ionTailMesh.scale.set(1.0, 1.0, tailScale)
    comaMesh.scale.setScalar(0.7 + tailScale * 0.4)

    // Type II Dust Tail lags slightly behind ion tail (shifted towards negative velocity)
    const dustDir = localAntiSun.clone().add(new THREE.Vector3(0.22, 0, 0.15)).normalize()
    dustTailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dustDir)
    dustTailMesh.scale.set(1.0, 1.0, tailScale * 0.75)
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
  }

  return {
    group: cometGroup,
    cometVessel,
    updateComet,
    dispose,
  }
}
