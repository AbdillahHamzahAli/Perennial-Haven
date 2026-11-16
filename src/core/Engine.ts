import * as THREE from 'three'

type UpdateFn = (delta: number, elapsed: number) => void

/** Membungkus renderer, scene, camera, resize, dan render loop. */
export class Engine {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200)
  readonly renderer: THREE.WebGLRenderer
  private clock = new THREE.Clock()
  private updaters: UpdateFn[] = []
  private resizers: ((width: number, height: number) => void)[] = []
  private renderFn: (() => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.scene.background = new THREE.Color(0xf4ece1)
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  onUpdate(fn: UpdateFn) {
    this.updaters.push(fn)
  }

  /** Dipanggil setiap ukuran jendela berubah (mis. untuk render target post-processing). */
  onResize(fn: (width: number, height: number) => void) {
    this.resizers.push(fn)
  }

  /** Ganti cara menggambar frame (mis. lewat EffectComposer). `null` = render langsung. */
  setRender(fn: (() => void) | null) {
    this.renderFn = fn
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta()
      const elapsed = this.clock.elapsedTime
      this.updaters.forEach((fn) => fn(delta, elapsed))
      if (this.renderFn) this.renderFn()
      else this.renderer.render(this.scene, this.camera)
    })
  }

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.resizers.forEach((fn) => fn(window.innerWidth, window.innerHeight))
  }
}
