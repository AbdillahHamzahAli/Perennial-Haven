import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Gabungkan semua mesh statis di bawah `root` menjadi satu mesh per material
 * (dan per kombinasi castShadow/receiveShadow) → jauh lebih sedikit draw call.
 *
 * - Objek di `keep` (beserta anak-anaknya) tidak disentuh, mis. pintu yang beranimasi.
 * - Panggil SETELAH semua mesh diposisikan dan flag bayangan di-set.
 * - Mesh hasil gabungan memakai ruang lokal `root`, jadi `root` tetap bebas digeser.
 */
export function mergeStaticMeshes(root: THREE.Object3D, keep: THREE.Object3D[] = []) {
  root.updateMatrixWorld(true)
  const toRootSpace = root.matrixWorld.clone().invert()
  const m = new THREE.Matrix4()

  type Bucket = { material: THREE.Material; cast: boolean; receive: boolean; parts: THREE.BufferGeometry[] }
  const buckets = new Map<string, Bucket>()
  const merged: THREE.Mesh[] = []

  const visit = (o: THREE.Object3D) => {
    if (keep.includes(o)) return
    if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && !Array.isArray(o.material)) {
      const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}`
      let b = buckets.get(key)
      if (!b) buckets.set(key, (b = { material: o.material, cast: o.castShadow, receive: o.receiveShadow, parts: [] }))
      b.parts.push(o.geometry.clone().applyMatrix4(m.multiplyMatrices(toRootSpace, o.matrixWorld)))
      merged.push(o)
    }
    o.children.forEach(visit)
  }
  root.children.forEach(visit)

  merged.forEach((o) => o.removeFromParent())
  pruneEmptyGroups(root, keep)

  for (const b of buckets.values()) {
    const geometry = mergeGeometries(b.parts)
    b.parts.forEach((g) => g.dispose())
    if (!geometry) throw new Error('mergeStaticMeshes: atribut geometry tidak cocok')
    const mesh = new THREE.Mesh(geometry, b.material)
    mesh.castShadow = b.cast
    mesh.receiveShadow = b.receive
    root.add(mesh)
  }
}

function pruneEmptyGroups(o: THREE.Object3D, keep: THREE.Object3D[]) {
  for (const child of [...o.children]) {
    if (keep.includes(child)) continue
    pruneEmptyGroups(child, keep)
    if (child.children.length === 0 && !(child instanceof THREE.Mesh)) child.removeFromParent()
  }
}
