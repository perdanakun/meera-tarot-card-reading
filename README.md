# Meera — React JSX + Vite + Tailwind

Purranormal: ritual tiga kartu bertema kucing, dengan palet orange/hitam dan tipografi typewriter. React + Vite, tanpa Next.js atau TypeScript. Semua komponen menggunakan `.jsx`, data dan konfigurasi menggunakan `.js`.

Catatan perbaikan, alasan desain, dan hasil pengujian: [docs/refinement.md](docs/refinement.md).

## 1. Jalankan dulu

Gunakan Node.js 22.12+ (misalnya Node 24 LTS). Ekstrak ZIP, buka folder `meera-jsx` di VS Code, lalu buka terminal di folder yang memiliki `package.json`.

```bash
npm install
npm run dev
```

Buka alamat `Local` yang ditampilkan terminal (biasanya `http://localhost:5173`). Tidak perlu menjalankan `npm create vite` lagi: project-nya sudah siap.

## 2. Peta file

| File                                 | Tanggung jawab                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `src/main.jsx`                       | Menyalakan React dan mengimpor CSS                                                |
| `src/App.jsx`                        | Memanggil pengalaman Meera                                                        |
| `src/components/MeeraExperience.jsx` | Mengatur state scene, pilihan, reveal, timer, dan reset                           |
| `src/components/IntroScene.jsx`      | Intro, morph paw, dan spiral hypnosis maju/reverse                                |
| `src/components/SelectionScene.jsx`  | Kipas 22 kartu, hover, tray pilihan, dan navigasi keyboard                        |
| `src/components/RevealScene.jsx`     | Komponen lama; flow aktif melakukan reveal di SelectionScene                       |
| `src/components/ResultScene.jsx`     | Tiga kartu terpilih dan meaning lokal                                              |
| `src/components/TarotCard.jsx`       | Komponen visual reusable untuk sisi depan/belakang                                |
| `src/data/cards.js`                  | Data lokal, copy kartu, helper layout, dan summary sederhana                      |
| `src/index.css`                      | Tailwind, design tokens, elemen global, dan tombol                                |
| `src/components/SelectionScene.css` | Kipas, slot pilihan, flip 3D, gathering, responsive, dan reduced motion            |
| `vite.config.js`                     | Plugin React dan plugin Tailwind                                                  |

Tailwind v4 sudah terhubung via `@tailwindcss/vite`. Tidak memerlukan `tailwind.config.js` atau konfigurasi PostCSS tambahan. Utility dipakai untuk layout dasar; CSS khusus menjaga tampilan dan motion draft.

## 3. Cara kerja flow

`intro → intro-entering → intro-arriving → selection → gathering → result`

SelectionScene melewati fase `choosing → departing → reading`. Setelah tiga kartu dipilih, kipas keluar dan kartu membesar di tempat. Pengguna membuka ketiganya dalam urutan bebas; setelah semua flip selesai, kartu berkumpul dan Result muncul otomatis.

- Posisi: **Past**, **Present**, **Future**.
- Pilihan dapat dibatalkan dengan klik kartu di tray, sebelum memilih kartu ketiga.
- Desktop: hover kartu, lalu klik bagian kartu yang terlihat.
- Mobile: swipe deck dan tap bagian kartu yang terlihat.
- Keyboard: Tab ke deck, panah kiri/kanan atau Home/End untuk menjelajah, Enter/Space untuk memilih.
- Preferensi reduced motion dihormati.
- Back to cards menampilkan kembali tiga kartu terbuka. See your reading kembali ke Result tanpa mengulang pilihan.

## 4. Mulai belajar dari satu edit

Pertama, buka `IntroScene.jsx` dan ubah headline. Simpan lalu lihat hasilnya di browser. Jangan ubah state flow dulu.

Token warna dan tipografi berada di `src/index.css`, seperti `--meera-bg`, `--meera-ink`, dan `--meera-font-body`.

Untuk ilustrasi kucing nanti, ubah `TarotCard.jsx` dan data kartu. Flow tidak perlu dibongkar.

## 5. Batas prototype

- Sisi depan memakai satu template artwork yang sama. Pemetaan ilustrasi individual per kartu belum dibuat.
- Copy masih bahasa Inggris mengikuti draft.
- Summary adalah gabungan teks lokal, bukan output AI atau ramalan.
- Reset merotasi urutan deck; belum memakai shuffle acak.
- Tidak ada audio, backend, login, analytics, atau penyimpanan otomatis.
- Pemeriksaan teknis bukan validasi dengan pengguna.

## 6. Build untuk nanti

```bash
npm run build
npm run preview
```

Output produksi ada di `dist/`. Belum ada deployment dalam paket ini. Jika nanti dipasang di Vercel: framework Vite, build command `npm run build`, output directory `dist`.

## Pemeriksaan paket ini

- `npm install` dan `npm run build` berhasil.
- Flow intro, pilih tiga, reveal bebas urutan, Result, kembali ke kartu, dan reset diperiksa di Chromium headless.
- Layout diperiksa pada 320, 390, 768, 844, 1440, dan 1920px. Detail skenario dan batas pengujian ada di catatan refinement.
- Pointer/touch, keyboard, reduced motion, resize saat transisi, dan interaksi berulang diperiksa.
- Ini pemeriksaan teknis, bukan pengujian dengan audiens target.

Referensi konfigurasi: [Tailwind dengan Vite](https://tailwindcss.com/docs/installation/using-vite) dan [Vite guide](https://vite.dev/guide/).
