// ─────────────────────────────────────────────────────────────────────────────
// galaxyGenerator.js — Photorealistic 3D Spiral Galaxy (Andromeda M31)
// 18,000 volumetric density-wave stars, 5000K core bulge, hot OB blue spiral arms,
// H-alpha ionized hydrogen emission nebulae, and dark dust lane extinction
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Creates a photorealistic 3D grand-design spiral galaxy (Andromeda M31).
 * Features 18,000 particles distributed via astrophysical logarithmic density wave theory.
 */
export function createAndromedaGalaxy() {
  const galaxyGroup = new THREE.Group()
  galaxyGroup.name = 'andromeda-galaxy'

  // Positioned in deep intergalactic space
  galaxyGroup.position.set(11000, 4200, -16000)

  // Authentic line-of-sight inclination of Andromeda (M31): ~77 degrees tilt
  galaxyGroup.rotation.x = THREE.MathUtils.degToRad(77)
  galaxyGroup.rotation.y = THREE.MathUtils.degToRad(32)
  galaxyGroup.rotation.z = THREE.MathUtils.degToRad(-18)

  const STAR_COUNT = 18000
  const starGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)

  const coreRadius = 550
  const diskRadius = 4600
  const numArms = 2
  const armCurl = 3.6 // Logarithmic spiral curvature b

  // Helper Gaussian random
  const randGaussian = () => {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3
    const pType = Math.random()

    let x, y, z
    let rColor, gColor, bColor
    let size = 1.6

    if (pType < 0.28) {
      // ── 1. Galactic Bulge & Core (Dense old stellar population) ────────────
      const r = coreRadius * Math.pow(Math.random(), 0.6)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)

      x = r * Math.sin(phi) * Math.cos(theta)
      // Flattened spheroidal bulge
      y = r * Math.cos(phi) * 0.48
      z = r * Math.sin(phi) * Math.sin(theta)

      // Warm 5000K-6000K golden-yellow / ivory stars
      const coreMix = Math.random()
      rColor = 1.0
      gColor = 0.88 - coreMix * 0.14
      bColor = 0.60 - coreMix * 0.25
      size = 2.4 - (r / coreRadius) * 0.9
    } else if (pType < 0.90) {
      // ── 2. Logarithmic Spiral Arms & Disk ──────────────────────────────────
      const armIndex = Math.floor(Math.random() * numArms)
      const baseArmAngle = (armIndex * (Math.PI * 2)) / numArms

      // Radial progression along arm (more stars closer to inner disk)
      const t = Math.pow(Math.random(), 0.75) // [0..1]
      const dist = coreRadius + t * (diskRadius - coreRadius)

      // Logarithmic spiral formula: theta = theta_0 + b * ln(r / r_0)
      const armAngle = baseArmAngle + armCurl * Math.log(dist / coreRadius)

      // Gaussian scatter across arm width and disk thickness
      const armWidth = 60 + dist * 0.08
      const angularScatter = (randGaussian() * armWidth) / dist
      const radialScatter = randGaussian() * (dist * 0.05)
      const effDist = dist + radialScatter
      const finalAngle = armAngle + angularScatter

      x = effDist * Math.cos(finalAngle)
      z = effDist * Math.sin(finalAngle)

      // Disk height scale: thicker toward core, thinner at edges
      const diskScaleHeight = 22 + 45 * (1.0 - t)
      y = randGaussian() * diskScaleHeight

      // Stellar Spectral Populations in Spiral Arms
      const popRoll = Math.random()
      if (popRoll < 0.60) {
        // Hot young OB associations (Brilliant Cyan-Blue / White, 15,000K-25,000K)
        rColor = 0.55 + Math.random() * 0.35
        gColor = 0.82 + Math.random() * 0.18
        bColor = 1.0
        size = 1.8 + Math.random() * 0.9
      } else if (popRoll < 0.78) {
        // Ionized Hydrogen (H-II) emission nebulae (Photoluminescent Magenta / Pink)
        rColor = 1.0
        gColor = 0.35 + Math.random() * 0.25
        bColor = 0.70 + Math.random() * 0.25
        size = 2.6 + Math.random() * 1.2
      } else if (popRoll < 0.90) {
        // Solar-type intermediate disk stars (Pale ivory / yellow)
        rColor = 0.98
        gColor = 0.95
        bColor = 0.82
        size = 1.4
      } else {
        // Dark dust lane silhouettes / cool red giants
        rColor = 0.85
        gColor = 0.45
        bColor = 0.30
        size = 1.1
      }
    } else {
      // ── 3. Galactic Halo & Globular Clusters ───────────────────────────────
      const r = coreRadius + Math.random() * diskRadius * 1.15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)

      x = r * Math.sin(phi) * Math.cos(theta)
      y = r * Math.cos(phi) * 0.32
      z = r * Math.sin(phi) * Math.sin(theta)

      rColor = 0.75
      gColor = 0.82
      bColor = 0.92
      size = 1.2
    }

    positions[i3]     = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z

    colors[i3]     = rColor
    colors[i3 + 1] = gColor
    colors[i3 + 2] = bColor

    sizes[i] = size
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Soft spherical star particle texture for natural glow
  const particleCanvas = document.createElement('canvas')
  particleCanvas.width = 32
  particleCanvas.height = 32
  const pCtx = particleCanvas.getContext('2d')
  const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
  pGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  pGrad.addColorStop(0.25, 'rgba(240, 248, 255, 0.85)')
  pGrad.addColorStop(0.65, 'rgba(180, 220, 255, 0.25)')
  pGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')
  pCtx.fillStyle = pGrad
  pCtx.fillRect(0, 0, 32, 32)

  const particleTexture = new THREE.CanvasTexture(particleCanvas)
  particleTexture.colorSpace = THREE.SRGBColorSpace

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const starPoints = new THREE.Points(starGeo, starMat)
  galaxyGroup.add(starPoints)

  // ── 4. Luminous Galactic Core Bulge (Supermassive Core Glow) ───────────────
  const coreCanvas = document.createElement('canvas')
  coreCanvas.width = 128
  coreCanvas.height = 128
  const cCtx = coreCanvas.getContext('2d')
  const cGrad = cCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
  cGrad.addColorStop(0.0, 'rgba(255, 250, 235, 1.0)')
  cGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.82)')
  cGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.35)')
  cGrad.addColorStop(0.8, 'rgba(217, 119, 6, 0.12)')
  cGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')
  cCtx.fillStyle = cGrad
  cCtx.fillRect(0, 0, 128, 128)

  const coreTex = new THREE.CanvasTexture(coreCanvas)
  coreTex.colorSpace = THREE.SRGBColorSpace

  const coreSpriteMat = new THREE.SpriteMaterial({
    map: coreTex,
    color: 0xfffae6,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const coreSprite = new THREE.Sprite(coreSpriteMat)
  coreSprite.scale.set(1600, 1200, 1)
  galaxyGroup.add(coreSprite)

  // Central Supermassive Black Hole (M31* Core Void)
  const smbhGeo = new THREE.SphereGeometry(38, 32, 32)
  const smbhMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const smbhMesh = new THREE.Mesh(smbhGeo, smbhMat)
  smbhMesh.userData = {
    id: 'andromeda',
    name: 'Andromeda Galaxy (M31)',
    radius: diskRadius,
    mesh: galaxyGroup,
    isGalaxy: true,
  }
  galaxyGroup.add(smbhMesh)

  // Relativistic Einstein Ring & Gravitational Lensing Accretion Halo
  const lensGeo = new THREE.RingGeometry(38.2, 120, 64)
  const lensMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vec2 centered = vUv * 2.0 - 1.0;
        float dist = length(centered);

        // Gravitational lensing radius (Einstein Ring peak at dist ≈ 0.45)
        float einsteinRing = exp(-pow((dist - 0.45) * 8.0, 2.0));
        // Inner event horizon cutoff (black hole shadow)
        float shadow = smoothstep(0.30, 0.36, dist);

        // Relativistic Doppler brightening (approaching side is brighter & bluer)
        float angle = atan(centered.y, centered.x) + uTime * 0.45;
        float doppler = 1.0 + 0.50 * sin(angle);

        // Gravitational redshift: warm amber near horizon, azure at outer boundary
        vec3 innerColor = vec3(1.0, 0.52, 0.12); // Redshifted photon orbit
        vec3 outerColor = vec3(0.35, 0.75, 1.0);  // High-energy lensing fringe
        vec3 color = mix(innerColor, outerColor, smoothstep(0.35, 0.85, dist)) * doppler;

        float alpha = einsteinRing * shadow * 0.90;
        if (alpha <= 0.005) discard;

        gl_FragColor = vec4(color * alpha * 1.6, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const lensMesh = new THREE.Mesh(lensGeo, lensMat)
  lensMesh.name = 'einstein-lensing-ring'
  lensMesh.rotation.x = Math.PI / 2.2
  galaxyGroup.add(lensMesh)

  // Slow galactic differential rotation handler
  const updateGalaxy = (delta, simSpeed) => {
    galaxyGroup.rotation.z += 0.00015 * simSpeed
    lensMat.uniforms.uTime.value += delta * simSpeed
  }

  const dispose = () => {
    starGeo.dispose()
    starMat.dispose()
    particleTexture.dispose()
    coreTex.dispose()
    coreSpriteMat.dispose()
    smbhGeo.dispose()
    smbhMat.dispose()
    lensGeo.dispose()
    lensMat.dispose()
  }

  return {
    group: galaxyGroup,
    coreMesh: smbhMesh,
    updateGalaxy,
    dispose,
  }
}
