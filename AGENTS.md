# Perennial Haven

Katalog toko bunga interaktif berbasis 3D (tugas kuliah Grafika Komputer).
Produk yang dijual adalah **bucket (bouquet) bunga**.

## Konsep pengalaman pengguna

1. Halaman dibuka: tampak **toko bunga dari luar** (kamera jauh di depan).
2. User **scroll** → pintu toko **terbuka** dan **kamera bergerak masuk**.
3. Di dalam ada **lemari grid** berisi bucket bunga sebagai **katalog**.

Seluruh animasi digerakkan oleh progress scroll (0..1), bukan waktu.

## Tech stack

- Three.js + TypeScript, dibundel dengan Vite. Package manager: **bun** (`bun.lock`).
- Perintah: `bun run dev`, `bun run build` (menjalankan `tsc` lalu `vite build`).

## Struktur

```
src/
├── main.ts               # bootstrap saja
├── core/                 # infrastruktur generik (tanpa konten toko)
│   ├── Engine.ts         # renderer, scene, camera, resize, render loop
│   ├── ScrollProgress.ts # scroll → value 0..1 yang di-smooth
│   └── CameraRig.ts      # kamera mengikuti keyframe berdasarkan progress
├── scenes/MainScene.ts   # merakit lampu, toko, lemari, TIMELINE, keyframe kamera
├── objects/              # objek 3D (extends THREE.Group)
│   ├── Shop.ts           # bangunan + pintu, setOpen(0..1)
│   ├── Shelf.ts          # lemari grid, dibangun dari data/flowers.ts
│   └── BouquetModel.ts   # bucket procedural (placeholder untuk GLB)
├── data/flowers.ts       # data katalog (satu-satunya sumber daftar bucket)
└── utils/math.ts         # clamp, lerp, smoothstep, segment
public/models/            # file .glb
public/textures/
```

## Konvensi

- **Data terpisah dari tampilan**: menambah bucket = tambah entri di `data/flowers.ts`; jangan hardcode di `Shelf.ts`.
- **Animasi berbasis scroll**: gunakan `segment(progress, start, end)` + `smoothstep` di `MainScene.ts`. Jangan memakai `setTimeout` atau waktu untuk animasi utama.
- Objek 3D dibuat sebagai class turunan `THREE.Group` dengan method kontrol sederhana (mis. `setOpen`).
- `core/` tidak boleh bergantung pada `objects/` atau `data/`.
- Panjang animasi diatur oleh tinggi `#scroll-space` di `style.css`.
- `tsconfig` memakai `erasableSyntaxOnly`: jangan pakai parameter properties (`constructor(private x)`), `enum`, atau `namespace`.
- Satuan dunia 3D: 1 unit ≈ 1 meter. Toko menghadap +Z, lemari menempel di dinding belakang.

## Rencana / belum dikerjakan

- Klik bucket → detail (nama, harga) memakai `Raycaster`.
- `GLTFLoader` untuk model bucket asli (field `model` di `Bouquet`).
- Overlay UI HTML (judul, petunjuk scroll, panel detail).
- Opsional: GSAP + ScrollTrigger bila timeline makin kompleks.
