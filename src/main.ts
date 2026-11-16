import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.z = 3

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x44aa88 })
)
scene.add(cube)

const light = new THREE.DirectionalLight(0xffffff, 2)
light.position.set(2, 3, 4)
scene.add(light)
scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const clock = new THREE.Clock()
function animate() {
  const t = clock.getElapsedTime()
  cube.rotation.x = t * 0.5
  cube.rotation.y = t * 0.8
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()
