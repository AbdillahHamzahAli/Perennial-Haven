export interface EnterOptions {
  /** true bila user memilih "Enter" biasa, false bila "enter without audio" */
  audio: boolean
}

/**
 * Halaman pembuka (overlay HTML di atas canvas).
 * Selama tampil, scroll halaman dikunci supaya animasi scene belum berjalan.
 * Tombol "Enter" (atau tombol Enter di keyboard) masuk dengan audio,
 * tombol "enter without audio" masuk tanpa audio.
 */
export class Landing {
  private root: HTMLElement
  private entered = false
  private onEnterFns: ((options: EnterOptions) => void)[] = []

  constructor(root: HTMLElement) {
    this.root = root
    // selalu mulai dari depan toko, jangan pulihkan posisi scroll lama
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.body.classList.add('is-locked')

    const button = root.querySelector<HTMLButtonElement>('[data-enter]')
    button?.addEventListener('click', () => this.enter({ audio: true }))
    root
      .querySelector<HTMLButtonElement>('[data-enter-muted]')
      ?.addEventListener('click', () => this.enter({ audio: false }))
    window.addEventListener('keydown', this.onKey)
    button?.focus({ preventScroll: true })
  }

  onEnter(fn: (options: EnterOptions) => void) {
    this.onEnterFns.push(fn)
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return
    // Enter pada tombol yang sedang fokus sudah memicu `click` tombol itu sendiri
    if (e.target instanceof HTMLButtonElement) return
    this.enter({ audio: true })
  }

  enter(options: EnterOptions) {
    if (this.entered) return
    this.entered = true
    window.removeEventListener('keydown', this.onKey)

    window.scrollTo(0, 0)
    document.body.classList.remove('is-locked')
    this.root.classList.add('is-hidden')
    this.root.setAttribute('aria-hidden', 'true')
    this.onEnterFns.forEach((fn) => fn(options))

    // hapus dari DOM setelah transisi fade selesai
    // (abaikan transitionend dari elemen anak yang ikut bubble ke sini)
    const remove = () => this.root.remove()
    this.root.addEventListener('transitionend', (e) => {
      if (e.target === this.root && e.propertyName === 'opacity') remove()
    })
    window.setTimeout(remove, 1800) // cadangan bila transisi dimatikan (reduced motion)
  }
}
