import * as THREE from 'three'
import { clamp, createRandom } from '../utils/math'
import type { HeightFn } from './terrain'

export interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface GrassOptions {
  /** area tanam rumput (koordinat dunia, bidang XZ) */
  area: Rect
  /** area yang dikosongkan, mis. bawah toko & jalan setapak */
  holes?: Rect[]
  /** jumlah helai maksimum (satu draw call berapa pun jumlahnya) */
  count?: number
  /** lebar zona tepi (m) tempat rumput makin jarang & pendek */
  edgeFade?: number
  /** tinggi helai min/max (m) */
  height?: [number, number]
  /** lebar pangkal helai min/max (m) */
  width?: [number, number]
  /** ketinggian tanah di (x, z) supaya helai menempel di bukit; default datar */
  heightAt?: HeightFn
  seed?: number
}

/** Palet rumput (sRGB). Diubah di sini untuk menggeser nuansa padang. */
const COLORS = {
  base: 0x2f6a35, // pangkal: sedikit lebih gelap, tidak kontras
  mid: 0x4f9442,
  tipA: 0x86bd58, // ujung hijau muda
  tipB: 0xa3c862, // ujung kekuningan lembut (petak-petak)
  tipC: 0x7bb862, // ujung kebiruan lembut (petak-petak)
}

/**
 * Rumput 3D ringan:
 * - semua helai = satu InstancedMesh (1 draw call)
 * - satu helai = 7 titik / 5 segitiga, melengkung
 * - warna & angin dihitung di shader (CPU tidak menyentuh helai per frame)
 * - tidak memberi bayangan (castShadow = false)
 */
export class Grass extends THREE.Group {
  private uniforms = {
    uTime: { value: 0 },
    uBase: { value: new THREE.Color(COLORS.base) },
    uMid: { value: new THREE.Color(COLORS.mid) },
    uTipA: { value: new THREE.Color(COLORS.tipA) },
    uTipB: { value: new THREE.Color(COLORS.tipB) },
    uTipC: { value: new THREE.Color(COLORS.tipC) },
  }

  constructor(options: GrassOptions) {
    super()
    const {
      area,
      holes = [],
      count = 120000,
      edgeFade = 6,
      height = [0.2, 0.38],
      width = [0.035, 0.055],
      heightAt = () => 0,
      seed = 7,
    } = options
    const rand = createRandom(seed)

    const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide })
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
        .replace('#include <project_vertex>', VERTEX_PROJECT)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT_COLOR}`)
        // normal selalu menghadap atas (tidak dibalik di sisi belakang) → padang tersinari rata, tanpa helai hitam
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize( vNormal );')
    }

    const mesh = new THREE.InstancedMesh(createBladeGeometry(), material, count)
    mesh.castShadow = false
    mesh.receiveShadow = true

    const inHole = (x: number, z: number) =>
      holes.some((h) => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ)
    // 1 di tengah area, turun ke 0 di tepi
    const density = (x: number, z: number) => {
      const d = Math.min(x - area.minX, area.maxX - x, z - area.minZ, area.maxZ - z)
      return clamp(d / edgeFade)
    }

    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    let placed = 0
    for (let tries = 0; placed < count && tries < count * 4; tries++) {
      const x = THREE.MathUtils.lerp(area.minX, area.maxX, rand())
      const z = THREE.MathUtils.lerp(area.minZ, area.maxZ, rand())
      const d = density(x, z)
      if (inHole(x, z) || rand() > d * 0.7 + 0.3 * d * d) continue

      // makin ke tepi makin pendek → transisi halus ke tanah datar
      const h = THREE.MathUtils.lerp(height[0], height[1], rand()) * (0.35 + 0.65 * d)
      dummy.position.set(x, heightAt(x, z), z)
      dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25)
      dummy.scale.set(THREE.MathUtils.lerp(width[0], width[1], rand()), h, h)
      dummy.updateMatrix()
      mesh.setMatrixAt(placed, dummy.matrix)

      // variasi kecil per helai di sekitar putih (warna utama dari shader)
      const v = 0.93 + rand() * 0.14
      tint.setRGB(v * (0.98 + rand() * 0.04), v, v * (0.97 + rand() * 0.06))
      mesh.setColorAt(placed, tint)
      placed++
    }
    mesh.count = placed
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()

    this.add(mesh)
  }

  /** Waktu untuk animasi angin (detik). */
  update(elapsed: number) {
    this.uniforms.uTime.value = elapsed
  }
}

/**
 * Helai satuan (lebar 1, tinggi 1): 3 ruas + ujung runcing, melengkung ke +Z.
 * Lengkungan ikut skala tinggi (scale.z = tinggi) supaya proporsinya tetap.
 */
function createBladeGeometry() {
  const rows = [
    // [y, setengah lebar, lengkung z]
    [0.0, 0.5, 0.0],
    [0.35, 0.42, 0.04],
    [0.7, 0.26, 0.13],
  ]
  const pos: number[] = []
  for (const [y, hw, z] of rows) pos.push(-hw, y, z, hw, y, z)
  pos.push(0, 1, 0.3)

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(7).fill([0, 1, 0]).flat(), 3))
  // prettier-ignore
  g.setIndex([
    0, 1, 2,  2, 1, 3,
    2, 3, 4,  4, 3, 5,
    4, 5, 6,
  ])
  return g
}

const NOISE = /* glsl */ `
float gHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float gNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x),
             mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`

const VERTEX_PARS = /* glsl */ `
uniform float uTime;
varying float vHeight; // 0 pangkal .. 1 ujung
varying float vWind;   // 0..1, kuat hembusan di helai ini
varying vec2 vRoot;    // posisi pangkal di dunia (xz)
${NOISE}
`

/** Pengganti <project_vertex>: hembusan angin = gelombang noise yang bergerak menyapu padang. */
const VERTEX_PROJECT = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  vec2 root = instanceMatrix[3].xz;
#else
  vec2 root = vec2( 0.0 );
#endif
vec2 windDir = normalize( vec2( 0.8, -0.6 ) );
// gelombang besar yang bergerak + getaran kecil per helai
float wave = gNoise( root * 0.12 - windDir * uTime * 0.35 );
float flutter = sin( uTime * 3.1 + root.x * 1.7 + root.y * 1.3 ) * 0.5 + 0.5;
float gust = wave * 0.85 + flutter * 0.15;
float bend = position.y * position.y;
mvPosition.xz += windDir * ( gust * 0.35 + 0.05 ) * bend * 0.6;
mvPosition.y -= gust * bend * 0.08; // helai yang tertekuk jadi sedikit lebih rendah

vHeight = position.y;
vWind = wave;
vRoot = root;

mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`

const FRAGMENT_PARS = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uMid;
uniform vec3 uTipA;
uniform vec3 uTipB;
uniform vec3 uTipC;
varying float vHeight;
varying float vWind;
varying vec2 vRoot;
${NOISE}
`

const FRAGMENT_COLOR = /* glsl */ `
{
  // petak warna besar di ujung helai: hijau muda / kekuningan / kebiruan
  float pA = gNoise( vRoot * 0.07 + 13.0 );
  float pB = gNoise( vRoot * 0.11 - 7.0 );
  vec3 tip = mix( uTipA, uTipB, smoothstep( 0.2, 0.95, pA ) * 0.6 );
  tip = mix( tip, uTipC, smoothstep( 0.2, 1.0, pB ) * 0.6 );

  // warna rata (tanpa gradasi sepanjang helai); hanya berubah lembut antar petak padang
  vec3 col = mix( uMid, tip, 0.5 );

  diffuseColor.rgb *= col; // diffuseColor sudah membawa variasi per helai (instanceColor)
}
`
