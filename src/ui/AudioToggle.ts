/**
 * Musik latar + tombol toggle (kiri bawah).
 * Audio hanya boleh mulai setelah interaksi user (aturan autoplay browser),
 * jadi `start()` dipanggil dari klik tombol Enter di halaman pembuka.
 */
export class AudioToggle {
  private audio: HTMLAudioElement
  private button: HTMLButtonElement
  private volume: number
  /** status yang diinginkan user (tombol langsung berubah, volume menyusul lewat fade) */
  private on = false
  private fadeId = 0

  constructor(button: HTMLButtonElement, src: string, volume = 0.5) {
    this.button = button
    this.volume = volume
    this.audio = new Audio(src)
    this.audio.loop = true
    this.audio.preload = 'auto'
    this.audio.volume = 0
    button.addEventListener('click', () => (this.on ? this.pause() : this.play()))
    this.render()
  }

  /** tampilkan tombol; putar audio bila `play` true */
  start(play: boolean) {
    this.button.classList.add('is-visible')
    if (play) this.play()
  }

  play() {
    this.on = true
    this.render()
    this.audio.play().then(
      () => this.fadeTo(this.volume),
      () => {
        // diblokir browser / file gagal dimuat: kembalikan tombol ke "mati"
        this.on = false
        this.render()
      },
    )
  }

  pause() {
    this.on = false
    this.render()
    this.fadeTo(0, () => this.audio.pause())
  }

  /** naik/turunkan volume perlahan supaya tidak mengagetkan */
  private fadeTo(target: number, done?: () => void) {
    const id = ++this.fadeId
    const from = this.audio.volume
    const duration = 600
    const t0 = performance.now()
    const step = (now: number) => {
      if (id !== this.fadeId) return // fade lain sudah mengambil alih
      const t = Math.min(1, (now - t0) / duration)
      this.audio.volume = from + (target - from) * t
      if (t < 1) requestAnimationFrame(step)
      else done?.()
    }
    requestAnimationFrame(step)
  }

  private render() {
    this.button.classList.toggle('is-on', this.on)
    this.button.setAttribute('aria-pressed', String(this.on))
    this.button.setAttribute('aria-label', this.on ? 'Matikan audio' : 'Nyalakan audio')
  }
}
