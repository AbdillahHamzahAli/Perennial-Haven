<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmhmbXB3Y2t2eXQwbHI3dHVqMXR1Y2VrdW54NnRkMWpkdHdxdTNmdiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/X3YpCNG0u8BF7klZ2f/giphy.gif" alt="Perennial Haven" width="320" />
</p>

# 🌸 Perennial Haven

![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Katalog toko bunga interaktif berbasis 3D, dibuat untuk tugas mata kuliah Grafika Komputer. Produk yang ditampilkan adalah **bucket (bouquet) bunga**.

## Konsep

1. Halaman dibuka dan menampilkan **toko bunga dari luar**.
2. **Scroll** untuk membuka pintu toko, lalu kamera **masuk ke dalam**.
3. Di dalam terdapat **lemari grid** berisi bucket bunga sebagai katalog.

Seluruh animasi digerakkan oleh progress scroll, bukan oleh waktu.

## Setup

Prasyarat: [Bun](https://bun.sh) (atau Node.js 20+ dengan npm).

```bash
# 1. install dependensi
bun install

# 2. jalankan dev server
bun run dev

# 3. build untuk produksi
bun run build

# 4. preview hasil build
bun run preview
```

Buka alamat yang tampil di terminal (biasanya `http://localhost:5173`), lalu scroll.

## Struktur singkat

```
src/
├── main.ts               # bootstrap
├── core/                 # Engine, ScrollProgress, CameraRig
├── scenes/MainScene.ts   # merakit scene + timeline animasi
├── objects/              # Shop, Shelf, BouquetModel
├── data/flowers.ts       # daftar bucket katalog
└── utils/math.ts
public/models/            # model .glb
```
