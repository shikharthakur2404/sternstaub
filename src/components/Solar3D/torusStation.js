// ─────────────────────────────────────────────────────────────────────────────
// torusStation.js — Photorealistic Rotating Stanford Torus Megastructure ("Olympus Torus")
// High Earth Orbit artificial gravity space station featuring:
// 1. Multi-layer habit wheel: Dark titanium armor hull + glowing interior
//    city/biosphere window ring + 16 circumferential structural bulkhead ribs.
// 2. 4 open space-frame truss spoke towers with diagonal guy cables & mag-lev pods.
// 3. Segmented microgravity hub: Gold MLI quilted core, 4-way docking hub,
//    RCS thruster quads, spherical cryo propellant tanks, and communications dishes.
// 4. Dual articulated monocrystalline solar wings & accordion thermal radiators.
// 5. Berthed lifting-body orbital transfer shuttles & synchronized avionics strobes.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import {
  createTorusExteriorHullTexture,
  createTorusInteriorHabitatTexture,
  createRealisticMLITexture,
  createPhotovoltaicArrayTexture,
} from './proceduralTextures.js'

/**
 * Creates the photorealistic Olympus Torus Megastructure in High Earth Orbit.
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
  const hullTexture = createTorusExteriorHullTexture()
  texturesToDispose.push(hullTexture)

  const interiorHabitatTexture = createTorusInteriorHabitatTexture()
  texturesToDispose.push(interiorHabitatTexture)

  const mliTexture = createRealisticMLITexture()
  texturesToDispose.push(mliTexture)

  const pvTexture = createPhotovoltaicArrayTexture()
  texturesToDispose.push(pvTexture)

  // ── 1. Orbital Frame Setup (High Earth Orbit) ──────────────────────────────
  const orbitRadius = earthRadius * 2.32 // ~17.1 units (MEO/GEO corridor)
  const orbitPivot = new THREE.Group()
  orbitPivot.rotation.x = THREE.MathUtils.degToRad(14.5)
  orbitPivot.rotation.z = THREE.MathUtils.degToRad(32.0)
  stationRoot.add(orbitPivot)

  // Orbit Path Trace Ring
  const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, Math.PI * 2)
  const orbitPoints = orbitCurve.getPoints(140)
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

  // A. Primary Habitation Torus Hull (Dark Titanium & Composite Armor Plating)
  // Major radius: 2.3 units, tube radius: 0.36 units
  const torusGeo = new THREE.TorusGeometry(2.3, 0.36, 36, 100)
  geometriesToDispose.push(torusGeo)
  const torusMat = new THREE.MeshStandardMaterial({
    map: hullTexture,
    metalness: 0.45,
    roughness: 0.55,
    bumpMap: hullTexture,
    bumpScale: 0.02,
  })
  materialsToDispose.push(torusMat)
  const torusMesh = new THREE.Mesh(torusGeo, torusMat)
  spinningAssembly.add(torusMesh)

  // B. Inward-Facing Habitation Ceiling & Glass Skylight Gallery
  // Cylindrical inner band (R = 1.96, height = 0.44) looking directly into the interior city/biosphere
  const innerRingGeo = new THREE.CylinderGeometry(1.96, 1.96, 0.44, 80, 1, true)
  geometriesToDispose.push(innerRingGeo)
  const innerRingMat = new THREE.MeshStandardMaterial({
    map: interiorHabitatTexture,
    emissiveMap: interiorHabitatTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.85,
    side: THREE.BackSide,
    roughness: 0.3,
    metalness: 0.2,
  })
  materialsToDispose.push(innerRingMat)
  const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat)
  innerRingMesh.rotation.x = Math.PI / 2
  spinningAssembly.add(innerRingMesh)

  // Glass canopy layer with subtle specular reflections
  const glassGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.42, 64, 1, true)
  geometriesToDispose.push(glassGeo)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.4,
    side: THREE.BackSide,
  })
  materialsToDispose.push(glassMat)
  const glassMesh = new THREE.Mesh(glassGeo, glassMat)
  glassMesh.rotation.x = Math.PI / 2
  spinningAssembly.add(glassMesh)

  // C. 16 Circumferential Structural Bulkhead Rings (Aerospace Corrugated Girders)
  const bulkheadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.75,
    roughness: 0.35,
  })
  materialsToDispose.push(bulkheadMat)
  const bulkheadGeo = new THREE.TorusGeometry(0.38, 0.02, 12, 32)
  geometriesToDispose.push(bulkheadGeo)

  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16
    const ribPivot = new THREE.Group()
    ribPivot.rotation.z = angle

    const bulkhead = new THREE.Mesh(bulkheadGeo, bulkheadMat)
    bulkhead.position.x = 2.3
    bulkhead.rotation.y = Math.PI / 2
    ribPivot.add(bulkhead)
    spinningAssembly.add(ribPivot)
  }

  // D. Exterior Structural Keel Rings (Upper and Lower Rim Flanges)
  const keelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  })
  materialsToDispose.push(keelMat)
  const keelGeo = new THREE.TorusGeometry(2.66, 0.028, 12, 80)
  geometriesToDispose.push(keelGeo)

  const upperKeel = new THREE.Mesh(keelGeo, keelMat)
  upperKeel.position.z = 0.20
  spinningAssembly.add(upperKeel)

  const lowerKeel = new THREE.Mesh(keelGeo, keelMat)
  lowerKeel.position.z = -0.20
  spinningAssembly.add(lowerKeel)

  // E. 4 Open Space-Frame Truss Spoke Towers (Transit Elevator Shafts)
  const chordMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.85,
    roughness: 0.28,
  })
  materialsToDispose.push(chordMat)

  const transitTubeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.4,
  })
  materialsToDispose.push(transitTubeMat)

  const strutMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
    roughness: 0.3,
  })
  materialsToDispose.push(strutMat)

  const transitPods = []
  const podGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16)
  geometriesToDispose.push(podGeo)
  const podMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.2,
  })
  materialsToDispose.push(podMat)

  const spokeLength = 1.95
  const spokeGeo = new THREE.CylinderGeometry(0.065, 0.065, spokeLength, 16)
  geometriesToDispose.push(spokeGeo)

  const chordGeo = new THREE.CylinderGeometry(0.018, 0.018, spokeLength, 8)
  geometriesToDispose.push(chordGeo)

  const crossStrutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6)
  geometriesToDispose.push(crossStrutGeo)

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const spokeGroup = new THREE.Group()
    spokeGroup.rotation.z = angle
    spinningAssembly.add(spokeGroup)

    // Central pressurized mag-lev tube
    const spoke = new THREE.Mesh(spokeGeo, transitTubeMat)
    spoke.position.y = 0.50 + spokeLength / 2
    spokeGroup.add(spoke)

    // Triangular truss cage chords
    const chordOffsets = [
      { x: -0.11, z: -0.07 },
      { x: 0.11, z: -0.07 },
      { x: 0, z: 0.12 },
    ]
    chordOffsets.forEach(co => {
      const chord = new THREE.Mesh(chordGeo, chordMat)
      chord.position.set(co.x, 0.50 + spokeLength / 2, co.z)
      spokeGroup.add(chord)
    })

    // Diagonal truss lacing bays along spoke height
    for (let h = 0.70; h < 2.30; h += 0.25) {
      const strut1 = new THREE.Mesh(crossStrutGeo, strutMat)
      strut1.position.set(0, h, -0.07)
      strut1.rotation.z = Math.PI / 4
      spokeGroup.add(strut1)

      const strut2 = new THREE.Mesh(crossStrutGeo, strutMat)
      strut2.position.set(0.05, h, 0.02)
      strut2.rotation.x = Math.PI / 4
      spokeGroup.add(strut2)
    }

    // Terminal Vestibule Collars (Conical airlock flares at hub and rim)
    const baseCollarGeo = new THREE.CylinderGeometry(0.20, 0.12, 0.24, 16)
    geometriesToDispose.push(baseCollarGeo)
    const baseCollar = new THREE.Mesh(baseCollarGeo, chordMat)
    baseCollar.position.y = 0.54
    spokeGroup.add(baseCollar)

    const rimCollarGeo = new THREE.BoxGeometry(0.32, 0.18, 0.28)
    geometriesToDispose.push(rimCollarGeo)
    const rimCollar = new THREE.Mesh(rimCollarGeo, chordMat)
    rimCollar.position.y = 2.32
    spokeGroup.add(rimCollar)

    // Animated Mag-Lev Elevator Pod
    const pod = new THREE.Mesh(podGeo, podMat)
    spokeGroup.add(pod)
    transitPods.push({ mesh: pod, spokeGroup, phase: (i * Math.PI) / 2 })
  }

  // F. 8 Diagonal High-Tensile Guy Cables (Structural Rigging)
  const cableMat = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.45,
  })
  materialsToDispose.push(cableMat)

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const spokeMidX = Math.cos(angle) * 1.5
    const spokeMidY = Math.sin(angle) * 1.5

    // Fore and aft guy wires
    const cableGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0.75),
      new THREE.Vector3(spokeMidX, spokeMidY, 0),
    ])
    geometriesToDispose.push(cableGeo1)
    spinningAssembly.add(new THREE.Line(cableGeo1, cableMat))

    const cableGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -0.75),
      new THREE.Vector3(spokeMidX, spokeMidY, 0),
    ])
    geometriesToDispose.push(cableGeo2)
    spinningAssembly.add(new THREE.Line(cableGeo2, cableMat))
  }

  // G. 8 Perimeter Synchronized Xenon Navigation Strobes
  const strobeGeo = new THREE.SphereGeometry(0.045, 12, 12)
  geometriesToDispose.push(strobeGeo)
  const strobeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
  })
  materialsToDispose.push(strobeMat)

  const perimeterStrobes = []
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8
    const strobe = new THREE.Mesh(strobeGeo, strobeMat)
    strobe.position.set(Math.cos(angle) * 2.68, Math.sin(angle) * 2.68, 0)
    spinningAssembly.add(strobe)
    perimeterStrobes.push(strobe)
  }

  // ── 3. Counter-Stabilized Central Hub (Microgravity Industrial Core) ────────
  const centralHub = new THREE.Group()
  gimbalGroup.add(centralHub)

  // A. Segmented Core Spindle with Quilted Gold MLI Thermal Blankets
  const spindleGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.95, 32)
  geometriesToDispose.push(spindleGeo)
  const spindleMat = new THREE.MeshStandardMaterial({
    map: mliTexture,
    metalness: 0.85,
    roughness: 0.28,
    bumpMap: mliTexture,
    bumpScale: 0.04,
  })
  materialsToDispose.push(spindleMat)
  const spindle = new THREE.Mesh(spindleGeo, spindleMat)
  spindle.rotation.x = Math.PI / 2 // Orient along Z axis
  centralHub.add(spindle)

  // End-cap Titanium Rings
  const endCapGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 32)
  geometriesToDispose.push(endCapGeo)
  const endCapMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  })
  materialsToDispose.push(endCapMat)

  const foreCap = new THREE.Mesh(endCapGeo, endCapMat)
  foreCap.position.z = 1.02
  foreCap.rotation.x = Math.PI / 2
  centralHub.add(foreCap)

  const aftCap = new THREE.Mesh(endCapGeo, endCapMat)
  aftCap.position.z = -1.02
  aftCap.rotation.x = Math.PI / 2
  centralHub.add(aftCap)

  // B. Mechanical Rotational Bearing & Slip-Ring Collar
  const bearingGeo = new THREE.TorusGeometry(0.50, 0.05, 16, 40)
  geometriesToDispose.push(bearingGeo)
  const bearingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.2,
  })
  materialsToDispose.push(bearingMat)
  const bearingCollar = new THREE.Mesh(bearingGeo, bearingMat)
  centralHub.add(bearingCollar)

  // C. 4-Way Radial Berthing Ports & Axial APAS Airlock
  const collarGeo = new THREE.TorusGeometry(0.30, 0.045, 16, 32)
  geometriesToDispose.push(collarGeo)
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.25,
  })
  materialsToDispose.push(collarMat)

  // Forward axial docking port
  const foreCollar = new THREE.Mesh(collarGeo, collarMat)
  foreCollar.position.z = 1.15
  centralHub.add(foreCollar)

  // APAS Docking Petals (3 guide fins)
  for (let p = 0; p < 3; p++) {
    const petalGeo = new THREE.BoxGeometry(0.04, 0.12, 0.08)
    geometriesToDispose.push(petalGeo)
    const petal = new THREE.Mesh(petalGeo, endCapMat)
    const pAngle = (p * Math.PI * 2) / 3
    petal.position.set(Math.cos(pAngle) * 0.32, Math.sin(pAngle) * 0.32, 1.20)
    petal.rotation.z = pAngle
    centralHub.add(petal)
  }

  // Aft engineering axial port
  const aftCollar = new THREE.Mesh(collarGeo, collarMat)
  aftCollar.position.z = -1.15
  centralHub.add(aftCollar)

  // D. Docking Approach Guidance Beacons (Pulsing Amber/Cyan)
  const beaconGeo = new THREE.SphereGeometry(0.045, 12, 12)
  geometriesToDispose.push(beaconGeo)
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
  })
  materialsToDispose.push(beaconMat)

  const foreBeacon1 = new THREE.Mesh(beaconGeo, beaconMat)
  foreBeacon1.position.set(0, 0.44, 1.18)
  centralHub.add(foreBeacon1)

  const foreBeacon2 = new THREE.Mesh(beaconGeo, beaconMat)
  foreBeacon2.position.set(0, -0.44, 1.18)
  centralHub.add(foreBeacon2)

  // E. 4 Spherical Cryogenic Propellant Tanks (Aft Truss Bay)
  const tankGeo = new THREE.SphereGeometry(0.16, 16, 16)
  geometriesToDispose.push(tankGeo)
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.92,
    roughness: 0.15,
  })
  materialsToDispose.push(tankMat)

  for (let t = 0; t < 4; t++) {
    const tAngle = (t * Math.PI) / 2 + Math.PI / 4
    const tank = new THREE.Mesh(tankGeo, tankMat)
    tank.position.set(Math.cos(tAngle) * 0.52, Math.sin(tAngle) * 0.52, -0.65)
    centralHub.add(tank)
  }

  // F. RCS 4-Quad Attitude Control Thruster Blocks
  const rcsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 })
  materialsToDispose.push(rcsMat)
  const rcsNozzleGeo = new THREE.ConeGeometry(0.024, 0.06, 8)
  geometriesToDispose.push(rcsNozzleGeo)

  for (let q = 0; q < 4; q++) {
    const qAngle = (q * Math.PI) / 2
    const rcsGroup = new THREE.Group()
    rcsGroup.position.set(Math.cos(qAngle) * 0.62, Math.sin(qAngle) * 0.62, 0.85)
    centralHub.add(rcsGroup)

    // 4 directional thruster bells
    const n1 = new THREE.Mesh(rcsNozzleGeo, rcsMat)
    n1.rotation.x = Math.PI / 2
    rcsGroup.add(n1)
    const n2 = new THREE.Mesh(rcsNozzleGeo, rcsMat)
    n2.rotation.x = -Math.PI / 2
    rcsGroup.add(n2)
    const n3 = new THREE.Mesh(rcsNozzleGeo, rcsMat)
    n3.rotation.z = Math.PI / 2
    rcsGroup.add(n3)
    const n4 = new THREE.Mesh(rcsNozzleGeo, rcsMat)
    n4.rotation.z = -Math.PI / 2
    rcsGroup.add(n4)
  }

  // G. Dual Articulated Photovoltaic Solar Wings & Accordion Radiators
  const solarWingGroup = new THREE.Group()
  centralHub.add(solarWingGroup)

  // Solar Wing Booms (Scissor-Truss Masts)
  const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 12)
  geometriesToDispose.push(mastGeo)
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 })
  materialsToDispose.push(mastMat)
  const mast = new THREE.Mesh(mastGeo, mastMat)
  mast.rotation.z = Math.PI / 2
  solarWingGroup.add(mast)

  // Dual Monocrystalline Solar Array Panels
  const solarWingGeo = new THREE.PlaneGeometry(1.55, 0.75)
  geometriesToDispose.push(solarWingGeo)
  const solarWingMat = new THREE.MeshStandardMaterial({
    map: pvTexture,
    metalness: 0.88,
    roughness: 0.22,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(solarWingMat)

  const leftWing = new THREE.Mesh(solarWingGeo, solarWingMat)
  leftWing.position.set(-1.65, 0, 0)
  solarWingGroup.add(leftWing)

  const rightWing = new THREE.Mesh(solarWingGeo, solarWingMat)
  rightWing.position.set(1.65, 0, 0)
  solarWingGroup.add(rightWing)

  // Deployable Thermal Radiator Panels (Perpendicular white heat-rejection wings)
  const radiatorGeo = new THREE.PlaneGeometry(0.85, 0.45)
  geometriesToDispose.push(radiatorGeo)
  const radiatorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.1,
    roughness: 0.85,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(radiatorMat)

  const topRadiator = new THREE.Mesh(radiatorGeo, radiatorMat)
  topRadiator.position.set(0, 0.85, -0.45)
  topRadiator.rotation.x = Math.PI / 2
  centralHub.add(topRadiator)

  const bottomRadiator = new THREE.Mesh(radiatorGeo, radiatorMat)
  bottomRadiator.position.set(0, -0.85, -0.45)
  bottomRadiator.rotation.x = Math.PI / 2
  centralHub.add(bottomRadiator)

  // H. Dual Articulated High-Gain Parabolic Communications Dishes
  const dishGeo = new THREE.ConeGeometry(0.36, 0.16, 32, 1, true)
  geometriesToDispose.push(dishGeo)
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.9,
    roughness: 0.2,
    side: THREE.DoubleSide,
  })
  materialsToDispose.push(dishMat)

  const dish1 = new THREE.Mesh(dishGeo, dishMat)
  dish1.position.set(0, 0.72, 0.45)
  dish1.rotation.x = -Math.PI / 3.5
  centralHub.add(dish1)

  // I. Berthed Interplanetary Transfer Shuttles (Lifting-Body Spacecraft)
  const createDockedShuttle = (zOffset, angle) => {
    const shuttle = new THREE.Group()
    shuttle.position.set(Math.cos(angle) * 0.76, Math.sin(angle) * 0.76, zOffset)
    shuttle.rotation.z = angle + Math.PI / 2

    // Aerodynamic lifting-body fuselage
    const bodyGeo = new THREE.ConeGeometry(0.13, 0.48, 6)
    geometriesToDispose.push(bodyGeo)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.65,
      roughness: 0.35,
    })
    materialsToDispose.push(bodyMat)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.rotation.x = Math.PI / 2
    body.scale.set(1.4, 0.7, 1.0)
    shuttle.add(body)

    // Matte black heat shield belly
    const shieldGeo = new THREE.BoxGeometry(0.24, 0.04, 0.46)
    geometriesToDispose.push(shieldGeo)
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.1,
      roughness: 0.95,
    })
    materialsToDispose.push(shieldMat)
    const shield = new THREE.Mesh(shieldGeo, shieldMat)
    shield.position.y = -0.06
    shuttle.add(shield)

    // Glazed cockpit windshield
    const visorGeo = new THREE.BoxGeometry(0.12, 0.06, 0.10)
    geometriesToDispose.push(visorGeo)
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.95,
      roughness: 0.1,
    })
    materialsToDispose.push(visorMat)
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 0.05, 0.14)
    shuttle.add(visor)

    // Twin canted winglets
    const wingGeo = new THREE.BoxGeometry(0.04, 0.12, 0.18)
    geometriesToDispose.push(wingGeo)
    const wing1 = new THREE.Mesh(wingGeo, bodyMat)
    wing1.position.set(0.18, 0.04, -0.12)
    wing1.rotation.z = -0.45
    shuttle.add(wing1)

    const wing2 = new THREE.Mesh(wingGeo, bodyMat)
    wing2.position.set(-0.18, 0.04, -0.12)
    wing2.rotation.z = 0.45
    shuttle.add(wing2)

    // Blue Ion Thruster Exhaust Glow
    const exhaustGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.08, 12)
    geometriesToDispose.push(exhaustGeo)
    const exhaustMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    })
    materialsToDispose.push(exhaustMat)
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat)
    exhaust.position.set(0, 0, -0.26)
    exhaust.rotation.x = Math.PI / 2
    shuttle.add(exhaust)

    return shuttle
  }

  const shuttle1 = createDockedShuttle(0.35, 0)
  centralHub.add(shuttle1)

  const shuttle2 = createDockedShuttle(-0.35, Math.PI)
  centralHub.add(shuttle2)

  // ── 4. Interaction & Raycast Registration ──────────────────────────────────
  torusMesh.userData = {
    id: 'torus_station',
    name: 'Olympus Stanford Torus',
    desc: 'High Earth Orbit Megastructure • 1g Centrifugal Gravity • Habitation Population 14,000',
    mesh: vesselGroup,
  }
  raycastTargets.push(torusMesh)

  vesselGroup.userData = {
    id: 'torus_station',
    name: 'Olympus Stanford Torus',
    desc: 'High Earth Orbit Megastructure • 1g Centrifugal Gravity',
    mesh: vesselGroup,
  }

  // ── 5. Animation & Dynamic Physics Loop ───────────────────────────────────
  let orbitAngle = 0.85
  let strobeTimer = 0

  const updateStation = (delta, simSpeed) => {
    // 1. Advance Orbital Motion around Earth (~120s base period)
    orbitAngle += delta * 0.28 * simSpeed
    vesselGroup.position.x = Math.cos(orbitAngle) * orbitRadius
    vesselGroup.position.z = Math.sin(orbitAngle) * orbitRadius

    // Orient station along orbital flight path
    vesselGroup.rotation.y = -orbitAngle + Math.PI / 2

    // 2. Rotate Habitation Torus for Artificial Gravity (Spin Rate: ~0.26 rad/s)
    spinningAssembly.rotation.z += delta * 0.26 * simSpeed

    // 3. Animate Elevator Transit Pods along spoke towers
    strobeTimer += delta * simSpeed
    transitPods.forEach(pod => {
      // Smooth sinusoidal oscillation between 0.60 (hub) and 2.15 (rim)
      const t = (Math.sin(strobeTimer * 1.1 + pod.phase) + 1.0) / 2.0
      pod.mesh.position.y = 0.60 + t * 1.55
    })

    // 4. Flash Perimeter Strobes & Guidance Beacons
    // Synchronized double-flash strobe (1.0 Hz period)
    const cycle = strobeTimer % 1.0
    const isStrobe = cycle < 0.08 || (cycle > 0.16 && cycle < 0.24)
    strobeMat.opacity = isStrobe ? 1.0 : 0.12
    perimeterStrobes.forEach(s => s.scale.setScalar(isStrobe ? 1.9 : 0.8))

    const isBeacon = (strobeTimer % 1.4) < 0.7
    beaconMat.opacity = isBeacon ? 0.95 : 0.25

    // 5. Gimbal Solar Wings toward Sol Direction
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
