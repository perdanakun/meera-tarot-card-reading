# Meera — React JSX + Vite + Tailwind

Paket mandiri untuk dijalankan dan diedit sendiri. Identitas visual draft v0 tetap dipakai: ivory, wine, serif editorial, dan kartu mengambang. Tidak memakai Next.js atau TypeScript. Semua komponen menggunakan `.jsx`, data dan konfigurasi menggunakan `.js`.

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
| `src/components/IntroScene.jsx`      | Copy intro, floating cards, dan vortex entrance                                   |
| `src/components/SelectionScene.jsx`  | Kipas 22 kartu, hover, tray pilihan, dan navigasi keyboard                        |
| `src/components/RevealScene.jsx`     | Tiga kartu individual, flip, pesan per kartu, dan gathering                       |
| `src/components/ResultScene.jsx`     | Tumpukan kartu dan summary                                                        |
| `src/components/TarotCard.jsx`       | Komponen visual reusable untuk sisi depan/belakang                                |
| `src/data/cards.js`                  | Data lokal, copy kartu, helper layout, dan summary sederhana                      |
| `src/index.css`                      | Tailwind, design tokens, elemen global, dan tombol                                |
| `src/styles/animations.css`          | Styling scene, kipas, flip 3D, floating, stacking, responsive, dan reduced motion |
| `vite.config.js`                     | Plugin React dan plugin Tailwind                                                  |

Tailwind v4 sudah terhubung via `@tailwindcss/vite`. Tidak memerlukan `tailwind.config.js` atau konfigurasi PostCSS tambahan. Utility dipakai untuk layout dasar; CSS khusus menjaga tampilan dan motion draft.

## 3. Cara kerja flow

`intro → entering → selection → selection-complete → reveal → gathering → result`

Scene `entering`, `selection-complete`, dan `gathering` adalah state transisi. Pengguna memilih tiga kartu, lalu reveal setiap kartu dalam urutan bebas. Summary baru tersedia setelah ketiganya selesai dibuka.

- Posisi: **Feeling**, **Perspective**, **Small step**.
- Pilihan dapat dibatalkan dengan klik kartu di tray, sebelum memilih kartu ketiga.
- Desktop: hover kartu, lalu klik bagian kartu yang terlihat.
- Mobile: swipe deck dan tap bagian kartu yang terlihat.
- Keyboard: Tab ke deck, panah kiri/kanan atau Home/End untuk menjelajah, Enter/Space untuk memilih.
- Preferensi reduced motion dihormati.

## 4. Mulai belajar dari satu edit

Pertama, buka `IntroScene.jsx` dan ubah headline. Simpan lalu lihat hasilnya di browser. Jangan ubah state flow dulu.

Setelah itu, ubah hanya `--wine` di `src/index.css`. Token ini juga tersedia sebagai utility Tailwind, misalnya `text-wine`, `bg-wine`, dan `border-wine`.

Untuk ilustrasi kucing nanti, ubah `TarotCard.jsx` dan data kartu. Flow tidak perlu dibongkar.

## 5. Batas prototype

- Artwork masih gradient + simbol, bukan ilustrasi kucing final.
- Copy masih bahasa Inggris mengikuti draft.
- Summary adalah gabungan teks lokal, bukan output AI atau ramalan.
- Reset merotasi urutan deck; belum memakai shuffle acak.
- Tidak ada audio, backend, login, analytics, atau penyimpanan otomatis.
- `Save this reflection` membuka dialog print; pilih Save as PDF jika tersedia di browser.
- Pemeriksaan teknis bukan validasi dengan pengguna.

## 6. Build untuk nanti

```bash
npm run build
npm run preview
```

Output produksi ada di `dist/`. Belum ada deployment dalam paket ini. Jika nanti dipasang di Vercel: framework Vite, build command `npm run build`, output directory `dist`.

## Pemeriksaan paket ini

- `npm install` dan `npm run build` berhasil.
- Flow intro, pilih tiga, reveal bebas urutan, summary, kembali ke kartu, dan reset telah diperiksa di browser.
- Layout diperiksa pada 1440px, 390px, dan 320px; tidak ada horizontal overflow atau console/runtime error dalam tes ini.
- Pemilihan kartu melalui pointer dan keyboard diperiksa. Mode reduced motion diperiksa pada 320px.
- Ini pemeriksaan teknis, bukan pengujian dengan audiens target.

Referensi konfigurasi: [Tailwind dengan Vite](https://tailwindcss.com/docs/installation/using-vite) dan [Vite guide](https://vite.dev/guide/).
