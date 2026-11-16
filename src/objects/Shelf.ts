import * as THREE from 'three'
import { bouquets } from '../data/flowers'
import { createBouquet } from './BouquetModel'

export interface ShelfOptions {
  columns: number
  cellWidth: number
  cellHeight: number
  depth: number
}

/** Lemari grid berisi bucket bunga. Origin di tengah-bawah lemari. */
export class Shelf extends THREE.Group {
  readonly items: THREE.Group[] = []

  constructor(opts: ShelfOptions = { columns: 3, cellWidth: 1, cellHeight: 0.9, depth: 0.5 }) {
    super()
    const { columns, cellWidth, cellHeight, depth } = opts
    const rows = Math.ceil(bouquets.length / columns)
    const width = columns * cellWidth
    const height = rows * cellHeight
    const wood = new THREE.MeshStandardMaterial({ color: 0x8d6e4c })

    // papan horizontal (rows + 1) dan sekat vertikal (columns + 1)
    for (let r = 0; r <= rows; r++) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.05, depth), wood)
      board.position.y = r * cellHeight
      board.receiveShadow = true
      this.add(board)
    }
    for (let c = 0; c <= columns; c++) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, depth), wood)
      side.position.set(-width / 2 + c * cellWidth, height / 2, 0)
      this.add(side)
    }

    bouquets.forEach((data, i) => {
      const col = i % columns
      const row = Math.floor(i / columns)
      const item = createBouquet(data)
      item.position.set(
        -width / 2 + (col + 0.5) * cellWidth,
        (rows - 1 - row) * cellHeight + 0.03, // baris pertama di atas
        0,
      )
      this.items.push(item)
      this.add(item)
    })
  }
}
