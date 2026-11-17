import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import type { Engine } from '../core/Engine'
import { CameraRig } from '../core/CameraRig'
import { LookControl } from '../core/LookControl'
import { PostProcessing } from '../core/PostProcessing'
import { ScrollProgress } from '../core/ScrollProgress'
import { Shop } from '../objects/Shop'
import { Shelf } from '../objects/Shelf'
import { Ground } from '../objects/Ground'
import { Grass } from '../objects/Grass'
import { createTerrain } from '../objects/terrain'
import { segment, smoothstep } from '../utils/math'

/**
 * Scene utama: toko -> pintu terbuka -> kamera masuk -> katalog lemari.
 * Atur timing di `TIMELINE` dan posisi kamera di `keyframes`.
 */
const SKY = {
  sunElevation: 45, // derajat di atas horizon (siang)
  sunAzimuth: 30, // derajat, 0 = arah +Z (depan toko)
  exposure: 0.9,
  horizon: 0xcfe6ea, // warna kabut: biru-tosca muda seperti langit dekat horizon
  fogNear: 6,
  fogFar: 60,
}

/** nuansa akhir gambar (post-processing) */
const LOOK = {
  bloom: { strength: 0.012, radius: 0.5, threshold: 1 }, // langit sangat terang (HDR), jadi nilainya kecil
  tint: 0xdff6f2, // geser ke tosca
  tintAmount: 0.6,
  saturation: 1.12,
  contrast: 0.96,
  vignette: 0.28,
}

const TIMELINE = {
  doorsOpen: [0.1, 0.35] as const, // rentang scroll untuk animasi pintu
  grassHiddenAfter: 0.7, // kamera sudah di dalam toko → rumput tidak dirender
}

/**
 * Kamera "maju sedikit" saat tombol Enter di halaman pembuka diklik.
 * Satu-satunya animasi berbasis waktu: terjadi sekali sebelum scroll dibuka,
 * dan offset-nya habis (0) sebelum user mulai scroll, jadi tidak bentrok dengan timeline.
 */
const INTRO = {
  distance: 3, // meter mundur dari keyframe pertama selama halaman pembuka tampil
  lift: 0.4, // sedikit lebih tinggi
  duration: 2.2, // detik
}

/** jalan setapak dari depan halaman ke pintu toko */
const PATH = { halfWidth: 1, startZ: 3, endZ: 16 }

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
  scene.fog = new THREE.Fog(SKY.horizon, SKY.fogNear, SKY.fogFar) // bukit jauh memudar ke warna langit

  engine.renderer.toneMapping = THREE.ACESFilmicToneMapping
  engine.renderer.toneMappingExposure = SKY.exposure

  scene.add(new THREE.HemisphereLight(0xdfeeff, 0xcdb89a, 1.3))
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6)
  sun.position.copy(sunDir).multiplyScalar(12)
  sun.castShadow = true
  scene.add(sun)

  // matahari & toko diam; satu-satunya pemberi bayangan yang bergerak adalah pintu.
  // Shadow map cukup digambar ulang saat pintu berubah, bukan setiap frame.
  const shadowMap = engine.renderer.shadowMap
  shadowMap.autoUpdate = false
  shadowMap.needsUpdate = true

  const shop = new Shop()
  scene.add(shop)

  // bukit landai; area toko, jalan setapak, dan jalur kamera dijaga datar
  const heightAt = createTerrain({ flat: { minX: -7, maxX: 7, minZ: -7, maxZ: 22 } })

  const ground = new Ground({ size: 400, path: PATH, heightAt, lawnRadius: 20 })
  ground.position.y = -0.1
  scene.add(ground)

  // rumput 3D hanya di halaman yang terlihat kamera; sisanya cukup warna tanah + kabut
  const half = shop.width / 2 + 0.4
  const grass = new Grass({
    area: { minX: -22, maxX: 22, minZ: -20, maxZ: 13 },
    holes: [
      { minX: -half, maxX: half, minZ: -half, maxZ: half }, // bawah toko
      { minX: -PATH.halfWidth + 0.05, maxX: PATH.halfWidth - 0.05, minZ: PATH.startZ, maxZ: PATH.endZ }, // jalan
    ],
    count: 140000,
    edgeFade: 9,
    heightAt,
  })
  grass.position.y = -0.1
  scene.add(grass)

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

  const look = new LookControl(camera, engine.renderer.domElement)

  const post = new PostProcessing(engine.renderer, scene, camera, LOOK)
  engine.onResize((w, h) => post.setSize(w, h))
  engine.setRender(() => post.render())

  const scroll = new ScrollProgress()
  let doorOpen = -1
  // 0 = kamera masih mundur (halaman pembuka), 1 = sudah di keyframe pertama
  let intro = 0
  let introPlaying = false
  const forward = new THREE.Vector3()
  engine.onUpdate((delta, elapsed) => {
    scroll.update(delta)
    const p = scroll.value
    const door = smoothstep(segment(p, ...TIMELINE.doorsOpen))
    if (door !== doorOpen) {
      doorOpen = door
      shop.setOpen(door)
      shadowMap.needsUpdate = true
    }
    sky.material.uniforms.time.value = elapsed // awan bergerak pelan
    grass.visible = p < TIMELINE.grassHiddenAfter
    grass.update(elapsed)
    rig.update(p)
    if (introPlaying) intro = Math.min(1, intro + delta / INTRO.duration)
    if (intro < 1) {
      // ease-out kubik: cepat di awal, melambat halus saat sampai
      const back = Math.pow(1 - intro, 3)
      camera.getWorldDirection(forward)
      camera.position.addScaledVector(forward, -INTRO.distance * back)
      camera.position.y += INTRO.lift * back
    }
    look.apply(delta)
    shelf.items.forEach((item, i) => (item.rotation.y = Math.sin(elapsed * 0.6 + i) * 0.15))
  })

  /** jalankan animasi kamera maju (dipanggil saat user menekan Enter) */
  const enter = () => {
    introPlaying = true
  }

  return { shop, shelf, grass, enter }
}
