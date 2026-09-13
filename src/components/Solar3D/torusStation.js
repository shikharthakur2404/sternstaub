// ─────────────────────────────────────────────────────────────────────────────
// torusStation.js — Futuristic Rotating Stanford Torus Space Station ("Olympus Torus")
// High Earth Orbit Megastructure featuring continuous artificial gravity rotation,
// illuminated multi-deck habitation ring, elevator transit spokes, central zero-g
// docking hub, approach clearance beacons, solar arrays, and docked shuttlecraft.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import {
  createTorusHabitatTexture,
  createPhotovoltaicArrayTexture,
  createThermalBlanketTexture,
} from './proceduralTextures.js'

/**
 * Creates the Olympus Torus Space Station in High Earth Orbit.
 * @param {THREE.Mesh} earthMesh - Earth mesh to attach the orbital station to.
 * @param {number} earthRadius - Earth's physical radius in the scene.
 */
export function createTorusStation(earthMesh, earthRadius) {
  const stationRoot = new THREE.Group()
  stationRoot.name = 'olympus-torus-station-group'
  earthMesh.add(stationRoot)

  const raycastTargets = []
  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []

  // Procedural Textures
  const habitatTexture = createTorusHabitatTexture()
  texturesToDispose.push(habitatTexture)

  const pvTexture = createPhotovoltaicArrayTexture()
  texturesToDispose.push(pvTexture)

  const mliTexture = createThermalBlanketTexture()
  texturesToDispose.push(mliTexture)

  // ── 1. Orbital Frame Setup (High Earth Orbit) ──────────────────────────────
  const orbitRadius = earthRadius * 2.32 // ~17.1 units (MEO/GEO corridor)
  const orbitPivot = new THREE.Group()
  orbitPivot.rotation.x = THREE.MathUtils.degToRad(14.5)
  orbitPivot.rotation.z = THREE.MathUtils.degToRad(32.0)
  stationRoot.add(orbitPivot)

  // Orbit Path Trace Ring
  const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, Math.PI * 2)
  const orbitPoints = orbitCurve.getPoints(120)
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
  )
  geometriesToDispose.push(orbitGeo)
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.24,
  })
  materialsToDispose.push(orbitMat)
  orbitPivot.add(new THREE.Line(orbitGeo, orbitMat))

  // Station Vessel Root (moves along the orbit)
  const vesselGroup = new THREE.Group()
  vesselGroup.position.x = orbitRadius
  orbitPivot.add(vesselGroup)

  // Align station axis to face aesthetically along the orbital tangent
  const gimbalGroup = new THREE.Group()
  gimbalGroup.rotation.x = Math.PI / 2.3
  gimbalGroup.rotation.y = Math.PI / 6
  vesselGroup.add(gimbalGroup)

  // ── 2. Rotating Sub-Assembly (Artificial Gravity Habitat Wheel) ────────────
  const spinningAssembly = new THREE.Group()
  gimbalGroup.add(spinningAssembly)

  // A. Primary Habitation Torus
  // Major radius: 2.3 units, tube radius: 0.36 units
  const torusGeo = new THREE.TorusGeometry(2.3, 0.36, 32, 96)
  geometriesToDispose.push(torusGeo)
  const torusMat = new THREE.MeshStandardMaterial({
    map: habitatTexture,
    metalness: 0.72,
    roughness: 0.32,
    emissive: 0x0f172a,
    emissiveIntensity: 0.3,
  })
  materialsToDispose.push(torusMat)
  const torusMesh = new THREE.Mesh(torusGeo, torusMat)
  spinningAssembly.add(torusMesh)

  // B. Structural Outer Reinforcement Rings
  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.25,
  })
  materialsToDispose.push(ribMat)

  const ribGeo1 = new THREE.TorusGeometry(2.65, 0.035, 16, 80)
  geometriesToDispose.push(ribGeo1)
  const rib1 = new THREE.Mesh(ribGeo1, ribMat)
  rib1.position.z = 0.22
  spinningAssembly.add(rib1)

  const ribGeo2 = new THREE.TorusGeometry(2.65, 0.035, 16, 80)
  geometriesToDispose.push(ribGeo2)
  const rib2 = new THREE.Mesh(ribGeo2, ribMat)
  rib2.position.z = -0.22
  spinningAssembly.add(rib2)

  // C. 4 Structural Transit Spokes (Elevator Shafts connecting hub to rim)
  const spokeGeo = new THREE.CylinderGeometry(0.075, 0.075, 2.3, 16)
  geometriesToDispose.push(spokeGeo)
  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.82,
    roughness: 0.30,
  })
  materialsToDispose.push(spokeMat)

  const transitPods = []
  const podGeo = new THREE.BoxGeometry(0.14, 0.18, 0.14)
  geometriesToDispose.push(podGeo)
  const podMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  })
  materialsToDispose.push(podMat)

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const spokeGroup = new THREE.Group()
    spokeGroup.rotation.z = angle
    spinningAssembly.add(spokeGroup)

    const spoke = new THREE.Mesh(spokeGeo, spokeMat)
    // Offset along Y so base is at hub and tip is at torus rim
    spoke.position.y = 1.15
    spokeGroup.add(spoke)

    // Animated Elevator Transit Pod
    const pod = new THREE.Mesh(podGeo, podMat)
    spokeGroup.add(pod)
    transitPods.push({ mesh: pod, spokeGroup, phase: (i * Math.PI) / 2 })
  }

  // D. Perimeter Navigation Strobes (4 cardinal points on the rotating rim)
  const strobeGeo = new THREE.SphereGeometry(0.06, 12, 12)
  geometriesToDispose.push(strobeGeo)
  const strobeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  })
  materialsToDispose.push(strobeMat)

  const perimeterStrobes = []
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const strobe = new THREE.Mesh(strobeGeo, strobeMat)
    strobe.position.set(Math.cos(angle) * 2.68, Math.sin(angle) * 2.68, 0)
    spinningAssembly.add(strobe)
    perimeterStrobes.push(strobe)
  }

  // ── 3. Counter-Stabilized Central Hub (Zero-G Docking & Core Systems) ──────
  const centralHub = new THREE.Group()
  gimbalGroup.add(centralHub)

  // A. Axial Spindle
  const spindleGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.2, 32)
  geometriesToDispose.push(spindleGeo)
  const spindleMat = new THREE.MeshStandardMaterial({
    map: mliTexture,
    metalness: 0.88,
    roughness: 0.25,
  })
  materialsToDispose.push(spindleMat)
  const spindle = new THREE.Mesh(spindleGeo, spindleMat)
  spindle.rotation.x = Math.PI / 2 // Orient along Z axis
  centralHub.add(spindle)

  // B. Fore & Aft Docking Collars
  const collarGeo = new THREE.TorusGeometry(0.32, 0.05, 16, 32)
  geometriesToDispose.push(collarGeo)
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  })
  materialsToDispose.push(collarMat)

  const foreCollar = new THREE.Mesh(collarGeo, collarMat)
  foreCollar.position.z = 1.12
  centralHub.add(foreCollar)

  const aftCollar = new THREE.Mesh(collarGeo, collarMat)
  aftCollar.position.z = -1.12
  centralHub.add(aftCollar)

  // C. Docking Approach Clearance Beacons (Pulsing Amber/Cyan)
  const beaconGeo = new THREE.SphereGeometry(0.045, 12, 12)
  geometriesToDispose.push(beaconGeo)
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
  })
  materialsToDispose.push(beaconMat)

  const foreBeacon = new THREE.Mesh(beaconGeo, beaconMat)
  foreBeacon.position.set(0, 0.38, 1.15)
  centralHub.add(foreBeacon)

  const aftBeacon = new THREE.Mesh(beaconGeo, beaconMat)
  aftBeacon.position.set(0, 0.38, -1.15)
  centralHub.add(aftBeacon)

  // D. Photovoltaic Solar Concentrator Wings (Mounted to non-rotating hub)
  const solarWingGroup = new THREE.Group()
  centralHub.add(solarWingGroup)

  const solarWingGeo = new THREE.PlaneGeometry(1.6, 0.8)
  geometriesToDispose.push(solarWingGeo)
  const solarWingMat = new THREE.MeshStandardMaterial({
    map: pvTexture,
    metalness: 0.92,
    roughness: 0.20,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(solarWingMat)

  const leftWing = new THREE.Mesh(solarWingGeo, solarWingMat)
  leftWing.position.set(-1.45, 0, 0)
  solarWingGroup.add(leftWing)

  const rightWing = new THREE.Mesh(solarWingGeo, solarWingMat)
  rightWing.position.set(1.45, 0, 0)
  solarWingGroup.add(rightWing)

  // Solar Boom Mounts
  const boomGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.9, 12)
  geometriesToDispose.push(boomGeo)
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
  materialsToDispose.push(boomMat)
  const boom = new THREE.Mesh(boomGeo, boomMat)
  boom.rotation.z = Math.PI / 2
  solarWingGroup.add(boom)

  // E. Deep Space High-Gain Communications Dish
  const dishGeo = new THREE.ConeGeometry(0.38, 0.18, 32, 1, true)
  geometriesToDispose.push(dishGeo)
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.92,
    roughness: 0.18,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(dishMat)
  const dish = new THREE.Mesh(dishGeo, dishMat)
  dish.position.set(0, 0.72, 0)
  dish.rotation.x = -Math.PI / 3
  centralHub.add(dish)

  // F. Docked Interplanetary Transport Shuttles (Berthed at lateral docking rings)
  const createDockedShuttle = (zOffset, angle) => {
    const shuttle = new THREE.Group()
    shuttle.position.set(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, zOffset)
    shuttle.rotation.z = angle + Math.PI / 2

    // Wedge Fuselage
    const hullGeo = new THREE.ConeGeometry(0.12, 0.44, 4)
    geometriesToDispose.push(hullGeo)
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3,
    })
    materialsToDispose.push(hullMat)
    const hull = new THREE.Mesh(hullGeo, hullMat)
    hull.rotation.x = Math.PI / 2
    shuttle.add(hull)

    // Blue Ion Engine Glow
    const engineGeo = new THREE.SphereGeometry(0.04, 12, 12)
    geometriesToDispose.push(engineGeo)
    const engineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    materialsToDispose.push(engineMat)
    const engine = new THREE.Mesh(engineGeo, engineMat)
    engine.position.z = -0.22
    shuttle.add(engine)

    centralHub.add(shuttle)
  }
  createDockedShuttle(0.4, 0)
  createDockedShuttle(-0.4, Math.PI)

  // ── 4. Raycast Target & User Data Metadata ────────────────────────────────
  vesselGroup.userData = {
    id: 'torus_station',
    name: 'Olympus Torus (Orbital Station)',
    radius: 3.2,
    mesh: vesselGroup,
    isStation: true,
  }
  raycastTargets.push(torusMesh, spindle)

  // ── 5. Animation & Dynamic Physics Loop ───────────────────────────────────
  let orbitAngle = 0.85
  let strobeTimer = 0

  const updateStation = (delta, simSpeed) => {
    // 1. Advance Orbital Motion around Earth (~120s base period)
    orbitAngle += delta * 0.28 * simSpeed
    vesselGroup.position.x = Math.cos(orbitAngle) * orbitRadius
    vesselGroup.position.z = Math.sin(orbitAngle) * orbitRadius

    // Orient station along velocity vector
    vesselGroup.rotation.y = -orbitAngle + Math.PI / 2

    // 2. Rotate Habitation Torus for Artificial Gravity (Spin Rate: ~0.35 rad/s)
    spinningAssembly.rotation.z += delta * 0.35 * simSpeed

    // 3. Animate Elevator Transit Pods along spokes (Radially cycling)
    strobeTimer += delta * simSpeed
    transitPods.forEach(pod => {
      // Oscillate between 0.45 (near hub) and 2.15 (near rim)
      const t = (Math.sin(strobeTimer * 1.2 + pod.phase) + 1.0) / 2.0
      pod.mesh.position.y = 0.45 + t * 1.70
    })

    // 4. Flash Perimeter Strobes & Approach Beacons (1.0 Hz period)
    const isStrobe = (strobeTimer % 1.0) < 0.12
    strobeMat.opacity = isStrobe ? 1.0 : 0.15
    perimeterStrobes.forEach(s => s.scale.setScalar(isStrobe ? 1.8 : 0.8))

    const isBeacon = (strobeTimer % 1.6) < 0.8
    beaconMat.opacity = isBeacon ? 0.95 : 0.25

    // 5. Gimbal Solar Booms to Face Sol Direction
    solarWingGroup.rotation.x = Math.sin(orbitAngle) * 0.35
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: stationRoot,
    vesselGroup,
    raycastTargets,
    updateStation,
    dispose,
  }
}
