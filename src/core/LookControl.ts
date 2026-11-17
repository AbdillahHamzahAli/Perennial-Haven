import * as THREE from 'three'
import { clamp, lerp } from '../utils/math'

export interface LookControlOptions {
  /** batas menoleh kiri/kanan ke tiap sisi (radian). Default 5°. */
  maxYaw?: number
  /** batas mendongak/menunduk ke tiap sisi (radian). Default 5°. */
  maxPitch?: number
  /** radian per piksel saat drag (layar sentuh) */
  dragSensitivity?: number
  /** radian per detik saat tombol panah ditahan */
  keySpeed?: number
  /** kecepatan smoothing (semakin besar semakin cepat mengejar target) */
  smoothing?: number
}

/**
 * Menoleh kiri/kanan (yaw) dan atas/bawah (pitch) di atas orientasi kamera dari CameraRig.
 * Input:
 * - mouse: pandangan mengikuti posisi kursor (tanpa klik); tengah layar = lurus,
 *   tepi layar = batas maksimum. Kursor keluar jendela → kembali ke tengah.
 * - layar sentuh: geser jari horizontal.
 * - tombol panah.
 * Panggil `apply()` SETELAH `CameraRig.update()` setiap frame.
 */
export class LookControl {
  private yaw = 0
  private pitch = 0
  private targetYaw = 0
  private targetPitch = 0
  private dragging = false
  private lastX = 0
  private lastY = 0
  private keys = new Set<string>()
  private q = new THREE.Quaternion()
  private static readonly UP = new THREE.Vector3(0, 1, 0)
  private static readonly RIGHT = new THREE.Vector3(1, 0, 0)

  private camera: THREE.Camera
  private maxYaw: number
  private maxPitch: number
  private dragSensitivity: number
  private keySpeed: number
  private smoothing: number

  constructor(camera: THREE.Camera, element: HTMLElement, options: LookControlOptions = {}) {
    this.camera = camera
    this.maxYaw = options.maxYaw ?? THREE.MathUtils.degToRad(5)
    this.maxPitch = options.maxPitch ?? THREE.MathUtils.degToRad(5)
    this.dragSensitivity = options.dragSensitivity ?? 0.001
    this.keySpeed = options.keySpeed ?? 0.3
    this.smoothing = options.smoothing ?? 8

    // sentuhan vertikal tetap men-scroll halaman, horizontal dipakai untuk menoleh
    element.style.touchAction = 'pan-y'

    // didengar di window supaya tetap jalan di atas elemen lain
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      const nx = (e.clientX / window.innerWidth) * 2 - 1 // -1 kiri .. 1 kanan
      const ny = (e.clientY / window.innerHeight) * 2 - 1 // -1 atas .. 1 bawah
      // kursor ke kanan → menoleh ke kanan, kursor ke atas → mendongak
      this.setTarget(-nx * this.maxYaw, -ny * this.maxPitch)
    })
    document.documentElement.addEventListener('mouseleave', () => this.setTarget(0, 0))

    // layar sentuh: gaya "menggenggam"
    element.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return
      this.dragging = true
      this.lastX = e.clientX
      this.lastY = e.clientY
    })
    element.addEventListener('pointermove', (e) => {
      if (!this.dragging || e.pointerType === 'mouse') return
      this.setTarget(
        this.targetYaw + (e.clientX - this.lastX) * this.dragSensitivity,
        this.targetPitch + (e.clientY - this.lastY) * this.dragSensitivity,
      )
      this.lastX = e.clientX
      this.lastY = e.clientY
    })
    const stop = () => (this.dragging = false)
    element.addEventListener('pointerup', stop)
    element.addEventListener('pointercancel', stop)

    const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    window.addEventListener('keydown', (e) => {
      if (!ARROWS.includes(e.key)) return
      e.preventDefault() // panah atas/bawah tidak men-scroll halaman
      this.keys.add(e.key)
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.key))
    window.addEventListener('blur', () => this.keys.clear())
  }

  private setTarget(yaw: number, pitch: number) {
    this.targetYaw = clamp(yaw, -this.maxYaw, this.maxYaw)
    this.targetPitch = clamp(pitch, -this.maxPitch, this.maxPitch)
  }

  /** Terapkan yaw (sumbu Y dunia) dan pitch (sumbu X lokal kamera). */
  apply(delta: number) {
    const k = this.keys
    const dx = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
    const dy = (k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0)
    if (dx || dy) {
      const step = this.keySpeed * delta
      this.setTarget(this.targetYaw + dx * step, this.targetPitch + dy * step)
    }

    const t = 1 - Math.exp(-this.smoothing * delta)
    this.yaw = lerp(this.yaw, this.targetYaw, t)
    this.pitch = lerp(this.pitch, this.targetPitch, t)

    // pitch di ruang lokal kamera dulu, lalu yaw di ruang dunia → horizon tidak miring
    this.camera.quaternion.multiply(this.q.setFromAxisAngle(LookControl.RIGHT, this.pitch))
    this.camera.quaternion.premultiply(this.q.setFromAxisAngle(LookControl.UP, this.yaw))
  }
}
