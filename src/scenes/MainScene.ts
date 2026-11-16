import * as THREE from 'three'
import type { Engine } from '../core/Engine'
import { CameraRig } from '../core/CameraRig'
import { ScrollProgress } from '../core/ScrollProgress'
import { Shop } from '../objects/Shop'
import { Shelf } from '../objects/Shelf'
import { segment, smoothstep } from '../utils/math'

/**
 * Scene utama: toko -> pintu terbuka -> kamera masuk -> katalog lemari.
 * Atur timing di `TIMELINE` dan posisi kamera di `keyframes`.
 */
const TIMELINE = {
  doorsOpen: [0.1, 0.35] as const, // rentang scroll untuk animasi pintu
}

export function createMainScene(engine: Engine) {
  const { scene, camera } = engine

  // cahaya
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdb89a, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 2)
  sun.position.set(4, 8, 8)
  sun.castShadow = true
  scene.add(sun)

  // tanah
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0xa8c49a }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.1
  ground.receiveShadow = true
  scene.add(ground)

  const shop = new Shop()
  scene.add(shop)

  const shelf = new Shelf()
  shelf.position.set(0, 0, -shop.depth / 2 + 0.4)
  scene.add(shelf)

  // kamera: depan toko -> pintu -> dalam toko -> dekat lemari
  const rig = new CameraRig(camera, [
    { at: 0.0, position: { x: 0, y: 2.5, z: 14 }, lookAt: { x: 0, y: 1.8, z: 0 } },
    { at: 0.35, position: { x: 0, y: 2, z: 9 }, lookAt: { x: 0, y: 1.6, z: 0 } },
    { at: 0.65, position: { x: 0, y: 1.8, z: 2.5 }, lookAt: { x: 0, y: 1.6, z: -2.5 } },
    { at: 1.0, position: { x: 0, y: 1.4, z: -0.6 }, lookAt: { x: 0, y: 1.3, z: -2.6 } },
  ])

  const scroll = new ScrollProgress()
  engine.onUpdate((delta, elapsed) => {
    scroll.update(delta)
    const p = scroll.value
    shop.setOpen(smoothstep(segment(p, ...TIMELINE.doorsOpen)))
    rig.update(p)
    // bucket sedikit bergoyang
    shelf.items.forEach((item, i) => (item.rotation.y = Math.sin(elapsed * 0.6 + i) * 0.15))
  })

  return { shop, shelf }
}
