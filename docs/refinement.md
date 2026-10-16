# Purranormal refinement

Base: `875e2d5`, 15 October 2026. Urutan flow dan data kartu dipertahankan.

## Bug dan perbaikan

| Masalah | Penyebab | Perbaikan |
| --- | --- | --- |
| Macet setelah kartu ketiga | Cleanup effect `choosing` menghapus timer `reading` | Timer dipisahkan menurut fase |
| Error saat hypnosis | `addPause` menerima angka sebagai callback | Posisi pause diberikan sebagai argumen pertama |
| Warning radius SVG kosong | Core circle tidak memiliki nilai awal `r` ketika GSAP revert | Nilai awal `r="0"` |
| Auto-result berulang saat Back to cards | State revealed tetap memenuhi syarat auto-result | Mode reviewing menahan auto-result; tombol kembali ke reading memakai copy yang sudah ada |
| State flip dan visual bisa berbeda | Parent dan Selection menyimpan status flip terpisah | Status tunggal di parent, diselesaikan oleh transitionend dengan timer cadangan |
| Paw melompat pada handoff | Offset shape pada MorphButton tidak dipakai portal | Kedua tahap memakai offset paw yang sama |
| Kartu berubah proporsi saat terbang | Bounding box terotasi dipakai sebagai dimensi kartu datar | Dimensi CSS, sudut, scale, dan pusat kartu dipertahankan |
| Fokus keyboard hilang saat kartu terbang | Kartu sumber disembunyikan | Fokus diteruskan ke kartu berikutnya, lalu ke kartu reveal |
| Enter/Space gagal pada layar mobile | Semua click diblokir oleh kondisi mobile | Click keyboard tetap aktif; touch memakai pointer gesture |
| Font tidak ditemukan | Path menunjuk folder yang salah | Path diarahkan ke design-system/fonts |
| Kontras eyebrow Selection rendah | Token cokelat gelap dipakai di atas hitam | Warna mengikuti orange Selection |
| ARIA tidak valid | Label pada div tanpa role | Brand memakai role img; pilihan memakai role group |
| Urutan lapisan fan desktop tidak konsisten | z-index pecahan | z-index integer mengikuti pusat fan |
| Resize mengganggu animasi | Geometri layar dan target flight tertinggal | Flight diselesaikan aman, ukuran fan diperbarui, koordinat portal dipusatkan ulang |

## Refinement dan alasan

- Orange/hitam, typewriter, ilustrasi kucing dan tiga posisi kartu tetap menjadi identitas utama.
- Result mengikuti warna dan font Selection agar transisi tidak berpindah ke tema krem/serif yang berbeda. Ini asumsi desain: token global dan scene aktif menjadi acuan konsistensi.
- Rasio artwork 972:1619 dan radius 10px dipakai juga pada Result. Artwork tetap milik proyek.
- Zoom slot memakai transform dari ukuran lama ke ukuran baru, sehingga layout tidak dihitung ulang setiap frame.
- Gathering kini menggerakkan tiga kartu ke tengah sebelum Result. Gerak menjelaskan perpindahan state, bukan dekorasi tambahan.
- Result masuk dengan gerakan 8px dan opacity selama 360ms, untuk menghubungkan akhir gathering ke isi hasil.
- Spiral tetap 4.6 detik per arah. Geometri di-memoize; path tidak ditulis ulang jika indeks gambar belum berubah.
- Reduced motion melewati spiral, sprite, typing dan flight; flip, zoom, fan dan Result mengikuti preferensi yang sama. Perubahan preferensi saat transisi juga ditangani.
- Focus ring tetap terlihat, fan memiliki satu titik Tab aktif dengan navigasi panah/Home/End, dan nama kartu tidak dibocorkan sebelum reveal.
- Copy tetap, kecuali nama brand lama `MEOWGIC` menjadi `PURRANORMAL` dan instruksi reveal memakai teks dari RevealScene yang sudah ada.

## Tambahan

Tidak ada asset, komponen React, atau dependency proyek baru.

Satu kontrol kontekstual menggunakan copy lama `See your reading →`, hanya saat pengguna kembali dari Result. Kontrol ini menyediakan jalan kembali ke Result setelah auto-result dinonaktifkan dalam mode reviewing. Jika kontrol dihapus, hapus juga Back to cards agar tidak meninggalkan pengguna tanpa jalan kembali.

Gerak tambahan mudah dimatikan melalui CSS:
- Gathering: hapus deklarasi animation pada `.selection-scene.is-gathering .selection-pick-slot`; timer flow tetap bekerja.
- Result: hapus blok `@media (prefers-reduced-motion: no-preference)` dalam ResultScene.css; isi dan tombol tetap bekerja.

## Verifikasi

Browser: Chromium headless. Test runner dan pemeriksaan axe-core dipasang terpisah dari repo; package.json dan lockfile tidak berubah.

Click-through:
- Let's Paw!: morph, hypnosis maju, reverse, Selection.
- Fan: Enter, Space, Home, panah, touch tap, dan swipe.
- Slot pilihan: membatalkan sebelum kartu ketiga.
- Tiga kartu: fan keluar, zoom, reveal dalam urutan 3-1-2.
- Reveal: klik berulang tidak menggandakan state; setelah semuanya selesai, gathering dan Result otomatis.
- Back to cards: tetap di tiga kartu terbuka sesudah 1.8 detik.
- See your reading: kembali ke Result.
- Start again: kembali ke Intro dan mengosongkan pilihan.

Layout: 320x568, 390x844, 768x1024, 844x390, 1440x900, 1920x1080. Intro dan tiga kartu diperiksa untuk overflow, overlap, dan clipping; Result boleh scroll vertikal pada layar pendek.

Edge cases: tap ganda, resize saat flight, resize portal, perubahan prefers-reduced-motion saat portal, dan urutan reveal berbeda. Saat viewport menjadi 390x844, pusat mata terukur di x195/y422.

Build produksi berhasil tanpa warning asset/font. Pada skenario browser yang diuji tidak ada console warning atau runtime error. Axe WCAG 2 A/AA dan 2.1 AA tidak menemukan pelanggaran otomatis pada Intro, Selection, Reveal, dan Result.

Batas: belum diuji pada perangkat fisik atau Safari/Firefox. Headless browser bukan bukti 60 FPS pada semua ponsel.

## Filter anti-slop

Direction: ritual tarot kucing, minimalis dan hangat. ENERGY 1 / RHYTHM 1 / MOTION 2; spiral panjang adalah motif transisi yang sudah ditetapkan pemilik.

- Hard gate PASS pada cakupan uji: build, click-through, layout, console dan axe diperiksa; tidak menambah klaim, data, nav, atau asset fiktif. Data lokal tidak memerlukan UI fetch/loading/error baru. Copy lama dipertahankan sesuai instruksi pemilik.
- Purpose gate PASS: typewriter berasal dari identitas proyek; tiga kartu setara karena mewakili tiga posisi ritual; shadow hanya memisahkan kartu bertumpuk; motion mengikuti pemilihan dan perpindahan state. Tidak ada gradient, glow, blur atau ikon tambahan.
- Liveliness PASS: kucing/paw, mata kuning dan spiral menjadi motif yang sudah ada. Focal point berpindah dari kucing ke kartu, lalu hasil. Whitespace dipertahankan.
- Quality locks PASS pada cakupan uji: palette, radius dan rasio artwork konsisten; setiap kontrol memiliki aksi yang diuji; tidak ada section baru atau template marketing.

## Sengaja tidak diubah

- Urutan scene, tiga kartu, nama posisi Past/Present/Future, data lokal dan mekanisme rotasi deck.
- Bentuk dan warna spiral, durasi maju/reverse, serta koordinat mata penutup.
- Artwork, sprite kucing, template kartu, dan font pilihan pemilik.
- Pemetaan artwork individual belum ditambahkan. Template depan saat ini bergambar The Emperor untuk semua kartu, sesuai asset base; nama dan meaning tetap mengikuti data pilihan.
- RevealScene dan SpiralTransition lama tetap tersimpan, tetapi tidak diaktifkan kembali.
- Tidak ada shuffle acak, backend, halaman baru, theme toggle, atau library baru.

### Checklist filter per aturan

| Aturan | Status dan bukti |
| --- | --- |
| R-02 | PASS: penjelasan baru tanpa em dash; copy sumber dipertahankan sesuai brief |
| R-03 | PASS: enam viewport diuji; tidak ada overflow/overlap pada area utama; tombol minimal 44px |
| R-17 | PASS: tidak menambah statistik |
| R-18 | PASS: tidak menambah testimonial |
| R-23 | PASS: memakai asset yang sudah ada |
| R-24 | PASS: tidak ada navbar atau link baru |
| R-25 | PASS: axe WCAG AA tidak menemukan pelanggaran kontras pada empat state |
| R-26 | PASS: seluruh kontrol aktif tercatat dalam click-through |
| R-27 | PASS pada scope lokal: empty selection dan state transisi ditangani; tidak menambah fetch data atau error flow fiktif |
| R-28 | PASS: tidak ada FAQ |
| R-32 | PASS: Tab, Enter, Space, panah, Home/End, fokus setelah flight dan scene diuji |
| R-33 | PASS: perubahan fitur ditulis langsung pada source |
| R-34 | PASS: tidak ada theme toggle atau mode tambahan |
| R-35 | PASS: build dan click-through browser selesai; hasil serta batas uji dicatat |
| R-36 | PASS: tidak ada klaim performa/perangkat fisik yang tidak diuji |
| R-37 | PASS: arah pemilik dan dials dinyatakan sebelum pengerjaan |
| R-38 | PASS: data milik repo; template artwork tetap dijelaskan sebagai placeholder |
| R-01 | PASS: tidak menambah gradient atau warna baru |
| R-04 | PASS: tidak menambah ikon |
| R-06 | PASS: typewriter adalah pilihan identitas pemilik |
| R-07 | PASS: tidak menambah background pattern |
| R-08 | PASS: arrow yang sudah ada dipertahankan, tidak disebar ke kontrol lain |
| R-09 | PASS: tidak menambah badge |
| R-10 | PASS: tidak menambah glassmorphism |
| R-12 | PASS: shadow terbatas pada kartu fan yang bertumpuk |
| R-13 | PASS: tidak menambah glow |
| R-14 | PASS: ukuran setara untuk Past/Present/Future, bukan feature cards marketing |
| R-19 | PASS: flight menunjukkan pilihan, flip menunjukkan reveal, gathering menunjukkan perpindahan ke hasil |
| R-22 | PASS: ilustrasi kucing asli dipertahankan |
| Dials | PASS: ENERGY 1, RHYTHM 1, MOTION 2; pengecualian spiral panjang berasal dari konsep pemilik |
| Focal point | PASS: kucing, tiga kartu, lalu hasil mengikuti state |
| Whitespace | PASS: posisi dan ruang napas base dipertahankan pada enam viewport |
| Accent | PASS: mata kuning tetap khusus pada portal |
| Motif | PASS: paw, mata, dan artwork kucing tetap milik Purranormal |
| Design read | PASS: brief pemilik menjadi arah sebelum source diedit |
| C-1 | PASS: alasan setiap refinement dicatat di atas |
| C-2 | PASS: kontrol dan jalur kembali diuji |
| C-3 | PASS: tidak ada section tambahan |
| C-4 | PASS pada cakupan uji: breakpoint, input, resize, repeated interaction dan reduced motion diuji |
| C-5 | PASS: hasil pengujian dilaporkan tanpa klaim perangkat fisik |
| R-05 | PASS: struktur ritual asli dipertahankan |
| R-11 | PASS: kartu menggunakan radius 10px |
| R-15 | PASS: CTA yang sudah ada tetap dipakai |
| R-16 | PASS: tidak menambah copy marketing |
| R-20 | PASS: identitas kucing, orange/hitam dan typewriter tetap jelas |
| R-21 | PASS: scene hitam adalah bagian konsep asli; tidak ada theme toggle baru |
| R-29 | PASS: orange/hitam dan aksen mata kuning; artwork asli tidak diwarnai ulang |
| R-30 | PASS: tidak meniru produk lain |
| R-31 | PASS: alasan palette, layout, type, spacing, kartu dan motion dicatat |
