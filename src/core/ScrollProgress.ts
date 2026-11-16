import { clamp, lerp } from '../utils/math'

/** Progress scroll halaman (0..1) yang di-smooth supaya animasi terasa halus. */
export class ScrollProgress {
  /** nilai target mentah dari scroll */
  private target = 0
  /** nilai yang sudah di-smooth; pakai ini untuk animasi */
  value = 0

  private smoothing: number

  constructor(smoothing = 6) {
    this.smoothing = smoothing
    window.addEventListener('scroll', () => this.read(), { passive: true })
    this.read()
    this.value = this.target
  }

  private read() {
    const max = document.documentElement.scrollHeight - window.innerHeight
    this.target = max > 0 ? clamp(window.scrollY / max) : 0
  }

  update(delta: number) {
    this.value = lerp(this.value, this.target, 1 - Math.exp(-this.smoothing * delta))
  }
}
