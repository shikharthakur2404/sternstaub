// ─────────────────────────────────────────────────────────────────────────────
// VERTEX SHADER — runs once per particle, every frame
//
// Responsibilities:
//   1. Animate each particle outward from center (dispersion)
//   2. Add a slow organic drift so nothing feels static
//   3. Scale particles based on distance from center (closer = brighter/bigger)
// ─────────────────────────────────────────────────────────────────────────────

// These come in from React Three Fiber uniforms (updated every frame)
uniform float uTime;           // seconds since app started
uniform float uDispersion;     // 0–1 slider: how spread out particles are
uniform float uDriftSpeed;     // 0–2 slider: how fast particles drift

// These come in per-particle from the BufferGeometry attributes
attribute float aScale;        // each particle gets a random base size
attribute vec3  aOffset;       // each particle's unique drift direction

// Passed to the fragment shader so it can fade edges
varying float vDistanceFromCenter;

void main() {
  // ── Step 1: Start from the particle's original position ──
  vec3 pos = position;

  // ── Step 2: Apply dispersion — push particles away from origin ──
  // aOffset is a normalized random direction vector per particle.
  // uDispersion controls how far they travel.
  pos += aOffset * uDispersion * 2.0;

  // ── Step 3: Add slow organic drift using sin/cos waves ──
  // Each particle drifts at a slightly different rate (aOffset.x as seed).
  float driftTime = uTime * uDriftSpeed * 0.3;
  pos.x += sin(driftTime + aOffset.x * 6.28) * 0.15;
  pos.y += cos(driftTime + aOffset.y * 6.28) * 0.15;
  pos.z += sin(driftTime + aOffset.z * 6.28) * 0.10;

  // ── Step 4: Calculate distance from center for glow falloff ──
  vDistanceFromCenter = length(pos);

  // ── Step 5: Standard Three.js projection ──
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Particles further away appear smaller (perspective scaling)
  float perspectiveScale = 80.0 / -mvPosition.z;
  gl_PointSize = aScale * perspectiveScale * (1.0 - uDispersion * 0.3);

  gl_Position = projectionMatrix * mvPosition;
}
