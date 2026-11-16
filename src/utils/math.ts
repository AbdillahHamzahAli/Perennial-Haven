export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Ubah progress global (0..1) menjadi progress lokal (0..1) untuk rentang [start, end]. */
export const segment = (progress: number, start: number, end: number) =>
  clamp((progress - start) / (end - start))
