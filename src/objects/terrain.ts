import { clamp, smoothstep } from '../utils/math'

export type HeightFn = (x: number, z: number) => number

export interface TerrainOptions {
  /** area yang dijaga tetap datar (toko, jalan setapak, jalur kamera) */
  flat: { minX: number; maxX: number; minZ: number; maxZ: number }
  /** jarak (m) dari tepi area datar sampai bukit mencapai tinggi penuh */
  blend?: number
  /** pengali tinggi bukit */
  amplitude?: number
}

/**
 * Fungsi ketinggian bukit landai. Dipakai bersama oleh Ground (bentuk tanah)
 * dan Grass (tinggi pangkal helai) supaya keduanya selalu cocok.
 */
export function createTerrain(options: TerrainOptions): HeightFn {
  const { flat, blend = 16, amplitude = 1 } = options
  return (x, z) => {
    const dx = Math.max(flat.minX - x, x - flat.maxX, 0)
    const dz = Math.max(flat.minZ - z, z - flat.maxZ, 0)
    const dist = Math.hypot(dx, dz)
    const mask = smoothstep(clamp(dist / blend))

    const hills =
      2.2 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.05 - 0.4) +
      1.3 * Math.sin(x * 0.11 + z * 0.07 + 2.0) +
      0.6 * Math.sin(z * 0.19 - x * 0.13)
    // makin jauh makin tinggi → bukit menutupi garis horizon
    const far = 1 + 1.5 * smoothstep(clamp((dist - 20) / 90))
    return mask * (1.6 + hills) * far * amplitude
  }
}
