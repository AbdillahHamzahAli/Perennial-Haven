import * as THREE from 'three'
import { smoothstep } from '../utils/math'

export interface CameraKeyframe {
  /** posisi progress scroll (0..1) */
  at: number
  position: THREE.Vector3Like
  lookAt: THREE.Vector3Like
}

/** Menggerakkan kamera melewati keyframe berdasarkan progress scroll. */
export class CameraRig {
  private pos = new THREE.Vector3()
  private look = new THREE.Vector3()
  private a = new THREE.Vector3()
  private b = new THREE.Vector3()

  private camera: THREE.PerspectiveCamera
  private frames: CameraKeyframe[]

  constructor(camera: THREE.PerspectiveCamera, frames: CameraKeyframe[]) {
    this.camera = camera
    this.frames = frames
    this.frames.sort((x, y) => x.at - y.at)
  }

  update(progress: number) {
    const f = this.frames
    let i = f.findIndex((k) => k.at > progress) - 1
    if (i < 0) i = progress >= f[f.length - 1].at ? f.length - 2 : 0
    const from = f[i]
    const to = f[i + 1]
    const t = smoothstep(Math.min(1, Math.max(0, (progress - from.at) / (to.at - from.at))))

    this.pos.copy(this.a.copy(from.position as THREE.Vector3).lerp(this.b.copy(to.position as THREE.Vector3), t))
    this.look.copy(this.a.copy(from.lookAt as THREE.Vector3).lerp(this.b.copy(to.lookAt as THREE.Vector3), t))
    this.camera.position.copy(this.pos)
    this.camera.lookAt(this.look)
  }
}
