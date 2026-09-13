// ─────────────────────────────────────────────────────────────────────────────
// atmosphereShader.js — Physical Rayleigh + Mie Atmospheric Scattering Shader
// Single-pass optical depth integration with wavelength-dependent Rayleigh
// scattering, Mie forward haze, limb brightening, and terminator sunset reddening.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Creates a physically-inspired atmospheric scattering shell mesh.
 * 
 * @param {Object} options
 * @param {number} options.radius - Planet core radius
 * @param {number} [options.atmosphereScale=1.035] - Scale factor for outer atmosphere boundary
 * @param {THREE.Color|number} [options.dayColor=0x38bdf8] - Daytime Rayleigh scattering wavelength tint
 * @param {THREE.Color|number} [options.sunsetTint=0xf97316] - Twilight / sunset terminator reddened tint
 * @param {number} [options.density=1.4] - Atmospheric density / optical depth multiplier
 * @param {number} [options.rimPower=3.2] - Grazing angle Fresnel exponent
 * @returns {THREE.Mesh} Atmosphere mesh with uniforms bound for heliocentric tracking
 */
export function createAtmosphereMesh({
  radius,
  atmosphereScale = 1.035,
  dayColor = 0x38bdf8,
  sunsetTint = 0xf97316,
  density = 1.4,
  rimPower = 3.2,
}) {
  const atmoGeo = new THREE.SphereGeometry(radius * atmosphereScale, 64, 64)

  const uniforms = {
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uDayColor: { value: new THREE.Color(dayColor) },
    uSunsetTint: { value: new THREE.Color(sunsetTint) },
    uDensity: { value: density },
    uRimPower: { value: rimPower },
  }

  const atmoMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewDir;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunPosition;
      uniform vec3 uDayColor;
      uniform vec3 uSunsetTint;
      uniform float uDensity;
      uniform float uRimPower;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewDir;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uSunPosition - vWorldPosition);

        // Angle between surface normal and incident sun illumination
        float cosSun = dot(N, L);

        // Grazing limb factor (Fresnel optical path through planetary shell)
        float VdotN = max(0.0, dot(V, N));
        float limbFactor = pow(1.0 - VdotN, uRimPower);

        // Rayleigh phase scattering function: P(theta) = 3/4 * (1 + cos^2(theta))
        float cosTheta = dot(V, L);
        float rayleighPhase = 0.75 * (1.0 + cosTheta * cosTheta);

        // Mie forward scattering peak towards the sun
        float g = 0.76;
        float miePhase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5) * 0.15;

        // Day illumination factor with smooth penumbra cutoff
        float dayFactor = smoothstep(-0.25, 0.45, cosSun);

        // Terminator sunset reddening: light passes through maximum airmass at twilight
        float sunsetFactor = smoothstep(0.40, -0.15, cosSun) * smoothstep(-0.35, 0.10, cosSun);
        vec3 scatterColor = mix(uDayColor, uSunsetTint, sunsetFactor * 1.6);

        // Composite atmospheric optical emission
        float intensity = (rayleighPhase + miePhase) * limbFactor * dayFactor * uDensity;

        // Additive sunset halo bleed across the twilight terminator
        intensity += sunsetFactor * pow(1.0 - VdotN, uRimPower * 0.8) * 0.65;

        if (intensity <= 0.002) {
          discard;
        }

        gl_FragColor = vec4(scatterColor * intensity, min(1.0, intensity * 1.2));
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(atmoGeo, atmoMat)
  mesh.name = 'atmospheric-scattering-shell'

  return {
    mesh,
    material: atmoMat,
    uniforms,
    updateSunPosition: (sunWorldPos) => {
      uniforms.uSunPosition.value.copy(sunWorldPos)
    },
    dispose: () => {
      atmoGeo.dispose()
      atmoMat.dispose()
    },
  }
}
