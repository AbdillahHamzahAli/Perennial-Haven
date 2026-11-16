export interface Bouquet {
  id: string
  name: string
  price: number
  /** warna bunga (hex) – dipakai oleh bucket procedural */
  color: number
  /** opsional: path model GLB di /public/models */
  model?: string
}

export const bouquets: Bouquet[] = [
  { id: 'rose-red', name: 'Red Rose', price: 150_000, color: 0xd62839 },
  { id: 'tulip-pink', name: 'Pink Tulip', price: 120_000, color: 0xf48fb1 },
  { id: 'sunflower', name: 'Sunflower', price: 100_000, color: 0xffc107 },
  { id: 'lavender', name: 'Lavender', price: 130_000, color: 0x9575cd },
  { id: 'daisy', name: 'White Daisy', price: 90_000, color: 0xfafafa },
  { id: 'orchid', name: 'Orchid', price: 200_000, color: 0xba68c8 },
  { id: 'peony', name: 'Peony', price: 180_000, color: 0xf8bbd0 },
  { id: 'hydrangea', name: 'Hydrangea', price: 160_000, color: 0x64b5f6 },
  { id: 'carnation', name: 'Carnation', price: 110_000, color: 0xff7043 },
]
