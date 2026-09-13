// ─────────────────────────────────────────────────────────────────────────────
// SolarSystem3D.jsx — Super-Realistic Keplerian 3D Multi-Cosmic Engine (Three.js)
// Sol System • TRAPPIST-1 Red Dwarf Exosystem • Andromeda (M31) 3D Spiral Galaxy
// 2-Tier HUD Architecture • Hierarchical Cosmic Step-Zoom (Satellite ⇌ Planet ⇌ System ⇌ Galaxy)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createAndromedaGalaxy } from './galaxyGenerator.js'
import { createExosystem, EXOPLANET_CONFIG } from './exosystemGenerator.js'
import { createMeteorShower } from './meteorShower.js'
import { createEarthSatellites } from './earthSatellites.js'
import { createTorusStation } from './torusStation.js'
import { createComet } from './cometGenerator.js'
import { createAsteroidBelt } from './asteroidBelt.js'
import './SolarSystem3D.css'

// ── Sol Planetary Astronomical Configuration ────────────────────────────────
const PLANET_CONFIG = [
  {
    id: 'mercury',
    name: 'Mercury',
    texture: 'mercury.jpg',
    r: 4.2,
    dist: 70,
    speed: 0.024,
    tilt: 0.03,
    rot: 0.008,
    roughness: 0.9,
    metalness: 0.05,
    moons: [],
  },
  {
    id: 'venus',
    name: 'Venus',
    texture: 'venus.jpg',
    r: 6.8,
    dist: 105,
    speed: 0.018,
    tilt: 3.10,
    rot: -0.004,
    roughness: 0.55,
    metalness: 0.0,
    hasAtmosphere: true,
    atmoColor: 0xfef08a,
    atmoOpacity: 0.16,
    moons: [],
  },
  {
    id: 'earth',
    name: 'Earth',
    texture: 'earth.jpg',
    r: 7.4,
    dist: 152,
    speed: 0.014,
    tilt: 0.41,
    rot: 0.016,
    roughness: 0.45,
    metalness: 0.1,
    hasClouds: true,
    hasAtmosphere: true,
    atmoColor: 0x38bdf8,
    atmoOpacity: 0.20,
    moons: [
      { id: 'moon', name: 'The Moon (Luna)', r: 1.9, dist: 16.5, speed: 1.6, useMoonMap: true },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    texture: 'mars.jpg',
    r: 5.2,
    dist: 202,
    speed: 0.011,
    tilt: 0.44,
    rot: 0.014,
    roughness: 0.85,
    metalness: 0.05,
    moons: [
      { id: 'phobos', name: 'Phobos', r: 0.75, dist: 9.2, speed: 2.9, color: 0x78716c, scale: [1.25, 0.9, 0.8] },
      { id: 'deimos', name: 'Deimos', r: 0.55, dist: 14.8, speed: 1.6, color: 0xa8a29e, scale: [1.1, 0.85, 0.9] },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    texture: 'jupiter.jpg',
    r: 18.0,
    dist: 330,
    speed: 0.006,
    tilt: 0.05,
    rot: 0.035,
    roughness: 0.65,
    metalness: 0.0,
    moons: [
      { id: 'io',       name: 'Io (Volcanic)',       r: 1.45, dist: 28, speed: 2.4, color: 0xfacc15, roughness: 0.85 },
      { id: 'europa',   name: 'Europa (Ice Ocean)',  r: 1.25, dist: 38, speed: 1.8, color: 0xe0f2fe, roughness: 0.25, metalness: 0.15 },
      { id: 'ganymede', name: 'Ganymede (Giant)',    r: 2.05, dist: 49, speed: 1.3, color: 0xd1d5db, roughness: 0.75 },
      { id: 'callisto', name: 'Callisto (Cratered)', r: 1.75, dist: 62, speed: 0.9, color: 0x4b5563, roughness: 0.95 },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    texture: 'saturn.jpg',
    r: 15.0,
    dist: 450,
    speed: 0.004,
    tilt: 0.47,
    rot: 0.028,
    roughness: 0.7,
    metalness: 0.0,
    hasRings: true,
    moons: [
      { id: 'mimas',     name: 'Mimas (Cratered)',     r: 0.65, dist: 24, speed: 2.8, color: 0x9ca3af, roughness: 0.9 },
      { id: 'enceladus', name: 'Enceladus (Cryo-Ice)', r: 0.95, dist: 32, speed: 2.1, color: 0xffffff, roughness: 0.12, metalness: 0.2 },
      { id: 'rhea',      name: 'Rhea (Ice Rock)',      r: 1.15, dist: 40, speed: 1.5, color: 0xd1d5db, roughness: 0.8 },
      { id: 'titan',     name: 'Titan (Methane Haze)', r: 2.15, dist: 54, speed: 1.0, color: 0xf59e0b, roughness: 0.92 },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    texture: 'uranus.jpg',
    r: 9.5,
    dist: 560,
    speed: 0.0028,
    tilt: 1.70,
    rot: -0.018,
    roughness: 0.6,
    metalness: 0.0,
    hasUranusRing: true,
    moons: [
      { id: 'miranda', name: 'Miranda', r: 0.7, dist: 17, speed: 2.6, color: 0xa8a29e, roughness: 0.9 },
      { id: 'ariel',   name: 'Ariel',   r: 1.0, dist: 23, speed: 1.9, color: 0xd6d3d1, roughness: 0.7 },
      { id: 'titania', name: 'Titania', r: 1.3, dist: 31, speed: 1.3, color: 0xe7e5e4, roughness: 0.8 },
      { id: 'oberon',  name: 'Oberon',  r: 1.2, dist: 40, speed: 0.9, color: 0x78716c, roughness: 0.9 },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    texture: 'neptune.jpg',
    r: 9.2,
    dist: 660,
    speed: 0.0020,
    tilt: 0.50,
    rot: 0.020,
    roughness: 0.6,
    metalness: 0.0,
    moons: [
      { id: 'proteus', name: 'Proteus',                  r: 0.8, dist: 18, speed: 2.3, color: 0x57534e, scale: [1.2, 0.8, 0.9] },
      { id: 'triton',  name: 'Triton (Retrograde Frost)', r: 1.6, dist: 27, speed: -1.4, color: 0xfbcfe8, roughness: 0.35, metalness: 0.1 },
    ],
  },
  {
    id: 'pluto',
    name: 'Pluto (Dwarf Planet)',
    texture: 'pluto.jpg',
    r: 3.2,
    dist: 760,
    speed: 0.0014,
    tilt: 2.05,
    rot: -0.012,
    roughness: 0.85,
    metalness: 0.05,
    inclination: 0.30,
    moons: [
      { id: 'charon', name: 'Charon (Binary Moon)', r: 1.6, dist: 13, speed: 1.8, color: 0xc4b5fd, roughness: 0.8 },
      { id: 'hydra',  name: 'Hydra',                r: 0.5, dist: 20, speed: 1.1, color: 0xe5e7eb, roughness: 0.9 },
    ],
  },
]

export default function SolarSystem3D({ onReturn }) {
  const mountRef = useRef(null)
  const [activeRealm, setActiveRealm] = useState('sol') // 'sol' | 'exosystem' | 'andromeda'
  const activeRealmRef = useRef('sol')
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [simSpeed, setSimSpeed] = useState(1.0)
  const [isWarpingOut, setIsWarpingOut] = useState(false)
  const [cosmicAltitude, setCosmicAltitude] = useState('')
  const [arrivalTelemetry, setArrivalTelemetry] = useState(
    '✦ HYPERSPACE DROP-OUT // COMPLETED 4D WORMHOLE TRANSIT // ORBITAL INSERTION CONFIRMED'
  )

  useEffect(() => {
    activeRealmRef.current = activeRealm
  }, [activeRealm])

  useEffect(() => {
    const timer = setTimeout(() => {
      setArrivalTelemetry('')
    }, 3200)
    return () => clearTimeout(timer)
  }, [])

  const [cityLights, setCityLights] = useState(true)
  const cityLightsRef = useRef(true)
  const earthNightMatRef = useRef(null)
  const meteorShowerRef = useRef(null)
  const hudRef = useRef(null)

  const handleHorizontalScrollWheel = useCallback((e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY * 0.85
    }
  }, [])

  useEffect(() => {
    cityLightsRef.current = cityLights
  }, [cityLights])

  // Shared animation references
  const targetCamPosRef = useRef(null)
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  const focusedTargetRef = useRef(null)
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
      } else if (e.key === 'd' || e.key === 'D') {
        setCityLights(prev => !prev)
      } else if (e.key === 'm' || e.key === 'M') {
        meteorShowerRef.current?.triggerStorm()
        setArrivalTelemetry('✦ METEOR STORM ENGAGED // HYPERSONIC BOLIDE IONIZATION WAVE')
        setTimeout(() => setArrivalTelemetry(''), 2600)
      } else if (e.key === '1') {
        mountRef.current?.switchRealm?.('sol')
      } else if (e.key === '2') {
        mountRef.current?.switchRealm?.('exosystem')
      } else if (e.key === '3') {
        mountRef.current?.switchRealm?.('andromeda')
      } else if (e.key === '-' || e.key === '_') {
        mountRef.current?.stepZoom?.(-1)
      } else if (e.key === '=' || e.key === '+') {
        mountRef.current?.stepZoom?.(1)
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

    // ── 1. Scene, Camera, Renderer with Logarithmic Depth Buffer ────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x02050b)

    // Logarithmic depth buffer enables precision from 1 unit to 120,000 units
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 120000)
    camera.position.set(0, 1200, 1800)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 36000
    controls.minDistance = 6

    // ── 2. Texture Loader & Base Resolution ─────────────────────────────────
    const BASE = import.meta.env.BASE_URL || './'
    const textureLoader = new THREE.TextureLoader()

    const loadTex = (path) => {
      const tex = textureLoader.load(`${BASE}textures/planets/${path}`)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }

    const sunTexture         = loadTex('sun.jpg')
    const earthCloudsTexture = loadTex('earth_clouds.png')
    const earthLightsTexture = loadTex('earth_lights.png')
    const moonTexture        = loadTex('moon.jpg')
    const saturnRingTexture  = loadTex('saturn_ring.png')

    const arrivalStartTime = performance.now()
    const arrivalDuration = 2400

    // ── 3. Sol System Lighting ──────────────────────────────────────────────
    const sunLight = new THREE.PointLight(0xfffdf5, 3.4, 4500, 0.3)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.12)
    scene.add(ambientLight)

    // ── 4. Deep-Cosmic Astronomical Starfield ───────────────────────────────
    const starGeo = new THREE.BufferGeometry()
    const starCount = 6500
    const starPos = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)

    const SPECTRAL_COLORS = [
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0xf8fafc),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfca5a5),
    ]

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const r = 38000 + Math.random() * 22000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      starPos[i3]     = r * Math.sin(phi) * Math.cos(theta)
      starPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i3 + 2] = r * Math.cos(phi)

      const col = SPECTRAL_COLORS[Math.floor(Math.random() * SPECTRAL_COLORS.length)]
      starColors[i3]     = col.r
      starColors[i3 + 1] = col.g
      starColors[i3 + 2] = col.b
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── 5. Andromeda Galaxy (M31) 3D Spiral ──────────────────────────────────
    const andromeda = createAndromedaGalaxy()
    scene.add(andromeda.group)

    // ── 6. Secondary Exosystem (TRAPPIST-1 Red Dwarf System) ────────────────
    const exosystem = createExosystem()
    scene.add(exosystem.group)

    // ── 7. Interplanetary Meteor Shower Engine ──────────────────────────────
    const meteorShower = createMeteorShower()
    scene.add(meteorShower.group)
    meteorShowerRef.current = meteorShower

    // ── 8. Hyperbolic Interplanetary Comet C/2026 ───────────────────────────
    const comet = createComet()
    scene.add(comet.group)

    // ── 9. Sol Mesh & Plasma Corona ─────────────────────────────────────────
    const sunGeo = new THREE.SphereGeometry(32, 64, 64)
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    const coronaInnerGeo = new THREE.SphereGeometry(34.2, 36, 36)
    const coronaInnerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.32,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    const coronaInnerMesh = new THREE.Mesh(coronaInnerGeo, coronaInnerMat)
    sunMesh.add(coronaInnerMesh)

    const coronaOuterGeo = new THREE.SphereGeometry(38.0, 32, 32)
    const coronaOuterMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    const coronaOuterMesh = new THREE.Mesh(coronaOuterGeo, coronaOuterMat)
    sunMesh.add(coronaOuterMesh)

    const raycastTargets = [
      sunMesh,
      andromeda.coreMesh,
      comet.cometVessel,
      ...exosystem.raycastTargets,
    ]
    sunMesh.userData = { id: 'sun', name: 'Sol (The Sun)', radius: 32, mesh: sunMesh }

    // ── 10. Sol Planetary Systems & Earth Satellites (ISS) ──────────────────
    const planetObjects = []
    let earthSatellites = null
    let torusStation = null

    PLANET_CONFIG.forEach(p => {
      const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, 2 * Math.PI, false, 0)
      const points = orbitCurve.getPoints(140)
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map(pt => new THREE.Vector3(pt.x, 0, pt.y))
      )
      const orbitMat = new THREE.LineBasicMaterial({
        color: p.id === 'earth' ? 0x38bdf8 : p.id === 'pluto' ? 0xc084fc : 0x64748b,
        transparent: true,
        opacity: p.id === 'earth' ? 0.30 : p.id === 'pluto' ? 0.28 : 0.12,
      })
      const orbitLine = new THREE.Line(orbitGeo, orbitMat)
      if (p.inclination) orbitLine.rotation.x = p.inclination
      scene.add(orbitLine)

      const pivot = new THREE.Group()
      if (p.inclination) pivot.rotation.x = p.inclination
      scene.add(pivot)

      const pGeo = new THREE.SphereGeometry(p.r, 64, 64)
      const pMat = new THREE.MeshStandardMaterial({
        map: loadTex(p.texture),
        roughness: p.roughness,
        metalness: p.metalness,
      })
      const pMesh = new THREE.Mesh(pGeo, pMat)
      pMesh.rotation.z = p.tilt
      pMesh.position.x = p.dist
      pMesh.userData = { id: p.id, name: p.name, radius: p.r, mesh: pMesh }
      pivot.add(pMesh)
      raycastTargets.push(pMesh)

      if (p.hasAtmosphere) {
        const atmoGeo = new THREE.SphereGeometry(p.r * 1.025, 48, 48)
        const atmoMat = new THREE.MeshBasicMaterial({
          color: p.atmoColor,
          transparent: true,
          opacity: p.atmoOpacity,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
        })
        pMesh.add(new THREE.Mesh(atmoGeo, atmoMat))
      }

      let cloudMesh = null
      if (p.hasClouds) {
        const cGeo = new THREE.SphereGeometry(p.r * 1.014, 64, 64)
        const cMat = new THREE.MeshStandardMaterial({
          map: earthCloudsTexture,
          transparent: true,
          opacity: 0.68,
          blending: THREE.NormalBlending,
        })
        cloudMesh = new THREE.Mesh(cGeo, cMat)
        pMesh.add(cloudMesh)
      }

      // Earth Real Glowing Night Lights & Satellites (ISS)
      if (p.id === 'earth') {
        const nightGeo = new THREE.SphereGeometry(p.r * 1.018, 64, 64)
        const nightMat = new THREE.ShaderMaterial({
          uniforms: {
            uLightsMap: { value: earthLightsTexture },
            uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
            uTime: { value: 0.0 },
            uFestiveMode: { value: 1.0 },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;

            void main() {
              vUv = uv;
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPos.xyz;
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform sampler2D uLightsMap;
            uniform vec3 uSunPosition;
            uniform float uTime;
            uniform float uFestiveMode;

            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;

            void main() {
              vec3 sunDir = normalize(uSunPosition - vWorldPosition);
              float sunDot = dot(vWorldNormal, sunDir);

              float nightFactor = smoothstep(0.04, -0.15, sunDot);
              if (nightFactor <= 0.001) {
                discard;
              }

              vec4 texColor = texture2D(uLightsMap, vUv);
              float lum = max(texColor.r, max(texColor.g, texColor.b));
              if (lum < 0.02) {
                discard;
              }

              vec3 baseCity = texColor.rgb * vec3(1.3, 1.15, 0.9);
              float twinkle = 1.0 + 0.25 * sin(uTime * 3.5 + vUv.x * 280.0 + vUv.y * 190.0);
              vec3 activeCity = baseCity * twinkle;
              vec3 result = mix(baseCity, activeCity, uFestiveMode);

              gl_FragColor = vec4(result * nightFactor, lum * nightFactor);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.FrontSide,
        })
        earthNightMatRef.current = nightMat
        pMesh.add(new THREE.Mesh(nightGeo, nightMat))

        // Attach Earth Orbital Satellites (ISS & Constellation)
        earthSatellites = createEarthSatellites(pMesh, p.r)
        raycastTargets.push(...earthSatellites.raycastTargets)

        // Attach Olympus Torus Space Station (High Earth Orbit)
        torusStation = createTorusStation(pMesh, p.r)
        raycastTargets.push(...torusStation.raycastTargets)
      }

      if (p.hasRings) {
        const innerR = p.r * 1.38
        const outerR = p.r * 2.52
        const rGeo = new THREE.RingGeometry(innerR, outerR, 80)
        const pos = rGeo.attributes.position
        const uv = rGeo.attributes.uv
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i)
          const vy = pos.getY(i)
          const dist = Math.sqrt(vx * vx + vy * vy)
          const norm = (dist - innerR) / (outerR - innerR)
          uv.setXY(i, norm, 0.5)
        }
        rGeo.rotateX(Math.PI / 2)
        const rMat = new THREE.MeshStandardMaterial({
          map: saturnRingTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.96,
          roughness: 0.6,
        })
        pMesh.add(new THREE.Mesh(rGeo, rMat))
      }

      if (p.hasUranusRing) {
        const uRingGeo = new THREE.RingGeometry(p.r * 1.35, p.r * 1.55, 64)
        uRingGeo.rotateX(Math.PI / 2)
        pMesh.add(new THREE.Mesh(uRingGeo, new THREE.MeshBasicMaterial({
          color: 0xbae6fd,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })))
      }

      const moonObjectsForPlanet = []
      p.moons.forEach(m => {
        const mOrbitGeo = new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, m.dist, m.dist, 0, Math.PI * 2)
            .getPoints(48)
            .map(pt => new THREE.Vector3(pt.x, 0, pt.y))
        )
        pMesh.add(new THREE.Line(
          mOrbitGeo,
          new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.14 })
        ))

        const mGeo = new THREE.SphereGeometry(m.r, 28, 28)
        const mMat = new THREE.MeshStandardMaterial({
          map: m.useMoonMap ? moonTexture : (m.color ? null : moonTexture),
          color: m.color ? m.color : 0xffffff,
          roughness: m.roughness || 0.8,
          metalness: m.metalness || 0.05,
        })
        const mMesh = new THREE.Mesh(mGeo, mMat)
        if (m.scale) mMesh.scale.set(...m.scale)

        const initialAngle = Math.random() * Math.PI * 2
        mMesh.position.set(Math.cos(initialAngle) * m.dist, 0, Math.sin(initialAngle) * m.dist)

        mMesh.userData = {
          id: m.id,
          name: `${p.name} • ${m.name}`,
          radius: m.r,
          mesh: mMesh,
          isMoon: true,
        }
        pMesh.add(mMesh)
        raycastTargets.push(mMesh)

        moonObjectsForPlanet.push({
          data: m,
          mesh: mMesh,
          angle: initialAngle,
        })
      })

      planetObjects.push({
        data: p,
        pivot,
        mesh: pMesh,
        cloudMesh,
        moons: moonObjectsForPlanet,
        angle: Math.random() * Math.PI * 2,
      })
    })

    // ── 11. Photorealistic Main Asteroid Belt (Ceres, Vesta & 2,800 bodies) ──
    const asteroidBelt = createAsteroidBelt()
    scene.add(asteroidBelt.group)
    raycastTargets.push(...asteroidBelt.raycastTargets)

    // ── 12. Quantum Singularity Gateway (Return Beacon) ─────────────────────
    const gatewayGroup = new THREE.Group()
    gatewayGroup.position.set(410, 55, -310)
    scene.add(gatewayGroup)

    const gateTorusGeo = new THREE.TorusGeometry(16, 2.0, 16, 64)
    const gateTorusMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    const gateTorus = new THREE.Mesh(gateTorusGeo, gateTorusMat)
    gatewayGroup.add(gateTorus)

    const gateHoleGeo = new THREE.SphereGeometry(13, 32, 32)
    const gateHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const gateHole = new THREE.Mesh(gateHoleGeo, gateHoleMat)
    gatewayGroup.add(gateHole)
    gateHole.userData = { id: 'gateway', name: 'Quantum Singularity Gate' }
    raycastTargets.push(gateHole)

    // ── 13. Raycaster & Navigation Mechanics ────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const focusOnTarget = (targetData) => {
      setSelectedPlanet(targetData.name)
      focusedTargetRef.current = targetData

      if (targetData.isGalaxy) {
        setActiveRealm('andromeda')
        targetLookAtRef.current.copy(andromeda.group.position)
        targetCamPosRef.current = andromeda.group.position.clone().add(new THREE.Vector3(0, 4800, 10500))
        return
      }

      if (targetData.systemGroup) {
        setActiveRealm('exosystem')
      } else if (targetData.id !== 'gateway') {
        setActiveRealm('sol')
      }

      const targetRadius = targetData.radius || 10
      if (targetData.id === 'earth') {
        const dist = targetRadius * 3.2 + 8
        targetCamPosRef.current = new THREE.Vector3(dist * 0.72, dist * 0.38, dist * 0.72)
      } else if (targetData.id === 'iss') {
        targetCamPosRef.current = new THREE.Vector3(2.4, 1.2, 2.4)
      } else if (targetData.id === 'hubble') {
        targetCamPosRef.current = new THREE.Vector3(2.0, 1.0, 2.0)
      } else if (targetData.id === 'torus_station') {
        targetCamPosRef.current = new THREE.Vector3(5.2, 2.6, 5.2)
      } else if (targetData.id === 'comet_c2026') {
        targetCamPosRef.current = new THREE.Vector3(18, 8, 18)
      } else if (targetData.id === 'ceres') {
        targetCamPosRef.current = new THREE.Vector3(7.2, 3.6, 7.2)
      } else if (targetData.id === 'vesta') {
        targetCamPosRef.current = new THREE.Vector3(6.2, 3.1, 6.2)
      } else {
        const offset = targetData.isMoon
          ? targetRadius * 5.0 + 8
          : targetRadius * 3.8 + 14
        targetCamPosRef.current = new THREE.Vector3(offset, offset * 0.45, offset)
      }
    }

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

    // Expose Realm Switcher to HUD
    container.switchRealm = (realm) => {
      activeRealmRef.current = realm
      setActiveRealm(realm)
      setSelectedPlanet(null)
      focusedTargetRef.current = null

      if (realm === 'sol') {
        targetCamPosRef.current = new THREE.Vector3(0, 340, 720)
        targetLookAtRef.current = new THREE.Vector3(0, 0, 0)
        setArrivalTelemetry('✦ REALM FOCUS // SOL PLANETARY SYSTEM')
      } else if (realm === 'exosystem') {
        targetLookAtRef.current = exosystem.position.clone()
        targetCamPosRef.current = exosystem.position.clone().add(new THREE.Vector3(0, 260, 540))
        setArrivalTelemetry('✦ REALM FOCUS // TRAPPIST-1 RED DWARF EXOSYSTEM')
      } else if (realm === 'andromeda') {
        targetLookAtRef.current = andromeda.group.position.clone()
        targetCamPosRef.current = andromeda.group.position.clone().add(new THREE.Vector3(0, 4800, 10500))
        setSelectedPlanet('Andromeda Galaxy (M31)')
        setArrivalTelemetry('✦ REALM FOCUS // ANDROMEDA GALAXY (M31) MACRO FIELD')
      }
      setTimeout(() => setArrivalTelemetry(''), 2500)
    }

    // Expose Planet Focus to HUD
    container.focusPlanet = (id) => {
      if (id === 'overview') {
        container.switchRealm('sol')
      } else if (id === 'sun') {
        focusOnTarget(sunMesh.userData)
      } else if (id === 'iss') {
        if (earthSatellites) focusOnTarget(earthSatellites.issVessel.userData)
      } else if (id === 'hubble') {
        if (earthSatellites) focusOnTarget(earthSatellites.hstVessel.userData)
      } else if (id === 'torus_station') {
        if (torusStation) focusOnTarget(torusStation.vesselGroup.userData)
      } else if (id === 'comet_c2026') {
        focusOnTarget(comet.cometVessel.userData)
      } else if (id === 'ceres') {
        if (asteroidBelt) focusOnTarget(asteroidBelt.ceresVessel.userData)
      } else if (id === 'vesta') {
        if (asteroidBelt) focusOnTarget(asteroidBelt.vestaVessel.userData)
      } else if (id === 'exosystem_overview') {
        container.switchRealm('exosystem')
      } else if (id === 'trappist_star') {
        focusOnTarget(exosystem.starMesh.userData)
      } else if (id === 'andromeda_overview' || id === 'andromeda_core') {
        container.switchRealm('andromeda')
      } else {
        const solFound = planetObjects.find(p => p.data.id === id)
        if (solFound) {
          focusOnTarget(solFound.mesh.userData)
          return
        }
        const exoFound = exosystem.exoplanetObjects.find(p => p.data.id === id)
        if (exoFound) {
          focusOnTarget(exoFound.mesh.userData)
        }
      }
    }

    // ── 14. Hierarchical Cosmic Step-Zoom Engine ────────────────────────────
    // Moves logically across astronomical scales:
    // Satellite/Moon ⇌ Planet ⇌ System Overview ⇌ Intergalactic Macro Field
    container.stepZoom = (direction) => {
      if (direction < 0) {
        // ── STEP BACK (ZOOM OUT 1 TIER) ──
        if (focusedTargetRef.current) {
          const cur = focusedTargetRef.current
          if (cur.id === 'iss' || cur.id === 'hubble' || cur.id === 'torus_station' || cur.isSatellite || cur.isStation) {
            // Satellite / Space Station -> Step back to parent Earth
            const earth = planetObjects.find(p => p.data.id === 'earth')
            if (earth) focusOnTarget(earth.mesh.userData)
            setArrivalTelemetry('✦ STEP ZOOM OUT // ORBITAL REFERENCE: EARTH')
          } else if (cur.isMoon) {
            // Moon -> Step back to parent planet
            const parentMesh = cur.mesh?.parent
            if (parentMesh?.userData?.name) {
              focusOnTarget(parentMesh.userData)
              setArrivalTelemetry(`✦ STEP ZOOM OUT // ORBITAL REFERENCE: ${parentMesh.userData.name.toUpperCase()}`)
            } else {
              container.switchRealm(activeRealmRef.current || 'sol')
            }
          } else {
            // Planet / Star / Comet -> Step back to System Overview
            if (activeRealmRef.current === 'exosystem') {
              container.switchRealm('exosystem')
            } else {
              container.switchRealm('sol')
            }
            setArrivalTelemetry('✦ STEP ZOOM OUT // STELLAR SYSTEM OVERVIEW')
          }
        } else if (activeRealmRef.current === 'sol' || activeRealmRef.current === 'exosystem') {
          // System Overview -> Step back to Intergalactic Macro Field (Andromeda)
          container.switchRealm('andromeda')
          setArrivalTelemetry('✦ STEP ZOOM OUT // INTERGALACTIC DEEP FIELD')
        } else {
          // Already at Intergalactic View -> Zoom further back into void
          const offset = camera.position.clone().sub(controls.target)
          const newLen = Math.min(controls.maxDistance, offset.length() * 1.4)
          offset.setLength(newLen)
          camera.position.copy(controls.target).add(offset)
          controls.update()
        }
      } else {
        // ── STEP FORWARD (ZOOM IN 1 TIER) ──
        if (activeRealmRef.current === 'andromeda') {
          // Intergalactic -> Step into closest system (Sol)
          container.switchRealm('sol')
          setArrivalTelemetry('✦ STEP ZOOM IN // SOL SYSTEM ORBIT')
        } else if (!focusedTargetRef.current) {
          // System Overview -> Step into primary habitable planet
          if (activeRealmRef.current === 'exosystem') {
            container.focusPlanet('aethelgard')
            setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: AETHELGARD (HABITABLE)')
          } else {
            container.focusPlanet('earth')
            setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: EARTH')
          }
        } else {
          const cur = focusedTargetRef.current
          if (cur.id === 'earth') {
            // Earth -> Step into ISS Space Station
            container.focusPlanet('iss')
            setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: ISS (LOW EARTH ORBIT)')
          } else if (cur.id === 'iss') {
            // ISS -> Step over to Hubble Space Telescope
            container.focusPlanet('hubble')
            setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: HST (HUBBLE SPACE TELESCOPE)')
          } else if (cur.id === 'hubble') {
            // Hubble -> Step over to Olympus Torus Station
            container.focusPlanet('torus_station')
            setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: OLYMPUS TORUS (HIGH EARTH ORBIT)')
          } else if (cur.id === 'jupiter') {
            const europa = cur.mesh?.children?.find(c => c.userData?.id === 'europa')
            if (europa) {
              focusOnTarget(europa.userData)
              setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: EUROPA (ICE OCEAN)')
            }
          } else if (cur.id === 'saturn') {
            const titan = cur.mesh?.children?.find(c => c.userData?.id === 'titan')
            if (titan) {
              focusOnTarget(titan.userData)
              setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: TITAN (METHANE HAZE)')
            }
          } else if (cur.id === 'aethelgard') {
            const solis = cur.mesh?.children?.find(c => c.userData?.id === 'solis')
            if (solis) {
              focusOnTarget(solis.userData)
              setArrivalTelemetry('✦ STEP ZOOM IN // LOCKED: SOLIS (EXOMOON)')
            }
          } else {
            // Zoom closer to current object
            if (targetCamPosRef.current) {
              targetCamPosRef.current.multiplyScalar(0.7)
            } else {
              const offset = camera.position.clone().sub(controls.target)
              const newLen = Math.max(controls.minDistance, offset.length() * 0.7)
              offset.setLength(newLen)
              camera.position.copy(controls.target).add(offset)
              controls.update()
            }
          }
        }
      }
      setTimeout(() => setArrivalTelemetry(''), 2200)
    }

    // Continuous Zoom for trackpad or slider
    container.zoomBy = (factor) => {
      const offset = camera.position.clone().sub(controls.target)
      const currentLen = offset.length()
      const newLen = Math.max(controls.minDistance, Math.min(controls.maxDistance, currentLen * factor))
      offset.setLength(newLen)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }

    // ── 15. Render & Physics Loop ───────────────────────────────────────────
    let animationFrameId
    const clock = new THREE.Clock()
    let lastAltitudeCheck = 0

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const speedMult = simSpeedRef.current

      // Superluminal Orbital Insertion Swoop
      const nowTime = performance.now()
      const arrivalElapsed = nowTime - arrivalStartTime
      if (arrivalElapsed < arrivalDuration) {
        const prog = arrivalElapsed / arrivalDuration
        const ease = 1 - Math.pow(1 - prog, 4)

        camera.position.set(
          0,
          1200 + (340 - 1200) * ease,
          1800 + (720 - 1800) * ease
        )
        camera.fov = 60 - 15 * ease
        camera.updateProjectionMatrix()
        controls.target.set(0, 0, 0)
      }

      // Rotate Sol & Corona
      sunMesh.rotation.y += 0.003 * speedMult
      coronaInnerMesh.rotation.y -= 0.002 * speedMult
      coronaOuterMesh.rotation.y += 0.001 * speedMult

      // Rotate Gateway & Asteroids
      gateTorus.rotation.x += 0.02 * speedMult
      gateTorus.rotation.y += 0.03 * speedMult
      asteroidMesh.rotation.y += 0.0007 * speedMult

      // Update Andromeda Galaxy Rotation
      andromeda.updateGalaxy(delta, speedMult)

      // Update TRAPPIST-1 Exosystem
      exosystem.updateExosystem(delta, speedMult)

      // Update Meteor Shower Trails
      meteorShower.updateMeteors(delta, speedMult)

      // Update Hyperbolic Comet
      comet.updateComet(delta, speedMult)

      // Update Photorealistic Main Asteroid Belt (Ceres, Vesta, 2,800 bodies)
      asteroidBelt.updateAsteroidBelt(delta, speedMult)

      // Update Earth Satellites (ISS & HST)
      if (earthSatellites) {
        earthSatellites.updateSatellites(delta, speedMult)
      }

      // Update Olympus Torus Space Station
      if (torusStation) {
        torusStation.updateStation(delta, speedMult)
      }

      // Advance Sol Planets & Moons
      planetObjects.forEach(po => {
        po.angle += po.data.speed * delta * 2.2 * speedMult
        po.mesh.position.x = Math.cos(po.angle) * po.data.dist
        po.mesh.position.z = Math.sin(po.angle) * po.data.dist
        po.mesh.rotation.y += po.data.rot * speedMult

        if (po.cloudMesh) {
          po.cloudMesh.rotation.y += po.data.rot * 1.25 * speedMult
        }

        po.moons.forEach(mo => {
          mo.angle += mo.data.speed * delta * 2.2 * speedMult
          mo.mesh.position.x = Math.cos(mo.angle) * mo.data.dist
          mo.mesh.position.z = Math.sin(mo.angle) * mo.data.dist
          mo.mesh.rotation.y += 0.015 * speedMult
        })
      })

      // Smooth Camera Lerp
      if (focusedTargetRef.current) {
        const targetWorldPos = new THREE.Vector3()
        if (focusedTargetRef.current.id === 'sun') {
          targetWorldPos.set(0, 0, 0)
        } else {
          focusedTargetRef.current.mesh.getWorldPosition(targetWorldPos)
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
        if (camera.position.distanceTo(targetCamPosRef.current) < 10) {
          targetCamPosRef.current = null
        }
      }

      // Real-Time Cosmic Altitude Telemetry
      if (nowTime - lastAltitudeCheck > 350) {
        lastAltitudeCheck = nowTime
        const distFromSol = camera.position.length()
        if (distFromSol > 2100) {
          const ly = Math.round(distFromSol * 1.85)
          setCosmicAltitude(`ALTITUDE: ${ly.toLocaleString()} LIGHT-YEARS // INTERGALACTIC DEEP FIELD // ANDROMEDA M31 VISIBLE`)
        } else {
          setCosmicAltitude('')
        }
      }

      // Update Earth Night Lights Shader
      if (earthNightMatRef.current) {
        earthNightMatRef.current.uniforms.uTime.value = clock.getElapsedTime()
        earthNightMatRef.current.uniforms.uFestiveMode.value = cityLightsRef.current ? 1.0 : 0.0
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // ── 16. Viewport Resize ─────────────────────────────────────────────────
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
      exosystem.dispose()
      meteorShower.dispose()
      comet.dispose()
      if (earthSatellites) earthSatellites.dispose()
      if (torusStation) torusStation.dispose()
      asteroidBelt.dispose()
      if (earthNightMatRef.current) {
        earthNightMatRef.current.dispose()
      }
      earthLightsTexture.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [handleReturnTrigger])

  return (
    <div className={`solar-3d-container ${isWarpingOut ? 'warp-out' : ''}`} ref={mountRef}>
      {/* ── TIER 1: TOP SCI-FI OBSERVATORY HUD ─────────────────────────────── */}
      <div className="solar-3d-hud" ref={hudRef} onWheel={handleHorizontalScrollWheel}>
        {/* Brand & Target Lock */}
        <div className="hud-brand">
          <span className="hud-pulse-dot" />
          <span className="hud-system-title">✦ MULTI-COSMIC 3D OBSERVATORY</span>
          {selectedPlanet && (
            <span className="hud-planet-focus" title={`Locked Target: ${selectedPlanet}`}>
              LOCKED: {selectedPlanet.toUpperCase()}
            </span>
          )}
        </div>

        {/* Macro Realm Switcher Tabs */}
        <div className="realm-selector-strip">
          <button
            className={`realm-tab ${activeRealm === 'sol' ? 'active' : ''}`}
            onClick={() => mountRef.current?.switchRealm?.('sol')}
            title="Focus Sol Planetary System (Key 1)"
          >
            ☉ SOL SYSTEM
          </button>
          <button
            className={`realm-tab ${activeRealm === 'exosystem' ? 'active' : ''}`}
            onClick={() => mountRef.current?.switchRealm?.('exosystem')}
            title="Traverse to TRAPPIST-1 Red Dwarf Exosystem (Key 2)"
          >
            ✦ TRAPPIST-1 EXOSYSTEM
          </button>
          <button
            className={`realm-tab ${activeRealm === 'andromeda' ? 'active' : ''}`}
            onClick={() => mountRef.current?.switchRealm?.('andromeda')}
            title="Frame Andromeda Galaxy M31 (Key 3)"
          >
            🌌 ANDROMEDA M31
          </button>
        </div>

        {/* Global Action controls */}
        <div className="hud-actions-strip">
          <button
            className="meteor-storm-btn"
            onClick={() => {
              meteorShowerRef.current?.triggerStorm()
              setArrivalTelemetry('✦ METEOR STORM ENGAGED // HYPERSONIC BOLIDE IONIZATION WAVE')
              setTimeout(() => setArrivalTelemetry(''), 2600)
            }}
            title="Trigger Interplanetary Meteor Shower Wave (M)"
          >
            <span className="meteor-icon">🌠</span>
            <span>METEORS (M)</span>
          </button>

          {activeRealm === 'sol' && (
            <button
              className={`city-lights-btn ${cityLights ? 'active' : ''}`}
              onClick={() => {
                const next = !cityLights
                setCityLights(next)
                setArrivalTelemetry(
                  next
                    ? '✦ NOCTURNAL CITY LIGHTS: ACTIVE // TERMINATOR ILLUMINATION ON'
                    : '✦ NOCTURNAL CITY LIGHTS: INACTIVE'
                )
                setTimeout(() => setArrivalTelemetry(''), 2800)
              }}
              title="Toggle Earth Nocturnal City Lights (D)"
            >
              <span className="city-lights-icon">🌃</span>
              <span>{cityLights ? 'CITY LIGHTS: ON' : 'CITY LIGHTS: OFF'}</span>
            </button>
          )}

          {/* Hierarchical Cosmic Step-Zoom Controls */}
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => mountRef.current?.stepZoom?.(-1)}
              title="Step Back 1 Scale Level (− key)"
            >
              −
            </button>
            <span className="zoom-label">STEP ZOOM</span>
            <button
              className="zoom-btn"
              onClick={() => mountRef.current?.stepZoom?.(1)}
              title="Step In 1 Scale Level (+ key)"
            >
              +
            </button>
          </div>

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

      {/* ── TIER 2: FLOATING BOTTOM CELESTIAL DOCK ──────────────────────────── */}
      <div className="celestial-dock">
        {activeRealm === 'sol' && (
          <div className="dock-strip" onWheel={handleHorizontalScrollWheel}>
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
            {PLANET_CONFIG.map(p => (
              <button
                key={p.id}
                className={`nav-chip ${selectedPlanet === p.name ? 'active' : ''}`}
                onClick={() => mountRef.current?.focusPlanet?.(p.id)}
              >
                {p.id === 'earth' ? '🌍 EARTH' : p.id === 'pluto' ? '♇ PLUTO' : p.name.toUpperCase()}
              </button>
            ))}
            <button
              className={`nav-chip ${selectedPlanet === 'ISS (International Space Station)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('iss')}
              title="Lock on International Space Station in LEO orbit"
            >
              🛰️ ISS
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'HST (Hubble Space Telescope)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('hubble')}
              title="Lock on Hubble Space Telescope in 28.5° LEO orbit"
            >
              🔭 HUBBLE
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'Olympus Torus (Orbital Station)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('torus_station')}
              title="Lock on Olympus Torus Space Station in High Earth Orbit"
            >
              🛞 TORUS
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'Comet C/2026 (Hyperbolic Visitor)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('comet_c2026')}
              title="Lock on Hyperbolic Interplanetary Comet C/2026"
            >
              ☄️ COMET
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'Ceres (Dwarf Planet)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('ceres')}
              title="Lock on Dwarf Planet Ceres with Occator Crater salt spots"
            >
              ⚪ CERES
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'Vesta (Protoplanet)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('vesta')}
              title="Lock on Protoplanet Vesta with Rheasilvia impact basin"
            >
              🪨 VESTA
            </button>
          </div>
        )}

        {activeRealm === 'exosystem' && (
          <div className="dock-strip" onWheel={handleHorizontalScrollWheel}>
            <button
              className={`nav-chip ${!selectedPlanet ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('exosystem_overview')}
            >
              ✦ SYSTEM
            </button>
            <button
              className={`nav-chip ${selectedPlanet === 'Astraeus (TRAPPIST-1 Star)' ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.('trappist_star')}
            >
              🔴 ASTRAEUS
            </button>
            {EXOPLANET_CONFIG.map(p => (
              <button
                key={p.id}
                className={`nav-chip ${selectedPlanet === p.name ? 'active' : ''}`}
                onClick={() => mountRef.current?.focusPlanet?.(p.id)}
              >
                {p.id === 'pyroclast' ? '🌋 PYROCLAST' :
                 p.id === 'aethelgard' ? '🌊 AETHELGARD' :
                 p.id === 'zephyrus' ? '🌀 ZEPHYRUS' :
                 p.id === 'chronos' ? '🪐 CHRONOS' : '❄️ NIX'}
              </button>
            ))}
          </div>
        )}

        {activeRealm === 'andromeda' && (
          <div className="dock-strip" onWheel={handleHorizontalScrollWheel}>
            <button
              className="nav-chip active"
              onClick={() => mountRef.current?.focusPlanet?.('andromeda_overview')}
            >
              🌌 ANDROMEDA SPIRAL DISK
            </button>
            <button
              className="nav-chip"
              onClick={() => mountRef.current?.focusPlanet?.('andromeda_core')}
            >
              ✨ NUCLEUS & SMBH
            </button>
          </div>
        )}
      </div>

      {/* Cosmic Macro Field Altitude Gauge */}
      {cosmicAltitude && (
        <div className="cosmic-altitude-hud">
          <span className="altitude-pulse" />
          <span className="altitude-text">{cosmicAltitude}</span>
        </div>
      )}

      {/* Superluminal Arrival Telemetry Banner */}
      {arrivalTelemetry && (
        <div className="arrival-hud-banner">
          <span className="arrival-radar-pulse" />
          <span className="arrival-banner-text">{arrivalTelemetry}</span>
        </div>
      )}

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
