// ─────────────────────────────────────────────────────────────────────────────
// ResonanceModel.js — 7-Planet Laplace Three-Body Resonant Chain
// Computes three-body Laplace angles Phi across the TRAPPIST-1 orbital chain
// (Luger et al. Nature Astronomy 2017), exposing the near-resonant dynamics.
// ─────────────────────────────────────────────────────────────────────────────

export const LAPLACE_TRIPLETS = [
  {
    id: 'bcd',
    label: 'Triplet b-c-d (8:5:3)',
    planets: ['trappist_1b', 'trappist_1c', 'trappist_1d'],
    p: 2,
    q: 3,
    formula: '2λ_b - 5λ_c + 3λ_d',
    centerDeg: 170.0,
  },
  {
    id: 'cde',
    label: 'Triplet c-d-e (5:3:2)',
    planets: ['trappist_1c', 'trappist_1d', 'trappist_1e'],
    p: 1,
    q: 2,
    formula: 'λ_c - 3λ_d + 2λ_e',
    centerDeg: 180.0,
  },
  {
    id: 'def',
    label: 'Triplet d-e-f (3:2:3)',
    planets: ['trappist_1d', 'trappist_1e', 'trappist_1f'],
    p: 2,
    q: 3,
    formula: '2λ_d - 5λ_e + 3λ_f',
    centerDeg: 170.0,
  },
  {
    id: 'efg',
    label: 'Triplet e-f-g (3:2:4)',
    planets: ['trappist_1e', 'trappist_1f', 'trappist_1g'],
    p: 1,
    q: 1,
    formula: 'λ_e - 2λ_f + λ_g',
    centerDeg: 180.0,
  },
  {
    id: 'fgh',
    label: 'Triplet f-g-h (4:3:2)',
    planets: ['trappist_1f', 'trappist_1g', 'trappist_1h'],
    p: 1,
    q: 1,
    formula: 'λ_f - 2λ_g + λ_h',
    centerDeg: 180.0,
  },
]

export class ResonanceModel {
  /**
   * Evaluates all 3-body Laplace resonance angles for the system.
   * @param {Map<string, object> | object} planetStates - Map of planetId -> state vector
   * @returns {Array<object>} Evaluated Laplace triplets with libration angles
   */
  evaluateLaplaceChain(planetStates) {
    const getLon = (id) => {
      const p = planetStates.get ? planetStates.get(id) : planetStates[id]
      return p ? p.trueLongitude : 0
    }

    return LAPLACE_TRIPLETS.map(triplet => {
      const [p1, p2, p3] = triplet.planets
      const l1 = getLon(p1)
      const l2 = getLon(p2)
      const l3 = getLon(p3)

      let phiRad = 0
      if (triplet.id === 'bcd') {
        phiRad = 2.0 * l1 - 5.0 * l2 + 3.0 * l3
      } else if (triplet.id === 'cde') {
        phiRad = 1.0 * l1 - 3.0 * l2 + 2.0 * l3
      } else if (triplet.id === 'def') {
        phiRad = 2.0 * l1 - 5.0 * l2 + 3.0 * l3
      } else if (triplet.id === 'efg') {
        phiRad = 1.0 * l1 - 2.0 * l2 + 1.0 * l3
      } else if (triplet.id === 'fgh') {
        phiRad = 1.0 * l1 - 2.0 * l2 + 1.0 * l3
      }

      // Normalize to [0, 360) degrees:
      let phiDeg = ((phiRad * 180.0) / Math.PI) % 360.0
      if (phiDeg < 0) phiDeg += 360.0

      // Libration offset from theoretical resonance equilibrium center:
      let librationOffset = phiDeg - triplet.centerDeg
      if (librationOffset > 180) librationOffset -= 360
      if (librationOffset < -180) librationOffset += 360

      const isLibrating = Math.abs(librationOffset) < 45.0

      return {
        ...triplet,
        phiDeg,
        librationOffset,
        isLibrating,
        status: isLibrating ? 'RESONANT LIBRATION' : 'CIRCULATION',
      }
    })
  }
}
