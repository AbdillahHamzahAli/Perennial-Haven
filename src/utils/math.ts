export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Ubah progress global (0..1) menjadi progress lokal (0..1) untuk rentang [start, end]. */
export const segment = (progress: number, start: number, end: number) =>
  clamp((progress - start) / (end - start))

/** RNG deterministik (mulberry32): hasil acak selalu sama untuk seed yang sama. */
export const createRandom = (seed = 1) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
