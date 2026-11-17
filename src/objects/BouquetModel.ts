import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Bouquet } from '../data/flowers'

/**
 * Geometry & material yang dipakai bersama oleh semua bucket.
 * Bentuknya identik, jadi cukup di-upload ke GPU sekali; hanya warna kelopak yang berbeda.
 * 7 kepala bunga digabung jadi 1 geometry, 7 tangkai juga → 3 draw call per bucket.
 */
let shared: {
  wrap: THREE.BufferGeometry
  heads: THREE.BufferGeometry
  stems: THREE.BufferGeometry
  wrapMat: THREE.Material
  stemMat: THREE.Material
} | null = null
const petalMats = new Map<number, THREE.MeshStandardMaterial>()

function getShared() {
  if (shared) return shared

  const wrap = new THREE.ConeGeometry(0.18, 0.4, 16, 1, true)
  wrap.rotateX(Math.PI)
  wrap.translate(0, 0.2, 0)

  const heads: THREE.BufferGeometry[] = []
  const stems: THREE.BufferGeometry[] = []
  const count = 7
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const r = i === 0 ? 0 : 0.1
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    heads.push(new THREE.SphereGeometry(0.07, 12, 12).translate(x, 0.5 + (i === 0 ? 0.05 : 0), z))
    stems.push(new THREE.CylinderGeometry(0.008, 0.008, 0.25).translate(x, 0.38, z))
  }

  shared = {
    wrap,
    heads: mergeGeometries(heads)!,
    stems: mergeGeometries(stems)!,
    wrapMat: new THREE.MeshStandardMaterial({ color: 0xe8d9b5, side: THREE.DoubleSide }),
    stemMat: new THREE.MeshStandardMaterial({ color: 0x3f7d3a }),
  }
  heads.forEach((g) => g.dispose())
  stems.forEach((g) => g.dispose())
  return shared
}

function getPetalMaterial(color: number) {
  let mat = petalMats.get(color)
  if (!mat) petalMats.set(color, (mat = new THREE.MeshStandardMaterial({ color })))
  return mat
}

/**
 * Bucket bunga procedural (placeholder).
 * Nanti ganti dengan GLTFLoader jika `bouquet.model` tersedia.
 *
 * Tidak memberi bayangan: bucket berada di dalam toko yang tidak terkena sinar matahari,
 * dan shadow map hanya diperbarui saat pintu bergerak (lihat MainScene).
 */
export function createBouquet(bouquet: Bouquet): THREE.Group {
  const s = getShared()
  const group = new THREE.Group()
  group.name = bouquet.id
  group.userData.bouquet = bouquet
  group.add(
    new THREE.Mesh(s.wrap, s.wrapMat),
    new THREE.Mesh(s.heads, getPetalMaterial(bouquet.color)),
    new THREE.Mesh(s.stems, s.stemMat),
  )
  return group
}
