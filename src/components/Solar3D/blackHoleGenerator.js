// ─────────────────────────────────────────────────────────────────────────────
// blackHoleGenerator.js — Volumetric Relativistic Singularity & Accretion Swarm
// Physically-inspired general relativity & volumetric particle visualization:
// 1. Pristine event horizon gravitational shadow sphere (depth-occluded)
// 2. Razor-thin ultra-brilliant photon sphere ring
// 3. Volumetric 3D Keplerian plasma particle accretion swarm (7,500 GPU sparks)
// 4. Relativistic Doppler beaming (approaching stream blueshifted & boosted)
// 5. Polar gravitational lensing arc (warped light cone curving over poles)
// 6. Volumetric 3D galactic stellar nucleus (6,000 ancient Pop II stars)
// ZERO flat 2D billboards • ZERO harsh geometric cuts • Pure 3D depth
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Creates a photorealistic, fully volumetric 3D Supermassive Black Hole assembly.
 */
export function createSupermassiveBlackHole() {
  const holeGroup = new THREE.Group()
  holeGroup.name = 'supermassive-black-hole-m31'

  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []

  const HORIZON_RADIUS = 35.0
  const DISK_INNER_RADIUS = 36.5
  const DISK_OUTER_RADIUS = 230.0

  // ── 1. Pitch-Black Event Horizon (Gravitational Shadow) ─────────────────────
  const shadowGeo = new THREE.SphereGeometry(HORIZON_RADIUS, 64, 64)
  geometriesToDispose.push(shadowGeo)

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthWrite: true,
  })
  materialsToDispose.push(shadowMat)

  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
  shadowMesh.name = 'event-horizon-shadow'
  shadowMesh.userData = {
    id: 'andromeda_smbh',
    name: 'M31* Supermassive Black Hole (Andromeda Core)',
    desc: 'Mass: ~1.4×10⁸ M☉ • Relativistic Kerr Black Hole with 3D Volumetric Accretion Swarm & Gravitational Lens',
    radius: 42,
    mesh: holeGroup,
    isBlackHole: true,
  }
  holeGroup.add(shadowMesh)

  // ── 2. Razor-Thin Brilliant Photon Sphere Ring ──────────────────────────────
  const photonRingGeo = new THREE.RingGeometry(HORIZON_RADIUS + 0.1, HORIZON_RADIUS + 3.8, 128)
  geometriesToDispose.push(photonRingGeo)

  const photonRingMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);

        // Ultra-narrow Gaussian peak at photon sphere boundary
        float ring = exp(-pow((r - 0.96) * 32.0, 2.0));
        
        // Subtle relativistic asymmetry
        float theta = atan(p.y, p.x);
        float doppler = 1.0 + 0.35 * sin(theta + uTime * 0.8);

        vec3 ringColor = mix(vec3(1.0, 0.96, 0.85), vec3(0.55, 0.90, 1.0), 0.30) * doppler;
        float innerEdge = smoothstep(0.905, 0.93, r);
        float outerEdge = smoothstep(0.998, 0.96, r);
        float alpha = ring * innerEdge * outerEdge * 0.95;

        if (alpha <= 0.005) discard;
        gl_FragColor = vec4(ringColor * 2.2, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(photonRingMat)

  const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat)
  photonRing.name = 'photon-sphere-ring'
  photonRing.rotation.x = Math.PI / 2.35
  holeGroup.add(photonRing)

  // ── Helper: Soft Circular Glow Texture for Points ─────────────────────────
  const createSoftPointTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.25, 'rgba(255, 245, 220, 0.85)')
    grad.addColorStop(0.65, 'rgba(255, 160, 60, 0.25)')
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    texturesToDispose.push(tex)
    return tex
  }
  const sparkTexture = createSoftPointTexture()

  // ── 3. Volumetric 3D Keplerian Particle Accretion Disk (7,500 GPU Sparks) ───
  const SWARM_COUNT = 7500
  const swarmGeo = new THREE.BufferGeometry()
  const sPositions = new Float32Array(SWARM_COUNT * 3)
  const aRadius = new Float32Array(SWARM_COUNT)
  const aBaseAngle = new Float32Array(SWARM_COUNT)
  const aHeight = new Float32Array(SWARM_COUNT)
  const aSpeed = new Float32Array(SWARM_COUNT)
  const aSize = new Float32Array(SWARM_COUNT)
  const aBaseColor = new Float32Array(SWARM_COUNT * 3)

  // Gaussian random helper
  const randGaussian = () => {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  for (let i = 0; i < SWARM_COUNT; i++) {
    const i3 = i * 3

    // Radial power distribution (denser toward inner ISCO rim)
    const u = Math.random()
    const r = DISK_INNER_RADIUS + Math.pow(u, 1.65) * (DISK_OUTER_RADIUS - DISK_INNER_RADIUS)
    const angle = Math.random() * Math.PI * 2

    // Disk thickness increases outward:
    const diskThickness = 1.2 + (r - DISK_INNER_RADIUS) * 0.065
    const h = randGaussian() * diskThickness

    // Keplerian angular orbital speed: omega ~ r^-1.35
    const speed = 1.85 * Math.pow(60.0 / Math.max(r, 36.5), 1.35)
    const size = 2.4 + Math.random() * 3.2

    // Color based on temperature gradient:
    // Inner ISCO (12,000K white/cyan) -> Mid (6,000K golden amber) -> Outer (2,500K deep infrared ember)
    const rNorm = (r - DISK_INNER_RADIUS) / (DISK_OUTER_RADIUS - DISK_INNER_RADIUS)
    let cr, cg, cb
    if (rNorm < 0.20) {
      const t = rNorm / 0.20
      cr = 1.0
      cg = 0.96 - t * 0.15
      cb = 0.98 - t * 0.55
    } else if (rNorm < 0.60) {
      const t = (rNorm - 0.20) / 0.40
      cr = 1.0 - t * 0.10
      cg = 0.81 - t * 0.45
      cb = 0.43 - t * 0.35
    } else {
      const t = (rNorm - 0.60) / 0.40
      cr = 0.90 - t * 0.45
      cg = 0.36 - t * 0.25
      cb = 0.08 - t * 0.05
    }

    sPositions[i3]     = r * Math.cos(angle)
    sPositions[i3 + 1] = h
    sPositions[i3 + 2] = r * Math.sin(angle)

    aRadius[i] = r
    aBaseAngle[i] = angle
    aHeight[i] = h
    aSpeed[i] = speed
    aSize[i] = size

    aBaseColor[i3]     = cr
    aBaseColor[i3 + 1] = cg
    aBaseColor[i3 + 2] = cb
  }

  swarmGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3))
  swarmGeo.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1))
  swarmGeo.setAttribute('aBaseAngle', new THREE.BufferAttribute(aBaseAngle, 1))
  swarmGeo.setAttribute('aHeight', new THREE.BufferAttribute(aHeight, 1))
  swarmGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1))
  swarmGeo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1))
  swarmGeo.setAttribute('aBaseColor', new THREE.BufferAttribute(aBaseColor, 3))
  geometriesToDispose.push(swarmGeo)

  const diskUniforms = {
    uTime: { value: 0 },
    uSparkMap: { value: sparkTexture },
  }

  const swarmMat = new THREE.ShaderMaterial({
    uniforms: diskUniforms,
    vertexShader: `
      attribute float aRadius;
      attribute float aBaseAngle;
      attribute float aHeight;
      attribute float aSpeed;
      attribute float aSize;
      attribute vec3 aBaseColor;

      varying vec3 vColor;
      varying float vAlpha;

      uniform float uTime;

      void main() {
        // Continuous Keplerian differential orbital propagation
        float currentAngle = aBaseAngle + uTime * aSpeed;

        float x = aRadius * cos(currentAngle);
        float z = aRadius * sin(currentAngle);
        float y = aHeight * (1.0 + 0.15 * sin(currentAngle * 3.0));

        vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);

        // Relativistic Doppler Beaming:
        // Plasma moving toward the observer is boosted in intensity and bluer;
        // receding stream is dimmer and redshifted.
        vec3 viewDir = normalize(-mvPosition.xyz);
        vec3 velDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
        float dopplerFactor = 1.0 + 0.58 * dot(velDir, viewDir);
        dopplerFactor = max(0.25, dopplerFactor);

        vColor = aBaseColor * dopplerFactor;

        // Smooth radial edge attenuation: ZERO hard geometric boundary
        float rNorm = (aRadius - 36.5) / (230.0 - 36.5);
        float innerFade = smoothstep(0.0, 0.06, rNorm);
        float outerFade = smoothstep(0.95, 0.50, rNorm);

        vAlpha = innerFade * outerFade * (0.65 + 0.35 * dopplerFactor);

        gl_PointSize = aSize * (200.0 / -mvPosition.z) * (0.75 + 0.35 * dopplerFactor);
        gl_PointSize = clamp(gl_PointSize, 1.0, 36.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      uniform sampler2D uSparkMap;

      void main() {
        vec4 tex = texture2D(uSparkMap, gl_PointCoord);
        float alpha = tex.a * vAlpha;
        if (alpha <= 0.008) discard;

        gl_FragColor = vec4(vColor * tex.rgb * 1.8, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(swarmMat)

  const swarmPoints = new THREE.Points(swarmGeo, swarmMat)
  swarmPoints.name = 'volumetric-accretion-swarm'
  swarmPoints.rotation.x = Math.PI / 2.35
  holeGroup.add(swarmPoints)

  // ── 4. Polar Gravitational Lensing Halo (2,500 Bent-Light Photons) ──────────
  const LENS_COUNT = 2500
  const lensGeo = new THREE.BufferGeometry()
  const lPositions = new Float32Array(LENS_COUNT * 3)
  const lRadius = new Float32Array(LENS_COUNT)
  const lBaseAngle = new Float32Array(LENS_COUNT)
  const lSpeed = new Float32Array(LENS_COUNT)
  const lSize = new Float32Array(LENS_COUNT)
  const lBaseColor = new Float32Array(LENS_COUNT * 3)

  for (let i = 0; i < LENS_COUNT; i++) {
    const i3 = i * 3
    const u = Math.random()
    const r = DISK_INNER_RADIUS + Math.pow(u, 1.4) * 110.0
    const angle = Math.random() * Math.PI * 2
    const speed = 1.4 * Math.pow(60.0 / Math.max(r, 36.5), 1.2)
    const size = 1.8 + Math.random() * 2.6

    lPositions[i3]     = r * Math.cos(angle)
    lPositions[i3 + 1] = (Math.random() - 0.5) * 4.0
    lPositions[i3 + 2] = r * Math.sin(angle)

    lRadius[i] = r
    lBaseAngle[i] = angle
    lSpeed[i] = speed
    lSize[i] = size

    // Golden-amber warped light with subtle cyan edge
    lBaseColor[i3]     = 1.0
    lBaseColor[i3 + 1] = 0.78 + Math.random() * 0.15
    lBaseColor[i3 + 2] = 0.35 + Math.random() * 0.35
  }

  lensGeo.setAttribute('position', new THREE.BufferAttribute(lPositions, 3))
  lensGeo.setAttribute('aRadius', new THREE.BufferAttribute(lRadius, 1))
  lensGeo.setAttribute('aBaseAngle', new THREE.BufferAttribute(lBaseAngle, 1))
  lensGeo.setAttribute('aSpeed', new THREE.BufferAttribute(lSpeed, 1))
  lensGeo.setAttribute('aSize', new THREE.BufferAttribute(lSize, 1))
  lensGeo.setAttribute('aBaseColor', new THREE.BufferAttribute(lBaseColor, 3))
  geometriesToDispose.push(lensGeo)

  const lensMat = new THREE.ShaderMaterial({
    uniforms: diskUniforms,
    vertexShader: `
      attribute float aRadius;
      attribute float aBaseAngle;
      attribute float aSpeed;
      attribute float aSize;
      attribute vec3 aBaseColor;

      varying vec3 vColor;
      varying float vAlpha;

      uniform float uTime;

      void main() {
        float angle = aBaseAngle + uTime * aSpeed;
        
        // Curved polar Einstein arc: warped upward and downward over poles
        float x = aRadius * cos(angle);
        float z = aRadius * sin(angle);
        float polarArc = pow(abs(sin(angle)), 1.6);
        float y = (sin(angle) > 0.0 ? 1.0 : -1.0) * (aRadius * 0.32 * polarArc);

        vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);

        float rNorm = (aRadius - 36.5) / 110.0;
        float innerFade = smoothstep(0.0, 0.08, rNorm);
        float outerFade = smoothstep(0.92, 0.45, rNorm);

        vColor = aBaseColor * (0.8 + 0.4 * polarArc);
        vAlpha = innerFade * outerFade * polarArc * 0.72;

        gl_PointSize = aSize * (170.0 / -mvPosition.z);
        gl_PointSize = clamp(gl_PointSize, 1.0, 28.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      uniform sampler2D uSparkMap;

      void main() {
        vec4 tex = texture2D(uSparkMap, gl_PointCoord);
        float alpha = tex.a * vAlpha;
        if (alpha <= 0.008) discard;

        gl_FragColor = vec4(vColor * tex.rgb * 1.5, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(lensMat)

  const lensPoints = new THREE.Points(lensGeo, lensMat)
  lensPoints.name = 'polar-gravitational-lens-arc'
  lensPoints.rotation.x = Math.PI / 2.35 + Math.PI / 2.0
  holeGroup.add(lensPoints)

  // ── 5. Volumetric 3D Galactic Stellar Nucleus (6,000 Ancient Pop II Stars) ───
  // Replaces the 2D canvas billboard with a genuine 3D spherical stellar bulge
  const NUCLEUS_COUNT = 6000
  const nucGeo = new THREE.BufferGeometry()
  const nPositions = new Float32Array(NUCLEUS_COUNT * 3)
  const nColors = new Float32Array(NUCLEUS_COUNT * 3)
  const nSizes = new Float32Array(NUCLEUS_COUNT)

  for (let i = 0; i < NUCLEUS_COUNT; i++) {
    const i3 = i * 3

    // de Vaucouleurs / Plummer spherical density distribution (dense core, soft outer envelope)
    const u = Math.random()
    const r = 45.0 + Math.pow(u, 2.2) * 620.0
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() * 2) - 1)

    // Slightly oblate bulge
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.cos(phi) * 0.65
    const z = r * Math.sin(phi) * Math.sin(theta)

    nPositions[i3]     = x
    nPositions[i3 + 1] = y
    nPositions[i3 + 2] = z

    // Ancient Population II stellar spectra: 4500K - 6000K warm peach, ivory, golden amber
    const pop = Math.random()
    if (pop < 0.55) {
      // Warm ivory K-giants
      nColors[i3]     = 1.0
      nColors[i3 + 1] = 0.92
      nColors[i3 + 2] = 0.74
    } else if (pop < 0.85) {
      // Golden peach solar-type stars
      nColors[i3]     = 1.0
      nColors[i3 + 1] = 0.78
      nColors[i3 + 2] = 0.48
    } else {
      // Hotter intermediate stars
      nColors[i3]     = 0.95
      nColors[i3 + 1] = 0.95
      nColors[i3 + 2] = 1.0
    }

    nSizes[i] = 1.4 + Math.random() * 1.8
  }

  nucGeo.setAttribute('position', new THREE.BufferAttribute(nPositions, 3))
  nucGeo.setAttribute('color', new THREE.BufferAttribute(nColors, 3))
  geometriesToDispose.push(nucGeo)

  const nucMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    map: sparkTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(nucMat)

  const nucleusPoints = new THREE.Points(nucGeo, nucMat)
  nucleusPoints.name = 'volumetric-galactic-core-nucleus'
  holeGroup.add(nucleusPoints)

  // ── 6. Physics Animation Loop Handler ──────────────────────────────────────
  const updateBlackHole = (delta, simSpeed, cameraPos) => {
    const elapsedDelta = delta * simSpeed
    diskUniforms.uTime.value += elapsedDelta
    photonRingMat.uniforms.uTime.value += elapsedDelta

    // Subtle counter-rotation of accretion plasma
    swarmPoints.rotation.z += 0.0006 * simSpeed
    lensPoints.rotation.z += 0.0003 * simSpeed
    nucleusPoints.rotation.y += 0.00008 * simSpeed

    // Proximity fade of nucleus stars: when viewing the SMBH close-up (dist < 400),
    // softly reduce nucleus star opacity so the accretion disk and event horizon
    // are viewed with crystalline clarity against deep space.
    if (cameraPos) {
      const worldPos = new THREE.Vector3()
      holeGroup.getWorldPosition(worldPos)
      const dist = cameraPos.distanceTo(worldPos)
      const nucAlpha = THREE.MathUtils.clamp((dist - 250) / 750, 0.15, 0.88)
      nucMat.opacity = nucAlpha
    }
  }

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose())
    materialsToDispose.forEach(m => m.dispose())
    texturesToDispose.forEach(t => t.dispose())
  }

  return {
    group: holeGroup,
    shadowMesh,
    updateBlackHole,
    dispose,
  }
}
