import './style.css'
import { Engine } from './core/Engine'
import { createMainScene } from './scenes/MainScene'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
// MainScene memakai PostProcessing (render target MSAA 4×), jadi canvas tidak perlu antialias
const engine = new Engine(canvas, { antialias: false })
createMainScene(engine)
engine.start()
