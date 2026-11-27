// Deterministic randomness: mulberry32, so a seed always grows the same run.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, lo, hi) { return lo + rng() * (hi - lo); }
export function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
