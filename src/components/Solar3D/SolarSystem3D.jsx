// ─────────────────────────────────────────────────────────────────────────────
// SolarSystem3D.jsx — Interactive 3D Rotatable Planetary Engine (Three.js)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  createSunTexture,
  createMercuryTexture,
  createVenusTexture,
  createEarthTexture,
  createEarthCloudTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingTexture,
  createUranusTexture,
  createNeptuneTexture,
} from './planetTextures'
import './SolarSystem3D.css'

const PLANET_DATA = [
  { id: 'mercury', name: 'Mercury', r: 4.2,  dist: 65,  speed: 0.024, tilt: 0.03, rot: 0.008, fn: createMercuryTexture },
  { id: 'venus',   name: 'Venus',   r: 6.8,  dist: 98,  speed: 0.018, tilt: 3.10, rot: -0.004, fn: createVenusTexture },
  { id: 'earth',   name: 'Earth',   r: 7.4,  dist: 142, speed: 0.014, tilt: 0.41, rot: 0.016, fn: createEarthTexture, hasClouds: true, hasMoon: true },
  { id: 'mars',    name: 'Mars',    r: 5.2,  dist: 188, speed: 0.011, tilt: 0.44, rot: 0.014, fn: createMarsTexture },
  { id: 'jupiter', name: 'Jupiter', r: 18.0, dist: 310, speed: 0.006, tilt: 0.05, rot: 0.035, fn: createJupiterTexture },
  { id: 'saturn',  name: 'Saturn',  r: 15.0, dist: 420, speed: 0.004, tilt: 0.47, rot: 0.028, fn: createSaturnTexture, hasRings: true },
  { id: 'uranus',  name: 'Uranus',  r: 9.5,  dist: 520, speed: 0.0028, tilt: 1.70, rot: -0.018, fn: createUranusTexture, hasUranusRing: true },
  { id: 'neptune', name: 'Neptune', r: 9.2,  dist: 610, speed: 0.0020, tilt: 0.50, rot: 0.020, fn: createNeptuneTexture },
]

export default function SolarSystem3D({ onReturn }) {
  const mountRef = useRef(null)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [simSpeed, setSimSpeed] = useState(1.0)
  const [isWarpingOut, setIsWarpingOut] = useState(false)

  // Shared references for animation loop
  const targetCamPosRef = useRef(null)
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  const focusedPlanetRef = useRef(null)
  const simSpeedRef = useRef(1.0)

  useEffect(() => {
    simSpeedRef.current = simSpeed
  }, [simSpeed])

  const handleReturnTrigger = useCallback(() => {
    if (isWarpingOut) return
    setIsWarpingOut(true)
    setTimeout(() => {
      onReturn?.()
    }, 1200)
  }, [isWarpingOut, onReturn])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'w' || e.key === 'W') {
        handleReturnTrigger()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleReturnTrigger])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // ── 1. Scene, Camera, Renderer ──────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x02050b)

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 6000)
    camera.position.set(0, 320, 680)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 2200
    controls.minDistance = 25

    // ── 2. Lighting ─────────────────────────────────────────────────────────
    const sunLight = new THREE.PointLight(0xffffff, 3.2, 3500, 0.4)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambientLight)

    // ── 3. Distant Starfield ────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry()
    const starCount = 3000
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 2400 + Math.random() * 800
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      starPos[i]     = r * Math.sin(phi) * Math.cos(theta)
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i + 2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.8 })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // ── 4. The Sun ──────────────────────────────────────────────────────────
    const sunGeo = new THREE.SphereGeometry(30, 48, 48)
    const sunMat = new THREE.MeshBasicMaterial({ map: createSunTexture() })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    // Sun Corona Glow
    const coronaGeo = new THREE.SphereGeometry(32.5, 32, 32)
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    })
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat)
    sunMesh.add(coronaMesh)

    // ── 5. Planets & Orbits ─────────────────────────────────────────────────
    const planetObjects = []
    const raycastTargets = [sunMesh]
    sunMesh.userData = { id: 'sun', name: 'Sol (The Sun)', radius: 30 }

    PLANET_DATA.forEach(p => {
      // Orbit Line
      const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, 2 * Math.PI, false, 0)
      const points = orbitCurve.getPoints(120)
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
      )
      const orbitMat = new THREE.LineBasicMaterial({
        color: p.id === 'earth' ? 0x38bdf8 : 0x64748b,
        transparent: true,
        opacity: p.id === 'earth' ? 0.28 : 0.12,
      })
      const orbitLine = new THREE.Line(orbitGeo, orbitMat)
      scene.add(orbitLine)

      // Pivot node
      const pivot = new THREE.Group()
      scene.add(pivot)

      // Planet Sphere
      const pGeo = new THREE.SphereGeometry(p.r, 40, 40)
      const pMat = new THREE.MeshStandardMaterial({
        map: p.fn(),
        roughness: 0.8,
        metalness: 0.1,
      })
      const pMesh = new THREE.Mesh(pGeo, pMat)
      pMesh.rotation.z = p.tilt
      pMesh.userData = { id: p.id, name: p.name, radius: p.r, mesh: pMesh }
      pivot.add(pMesh)
      pMesh.position.x = p.dist

      raycastTargets.push(pMesh)

      // Earth atmospheric clouds & Moon
      let cloudMesh = null
      let moonMesh = null
      if (p.hasClouds) {
        const cGeo = new THREE.SphereGeometry(p.r * 1.018, 36, 36)
        const cMat = new THREE.MeshStandardMaterial({
          map: createEarthCloudTexture(),
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
        })
        cloudMesh = new THREE.Mesh(cGeo, cMat)
        pMesh.add(cloudMesh)
      }

      if (p.hasMoon) {
        const mGeo = new THREE.SphereGeometry(1.8, 20, 20)
        const mMat = new THREE.MeshStandardMaterial({ map: createMercuryTexture(), roughness: 0.9 })
        moonMesh = new THREE.Mesh(mGeo, mMat)
        pMesh.add(moonMesh)
      }

      // Saturn Rings
      if (p.hasRings) {
        const rGeo = new THREE.RingGeometry(p.r * 1.35, p.r * 2.45, 64)
        // Adjust UV mapping so texture coordinates span radially
        const pos = rGeo.attributes.position
        const uv = rGeo.attributes.uv
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i)
          const vy = pos.getY(i)
          const dist = Math.sqrt(vx * vx + vy * vy)
          const norm = (dist - p.r * 1.35) / (p.r * 2.45 - p.r * 1.35)
          uv.setXY(i, norm, 0.5)
        }
        rGeo.rotateX(Math.PI / 2)
        const rMat = new THREE.MeshStandardMaterial({
          map: createSaturnRingTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
        })
        const ringMesh = new THREE.Mesh(rGeo, rMat)
        pMesh.add(ringMesh)
      }

      // Uranus Ring
      if (p.hasUranusRing) {
        const uRingGeo = new THREE.RingGeometry(p.r * 1.3, p.r * 1.5, 48)
        uRingGeo.rotateX(Math.PI / 2)
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0xa5f3fc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        })
        pMesh.add(new THREE.Mesh(uRingGeo, uRingMat))
      }

      planetObjects.push({
        data: p,
        pivot,
        mesh: pMesh,
        cloudMesh,
        moonMesh,
        angle: Math.random() * Math.PI * 2,
      })
    })

    // ── 6. Main Asteroid Belt ───────────────────────────────────────────────
    const asteroidGeo = new THREE.DodecahedronGeometry(0.7, 1)
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
    const asteroidCount = 450
    const asteroidMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < asteroidCount; i++) {
      const dist = 225 + (Math.random() - 0.5) * 45
      const angle = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 14
      dummy.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      const scale = Math.random() * 1.2 + 0.4
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      asteroidMesh.setMatrixAt(i, dummy.matrix)
    }
    asteroidMesh.instanceMatrix.needsUpdate = true
    scene.add(asteroidMesh)

    // ── 7. Quantum Singularity Gateway (Return Portal) ──────────────────────
    const gatewayGroup = new THREE.Group()
    gatewayGroup.position.set(380, 45, -280)
    scene.add(gatewayGroup)

    const gateTorusGeo = new THREE.TorusGeometry(15, 1.8, 16, 64)
    const gateTorusMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    const gateTorus = new THREE.Mesh(gateTorusGeo, gateTorusMat)
    gatewayGroup.add(gateTorus)

    const gateHoleGeo = new THREE.SphereGeometry(12, 32, 32)
    const gateHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const gateHole = new THREE.Mesh(gateHoleGeo, gateHoleMat)
    gatewayGroup.add(gateHole)
    gateHole.userData = { id: 'gateway', name: 'Quantum Singularity Gate' }
    raycastTargets.push(gateHole)

    // ── 8. Raycaster Pointer Interaction ────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handlePointerDown = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(raycastTargets, true)
      if (intersects.length > 0) {
        let hitObj = intersects[0].object
        while (hitObj && !hitObj.userData?.name) hitObj = hitObj.parent
        if (hitObj?.userData) {
          if (hitObj.userData.id === 'gateway') {
            handleReturnTrigger()
          } else {
            focusOnTarget(hitObj.userData)
          }
        }
      }
    }
    container.addEventListener('pointerdown', handlePointerDown)

    const focusOnTarget = (targetData) => {
      setSelectedPlanet(targetData.name)
      focusedPlanetRef.current = targetData
      const targetRadius = targetData.radius || 10
      const offset = targetRadius * 3.8 + 12
      targetCamPosRef.current = new THREE.Vector3(offset, offset * 0.45, offset)
    }

    // Expose focus setter to HUD
    container.focusPlanet = (id) => {
      if (id === 'overview') {
        setSelectedPlanet(null)
        focusedPlanetRef.current = null
        targetCamPosRef.current = new THREE.Vector3(0, 320, 680)
        targetLookAtRef.current = new THREE.Vector3(0, 0, 0)
      } else if (id === 'sun') {
        focusOnTarget(sunMesh.userData)
      } else {
        const found = planetObjects.find(p => p.data.id === id)
        if (found) focusOnTarget(found.mesh.userData)
      }
    }

    // ── 9. Render & Physics Loop ────────────────────────────────────────────
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const speedMult = simSpeedRef.current

      // Rotate Sun
      sunMesh.rotation.y += 0.003 * speedMult
      coronaMesh.rotation.y -= 0.002 * speedMult

      // Rotate Singularity Gateway
      gateTorus.rotation.x += 0.02 * speedMult
      gateTorus.rotation.y += 0.03 * speedMult

      // Orbit Asteroids
      asteroidMesh.rotation.y += 0.0008 * speedMult

      // Advance Planets
      planetObjects.forEach(po => {
        po.angle += po.data.speed * delta * 2.4 * speedMult
        po.mesh.position.x = Math.cos(po.angle) * po.data.dist
        po.mesh.position.z = Math.sin(po.angle) * po.data.dist

        // Self-rotation on axial tilt
        po.mesh.rotation.y += po.data.rot * speedMult

        if (po.cloudMesh) {
          po.cloudMesh.rotation.y += po.data.rot * 1.25 * speedMult
        }

        if (po.moonMesh) {
          const mTime = clock.getElapsedTime() * 1.8 * speedMult
          po.moonMesh.position.x = Math.cos(mTime) * 16
          po.moonMesh.position.z = Math.sin(mTime) * 16
        }
      })

      // Smooth Camera Lerp when targeting a planet
      if (focusedPlanetRef.current) {
        const targetWorldPos = new THREE.Vector3()
        if (focusedPlanetRef.current.id === 'sun') {
          targetWorldPos.set(0, 0, 0)
        } else {
          focusedPlanetRef.current.mesh.getWorldPosition(targetWorldPos)
        }
        targetLookAtRef.current.lerp(targetWorldPos, 0.06)
        controls.target.copy(targetLookAtRef.current)

        if (targetCamPosRef.current) {
          const desiredPos = targetWorldPos.clone().add(targetCamPosRef.current)
          camera.position.lerp(desiredPos, 0.06)
        }
      } else if (targetCamPosRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.05)
        controls.target.lerp(targetLookAtRef.current, 0.05)
        if (camera.position.distanceTo(targetCamPosRef.current) < 5) {
          targetCamPosRef.current = null
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // ── 10. Viewport Resize Handler ─────────────────────────────────────────
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('pointerdown', handlePointerDown)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [handleReturnTrigger])

  return (
    <div className={`solar-3d-container ${isWarpingOut ? 'warp-out' : ''}`} ref={mountRef}>
      {/* 3D HUD Navigation Bar */}
      <div className="solar-3d-hud">
        <div className="hud-brand">
          <span className="hud-pulse-dot" />
          <span className="hud-system-title">☉ KEPLERIAN 3D SOLAR SYSTEM</span>
          {selectedPlanet && <span className="hud-planet-focus">LOCKED: {selectedPlanet.toUpperCase()}</span>}
        </div>

        {/* Planet Quick-Nav Selector */}
        <div className="planet-nav-strip">
          <button
            className={`nav-chip ${!selectedPlanet ? 'active' : ''}`}
            onClick={() => mountRef.current?.focusPlanet?.('overview')}
          >
            ⊚ SYSTEM
          </button>
          <button
            className={`nav-chip ${selectedPlanet === 'Sol (The Sun)' ? 'active' : ''}`}
            onClick={() => mountRef.current?.focusPlanet?.('sun')}
          >
            ☉ SOL
          </button>
          {PLANET_DATA.map(p => (
            <button
              key={p.id}
              className={`nav-chip ${selectedPlanet === p.name ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.(p.id)}
            >
              {p.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Action controls */}
        <div className="hud-actions-strip">
          <div className="speed-controller">
            <span className="speed-label">TIME WARP</span>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={simSpeed}
              onChange={e => setSimSpeed(parseFloat(e.target.value))}
            />
            <span className="speed-value">{simSpeed.toFixed(1)}x</span>
          </div>

          <button
            className="return-wormhole-btn"
            onClick={handleReturnTrigger}
            title="Engage Reverse Singularity Transit (W)"
          >
            ⦿ RETURN TO STARDUST (W)
          </button>
        </div>
      </div>

      {/* Cinematic Warp Collapse Overlay during departure */}
      {isWarpingOut && (
        <div className="warp-out-overlay">
          <div className="warp-singularity-vortex" />
          <div className="warp-hud-telemetry">
            ✦ REVERSE EINSTEIN-ROSEN PLUNGE ENGAGED // TRAVERSING BACK TO STARDUST DIMENSION
          </div>
        </div>
      )}
    </div>
  )
}
