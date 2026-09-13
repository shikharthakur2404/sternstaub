// ─────────────────────────────────────────────────────────────────────────────
// meteorShower.js — Dynamic Interplanetary Meteor Showers & Bolide Streaks
// Periodic bolide waves, hypersonic ionization trails, and terminal ablation bursts
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

export function createMeteorShower() {
  const group = new THREE.Group()
  group.name = 'meteor-shower-system'

  const MAX_METEORS = 36
  const TRAIL_LENGTH = 10 // Vertices per meteor trail

  // Pre-allocated LineSegments geometry for all trails
  // Each segment connects vertex (k) to (k+1), so (TRAIL_LENGTH - 1) segments per meteor
  const segmentsPerMeteor = TRAIL_LENGTH - 1
  const totalSegments = MAX_METEORS * segmentsPerMeteor
  const totalVerts = totalSegments * 2

  const positions = new Float32Array(totalVerts * 3)
  const colors = new Float32Array(totalVerts * 3)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const lineSegments = new THREE.LineSegments(geo, mat)
  group.add(lineSegments)

  // Meteor state pool
  const meteors = []
  for (let i = 0; i < MAX_METEORS; i++) {
    meteors.push({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      history: Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()),
      life: 0,
      maxLife: 0,
      colorStart: new THREE.Color(0xffffff),
      colorEnd: new THREE.Color(0xf97316),
      speed: 0,
    })
  }

  // Terminal ablation burst particles
  const burstGeo = new THREE.BufferGeometry()
  const BURST_COUNT = 48
  const burstPos = new Float32Array(BURST_COUNT * 3)
  const burstColors = new Float32Array(BURST_COUNT * 3)
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3))
  burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3))

  const burstMat = new THREE.PointsMaterial({
    size: 4.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const burstPoints = new THREE.Points(burstGeo, burstMat)
  group.add(burstPoints)

  const burstPool = Array.from({ length: BURST_COUNT }, () => ({
    active: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 0,
    color: new THREE.Color(),
  }))

  const spawnBurst = (x, y, z, color) => {
    for (let i = 0; i < 4; i++) {
      const b = burstPool.find(p => !p.active)
      if (!b) break
      b.active = true
      b.pos.set(x, y, z)
      b.vel.set(
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45
      )
      b.life = 0
      b.maxLife = 0.4 + Math.random() * 0.3
      b.color.copy(color)
    }
  }

  // Spawn a single meteor
  const spawnMeteor = () => {
    const m = meteors.find(item => !item.active)
    if (!m) return

    m.active = true
    m.life = 0
    m.maxLife = 0.8 + Math.random() * 0.9

    // Random spawn position across interplanetary sphere
    const spawnDist = 900 + Math.random() * 1200
    const theta = Math.random() * Math.PI * 2
    const phi = (Math.random() - 0.5) * Math.PI * 0.7

    m.pos.set(
      spawnDist * Math.cos(phi) * Math.cos(theta),
      spawnDist * Math.sin(phi) + (Math.random() - 0.5) * 300,
      spawnDist * Math.cos(phi) * Math.sin(theta)
    )

    // Radiant direction (streaking across field)
    const targetOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 500,
      (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 500
    )
    const dir = targetOffset.sub(m.pos).normalize()

    m.speed = 1200 + Math.random() * 1800 // Hypersonic units/sec
    m.vel.copy(dir).multiplyScalar(m.speed)

    // Initialise history trail
    for (let k = 0; k < TRAIL_LENGTH; k++) {
      m.history[k].copy(m.pos)
    }

    // Spectral ionization color (hot electric blue/white to sodium orange)
    if (Math.random() < 0.6) {
      m.colorStart.set(0x93c5fd) // Ionized magnesium/nitrogen blue
      m.colorEnd.set(0x38bdf8)
    } else {
      m.colorStart.set(0xfef08a) // Sodium yellow / incandescent iron
      m.colorEnd.set(0xf97316)
    }
  }

  // Trigger a full meteor wave (shower storm)
  const triggerStorm = (count = 14) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        spawnMeteor()
      }, i * (80 + Math.random() * 120))
    }
  }

  // Automatic periodic shower scheduler
  let nextShowerTimer = 8.0 // First wave arrives in 8 seconds

  const updateMeteors = (delta, simSpeed) => {
    const effDelta = Math.min(delta, 0.05) * Math.max(simSpeed, 0.4)

    nextShowerTimer -= effDelta
    if (nextShowerTimer <= 0) {
      triggerStorm(8 + Math.floor(Math.random() * 6))
      nextShowerTimer = 12.0 + Math.random() * 8.0 // Wave cadence
    }

    const posAttr = geo.attributes.position
    const colAttr = geo.attributes.color

    let vIdx = 0

    // Update active meteors
    meteors.forEach(m => {
      if (!m.active) return

      m.life += effDelta
      if (m.life >= m.maxLife) {
        m.active = false
        spawnBurst(m.pos.x, m.pos.y, m.pos.z, m.colorEnd)
        return
      }

      // Advance position
      m.pos.addScaledVector(m.vel, effDelta)

      // Shift history trail
      for (let k = TRAIL_LENGTH - 1; k > 0; k--) {
        m.history[k].copy(m.history[k - 1])
      }
      m.history[0].copy(m.pos)

      // Fade factor over lifespan
      const lifeProg = m.life / m.maxLife
      const alphaFade = Math.sin(lifeProg * Math.PI) // Peak in middle

      // Write line segments into buffer
      for (let k = 0; k < segmentsPerMeteor; k++) {
        const p1 = m.history[k]
        const p2 = m.history[k + 1]

        const t1 = 1.0 - k / TRAIL_LENGTH
        const t2 = 1.0 - (k + 1) / TRAIL_LENGTH

        // Vertex 1
        posAttr.setXYZ(vIdx, p1.x, p1.y, p1.z)
        colAttr.setXYZ(
          vIdx,
          m.colorStart.r * t1 * alphaFade,
          m.colorStart.g * t1 * alphaFade,
          m.colorStart.b * t1 * alphaFade
        )
        vIdx++

        // Vertex 2
        posAttr.setXYZ(vIdx, p2.x, p2.y, p2.z)
        colAttr.setXYZ(
          vIdx,
          m.colorEnd.r * t2 * alphaFade * 0.7,
          m.colorEnd.g * t2 * alphaFade * 0.7,
          m.colorEnd.b * t2 * alphaFade * 0.7
        )
        vIdx++
      }
    })

    // Zero out unused vertices
    while (vIdx < totalVerts) {
      posAttr.setXYZ(vIdx, 0, 0, 0)
      colAttr.setXYZ(vIdx, 0, 0, 0)
      vIdx++
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    // Update terminal burst particles
    const bPosAttr = burstGeo.attributes.position
    const bColAttr = burstGeo.attributes.color

    burstPool.forEach((b, idx) => {
      if (!b.active) {
        bPosAttr.setXYZ(idx, 0, 0, 0)
        bColAttr.setXYZ(idx, 0, 0, 0)
        return
      }

      b.life += effDelta
      if (b.life >= b.maxLife) {
        b.active = false
        bPosAttr.setXYZ(idx, 0, 0, 0)
        bColAttr.setXYZ(idx, 0, 0, 0)
        return
      }

      b.pos.addScaledVector(b.vel, effDelta)
      const fade = 1.0 - b.life / b.maxLife

      bPosAttr.setXYZ(idx, b.pos.x, b.pos.y, b.pos.z)
      bColAttr.setXYZ(idx, b.color.r * fade, b.color.g * fade, b.color.b * fade)
    })

    bPosAttr.needsUpdate = true
    bColAttr.needsUpdate = true
  }

  const dispose = () => {
    geo.dispose()
    mat.dispose()
    burstGeo.dispose()
    burstMat.dispose()
  }

  return {
    group,
    updateMeteors,
    triggerStorm,
    dispose,
  }
}
