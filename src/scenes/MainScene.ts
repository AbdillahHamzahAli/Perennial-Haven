import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import type { Engine } from '../core/Engine'
import { CameraRig } from '../core/CameraRig'
import { LookControl } from '../core/LookControl'
import { ScrollProgress } from '../core/ScrollProgress'
import { Shop } from '../objects/Shop'
import { Shelf } from '../objects/Shelf'
import { segment, smoothstep } from '../utils/math'

/**
 * Scene utama: toko -> pintu terbuka -> kamera masuk -> katalog lemari.
 * Atur timing di `TIMELINE` dan posisi kamera di `keyframes`.
 */
const SKY = {
  sunElevation: 45, // derajat di atas horizon (siang)
  sunAzimuth: 30, // derajat, 0 = arah +Z (depan toko)
  exposure: 0.8,
  horizon: 0xdbe7f0, // warna kabut, disamakan dengan langit dekat horizon
}

const TIMELINE = {
  doorsOpen: [0.1, 0.35] as const, // rentang scroll untuk animasi pintu
}

export function createMainScene(engine: Engine) {
  const { scene, camera } = engine

  // langit siang cerah; arah matahari dipakai bersama oleh langit & DirectionalLight
  const sunDir = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - SKY.sunElevation),
    THREE.MathUtils.degToRad(SKY.sunAzimuth),
  )
  const sky = new Sky()
  sky.scale.setScalar(1000)
  const u = sky.material.uniforms
  u.turbidity.value = 2 // udara jernih
  u.rayleigh.value = 1.2 // biru langit
  u.mieCoefficient.value = 0.004
  u.mieDirectionalG.value = 0.8
  u.cloudCoverage.value = 0.3
  u.sunPosition.value.copy(sunDir)
  scene.add(sky)
  scene.background = null
  scene.fog = new THREE.Fog(SKY.horizon, 40, 150) // tepi tanah menyatu dengan horizon

  engine.renderer.toneMapping = THREE.ACESFilmicToneMapping
  engine.renderer.toneMappingExposure = SKY.exposure

  // cahaya
  scene.add(new THREE.HemisphereLight(0xdfeeff, 0xcdb89a, 1.3))
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6)
  sun.position.copy(sunDir).multiplyScalar(12)
  sun.castShadow = true
  scene.add(sun)

  // tanah
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
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

  // menoleh kiri/kanan & atas/bawah (drag / tombol panah), dibatasi ±10°
  const look = new LookControl(camera, engine.renderer.domElement)

  const scroll = new ScrollProgress()
  engine.onUpdate((delta, elapsed) => {
    scroll.update(delta)
    const p = scroll.value
    shop.setOpen(smoothstep(segment(p, ...TIMELINE.doorsOpen)))
    sky.material.uniforms.time.value = elapsed // awan bergerak pelan
    rig.update(p)
    look.apply(delta)
    // bucket sedikit bergoyang
    shelf.items.forEach((item, i) => (item.rotation.y = Math.sin(elapsed * 0.6 + i) * 0.15))
  })

  return { shop, shelf }
}
