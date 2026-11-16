import * as THREE from 'three'
import type { Bouquet } from '../data/flowers'

/**
 * Bucket bunga procedural (placeholder).
 * Nanti ganti dengan GLTFLoader jika `bouquet.model` tersedia.
 */
export function createBouquet(bouquet: Bouquet): THREE.Group {
  const group = new THREE.Group()
  group.name = bouquet.id
  group.userData.bouquet = bouquet

  const wrap = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.4, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe8d9b5, side: THREE.DoubleSide }),
  )
  wrap.rotation.x = Math.PI
  wrap.position.y = 0.2
  group.add(wrap)

  const petalMat = new THREE.MeshStandardMaterial({ color: bouquet.color })
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f7d3a })
  const count = 7
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const r = i === 0 ? 0 : 0.1
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), petalMat)
    head.position.set(Math.cos(angle) * r, 0.5 + (i === 0 ? 0.05 : 0), Math.sin(angle) * r)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25), stemMat)
    stem.position.set(head.position.x, 0.38, head.position.z)
    group.add(head, stem)
  }
  group.traverse((o) => (o.castShadow = true))
  return group
}
