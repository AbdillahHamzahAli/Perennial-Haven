import * as THREE from 'three'
import type { HeightFn } from './terrain'

export interface GroundOptions {
  /** panjang sisi plane tanah (m) */
  size?: number
  /** jalan setapak lurus searah sumbu Z, berpusat di x = 0 */
  path?: { halfWidth: number; startZ: number; endZ: number }
  /** ketinggian tanah di (x, z); default datar */
  heightAt?: HeightFn
  /** jumlah ruas plane per sisi (resolusi bukit) */
  segments?: number
  /** radius (m) area berumput 3D: di dalamnya tanah gelap, di luarnya terang seperti ujung rumput */
  lawnRadius?: number
}

/**
 * Tanah berumput dengan variasi warna procedural (noise di shader, tanpa tekstur)
 * dan jalan setapak tanah menuju pintu toko.
 */
export class Ground extends THREE.Group {
  constructor(options: GroundOptions = {}) {
    super()
    const size = options.size ?? 400
    const path = options.path ?? { halfWidth: 0, startZ: 0, endZ: 0 }

    const material = new THREE.MeshLambertMaterial()
    const uniforms = {
      uGrassA: { value: new THREE.Color(0x5c9440) },
      uGrassB: { value: new THREE.Color(0x86b254) },
      uFarA: { value: new THREE.Color(0x6fa648) },
      uFarB: { value: new THREE.Color(0xa6c860) },
      uLawnRadius: { value: options.lawnRadius ?? 16 },
      uDirt: { value: new THREE.Color(0xb59a74) },
      uPath: { value: new THREE.Vector3(path.halfWidth, path.startZ, path.endZ) },
    }

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGroundXZ;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvGroundXZ = (modelMatrix * vec4(transformed, 1.0)).xz;',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${GROUND_PARS}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${GROUND_COLOR}`)
    }

    const segments = options.heightAt ? (options.segments ?? 256) : 1
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    if (options.heightAt) {
      const pos = geometry.attributes.position
      for (let i = 0; i < pos.count; i++) pos.setY(i, options.heightAt(pos.getX(i), pos.getZ(i)))
      geometry.computeVertexNormals()
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    this.add(mesh)
  }
}

const GROUND_PARS = /* glsl */ `
varying vec2 vGroundXZ;
uniform vec3 uGrassA;
uniform vec3 uGrassB;
uniform vec3 uFarA;
uniform vec3 uFarB;
uniform float uLawnRadius;
uniform vec3 uDirt;
uniform vec3 uPath; // (halfWidth, startZ, endZ)

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

const GROUND_COLOR = /* glsl */ `
{
  vec2 p = vGroundXZ;
  // dua skala noise: petak besar terang/gelap + bintik kecil
  float big = gNoise(p * 0.12) * 0.65 + gNoise(p * 0.4) * 0.35;
  float fine = gNoise(p * 3.0);
  vec3 grass = mix(uGrassA, uGrassB, big) * (0.9 + 0.2 * fine);
  // di luar area rumput 3D, tanah memakai warna ujung rumput supaya batasnya tidak terlihat
  vec3 farGrass = mix(uFarA, uFarB, big) * (0.95 + 0.1 * fine);
  grass = mix(grass, farGrass, smoothstep(uLawnRadius * 0.55, uLawnRadius * 1.25, length(p)));

  // jalan setapak: tepi bergelombang, memudar di ujung jauh
  float edge = (gNoise(p * 1.7) - 0.5) * 0.35;
  float across = 1.0 - smoothstep(uPath.x - 0.15, uPath.x + 0.15, abs(p.x) + edge);
  float along = step(uPath.y, p.y) * (1.0 - smoothstep(uPath.z - 3.0, uPath.z, p.y));
  float onPath = across * along;
  vec3 dirt = uDirt * (0.85 + 0.25 * fine);

  diffuseColor.rgb = mix(grass, dirt, onPath);
}
`
