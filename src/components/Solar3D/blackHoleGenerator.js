// ─────────────────────────────────────────────────────────────────────────────
// blackHoleGenerator.js — Photorealistic Supermassive Black Hole & Accretion Disk
// Physically-inspired general relativity simulation:
// 1. Pristine event horizon gravitational shadow
// 2. Ultra-bright razor-thin photon sphere ring
// 3. Relativistic Doppler-beamed accretion disk with turbulent plasma filaments
// 4. Gravitational lensing Einstein halo arc curving over the shadow
// 5. Zero hard geometric boundaries — pure mathematical exponential falloffs
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Creates a photorealistic Supermassive Black Hole (M31* SMBH) assembly.
 * Designed to eliminate harsh elliptical clipping and synthetic gradient steps.
 */
export function createSupermassiveBlackHole() {
  const holeGroup = new THREE.Group()
  holeGroup.name = 'supermassive-black-hole-m31'

  const materialsToDispose = []
  const geometriesToDispose = []
  const texturesToDispose = []

  const HORIZON_RADIUS = 35.0
  const DISK_INNER_RADIUS = 36.5
  const DISK_OUTER_RADIUS = 220.0

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
    desc: 'Mass: ~1.4×10⁸ M☉ • Relativistic Kerr Black Hole with Doppler-beamed Accretion Disk & Photon Ring',
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

        vec3 ringColor = mix(vec3(1.0, 0.95, 0.82), vec3(0.55, 0.88, 1.0), 0.25) * doppler;
        float innerEdge = smoothstep(0.905, 0.93, r);
        float outerEdge = smoothstep(0.998, 0.96, r);
        float alpha = ring * innerEdge * outerEdge * 0.95;

        if (alpha <= 0.005) discard;
        gl_FragColor = vec4(ringColor * 2.0, alpha);
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

  // ── 3. Relativistic Doppler-Beamed Accretion Disk (Equatorial Plane) ─────────
  const diskGeo = new THREE.RingGeometry(DISK_INNER_RADIUS, DISK_OUTER_RADIUS, 128, 32)
  geometriesToDispose.push(diskGeo)

  const diskUniforms = {
    uTime: { value: 0 },
  }

  const diskMat = new THREE.ShaderMaterial({
    uniforms: diskUniforms,
    vertexShader: `
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vLocalPos;
      uniform float uTime;

      // Pseudo-random hash
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        float r = length(vLocalPos.xy);
        float theta = atan(vLocalPos.y, vLocalPos.x);

        // Normalized radial coordinate [0.0 at ISCO .. 1.0 at outer boundary]
        float rNorm = (r - 36.5) / (220.0 - 36.5);
        if (rNorm < 0.0 || rNorm > 1.0) {
          discard;
        }

        // Keplerian differential orbital velocity (omega ~ r^-1.5)
        float omega = 1.8 * pow(60.0 / max(r, 36.5), 1.35);
        float advectedTheta = theta - uTime * omega;

        // Multi-frequency spiral turbulent plasma filaments
        float f1 = sin(7.0 * advectedTheta + 6.0 * log(max(r, 1.0)));
        float f2 = cos(14.0 * advectedTheta - 3.5 * log(max(r, 1.0)));
        float f3 = sin(28.0 * advectedTheta + 9.0 * log(max(r, 1.0)));
        float turbulence = 0.55 + 0.30 * f1 + 0.12 * f2 + 0.06 * f3;

        // Relativistic Doppler Beaming factor:
        // Plasma revolving toward observer (sin(theta) > 0) is boosted & bluer;
        // receding plasma is redshifted and dimmer.
        float dopplerBeaming = 1.0 + 0.62 * sin(theta);
        dopplerBeaming = max(0.25, dopplerBeaming);

        // Smooth continuous radial color transition:
        // Ultra-hot inner ISCO rim -> Golden-yellow accretion mid-disk -> Deep ember outer smoke
        vec3 cInner = vec3(1.0, 0.96, 0.88);  // 12,000K white-hot inner boundary
        vec3 cMid   = vec3(1.0, 0.65, 0.18);  // 6,000K golden amber
        vec3 cOuter = vec3(0.85, 0.22, 0.04); // 2,500K deep infrared ember
        vec3 cEdge  = vec3(0.20, 0.05, 0.02); // Cool gas fringe

        vec3 plasmaColor;
        if (rNorm < 0.22) {
          plasmaColor = mix(cInner, cMid, rNorm / 0.22);
        } else if (rNorm < 0.65) {
          plasmaColor = mix(cMid, cOuter, (rNorm - 0.22) / 0.43);
        } else {
          plasmaColor = mix(cOuter, cEdge, (rNorm - 0.65) / 0.35);
        }

        // Apply Doppler color temperature modulation
        plasmaColor *= dopplerBeaming;

        // ZERO HARSH EDGES: Mathematical smoothstep falloff at both inner and outer bounds
        // Inner cutoff: rises smoothly from 0 at rNorm=0.0 to 1 at rNorm=0.06
        float innerFade = smoothstep(0.0, 0.05, rNorm);
        // Outer cutoff: smoothly fades to exactly 0.0 well before geometry boundary (by rNorm=0.88)
        float outerFade = smoothstep(0.92, 0.40, rNorm);
        // Exponential radial density attenuation
        float radialDensity = exp(-rNorm * 2.8);

        float alpha = innerFade * outerFade * radialDensity * turbulence * 0.95;

        // Doppler intensity boost on approaching side
        alpha *= pow(dopplerBeaming, 1.3);

        if (alpha <= 0.003) {
          discard;
        }

        gl_FragColor = vec4(plasmaColor * alpha * 1.5, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(diskMat)

  const diskMesh = new THREE.Mesh(diskGeo, diskMat)
  diskMesh.name = 'equatorial-accretion-disk'
  // Aligned with the galactic plane
  diskMesh.rotation.x = Math.PI / 2.35
  holeGroup.add(diskMesh)

  // ── 4. Gravitational Lensing Halo (The Bent Light Arc) ─────────────────────
  // Simulates light from the rear of the accretion disk warped over the poles
  const haloGeo = new THREE.RingGeometry(DISK_INNER_RADIUS, 155.0, 128, 24)
  geometriesToDispose.push(haloGeo)

  const haloMat = new THREE.ShaderMaterial({
    uniforms: diskUniforms,
    vertexShader: `
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vLocalPos;
      uniform float uTime;

      void main() {
        float r = length(vLocalPos.xy);
        float theta = atan(vLocalPos.y, vLocalPos.x);

        float rNorm = (r - 36.5) / (155.0 - 36.5);
        if (rNorm < 0.0 || rNorm > 1.0) {
          discard;
        }

        // Arched vertical Einstein ring profile: strongest near top and bottom poles
        float polarArc = pow(abs(sin(theta)), 1.8);

        // Relativistic Doppler beaming
        float doppler = 1.0 + 0.45 * cos(theta + uTime * 0.5);

        // Smooth radial Gaussian falloff
        float ringProfile = exp(-pow((rNorm - 0.12) * 5.5, 2.0));
        float innerFade = smoothstep(0.0, 0.04, rNorm);
        float outerFade = smoothstep(0.85, 0.35, rNorm);

        vec3 haloColor = mix(
          vec3(1.0, 0.72, 0.25),
          vec3(0.45, 0.75, 1.0),
          smoothstep(0.1, 0.7, rNorm) * 0.35
        ) * doppler;

        float alpha = polarArc * ringProfile * innerFade * outerFade * 0.65;
        if (alpha <= 0.003) {
          discard;
        }

        gl_FragColor = vec4(haloColor * alpha * 1.4, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(haloMat)

  const haloMesh = new THREE.Mesh(haloGeo, haloMat)
  haloMesh.name = 'lensing-halo-arc'
  // Perpendicular warped Einstein ring light cone
  haloMesh.rotation.x = Math.PI / 2.35 + Math.PI / 2.0
  holeGroup.add(haloMesh)

  // ── 5. Photometrically Seamless Galactic Core Bulge (High-Res 512×512) ─────
  // Smooth, continuous exponential Gaussian gradient with ZERO hard boundaries
  const coreCanvas = document.createElement('canvas')
  coreCanvas.width = 512
  coreCanvas.height = 512
  const ctx = coreCanvas.getContext('2d')

  // Pristine exponential radial glow
  const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  grad.addColorStop(0.00, 'rgba(255, 250, 235, 1.0)')
  grad.addColorStop(0.08, 'rgba(254, 240, 138, 0.75)')
  grad.addColorStop(0.22, 'rgba(251, 191, 36, 0.32)')
  grad.addColorStop(0.45, 'rgba(217, 119, 6, 0.10)')
  grad.addColorStop(0.72, 'rgba(180, 83, 9, 0.025)')
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  const coreTex = new THREE.CanvasTexture(coreCanvas)
  coreTex.colorSpace = THREE.SRGBColorSpace
  texturesToDispose.push(coreTex)

  const coreSpriteMat = new THREE.SpriteMaterial({
    map: coreTex,
    color: 0xfffae6,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  materialsToDispose.push(coreSpriteMat)

  // Perfectly symmetrical spherical core glow (No non-uniform stretching!)
  const coreSprite = new THREE.Sprite(coreSpriteMat)
  coreSprite.name = 'galactic-core-bulge-sprite'
  coreSprite.scale.set(1500, 1500, 1)
  holeGroup.add(coreSprite)

  // ── 6. Physics Animation Loop Handler ──────────────────────────────────────
  const updateBlackHole = (delta, simSpeed, cameraPos) => {
    const elapsedDelta = delta * simSpeed
    diskUniforms.uTime.value += elapsedDelta
    photonRingMat.uniforms.uTime.value += elapsedDelta

    // Subtle counter-rotation of accretion plasma
    diskMesh.rotation.z += 0.0008 * simSpeed
    haloMesh.rotation.z += 0.0004 * simSpeed

    // Proximity fade: when camera approaches the SMBH, fade out the background
    // galactic core sprite so the accretion disk and event horizon shadow are
    // crisp and pristine against deep space with ZERO washed-out oval gradient.
    if (cameraPos) {
      const worldPos = new THREE.Vector3()
      holeGroup.getWorldPosition(worldPos)
      const dist = cameraPos.distanceTo(worldPos)
      const coreAlpha = THREE.MathUtils.clamp((dist - 350) / 850, 0.0, 1.0)
      coreSpriteMat.opacity = coreAlpha * 0.85
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
    coreSprite,
    updateBlackHole,
    dispose,
  }
}
