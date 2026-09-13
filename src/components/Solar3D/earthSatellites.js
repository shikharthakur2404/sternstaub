// ─────────────────────────────────────────────────────────────────────────────
// earthSatellites.js — Photorealistic Earth Orbital Fleet: ISS & Hubble Space Telescope
// International Space Station (18-part composite, 8 PV solar wings with silicon cell grid,
// thermal radiators, Cupola, Canadarm2, docked capsule) & Hubble Space Telescope (HST)
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import {
  createPhotovoltaicArrayTexture,
  createThermalBlanketTexture,
} from './proceduralTextures.js'

/**
 * Creates Earth's photorealistic satellite fleet including the ISS and Hubble.
 * @param {THREE.Mesh} earthMesh - Earth mesh to attach the orbital fleet to.
 * @param {number} earthRadius - Earth's physical radius.
 */
export function createEarthSatellites(earthMesh, earthRadius) {
  const satelliteGroup = new THREE.Group()
  satelliteGroup.name = 'earth-satellite-fleet'
  earthMesh.add(satelliteGroup)

  const raycastTargets = []
  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []

  // Procedural Photovoltaic Silicon Texture for Solar Wings
  const pvTexture = createPhotovoltaicArrayTexture()
  texturesToDispose.push(pvTexture)

  // Procedural Thermal Multi-Layer Insulation Blanket Texture
  const mliTexture = createThermalBlanketTexture()
  texturesToDispose.push(mliTexture)

  // ── 1. INTERNATIONAL SPACE STATION (ISS) ──────────────────────────────────
  const issOrbitRadius = earthRadius * 1.34 // ~9.9 units (LEO orbit)
  const issOrbitPivot = new THREE.Group()
  // Authentic ISS orbital inclination: 51.6 degrees
  issOrbitPivot.rotation.x = THREE.MathUtils.degToRad(51.6)
  issOrbitPivot.rotation.z = THREE.MathUtils.degToRad(18.0)
  satelliteGroup.add(issOrbitPivot)

  // ISS Orbit Guide Trace
  const issOrbitCurve = new THREE.EllipseCurve(0, 0, issOrbitRadius, issOrbitRadius, 0, Math.PI * 2)
  const issOrbitPoints = issOrbitCurve.getPoints(80)
  const issOrbitGeo = new THREE.BufferGeometry().setFromPoints(
    issOrbitPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(issOrbitGeo)
  const issOrbitMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.22,
  })
  materialsToDispose.push(issOrbitMat)
  issOrbitPivot.add(new THREE.Line(issOrbitGeo, issOrbitMat))

  // ISS Vessel Root
  const issVessel = new THREE.Group()
  issVessel.position.x = issOrbitRadius
  issOrbitPivot.add(issVessel)

  // ── Common Materials ──
  const moduleMat = new THREE.MeshStandardMaterial({
    map: mliTexture,
    metalness: 0.85,
    roughness: 0.28,
  })
  materialsToDispose.push(moduleMat)

  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.75,
    roughness: 0.35,
  })
  materialsToDispose.push(trussMat)

  const solarMat = new THREE.MeshStandardMaterial({
    map: pvTexture,
    metalness: 0.88,
    roughness: 0.22,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(solarMat)

  const radiatorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.15,
  })
  materialsToDispose.push(radiatorMat)

  // ── A. Integrated Truss Structure (ITS) ──
  // Long segmented cross-girder spanning ~3.6 units
  const mainTrussGeo = new THREE.BoxGeometry(0.12, 0.12, 3.6)
  geometriesToDispose.push(mainTrussGeo)
  const mainTruss = new THREE.Mesh(mainTrussGeo, trussMat)
  issVessel.add(mainTruss)

  // ── B. 8 Main Solar Array Wings (SAW) ──
  // 4 dual-sided pairs: P4/P6 (port) and S4/S6 (starboard)
  const sawGeo = new THREE.BoxGeometry(1.15, 0.02, 0.38)
  geometriesToDispose.push(sawGeo)

  const solarWings = []
  const sawConfigs = [
    // Starboard S6 pair
    { x:  0.72, y: 0, z:  1.60 },
    { x: -0.72, y: 0, z:  1.60 },
    // Starboard S4 pair
    { x:  0.72, y: 0, z:  1.15 },
    { x: -0.72, y: 0, z:  1.15 },
    // Port P4 pair
    { x:  0.72, y: 0, z: -1.15 },
    { x: -0.72, y: 0, z: -1.15 },
    // Port P6 pair
    { x:  0.72, y: 0, z: -1.60 },
    { x: -0.72, y: 0, z: -1.60 },
  ]

  sawConfigs.forEach(cfg => {
    const wingPivot = new THREE.Group()
    wingPivot.position.set(0, cfg.y, cfg.z)
    mainTruss.add(wingPivot)

    const wingMesh = new THREE.Mesh(sawGeo, solarMat)
    wingMesh.position.x = cfg.x
    wingPivot.add(wingMesh)
    solarWings.push(wingPivot)
  })

  // ── C. Thermal Heat Rejection Radiator Panels ──
  const radiatorGeo = new THREE.BoxGeometry(0.02, 0.65, 0.32)
  geometriesToDispose.push(radiatorGeo)
  const radiatorOffsets = [
    { x: 0, y: -0.42, z:  0.45 },
    { x: 0, y: -0.42, z: -0.45 },
    { x: 0, y: -0.42, z:  0.00 },
  ]
  radiatorOffsets.forEach(off => {
    const rad = new THREE.Mesh(radiatorGeo, radiatorMat)
    rad.position.set(off.x, off.y, off.z)
    issVessel.add(rad)
  })

  // ── D. Pressurized Habitation Spine ──
  const moduleGroup = new THREE.Group()
  issVessel.add(moduleGroup)

  // 1. US Destiny Laboratory
  const destinyGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.72, 16)
  destinyGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(destinyGeo)
  const destinyMesh = new THREE.Mesh(destinyGeo, moduleMat)
  destinyMesh.position.set(0.35, 0, 0)
  moduleGroup.add(destinyMesh)

  // 2. Node 2 (Harmony)
  const harmonyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 16)
  harmonyGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(harmonyGeo)
  const harmonyMesh = new THREE.Mesh(harmonyGeo, moduleMat)
  harmonyMesh.position.set(0.85, 0, 0)
  moduleGroup.add(harmonyMesh)

  // 3. European Columbus Laboratory
  const columbusGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 14)
  columbusGeo.rotateZ(Math.PI / 2)
  geometriesToDispose.push(columbusGeo)
  const columbusMesh = new THREE.Mesh(columbusGeo, moduleMat)
  columbusMesh.position.set(0.85, 0, 0.32)
  moduleGroup.add(columbusMesh)

  // 4. Japanese Kibo Module (JEM + External Facility Porch)
  const kiboGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.58, 14)
  kiboGeo.rotateZ(Math.PI / 2)
  geometriesToDispose.push(kiboGeo)
  const kiboMesh = new THREE.Mesh(kiboGeo, moduleMat)
  kiboMesh.position.set(0.85, 0, -0.42)
  moduleGroup.add(kiboMesh)

  // Kibo External Experiment Porch
  const kiboPorchGeo = new THREE.BoxGeometry(0.22, 0.08, 0.25)
  geometriesToDispose.push(kiboPorchGeo)
  const kiboPorch = new THREE.Mesh(kiboPorchGeo, trussMat)
  kiboPorch.position.set(0.85, 0, -0.80)
  moduleGroup.add(kiboPorch)

  // 5. Earth-Facing 7-Window Cupola
  const cupolaGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.10, 7)
  geometriesToDispose.push(cupolaGeo)
  const cupolaMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0369a1,
    roughness: 0.1,
    metalness: 0.9,
  })
  materialsToDispose.push(cupolaMat)
  const cupolaMesh = new THREE.Mesh(cupolaGeo, cupolaMat)
  cupolaMesh.position.set(0.35, -0.24, 0)
  moduleGroup.add(cupolaMesh)

  // 6. Russian Segment: Zarya (FGB) & Zvezda Service Module
  const zaryaGeo = new THREE.CylinderGeometry(0.19, 0.17, 0.62, 14)
  zaryaGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(zaryaGeo)
  const zaryaMesh = new THREE.Mesh(zaryaGeo, moduleMat)
  zaryaMesh.position.set(-0.35, 0, 0)
  moduleGroup.add(zaryaMesh)

  const zvezdaGeo = new THREE.CylinderGeometry(0.18, 0.21, 0.65, 14)
  zvezdaGeo.rotateX(Math.PI / 2)
  geometriesToDispose.push(zvezdaGeo)
  const zvezdaMesh = new THREE.Mesh(zvezdaGeo, moduleMat)
  zvezdaMesh.position.set(-0.95, 0, 0)
  moduleGroup.add(zvezdaMesh)

  // Zvezda Swept Solar Arrays
  const zvezdaWingGeo = new THREE.BoxGeometry(0.65, 0.02, 0.22)
  geometriesToDispose.push(zvezdaWingGeo)
  const zWing1 = new THREE.Mesh(zvezdaWingGeo, solarMat)
  zWing1.position.set(-0.95, 0, 0.45)
  moduleGroup.add(zWing1)
  const zWing2 = new THREE.Mesh(zvezdaWingGeo, solarMat)
  zWing2.position.set(-0.95, 0, -0.45)
  moduleGroup.add(zWing2)

  // ── E. Canadarm2 Robotic Manipulator ──
  const armGroup = new THREE.Group()
  armGroup.position.set(0.15, 0.12, 0)
  const armSegmentGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8)
  geometriesToDispose.push(armSegmentGeo)
  const armMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  materialsToDispose.push(armMat)

  const armSeg1 = new THREE.Mesh(armSegmentGeo, armMat)
  armSeg1.rotation.z = Math.PI / 4
  armGroup.add(armSeg1)

  const armSeg2 = new THREE.Mesh(armSegmentGeo, armMat)
  armSeg2.position.set(0.22, 0.22, 0)
  armSeg2.rotation.z = -Math.PI / 4
  armGroup.add(armSeg2)
  issVessel.add(armGroup)

  // ── F. Docked Commercial Crew Dragon Capsule ──
  const capsuleGroup = new THREE.Group()
  capsuleGroup.position.set(1.22, 0, 0)
  capsuleGroup.rotation.z = -Math.PI / 2

  const coneGeo = new THREE.ConeGeometry(0.14, 0.26, 14)
  geometriesToDispose.push(coneGeo)
  const capsuleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.4,
  })
  materialsToDispose.push(capsuleMat)
  const capsuleCone = new THREE.Mesh(coneGeo, capsuleMat)
  capsuleGroup.add(capsuleCone)

  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 14)
  geometriesToDispose.push(trunkGeo)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.7,
  })
  materialsToDispose.push(trunkMat)
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat)
  trunkMesh.position.y = -0.18
  capsuleGroup.add(trunkMesh)
  issVessel.add(capsuleGroup)

  // ── G. Navigational Strobe Beacons ──
  const strobeGeo = new THREE.SphereGeometry(0.045, 8, 8)
  geometriesToDispose.push(strobeGeo)
  const strobeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const strobeRedMat   = new THREE.MeshBasicMaterial({ color: 0xef4444 })
  const strobeGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  materialsToDispose.push(strobeWhiteMat, strobeRedMat, strobeGreenMat)

  // Port Tip (Red)
  const portNav = new THREE.Mesh(strobeGeo, strobeRedMat)
  portNav.position.set(0, 0.08, -1.82)
  mainTruss.add(portNav)

  // Starboard Tip (Green)
  const stbdNav = new THREE.Mesh(strobeGeo, strobeGreenMat)
  stbdNav.position.set(0, 0.08, 1.82)
  mainTruss.add(stbdNav)

  // Center Strobe (Pulsed White)
  const centerStrobe = new THREE.Mesh(strobeGeo, strobeWhiteMat)
  centerStrobe.position.set(0, 0.14, 0)
  mainTruss.add(centerStrobe)

  issVessel.userData = {
    id: 'iss',
    name: 'ISS (International Space Station)',
    radius: 1.8,
    mesh: issVessel,
    isSatellite: true,
  }
  raycastTargets.push(issVessel)

  // ── 2. HUBBLE SPACE TELESCOPE (HST) ───────────────────────────────────────
  const hstOrbitRadius = earthRadius * 1.42 // ~10.5 units
  const hstOrbitPivot = new THREE.Group()
  // Authentic Hubble inclination: 28.5 degrees
  hstOrbitPivot.rotation.x = THREE.MathUtils.degToRad(28.5)
  hstOrbitPivot.rotation.y = THREE.MathUtils.degToRad(75.0)
  satelliteGroup.add(hstOrbitPivot)

  const hstOrbitCurve = new THREE.EllipseCurve(0, 0, hstOrbitRadius, hstOrbitRadius, 0, Math.PI * 2)
  const hstOrbitPoints = hstOrbitCurve.getPoints(80)
  const hstOrbitGeo = new THREE.BufferGeometry().setFromPoints(
    hstOrbitPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(hstOrbitGeo)
  const hstOrbitMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.18,
  })
  materialsToDispose.push(hstOrbitMat)
  hstOrbitPivot.add(new THREE.Line(hstOrbitGeo, hstOrbitMat))

  // Hubble Vessel Root
  const hstVessel = new THREE.Group()
  hstVessel.position.x = hstOrbitRadius
  hstOrbitPivot.add(hstVessel)

  // Telescope Optical Barrel (Polished Silver cylinder)
  const barrelGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.95, 16)
  barrelGeo.rotateZ(Math.PI / 2)
  geometriesToDispose.push(barrelGeo)
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.12,
  })
  materialsToDispose.push(barrelMat)
  const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat)
  hstVessel.add(barrelMesh)

  // Open Aperture Door
  const doorGeo = new THREE.CircleGeometry(0.18, 16)
  doorGeo.rotateY(Math.PI / 2)
  geometriesToDispose.push(doorGeo)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
  materialsToDispose.push(doorMat)
  const doorMesh = new THREE.Mesh(doorGeo, doorMat)
  doorMesh.position.set(0.52, 0.12, 0)
  doorMesh.rotation.z = Math.PI / 3
  hstVessel.add(doorMesh)

  // Dual Hubble Solar Array Wings
  const hstWingGeo = new THREE.BoxGeometry(0.18, 0.02, 0.65)
  geometriesToDispose.push(hstWingGeo)
  const hstWing1 = new THREE.Mesh(hstWingGeo, solarMat)
  hstWing1.position.set(0, 0, 0.52)
  hstVessel.add(hstWing1)

  const hstWing2 = new THREE.Mesh(hstWingGeo, solarMat)
  hstWing2.position.set(0, 0, -0.52)
  hstVessel.add(hstWing2)

  // High-Gain Communication Dish
  const dishGeo = new THREE.SphereGeometry(0.09, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  geometriesToDispose.push(dishGeo)
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  materialsToDispose.push(dishMat)
  const dishMesh = new THREE.Mesh(dishGeo, dishMat)
  dishMesh.position.set(-0.25, 0.22, 0)
  dishMesh.rotation.x = Math.PI
  hstVessel.add(dishMesh)

  hstVessel.userData = {
    id: 'hubble',
    name: 'HST (Hubble Space Telescope)',
    radius: 1.0,
    mesh: hstVessel,
    isSatellite: true,
  }
  raycastTargets.push(hstVessel)

  // ── 3. Earth Satellite Constellation (LEO & Geostationary Satellites) ──────
  const SATELLITE_COUNT = 14
  const constellationPivots = []

  const satGeo = new THREE.BoxGeometry(0.14, 0.09, 0.18)
  geometriesToDispose.push(satGeo)
  const satMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x0284c7,
    roughness: 0.25,
    metalness: 0.9,
  })
  materialsToDispose.push(satMat)

  for (let i = 0; i < SATELLITE_COUNT; i++) {
    const satPivot = new THREE.Group()
    satPivot.rotation.x = (Math.random() - 0.5) * Math.PI
    satPivot.rotation.y = Math.random() * Math.PI * 2
    satPivot.rotation.z = (Math.random() - 0.5) * 0.8
    satelliteGroup.add(satPivot)

    const dist = earthRadius * (1.22 + Math.random() * 0.55)
    const satMesh = new THREE.Mesh(satGeo, satMat)
    satMesh.position.x = dist
    satPivot.add(satMesh)

    const cCurve = new THREE.EllipseCurve(0, 0, dist, dist, 0, Math.PI * 2)
    const cPts = cCurve.getPoints(40)
    const cGeo = new THREE.BufferGeometry().setFromPoints(
      cPts.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
    )
    geometriesToDispose.push(cGeo)
    const cMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
    })
    materialsToDispose.push(cMat)
    satPivot.add(new THREE.Line(cGeo, cMat))

    const speed = (0.75 + Math.random() * 0.9) * (Math.random() > 0.3 ? 1 : -1)
    const angle = Math.random() * Math.PI * 2

    constellationPivots.push({
      pivot: satPivot,
      mesh: satMesh,
      dist,
      speed,
      angle,
    })
  }

  // ── 4. Animation Loop Handler ─────────────────────────────────────────────
  let issAngle = 0
  let hstAngle = 1.8
  let strobeTimer = 0

  const updateSatellites = (delta, simSpeed) => {
    // 1. Advance ISS Orbit (~75s period)
    issAngle += delta * 0.55 * simSpeed
    issVessel.position.x = Math.cos(issAngle) * issOrbitRadius
    issVessel.position.z = Math.sin(issAngle) * issOrbitRadius
    // Orient ISS along flight velocity vector
    issVessel.rotation.y = -issAngle + Math.PI / 2

    // Articulate Solar Wings to face Sun (Alpha/Beta gimbal tracking)
    solarWings.forEach((wing, idx) => {
      // Periodic sun-tracking oscillation
      wing.rotation.x = Math.sin(issAngle) * 0.45 + (idx % 2 === 0 ? 0.1 : -0.1)
    })

    // 2. Advance Hubble Orbit (~92s period)
    hstAngle += delta * 0.42 * simSpeed
    hstVessel.position.x = Math.cos(hstAngle) * hstOrbitRadius
    hstVessel.position.z = Math.sin(hstAngle) * hstOrbitRadius
    hstVessel.rotation.y = -hstAngle

    // 3. Flash Navigational Strobe (1.0s strobe period)
    strobeTimer += delta * simSpeed
    const isFlash = (strobeTimer % 1.0) < 0.10
    strobeWhiteMat.opacity = isFlash ? 1.0 : 0.15
    centerStrobe.scale.setScalar(isFlash ? 2.0 : 0.8)

    // 4. Advance constellation satellites
    constellationPivots.forEach(s => {
      s.angle += delta * s.speed * 0.45 * simSpeed
      s.mesh.position.x = Math.cos(s.angle) * s.dist
      s.mesh.position.z = Math.sin(s.angle) * s.dist
    })
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: satelliteGroup,
    issVessel,
    hstVessel,
    raycastTargets,
    updateSatellites,
    dispose,
  }
}
