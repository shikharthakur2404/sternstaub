// ─────────────────────────────────────────────────────────────────────────────
// earthSatellites.js — Realistic Earth Orbital Satellites & ISS Space Station
// International Space Station (51.6° LEO orbit, golden solar panels, strobe beacons)
// and orbital satellite constellation around Earth
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Creates Earth's artificial satellite constellation and the International Space Station (ISS).
 * @param {THREE.Mesh} earthMesh - Earth mesh to attach the orbital satellite system to.
 * @param {number} earthRadius - Earth's physical radius.
 */
export function createEarthSatellites(earthMesh, earthRadius) {
  const satelliteGroup = new THREE.Group()
  satelliteGroup.name = 'earth-satellite-system'
  earthMesh.add(satelliteGroup)

  const raycastTargets = []
  const materialsToDispose = []
  const geometriesToDispose = []

  // ── 1. International Space Station (ISS) ──────────────────────────────────
  const issOrbitRadius = earthRadius * 1.34 // ~9.9 units
  const issOrbitPivot = new THREE.Group()
  // Authentic ISS orbital inclination: 51.6 degrees
  issOrbitPivot.rotation.x = THREE.MathUtils.degToRad(51.6)
  issOrbitPivot.rotation.z = THREE.MathUtils.degToRad(18.0)
  satelliteGroup.add(issOrbitPivot)

  // ISS Orbit Line
  const issOrbitCurve = new THREE.EllipseCurve(0, 0, issOrbitRadius, issOrbitRadius, 0, Math.PI * 2)
  const issOrbitPoints = issOrbitCurve.getPoints(64)
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

  // Central Pressurized Module (Destiny / Zvezda cylinder)
  const moduleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.95, 12)
  moduleGeo.rotateZ(Math.PI / 2)
  geometriesToDispose.push(moduleGeo)
  const moduleMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.25,
  })
  materialsToDispose.push(moduleMat)
  const moduleMesh = new THREE.Mesh(moduleGeo, moduleMat)
  issVessel.add(moduleMesh)

  // Integrated Truss Structure (Long cross girder)
  const trussGeo = new THREE.BoxGeometry(0.09, 0.09, 1.9)
  geometriesToDispose.push(trussGeo)
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.7,
    roughness: 0.4,
  })
  materialsToDispose.push(trussMat)
  issVessel.add(new THREE.Mesh(trussGeo, trussMat))

  // 4 Photovoltaic Solar Array Wings (Golden Solar Panels)
  const solarWingGeo = new THREE.BoxGeometry(0.55, 0.02, 0.65)
  geometriesToDispose.push(solarWingGeo)
  const solarWingMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x451a03,
    roughness: 0.2,
    metalness: 0.8,
  })
  materialsToDispose.push(solarWingMat)

  // Left & Right Solar Array Pairs
  const wingOffsets = [
    { x: 0, y: 0.05, z: 0.70 },
    { x: 0, y: -0.05, z: 0.70 },
    { x: 0, y: 0.05, z: -0.70 },
    { x: 0, y: -0.05, z: -0.70 },
  ]
  wingOffsets.forEach(off => {
    const wing = new THREE.Mesh(solarWingGeo, solarWingMat)
    wing.position.set(off.x, off.y, off.z)
    issVessel.add(wing)
  })

  // Pulsed Navigational Strobe Beacons
  const strobeGeo = new THREE.SphereGeometry(0.08, 8, 8)
  geometriesToDispose.push(strobeGeo)
  const strobeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const strobeRedMat   = new THREE.MeshBasicMaterial({ color: 0xef4444 })
  const strobeGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  materialsToDispose.push(strobeWhiteMat, strobeRedMat, strobeGreenMat)

  const beaconCenter = new THREE.Mesh(strobeGeo, strobeWhiteMat)
  beaconCenter.position.set(0, 0.22, 0)
  issVessel.add(beaconCenter)

  const beaconPort = new THREE.Mesh(strobeGeo, strobeRedMat)
  beaconPort.position.set(0, 0, 0.98)
  issVessel.add(beaconPort)

  const beaconStarboard = new THREE.Mesh(strobeGeo, strobeGreenMat)
  beaconStarboard.position.set(0, 0, -0.98)
  issVessel.add(beaconStarboard)

  issVessel.userData = {
    id: 'iss',
    name: 'ISS (International Space Station)',
    radius: 1.2,
    mesh: issVessel,
    isSatellite: true,
  }
  raycastTargets.push(issVessel)

  // ── 2. Earth Satellite Constellation (LEO & Geostationary Satellites) ──────
  const SATELLITE_COUNT = 12
  const constellationPivots = []

  const satGeo = new THREE.BoxGeometry(0.12, 0.08, 0.16)
  geometriesToDispose.push(satGeo)
  const satMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x0284c7,
    roughness: 0.3,
    metalness: 0.9,
  })
  materialsToDispose.push(satMat)

  for (let i = 0; i < SATELLITE_COUNT; i++) {
    const satPivot = new THREE.Group()
    // Distribute across varying orbital inclinations
    satPivot.rotation.x = (Math.random() - 0.5) * Math.PI
    satPivot.rotation.y = Math.random() * Math.PI * 2
    satPivot.rotation.z = (Math.random() - 0.5) * 0.8
    satelliteGroup.add(satPivot)

    const dist = earthRadius * (1.25 + Math.random() * 0.55) // Low to mid orbit
    const satMesh = new THREE.Mesh(satGeo, satMat)
    satMesh.position.x = dist
    satPivot.add(satMesh)

    // Faint subtle orbital ringlet
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

    const speed = (0.8 + Math.random() * 0.9) * (Math.random() > 0.3 ? 1 : -1)
    const angle = Math.random() * Math.PI * 2

    const satObj = {
      pivot: satPivot,
      mesh: satMesh,
      dist,
      speed,
      angle,
    }
    constellationPivots.push(satObj)
  }

  // ── 3. Animation Loop Handler ─────────────────────────────────────────────
  let issAngle = 0
  let strobeTimer = 0

  const updateSatellites = (delta, simSpeed) => {
    // Advance ISS Orbit (Fast orbital period ~72s)
    issAngle += delta * 0.65 * simSpeed
    issVessel.position.x = Math.cos(issAngle) * issOrbitRadius
    issVessel.position.z = Math.sin(issAngle) * issOrbitRadius
    // ISS orient along flight path
    issVessel.rotation.y = -issAngle + Math.PI / 2

    // Flash Strobe Beacon (1.0s strobe period)
    strobeTimer += delta * simSpeed
    const isFlash = (strobeTimer % 1.0) < 0.12
    strobeWhiteMat.opacity = isFlash ? 1.0 : 0.1
    beaconCenter.scale.setScalar(isFlash ? 1.8 : 0.8)

    // Advance satellite constellation
    constellationPivots.forEach(s => {
      s.angle += delta * s.speed * 0.45 * simSpeed
      s.mesh.position.x = Math.cos(s.angle) * s.dist
      s.mesh.position.z = Math.sin(s.angle) * s.dist
    })
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
  }

  return {
    group: satelliteGroup,
    issVessel,
    raycastTargets,
    updateSatellites,
    dispose,
  }
}
