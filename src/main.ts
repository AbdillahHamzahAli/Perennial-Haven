import './style.css'
import { Engine } from './core/Engine'
import { createMainScene } from './scenes/MainScene'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const engine = new Engine(canvas)
createMainScene(engine)
engine.start()
