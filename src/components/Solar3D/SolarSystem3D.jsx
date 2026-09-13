// ─────────────────────────────────────────────────────────────────────────────
// SolarSystem3D.jsx — Super-Realistic Keplerian 3D Planetary Engine (Three.js)
// Real NASA/ESA Equirectangular Textures • Authentic Moons • Atmosphere Glows
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './SolarSystem3D.css'

// ── Planetary & Lunar Astronomical Configuration ─────────────────────────────
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
    moons: [], // Mercury has no moons
  },
  {
    id: 'venus',
    name: 'Venus',
    texture: 'venus.jpg',
    r: 6.8,
    dist: 105,
    speed: 0.018,
    tilt: 3.10, // Retrograde spin
    rot: -0.004,
    roughness: 0.55,
    metalness: 0.0,
    hasAtmosphere: true,
    atmoColor: 0xfef08a,
    atmoOpacity: 0.16,
    moons: [], // Venus has no moons
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
    tilt: 1.70, // 98 deg axial tilt (rolling on side)
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
      { id: 'triton',  name: 'Triton (Retrograde Frost)', r: 1.6, dist: 27, speed: -1.4, color: 0xfbcfe8, roughness: 0.35, metalness: 0.1 }, // Retrograde orbit
    ],
  },
  {
    id: 'pluto',
    name: 'Pluto (Dwarf Planet)',
    texture: 'pluto.jpg',
    r: 3.2,
    dist: 760,
    speed: 0.0014,
    tilt: 2.05, // 120 deg axial tilt
    rot: -0.012, // Retrograde spin
    roughness: 0.85,
    metalness: 0.05,
    inclination: 0.30, // 17 deg orbital inclination out of ecliptic plane
    moons: [
      { id: 'charon', name: 'Charon (Binary Moon)', r: 1.6, dist: 13, speed: 1.8, color: 0xc4b5fd, roughness: 0.8 },
      { id: 'hydra',  name: 'Hydra',                r: 0.5, dist: 20, speed: 1.1, color: 0xe5e7eb, roughness: 0.9 },
    ],
  },
]

export default function SolarSystem3D({ onReturn }) {
  const mountRef = useRef(null)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [simSpeed, setSimSpeed] = useState(1.0)
  const [isWarpingOut, setIsWarpingOut] = useState(false)
  const [arrivalTelemetry, setArrivalTelemetry] = useState(
    '✦ HYPERSPACE DROP-OUT // COMPLETED 4D WORMHOLE TRANSIT // ORBITAL INSERTION CONFIRMED'
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setArrivalTelemetry('')
    }, 3200)
    return () => clearTimeout(timer)
  }, [])

  const [cityLights, setCityLights] = useState(true)
  const cityLightsRef = useRef(true)
  const earthNightMatRef = useRef(null)

  useEffect(() => {
    cityLightsRef.current = cityLights
  }, [cityLights])

  // Shared references for animation loop
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

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 8000)
    // Start at superluminal deep space coordinates with wide warped perspective
    camera.position.set(0, 1200, 1800)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 2600
    controls.minDistance = 12

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

    // ── 3. Lighting Architecture ────────────────────────────────────────────
    // Central Sol PointLight for realistic daytime illumination & terminator shadows
    const sunLight = new THREE.PointLight(0xfffdf5, 3.4, 4500, 0.3)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    // Gentle deep-space ambient light so the night-side retains subtle planetary contour
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.12)
    scene.add(ambientLight)

    // ── 4. Deep-Cosmic Astronomical Starfield ────────────────────────────────
    const starGeo = new THREE.BufferGeometry()
    const starCount = 4200
    const starPos = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)

    const SPECTRAL_COLORS = [
      new THREE.Color(0xa5f3fc), // O/B blue
      new THREE.Color(0xf8fafc), // A white
      new THREE.Color(0xfef08a), // G yellow
      new THREE.Color(0xfca5a5), // M red
    ]

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const r = 2600 + Math.random() * 900
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
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── 5. The Sun (Sol Core & Multi-Stage Plasma Corona) ───────────────────
    const sunGeo = new THREE.SphereGeometry(32, 64, 64)
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    // Inner fiery corona
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

    // Outer golden halo
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

    const raycastTargets = [sunMesh]
    sunMesh.userData = { id: 'sun', name: 'Sol (The Sun)', radius: 32, mesh: sunMesh }

    // ── 6. Planetary Systems & Authentic Lunar Satellites ───────────────────
    const planetObjects = []
    const allMoonObjects = []

    PLANET_CONFIG.forEach(p => {
      // Orbital Track Line
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
      if (p.inclination) {
        orbitLine.rotation.x = p.inclination
      }
      scene.add(orbitLine)

      // Orbital Pivot Group
      const pivot = new THREE.Group()
      if (p.inclination) {
        pivot.rotation.x = p.inclination
      }
      scene.add(pivot)

      // Photorealistic Planet Sphere with NASA Equirectangular Map
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

      // Atmospheric Rayleigh Scattering Glow
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

      // Earth Rotating Cloud Sphere
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

      // Earth Real Glowing Night Lights & Diwali / New Year Festival Illumination
      if (p.id === 'earth') {
        const nightGeo = new THREE.SphereGeometry(p.r * 1.018, 64, 64)
        const nightMat = new THREE.ShaderMaterial({
          uniforms: {
            uLightsMap: { value: earthLightsTexture },
            uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
            uTime: { value: 0.0 },
            uFestiveMode: { value: 1.0 },
            uFestiveBoost: { value: 2.6 },
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
            uniform float uFestiveBoost;

            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;

            void main() {
              vec3 sunDir = normalize(uSunPosition - vWorldPosition);
              float sunDot = dot(vWorldNormal, sunDir);

              // Smooth transition across twilight terminator
              float nightFactor = smoothstep(0.04, -0.15, sunDot);
              if (nightFactor <= 0.001) {
                discard;
              }

              vec4 texColor = texture2D(uLightsMap, vUv);
              float lum = max(texColor.r, max(texColor.g, texColor.b));
              if (lum < 0.02) {
                discard;
              }

              // Realistic NASA city lights base (warm incandescent gold)
              vec3 baseCity = texColor.rgb * vec3(1.3, 1.15, 0.9);

              // ── Diwali & New Year Festival Illumination ──
              // Coordinates for Indian Subcontinent & South Asia
              float dU = (vUv.x - 0.722) * 2.8;
              float dV = (vUv.y - 0.608) * 2.2;
              float distIndia = sqrt(dU * dU + dV * dV);
              float indiaEpicenter = smoothstep(0.32, 0.0, distIndia);

              // Shimmering Diya micro-twinkle across populated lands
              float twinkle = 1.0 
                + 0.32 * sin(uTime * 4.2 + vUv.x * 260.0 + vUv.y * 180.0)
                + 0.18 * cos(uTime * 7.1 + vUv.x * 520.0)
                + 0.12 * sin(uTime * 9.8 + vUv.y * 340.0);

              // Celebration Fireworks: Periodic sparkling bursts across nocturnal cities
              float burstSeed = sin(uTime * 4.6 + vUv.x * 740.0) * cos(uTime * 3.8 + vUv.y * 580.0);
              float fireworkBurst = pow(max(0.0, burstSeed), 10.0) * 3.5;

              // Firework burst chromatic dispersion (festive crimson, emerald, saffron gold)
              vec3 fireworkColor = mix(
                vec3(1.0, 0.3, 0.18),
                vec3(0.25, 1.0, 0.55),
                sin(vUv.x * 85.0 + uTime * 2.2) * 0.5 + 0.5
              );

              // Rich Saffron / Amber Diya Flame Tone (Warm incandescent 2400K)
              vec3 diyaGoldenTone = vec3(1.45, 1.02, 0.44) * (1.0 + indiaEpicenter * 1.6);
              vec3 festiveIllumination = texColor.rgb * (diyaGoldenTone * twinkle + fireworkColor * fireworkBurst);

              // Soft incandescent atmospheric halo on intense light clusters
              float halo = pow(lum, 1.6) * 0.65 * (1.0 + indiaEpicenter * 1.0);
              vec3 haloColor = vec3(1.0, 0.82, 0.36) * halo;

              // Blend realistic mode vs festive celebration mode
              vec3 result = mix(baseCity, festiveIllumination * uFestiveBoost + haloColor, uFestiveMode);

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
      }

      // Saturn 3D Rings with Radial Mapping & Cassini Division
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
        const ringMesh = new THREE.Mesh(rGeo, rMat)
        pMesh.add(ringMesh)
      }

      // Uranus Tilted Rings
      if (p.hasUranusRing) {
        const uRingGeo = new THREE.RingGeometry(p.r * 1.35, p.r * 1.55, 64)
        uRingGeo.rotateX(Math.PI / 2)
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0xbae6fd,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })
        pMesh.add(new THREE.Mesh(uRingGeo, uRingMat))
      }

      // Moons Hierarchy (Orbiting around parent planet)
      const moonObjectsForPlanet = []
      p.moons.forEach(m => {
        // Moon orbital guide trace
        const mOrbitGeo = new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, m.dist, m.dist, 0, Math.PI * 2)
            .getPoints(48)
            .map(pt => new THREE.Vector3(pt.x, 0, pt.y))
        )
        const mOrbitLine = new THREE.Line(
          mOrbitGeo,
          new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.14 })
        )
        pMesh.add(mOrbitLine)

        // Moon Sphere Mesh
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

        const moonObj = {
          data: m,
          mesh: mMesh,
          angle: initialAngle,
        }
        moonObjectsForPlanet.push(moonObj)
        allMoonObjects.push(moonObj)
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

    // ── 7. Main Asteroid Belt (InstancedMesh) ────────────────────────────────
    const asteroidGeo = new THREE.DodecahedronGeometry(0.75, 1)
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.92 })
    const asteroidCount = 480
    const asteroidMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount)
    const dummy = new THREE.Object3D()

    for (let i = 0; i < asteroidCount; i++) {
      const dist = 245 + (Math.random() - 0.5) * 55
      const angle = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 16
      dummy.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      const scale = Math.random() * 1.3 + 0.4
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      asteroidMesh.setMatrixAt(i, dummy.matrix)
    }
    asteroidMesh.instanceMatrix.needsUpdate = true
    scene.add(asteroidMesh)

    // ── 8. Quantum Singularity Gateway (Return Beacon) ──────────────────────
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

    // ── 9. Raycaster Pointer Interaction ────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const focusOnTarget = (targetData) => {
      setSelectedPlanet(targetData.name)
      focusedTargetRef.current = targetData
      const targetRadius = targetData.radius || 10
      if (targetData.id === 'earth') {
        // Dramatic view of Earth's twilight terminator and glowing night cities
        const dist = targetRadius * 3.2 + 8
        targetCamPosRef.current = new THREE.Vector3(dist * 0.72, dist * 0.38, dist * 0.72)
      } else {
        const offset = targetData.isMoon
          ? targetRadius * 5.0 + 8
          : targetRadius * 3.8 + 12
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

    // Expose focus setter to HUD
    container.focusPlanet = (id) => {
      if (id === 'overview') {
        setSelectedPlanet(null)
        focusedTargetRef.current = null
        targetCamPosRef.current = new THREE.Vector3(0, 340, 720)
        targetLookAtRef.current = new THREE.Vector3(0, 0, 0)
      } else if (id === 'sun') {
        focusOnTarget(sunMesh.userData)
      } else {
        const found = planetObjects.find(p => p.data.id === id)
        if (found) focusOnTarget(found.mesh.userData)
      }
    }

    // ── 10. Render & Physics Loop ───────────────────────────────────────────
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const speedMult = simSpeedRef.current

      // Superluminal Orbital Insertion Swoop & Dynamic FOV Decompression
      const nowTime = performance.now()
      const arrivalElapsed = nowTime - arrivalStartTime
      if (arrivalElapsed < arrivalDuration) {
        const prog = arrivalElapsed / arrivalDuration
        const ease = 1 - Math.pow(1 - prog, 4) // Quartic hyper-deceleration

        camera.position.set(
          0,
          1200 + (340 - 1200) * ease,
          1800 + (720 - 1800) * ease
        )
        // Optical FOV decompression: wide warp perspective (60 deg) relaxes into standard cinematic view (45 deg)
        camera.fov = 60 - 15 * ease
        camera.updateProjectionMatrix()
        controls.target.set(0, 0, 0)
      }

      // Rotate Sun and Corona
      sunMesh.rotation.y += 0.003 * speedMult
      coronaInnerMesh.rotation.y -= 0.002 * speedMult
      coronaOuterMesh.rotation.y += 0.001 * speedMult

      // Rotate Singularity Gateway
      gateTorus.rotation.x += 0.02 * speedMult
      gateTorus.rotation.y += 0.03 * speedMult

      // Orbit Asteroids
      asteroidMesh.rotation.y += 0.0007 * speedMult

      // Advance Planets & Moons
      planetObjects.forEach(po => {
        po.angle += po.data.speed * delta * 2.2 * speedMult
        po.mesh.position.x = Math.cos(po.angle) * po.data.dist
        po.mesh.position.z = Math.sin(po.angle) * po.data.dist

        // Planet self-rotation on axial tilt
        po.mesh.rotation.y += po.data.rot * speedMult

        if (po.cloudMesh) {
          po.cloudMesh.rotation.y += po.data.rot * 1.25 * speedMult
        }

        // Orbit each moon around this planet
        po.moons.forEach(mo => {
          mo.angle += mo.data.speed * delta * 2.2 * speedMult
          mo.mesh.position.x = Math.cos(mo.angle) * mo.data.dist
          mo.mesh.position.z = Math.sin(mo.angle) * mo.data.dist
          mo.mesh.rotation.y += 0.015 * speedMult
        })
      })

      // Smooth Camera Lerp when targeting a planet or moon
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
        if (camera.position.distanceTo(targetCamPosRef.current) < 5) {
          targetCamPosRef.current = null
        }
      }

      // Update Earth Night Lights Shader Uniforms
      if (earthNightMatRef.current) {
        earthNightMatRef.current.uniforms.uTime.value = clock.getElapsedTime()
        earthNightMatRef.current.uniforms.uFestiveMode.value = cityLightsRef.current ? 1.0 : 0.0
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // ── 11. Viewport Resize Handler ─────────────────────────────────────────
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
          {PLANET_CONFIG.map(p => (
            <button
              key={p.id}
              className={`nav-chip ${selectedPlanet === p.name ? 'active' : ''}`}
              onClick={() => mountRef.current?.focusPlanet?.(p.id)}
            >
              {p.id === 'earth' ? '🌍 EARTH' : p.id === 'pluto' ? '♇ PLUTO' : p.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Action controls */}
        <div className="hud-actions-strip">
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
