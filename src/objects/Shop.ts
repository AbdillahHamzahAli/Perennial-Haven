import * as THREE from 'three'

/** Bangunan toko: dinding, lantai, atap, dan dua pintu yang bisa dibuka (0..1). */
export class Shop extends THREE.Group {
  private leftDoor: THREE.Group
  private rightDoor: THREE.Group
  readonly width = 6
  readonly height = 3.5
  readonly depth = 6

  constructor() {
    super()
    const wall = new THREE.MeshStandardMaterial({ color: 0xf2d7d9 })
    const floor = new THREE.MeshStandardMaterial({ color: 0xc9b79c })
    const { width: w, height: h, depth: d } = this

    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), floor)
    floorMesh.position.y = -0.05
    floorMesh.receiveShadow = true

    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), wall)
    back.position.set(0, h / 2, -d / 2)
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, d), wall)
    left.position.set(-w / 2, h / 2, 0)
    const right = left.clone()
    right.position.x = w / 2
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.4, 0.15, d + 0.4),
      new THREE.MeshStandardMaterial({ color: 0x7b4b3a }),
    )
    roof.position.y = h + 0.07

    // pintu depan, pivot di tepi luar supaya berayun ke luar
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x4e8b6a })
    const doorGeo = new THREE.BoxGeometry(w / 2, h, 0.08)
    this.leftDoor = new THREE.Group()
    this.leftDoor.position.set(-w / 2, 0, d / 2)
    const l = new THREE.Mesh(doorGeo, doorMat)
    l.position.set(w / 4, h / 2, 0)
    this.leftDoor.add(l)

    this.rightDoor = new THREE.Group()
    this.rightDoor.position.set(w / 2, 0, d / 2)
    const r = new THREE.Mesh(doorGeo, doorMat)
    r.position.set(-w / 4, h / 2, 0)
    this.rightDoor.add(r)

    this.add(floorMesh, back, left, right, roof, this.leftDoor, this.rightDoor)
    this.traverse((o) => (o.castShadow = true))
  }

  /** 0 = tertutup, 1 = terbuka penuh */
  setOpen(t: number) {
    const angle = t * (Math.PI * 0.55)
    this.leftDoor.rotation.y = -angle
    this.rightDoor.rotation.y = angle
  }
}
