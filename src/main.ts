import './style.css'
import { Engine } from './core/Engine'
import { createMainScene } from './scenes/MainScene'
import { Landing } from './ui/Landing'
import { AudioToggle } from './ui/AudioToggle'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
// MainScene memakai PostProcessing (render target MSAA 4×), jadi canvas tidak perlu antialias
const engine = new Engine(canvas, { antialias: false })
const main = createMainScene(engine)
engine.start()

// halaman pembuka; scene sudah dirender di belakangnya agar siap saat Enter diklik
const landing = new Landing(document.querySelector<HTMLElement>('#landing')!)
landing.onEnter(() => main.enter()) // kamera maju sedikit sambil halaman pembuka memudar

// musik latar; mulai dari klik Enter (gesture user) supaya tidak diblokir autoplay
const audio = new AudioToggle(document.querySelector<HTMLButtonElement>('#audio-toggle')!, '/audio.webm')
landing.onEnter(({ audio: withAudio }) => audio.start(withAudio))
