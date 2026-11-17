import * as THREE from 'three'
import { mergeStaticMeshes } from '../utils/mergeStatic'

/** Warna bangunan (sRGB). Diubah di sini untuk menggeser nuansa fasad. */
const COLORS = {
  wall: 0xf1e7d3, // dinding krem lantai bawah & panel atas
  frameGray: 0x6f7378, // rangka abu-abu lantai atas
  steel: 0x26282b, // kanopi & rangka jendela atas
  wood: 0xc9a373, // kolom kayu di kiri
  door: 0x5b3a2a, // pintu & jendela bawah (kayu gelap)
  floor: 0xb4907f, // paving depan
  glassDark: 0x24343a, // kaca bawah (tembus pandang)
  glassUpper: 0x93aab4,
  text: 0x6b4a3a,
}

/** Papan nama: tulisan serif dua baris di atas pintu. */
function createSignTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 192
  const g = c.getContext('2d')!
  g.fillStyle = '#' + COLORS.text.toString(16).padStart(6, '0')
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '600 66px Georgia, "Times New Roman", serif'
  g.letterSpacing = '8px'
  g.fillText('Perennial', 256, 62)
  g.fillText('Haven', 256, 132)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Bangunan toko 2 lantai: fasad krem, kanopi baja, pintu kaca ganda yang bisa dibuka (0..1). */
export class Shop extends THREE.Group {
  private leftDoor: THREE.Group
  private rightDoor: THREE.Group
  readonly width = 6
  readonly height = 3.2 // tinggi lantai bawah (ruang dalam)
  readonly depth = 6

  constructor() {
    super()
    const { width: w, height: h, depth: d } = this
    const upperH = 3

    const wall = new THREE.MeshStandardMaterial({ color: COLORS.wall })
    const gray = new THREE.MeshStandardMaterial({ color: COLORS.frameGray })
    const steel = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.4, roughness: 0.5 })
    const wood = new THREE.MeshStandardMaterial({ color: COLORS.wood })
    const doorMat = new THREE.MeshStandardMaterial({ color: COLORS.door })
    const glassLow = new THREE.MeshStandardMaterial({
      color: COLORS.glassDark,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
    })
    const glassUp = new THREE.MeshStandardMaterial({ color: COLORS.glassUpper, metalness: 0.3, roughness: 0.15 })

    /** kotak dari rentang koordinat (bukan dari pusat) */
    const box = (x0: number, x1: number, y0: number, y1: number, z: number, t: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, t), m)
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z)
      return mesh
    }

    // sampai tepi area tanpa rumput
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.8, 0.1, d + 0.8),
      new THREE.MeshStandardMaterial({ color: COLORS.floor }),
    )
    floorMesh.position.y = -0.05
    floorMesh.receiveShadow = true

    // dinding belakang & samping lantai bawah, plafon
    const back = box(-w / 2, w / 2, 0, h, -d / 2, 0.1, wall)
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, d), wall)
    left.position.set(-w / 2, h / 2, 0)
    const right = left.clone()
    right.position.x = w / 2
    const ceiling = box(-w / 2, w / 2, h - 0.05, h + 0.05, 0, d, wall)

    // dinding depan lantai bawah dengan bukaan: jendela kiri/kanan + pintu tengah
    const fz = d / 2 - 0.05
    const front = new THREE.Group()
    front.add(
      box(-w / 2, w / 2, 2.4, h, fz, 0.1, wall), // lintel (tempat papan nama)
      box(-w / 2, -2.5, 0, 2.4, fz, 0.1, wall),
      box(-1.1, -0.9, 0, 2.4, fz, 0.1, wall),
      box(0.9, 1.1, 0, 2.4, fz, 0.1, wall),
      box(2.5, w / 2, 0, 2.4, fz, 0.1, wall),
      box(-2.5, -1.1, 0, 0.7, fz, 0.1, wall), // dinding bawah jendela
      box(1.1, 2.5, 0, 0.7, fz, 0.1, wall),
    )

    /** panel kaca berbingkai: bingkai luar + sekat tengah */
    const glassPanel = (pw: number, ph: number, t: number, frame: THREE.Material, glass: THREE.Material, mullions = 1) => {
      const g = new THREE.Group()
      const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.02), glass)
      pane.userData.noShadow = true
      g.add(pane)
      g.add(
        box(-pw / 2, pw / 2, ph / 2 - t, ph / 2, 0, 0.07, frame),
        box(-pw / 2, pw / 2, -ph / 2, -ph / 2 + t, 0, 0.07, frame),
        box(-pw / 2, -pw / 2 + t, -ph / 2, ph / 2, 0, 0.07, frame),
        box(pw / 2 - t, pw / 2, -ph / 2, ph / 2, 0, 0.07, frame),
      )
      for (let i = 1; i <= mullions; i++) {
        const y = -ph / 2 + (ph * i) / (mullions + 1)
        g.add(box(-pw / 2, pw / 2, y - t / 2, y + t / 2, 0, 0.06, frame))
      }
      return g
    }

    for (const x of [-1.8, 1.8]) {
      const win = glassPanel(1.4, 1.7, 0.06, doorMat, glassLow, 2)
      win.position.set(x, 1.55, fz)
      front.add(win)
    }

    // pintu depan: dua daun, pivot di tepi luar supaya berayun ke luar
    const leafW = 0.9
    const leafH = 2.4
    const makeLeaf = (side: -1 | 1) => {
      const pivot = new THREE.Group()
      pivot.position.set(side * leafW, 0, fz)
      const leaf = glassPanel(leafW, leafH, 0.08, doorMat, glassLow, 2)
      leaf.position.set(-side * (leafW / 2), leafH / 2, 0)
      pivot.add(leaf)
      return pivot
    }
    this.leftDoor = makeLeaf(-1)
    this.rightDoor = makeLeaf(1)

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.64),
      new THREE.MeshBasicMaterial({ map: createSignTexture(), transparent: true, toneMapped: false }),
    )
    sign.position.set(0, 2.8, d / 2 + 0.01)
    sign.userData.noShadow = true

    const acMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f2 })
    for (const x of [-2.25, 2.25]) {
      const ac = box(x - 0.28, x + 0.28, 2.65, 3.0, d / 2 + 0.12, 0.24, acMat)
      front.add(ac)
    }

    const column = box(-w / 2, -w / 2 + 0.32, 0, h, d / 2 + 0.2, 0.3, wood)

    // kanopi baja gelap dengan rusuk di bawahnya
    const canopyDepth = 1.3
    const canopy = new THREE.Group()
    canopy.add(box(-w / 2 - 0.1, w / 2 + 0.1, h, h + 0.08, d / 2 + canopyDepth / 2, canopyDepth, steel))
    canopy.add(box(-w / 2 - 0.1, w / 2 + 0.1, h - 0.14, h, d / 2 + canopyDepth, 0.06, steel)) // balok depan
    for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.5) {
      canopy.add(box(x - 0.03, x + 0.03, h - 0.14, h, d / 2 + canopyDepth / 2, canopyDepth, steel))
    }

    // lantai atas: rangka abu-abu, panel krem, dua jendela besar
    const upper = box(-w / 2 - 0.05, w / 2 + 0.05, h + 0.1, h + 0.1 + upperH, 0, d, gray)
    const panelTop = h + 0.1 + upperH - 0.6
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(5.15, panelTop - (h + 0.3)), wall)
    panel.position.set(-0.3, (panelTop + h + 0.3) / 2, d / 2 + 0.005)
    const upperWins = new THREE.Group()
    for (const [x, ww] of [
      [-1.5, 1.5],
      [1.15, 1.4],
    ] as const) {
      const win = glassPanel(ww, 1.7, 0.1, steel, glassUp, 1)
      win.position.set(x, h + 1.95, d / 2 + 0.04)
      upperWins.add(win)
    }
    const cap = box(-w / 2 - 0.15, w / 2 + 0.15, h + 0.1 + upperH, h + 0.22 + upperH, 0, d + 0.2, steel)

    this.add(
      floorMesh,
      back,
      left,
      right,
      ceiling,
      front,
      this.leftDoor,
      this.rightDoor,
      sign,
      column,
      canopy,
      upper,
      panel,
      upperWins,
      cap,
    )
    this.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const glass = o.material === glassLow || o.material === glassUp
      o.castShadow = !(glass || o.userData.noShadow)
      o.receiveShadow = !o.userData.noShadow
    })

    // satu mesh per material; pintu tetap terpisah karena beranimasi
    mergeStaticMeshes(this, [this.leftDoor, this.rightDoor])
  }

  /** 0 = tertutup, 1 = terbuka penuh */
  setOpen(t: number) {
    const angle = t * (Math.PI * 0.55)
    this.leftDoor.rotation.y = -angle
    this.rightDoor.rotation.y = angle
  }
}
