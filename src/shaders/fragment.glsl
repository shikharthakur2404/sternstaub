// ─────────────────────────────────────────────────────────────────────────────
// FRAGMENT SHADER — runs once per pixel inside each particle's quad, every frame
//
// Responsibilities:
//   1. Shape the particle into a soft circle (not a square)
//   2. Mix colors based on distance from the glowing core
//   3. Fade out edges smoothly so particles blend into space
// ─────────────────────────────────────────────────────────────────────────────

// Color uniforms — set by the palette selector in the control panel
uniform vec3 uColorPrimary;    // outer particle color (e.g. deep blue/violet)
uniform vec3 uColorSecondary;  // mid-range color (e.g. cyan/teal)
uniform vec3 uColorCore;       // center glow color (e.g. white/gold)

// Passed from vertex shader
varying float vDistanceFromCenter;

void main() {
  // ── Step 1: Figure out where we are inside this particle's square ──
  // gl_PointCoord goes from (0,0) top-left to (1,1) bottom-right.
  // We shift to center it: now (0,0) = center of the particle.
  vec2 uv = gl_PointCoord - 0.5;

  // Distance from the center of this individual particle (0 = center, 0.5 = edge)
  float distFromParticleCenter = length(uv);

  // ── Step 2: Discard pixels outside the circle ──
  // This is how you turn a square gl_Point into a round particle.
  if (distFromParticleCenter > 0.5) discard;

  // ── Step 3: Soft glow falloff within the circle ──
  // smoothstep(edge0, edge1, x) — returns 0 at edge0, 1 at edge1, smooth in between.
  // Inverted: bright at center (dist=0), fades to transparent at edges (dist=0.5).
  float alpha = smoothstep(0.5, 0.0, distFromParticleCenter);

  // ── Step 4: Color mixing based on global position ──
  // Particles close to the origin (vDistanceFromCenter is small) = core color
  // Mid range = secondary color, far out = primary color
  float t = clamp(vDistanceFromCenter / 3.0, 0.0, 1.0); // normalize 0–3 range to 0–1

  // First mix: core → secondary
  vec3 color = mix(uColorCore, uColorSecondary, smoothstep(0.0, 0.5, t));
  // Second mix: secondary → primary (outer edge)
  color = mix(color, uColorPrimary, smoothstep(0.5, 1.0, t));

  // ── Step 5: Output final color with transparency ──
  // Additive blending (set in React) means overlapping particles get brighter.
  gl_FragColor = vec4(color, alpha * 0.85);
}
