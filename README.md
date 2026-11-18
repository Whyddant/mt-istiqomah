# MT. Al-Istiqomah

Aplikasi web Majelis Taklim Al-Istiqomah, Masjid Jami' Al-Ikhlas. Berisi jadwal shalat, info kajian, arisan, kas, dan informasi majelis untuk jamaah.

Alamat aplikasi: https://whyddant.github.io/mt-istiqomah/

> **Jangan pernah unggah `kode.gs` ke repositori ini.** Berkas itu memuat alamat Google Sheet milik majelis, dan repositori ini publik. `kode.gs` sudah ditambahkan ke `.gitignore` supaya tidak ter-commit tanpa sengaja. Tempel isinya langsung ke editor Apps Script (Extensions > Apps Script di Sheet), bukan ke sini.

## Isi repositori

| Berkas | Fungsi |
|---|---|
| `index.html` | Seluruh aplikasi (tampilan, gaya, dan skrip dalam satu berkas) |
| `config.js` | Alamat sambungan ke Google Sheet (Apps Script). Tidak berubah saat aplikasi diperbarui |
| `manifest.webmanifest` | Data pemasangan aplikasi di layar utama |
| `sw.js` | Service worker: membuat aplikasi tetap terbuka saat tidak ada sinyal |
| `fonts/` | Font Plus Jakarta Sans (lisensi OFL) yang disimpan lokal, tanpa Google Fonts |
| `data/tahlil.js`, `data/doa.js` | Naskah Tahlil/Yasin dan daftar doa. Dimuat saat halamannya dibuka |
| `screenshots/` | Tangkapan layar untuk dialog pemasangan di Android |
| `icon-192.png`, `icon-512.png` | Ikon aplikasi dan logo pratinjau tautan WhatsApp |

Semua berkas berada di folder utama. Jangan dipindah ke subfolder, karena pemasangan di layar utama dan service worker bergantung pada letaknya.

## Cara memperbarui aplikasi

1. Unggah `index.html` yang baru ke repositori (timpa berkas lama).
2. **Jangan menimpa `config.js`**, kecuali alamat Apps Script memang berganti.
3. Tunggu sekitar satu menit sampai GitHub Pages selesai memperbarui.
4. Buka aplikasi di HP dan periksa. Anggota yang terhubung internet otomatis mendapat versi terbaru.

Naikkan `VERSI` di `sw.js` bila daftar berkas `INTI` berubah (misalnya menambah berkas baru yang harus tersedia saat offline), atau bila isi `data/tahlil.js` / `data/doa.js` diubah dan ingin langsung terbaca di semua perangkat.

## Mengganti ikon atau logo

Ganti `icon-192.png` (192×192) dan `icon-512.png` (512×512) dengan nama yang sama. Logo ini juga tampil di pratinjau tautan WhatsApp. WhatsApp menyimpan pratinjau lama, jadi untuk mengujinya kirim tautan dengan akhiran baru, misalnya `.../mt-istiqomah/?v=2`.

## Data dari Google Sheet

Jadwal giliran arisan, aturan, lokasi, informasi, dan artikel diisi pengurus lewat Google Sheet / Panel pengurus. Jamaah tidak menulis langsung ke Sheet. Kiriman dari jamaah (Kirim kajian dan Usaha anggota) masuk lewat Apps Script berstatus `menunggu` dan baru tayang setelah disetujui pengurus.

### Peran pengurus

Tab `admin` di Sheet punya kolom `peran`. Isi dengan satu atau lebih peran, dipisah koma (mis. `arisan, artikel`):

| Peran | Boleh mengelola |
|---|---|
| `super` | Semua bagian, termasuk Profil majelis (sejarah, visi dan misi, pengurus, kontak, masjid) |
| `arisan` | Giliran arisan, lokasi acara, libur nasional, ketentuan arisan, dan tab Arisan di halaman Tentang majelis |
| `artikel` | Informasi dan kajian |
| `kas` | Laporan kas: kas rutin, kegiatan, bank penerima, bendahara; juga Infaq masjid (rekening, QRIS), Qurban kolektif (peserta), dan tab Kas di halaman Tentang majelis |
| `verifikator` | Hanya memeriksa kiriman kajian jamaah (setujui atau tolak). Peran `artikel` dan `super` juga boleh memeriksa |

- Kolom dikosongkan = `super`, supaya akun lama tetap berfungsi.
- Salah ketik (mis. `arsian`) tidak menjadi `super`: akun bisa masuk tetapi tidak bisa mengubah apa pun.
- Mengubah peran atau mengisi `aktif` dengan `tidak` berlaku pada permintaan berikutnya, tanpa menunggu pengurus keluar.
- Laporan kas diisi dari Panel pengurus > Laporan kas (tab `kas` di Sheet dibuat otomatis). Kas rutin hanya satu baris; kegiatan bisa ditambah, diubah, disembunyikan, dan dihapus. Tanggal "Data per" ikut diperbarui otomatis setiap kas disimpan. Selama tab `kas` belum diisi, halaman Kas di aplikasi menampilkan "Laporan kas belum diisi pengurus"; data contoh hanya tampil bila aplikasi belum tersambung ke backend terbaru.
- Usaha anggota: jamaah mengajukan dari aplikasi (tanpa login), pengajuan masuk tab `usaha` berstatus `menunggu` dan belum tampil. Pengurus peran `artikel` atau `super` memeriksa di Panel pengurus > Usaha anggota: Setujui, ubah, tolak (dengan alasan), sembunyikan, atau hapus. Pembatasan: 3 pengajuan per nomor WhatsApp per 6 jam, 20 pengajuan per jam untuk semua jamaah, dan antrean menunggu maksimal 100. Usaha yang sudah tayang tidak bisa ditimpa dari sisi jamaah; perubahannya lewat pengurus. Foto usaha hanya bisa diisi pengurus. Baris yang diisi tangan di Sheet tanpa isi kolom `status` dianggap tayang. Nomor WhatsApp disimpan dalam bentuk 62xxxxxxxxxx.
- Libur nasional dan Ketentuan arisan: peran `arisan` (dan `super`) mengelolanya di Panel pengurus > Libur nasional / Ketentuan arisan. Libur yang diisi (tab `libur`, jenis `libur` atau `cuti`) menambah atau mengoreksi daftar bawaan kalender pada tanggal yang sama; satu tanggal hanya punya satu baris. Ketentuan arisan ditulis satu ketentuan per baris tanpa nomor (maksimal 40 ketentuan, 300 karakter per ketentuan) dan disimpan di tab `majelis` pada baris `aturan`. Selama belum diisi, halaman Ketentuan menampilkan "Belum ada ketentuan arisan yang diisi pengurus".
- Halaman Tentang majelis punya tiga tab dan semuanya bisa diperbarui pengurus. **Profil**: Panel pengurus > Profil majelis (peran `super`), termasuk bagian baru *Kegiatan dan nilai* (waktu pengajian, nilai-nilai dasar, bentuk kegiatan, catatan tempat dan waktu). **Arisan**: Panel pengurus > *Tab Arisan di Tentang majelis* (peran `arisan`). **Kas**: Panel pengurus > *Tab Kas di Tentang majelis* (peran `kas`). Peran `super` boleh semuanya. Isi tab Arisan dan Kas ditulis sebagai teks biasa dengan format sederhana: `## Judul` membuat kartu baru, `### Judul kecil` membuat subjudul, `1.` daftar bernomor (nomor otomatis), `-` butir, dua spasi lalu `-` butir di bawah butir sebelumnya, baris lain menjadi paragraf, dan `Judul: uraian` di awal butir menebalkan Judul. Formulir langsung terisi tulisan yang sedang tampil, ada tombol Pratinjau, dan batasnya 12.000 karakter. Mengosongkan seluruh isi lalu Simpan membuat aplikasi memakai tulisan bawaan di `index.html`. Bila dua pengurus membuka bagian yang sama lalu menyimpan bergantian, simpanan kedua ditolak dengan pesan "sudah diubah pengurus lain" supaya tulisan pertama tidak tertimpa diam-diam. Perhatikan bahwa menu **Ketentuan arisan** (daftar satu ketentuan per baris yang tampil di halaman Arisan) adalah isian yang berbeda dari **Tab Arisan di Tentang majelis** (tata tertib lengkap); keduanya tidak otomatis sama, jadi bila aturannya berubah, perbarui kedua tempat.
- Urutan memperbarui: tempel `kode.gs` baru di Apps Script dan terapkan sebagai **versi baru**, baru unggah `index.html`.

- Kirim kajian (mode kolaborator): di halaman Tentang, ketuk baris "Versi" 7 kali, lalu menu **Kirim kajian** muncul di menu opsi. Ini hanya menyembunyikan menu, bukan pengaman. Kiriman masuk tab `artikel` berstatus `menunggu`; pengurus memeriksanya di Panel pengurus > Kiriman kajian. Pembatasan: 3 kiriman per nomor WhatsApp per 6 jam, 20 per jam untuk semua jamaah, antrean menunggu maksimal 100, tanggal kajian dalam 120 hari terakhir. Kajian yang sudah tayang tidak bisa ditimpa dari sisi jamaah. Foto kiriman disimpan di folder Drive "Foto Kajian Jamaah" dan ikut dibuang saat pengurus menghapus kiriman itu. Jalankan fungsi `izinkanDrive` sekali dari editor Apps Script agar Google meminta izin Drive.
- Kode kolaborator: isi `KODE_KOLABORATOR` di `kode.gs` agar hanya orang yang tahu kodenya yang dapat mengirim kajian (kosong = terbuka untuk siapa saja). Kode dimasukkan di formulir Kirim kajian dan diingat di perangkat itu. Tebakan salah dibatasi 30 per jam.

Lembar omzet anggota hanya tersimpan di perangkat anggota (tidak dikirim ke server). Anggota disarankan memasang aplikasi di layar utama sebelum menyimpan lembar omzet agar lebih aman dari penghapusan otomatis oleh browser.

## Mode pengembang (hanya untuk pengujian tampilan)

- Buka alamat aplikasi dengan `?dev=1` untuk menampilkan tombol **DEV** (tersimpan di perangkat itu). Matikan dengan `?dev=0`.
- `?demo=isi` menampilkan halaman Arisan dengan data contoh. Hanya di memori, tidak mengubah Sheet.

Mode ini tidak tampil bagi jamaah dan tidak mengubah data.

## Catatan versi

Tulis di sini ringkasan setiap pembaruan.

- v11: penyimpanan permanen untuk lembar omzet, catatan "simpan ulang fotonya", logo pratinjau tautan WhatsApp memakai alamat lengkap.
- v12: fitur Doa harian (35 doa, bisa dicari) menggantikan pintasan Penanda di Beranda. Ukuran huruf, tulisan Latin, dan terjemah mengikuti pengaturan di halaman Tahlil.
- v13: Surah Yasin di halaman Tahlil kini lengkap (ayat 1–83). Arab dan terjemahan semua ayat dari data surah Kemenag. Latin ayat 1–12 tetap yang lama; Latin ayat 13–83 dari transliterasi sumber lain (gaya berbeda), perlu diseragamkan dan diperiksa.
- v14: splash screen. Ikon memakai logo asli berwarna di atas krem polos (#F1EDE0), sama dengan `background_color` di manifest. Setelah splash bawaan HP, halaman menampilkan logo yang sama dengan nama majelis di bawahnya dan nama masjid di footer, sekali per sesi.
- v15: alamat manifest dan ikon diberi akhiran `?v=15` agar Android tidak memakai salinan lama. Bila mengganti ikon atau warna manifest lagi, naikkan angka ini (di `index.html` dan `manifest.webmanifest`).
- v15 (splash): splash di halaman kembali beranimasi (lapisan simbol naik, bintang muncul satu per satu, lalu nama majelis dan nama masjid). Latar tetap krem agar menyatu dengan splash bawaan Android.
- v16: navbar bawah kini tetap tampil di tab Kajian, Arisan, Jamaah, dan Kas (halaman tab berhenti di atas navbar, tab aktif ikut berpindah). Pesan pengingat shalat dibuat jujur: berbunyi selama aplikasi terbuka. Ikon manifest dipisah `any` dan `maskable`, ditambah `id`, pintasan (Arisan, Kas, Kajian lewat `?buka=`), dan tangkapan layar. Font dipasang lokal. Naskah Tahlil/Yasin dan Doa dipindah ke `data/` dan dimuat saat dibuka. Cache `sw.js` (v5) tidak lagi menumpuk per parameter query. Naikkan angka `?v=16` di `index.html` dan manifest bila mengganti ikon.
- Backend Usaha anggota: `kode.gs` menambah tab `usaha`, aksi `ajukanUsaha` (jamaah), `simpanUsaha`, `hapusUsaha`, serta `usaha` dan `usahaStatus` di data publik; `CACHE_KEY` naik ke `data_v5`. `index.html`: pesan penolakan dari server kini tampil di formulir pengajuan.
- Kiriman kajian jamaah: `kode.gs` menambah aksi `ajukanKajian` (jamaah) dan `periksaKajian` (pengurus), peran `verifikator`, `kajianStatus` di data publik (kini memuat juga kiriman jamaah yang sudah tayang), `KODE_KOLABORATOR`, dan pembuangan foto kiriman; `CACHE_KEY` naik ke `data_v9`. `index.html`: status kiriman langsung benar setelah mengirim (data dimuat ulang) dan membedakan menunggu, ditolak, tayang, dan sudah dihapus; kebijakan privasi diperbarui; nama pengembang dan tahun diisi.
- Libur dan Ketentuan arisan (sebelumnya bernama Aturan main): `kode.gs` menambah tab `libur`, aksi `simpanLibur`, `hapusLibur`, `simpanAturan`, serta `libur` dan `aturan` di data publik; `CACHE_KEY` naik ke `data_v6`. `index.html` menambah menu Libur nasional dan Aturan main di Panel pengurus. Dengan ini semua fitur frontend sudah punya backend. Nama "Aturan main" diganti "Ketentuan arisan" di semua tulisan yang terlihat; nama tab dan kolom di Sheet (`aturan`) tidak berubah, jadi data lama tetap terbaca.
- Perbaikan dari pemeriksaan kode: `index.html` tidak lagi menampilkan giliran arisan cadangan yang tertanam (nama lama bisa tertinggal tampil setelah tanggalnya lewat) — bila Sheet belum punya giliran mendatang, kartu Beranda dan halaman Arisan kini menampilkan "Giliran belum diumumkan pengurus" (lihat `giliranBerikut()`). Fungsi `R.login` yang didefinisikan dua kali (yang pertama selalu tertimpa, jadi tidak pernah terpakai) dibuang. Cache jadwal shalat per tanggal (`jadwalSholat_<tanggal>`) kini dibersihkan otomatis setiap hari, hanya menyimpan kunci hari ini, supaya tidak menumpuk ~365 kunci per tahun per perangkat.
- Penguncian login: `kode.gs` tidak lagi punya kunci gabungan 30 salah sandi untuk semua pengurus (`gagal_semua`), yang dulu bisa dipicu siapa saja yang hanya tahu satu nama pengguna pengurus. Kunci 5 salah sandi/15 menit per nama pengguna tetap berlaku.
- `kode.gs` (`baca_`): sel Sheet berformat waktu yang diisi tangan (mis. kolom jam usaha anggota) kini dibaca sebagai "HH:mm", bukan tertimpa jadi tanggal rusak "1899-12-30" seperti sebelumnya.
- Label "Contoh isi" di header halaman Bantuan, Tentang aplikasi, Kebijakan privasi, Profil majelis, Acara malam Jumat, Hubungi pengurus, dan Kirim masukan dibuang (hanya tersisa di Masuk pengurus dan Laporan kas, yang memang otomatis hilang begitu data asli masuk).
- ~~Dicatat, belum diperbaiki: Profil majelis tidak tersambung ke Sheet~~ — sudah dikerjakan, lihat catatan v17.
- Perbaikan laporan kas: `muatData()` membangun objek `DATA` dari respons backend dengan daftar field eksplisit, dan field `kas` serta `majelis` (keduanya sudah dikirim `kode.gs`) tidak pernah ikut disalin. Akibatnya halaman Laporan kas selalu mengira belum tersambung ke Sheet dan terus menampilkan data contoh + label "Contoh isi", walau tab `kas` di Sheet sudah diisi pengurus. Sekarang kedua field itu ikut dimuat.
- v17: **Panel pengurus** punya tiga menu baru. *Profil majelis* (peran `super`): slogan, tahun berdiri, guru, sejarah, visi dan misi, pengurus, kontak WhatsApp, nama dan alamat masjid; disimpan di tab `majelis` dan dibaca halaman Profil, Hubungi pengurus, dan Lokasi (`mjTerap()`). Bagian yang dikosongkan tetap memakai isi bawaan di `index.html`. *Infaq masjid* (peran `kas`): rekening (satu per baris, `Bank | Nomor | Atas nama`), tautan gambar QRIS, WhatsApp konfirmasi. *Qurban kolektif* (peran `kas`): tahun hijriah, tanggal, biaya sapi/kambing, peserta sapi (kelompok dipisah baris kosong, maksimal 7 nama) dan kambing. Selama belum diisi, halaman Infaq dan Qurban tetap menampilkan contoh dengan catatan "masih contoh"; setelah rekening/peserta diisi, catatan itu hilang. `kode.gs`: aksi `simpanInfaq` dan `simpanQurban`, `infaq` dan `qurban` di data publik, `daftar` mengirim `majelis`/`infaq`/`qurban` ke panel, skema `masjid`; `CACHE_KEY` naik ke `data_v10`. Urutan memperbarui: tempel `kode.gs` baru dan terapkan sebagai **versi baru**, baru unggah `index.html`.
- v17 (Yasin): naskah Surah Yasin diperiksa terhadap teks Kemenag (bimasislam.kemenag.go.id/en/al-quran/yasin). Arab ayat 1–83 sama dengan data Kemenag. Latin ayat 1–83 kini sama persis dengan Kemenag, termasuk tanda jeda dalam kurung, misalnya `alīm(un)` (sebelumnya 27 ayat berbeda ejaan dan gaya bercampur). Terjemahan ayat 1–12 masih edisi lama dan diganti dengan edisi Kemenag terkini; terjemahan ayat 13–83 sudah edisi penyempurnaan dan ayat 13–27 dicocokkan satu per satu dengan situs Kemenag (sisanya belum dicocokkan baris demi baris). `sw.js` naik ke v9 agar naskah baru terbaca di semua perangkat.
- v18: **Lokasi pekan dengan peta.** Di Panel pengurus > Lokasi acara > Atur lokasi pekan, pengurus bisa memilih titik di peta kecil (OpenStreetMap + Leaflet, dimuat dari unpkg hanya saat form dibuka): ketuk peta, geser penanda, cari nama tempat, atau pakai lokasi perangkat. Alamat terisi otomatis dari titik (OpenStreetMap Nominatim) dan tetap bisa diubah. Titik disimpan sebagai `lat` dan `lng`; bila ada, tombol Google Maps dan Petunjuk arah di aplikasi jamaah memakai koordinat, bila kosong tetap memakai alamat tertulis. `kode.gs` perlu menambah kolom `lat` dan `lng` di tab `lokasi`, menerimanya di `simpanLokasi`, dan mengembalikannya di `lokasi` pada data publik; naikkan `CACHE_KEY`. Urutan memperbarui: tempel `kode.gs` baru dan terapkan sebagai **versi baru**, baru unggah `index.html`. Tanpa pembaruan `kode.gs`, form tetap jalan tetapi titik tidak tersimpan.
- v19: **Data contoh dihapus.** Aplikasi tidak lagi menampilkan data contoh. Laporan kas, Infaq (rekening dan QRIS), Qurban kolektif, Usaha anggota, serta Informasi dan Kajian di Beranda kini hanya menampilkan isi dari Sheet. Bila Sheet belum diisi, halaman menampilkan "belum diisi pengurus"; bila data belum bisa dimuat (tanpa sinyal dan belum pernah tersimpan di perangkat), halaman menampilkan "belum dapat dimuat". Kode QRIS acak, rekening contoh, dan label "Contoh isi" dibuang. Catatan di bagian atas yang menyebut halaman Kas, Infaq, dan Qurban menampilkan contoh sudah tidak berlaku. Isi bawaan Profil majelis (nama, sejarah, pengurus, kontak) tetap ada sebagai cadangan bila bagiannya dikosongkan di Sheet. Mode pengembang kehilangan satu tombol, "Contoh Informasi, Kajian, dan Usaha anggota"; untuk menguji tampilan itu, isi tab terkait di Sheet. Tombol kondisi tampilan, data contoh arisan (`?demo=isi`), dan jam simulasi tetap ada.
- v20: **Gambar dari Google Drive.** Pengurus tidak perlu akses GitHub: unggah gambar ke Google Drive majelis, atur berbagi ke "Siapa saja yang memiliki tautan", lalu tempel tautan berbagi biasa. Aplikasi mengubahnya sendiri menjadi gambar. Berlaku untuk: foto kajian, foto usaha, QRIS infaq, **gambar pengumuman dan undangan** (kolom baru `foto` di tab `informasi`), **galeri kajian** (kolom baru `galeri` di tab `artikel`, maksimal 8 tautan, satu per baris), serta **foto guru dan pengurus** (Panel pengurus > Profil majelis). Lembar omzet tidak berubah. **Unggah langsung dari HP:** di setiap isian gambar ada tombol "Pilih foto dari HP"; foto dikecilkan di aplikasi, disimpan di folder Drive "Foto Aplikasi Majelis" (dibuat otomatis, pemilik = akun script) dan tautannya terisi sendiri. Aksi baru `unggahFoto` (peran artikel atau kas). Tombol ini tidak ada untuk lembar omzet. **Undangan berupa gambar saja:** di Informasi, teks dan tanggal acara tidak wajib bila gambar diisi. Daftar informasi menampilkan miniatur gambar, dan halaman detail menampilkan gambarnya di bawah judul (ketuk untuk membuka ukuran penuh). `kode.gs`: `CACHE_KEY` naik ke `data_v12`, kolom baru dibuat otomatis di Sheet, tautan divalidasi `https://`. Tempel `kode.gs` ke Apps Script dan terapkan sebagai versi baru sebelum mengunggah `index.html`.
- v21: **Tentang majelis bisa diperbarui pengurus.** Tab Arisan dan tab Kas kini dibaca dari Sheet (tab `majelis`, kunci `tentang_arisan` dan `tentang_kas`), diedit lewat dua menu baru di Panel pengurus; isi lama di `index.html` tetap menjadi tulisan bawaan (`TENTANG_BAWAAN`) selama belum diisi. Tab Profil mendapat bagian baru *Kegiatan dan nilai* (kunci `kegiatan`) untuk waktu, nilai-nilai dasar, bentuk kegiatan, dan catatan tempat dan waktu yang sebelumnya tertanam di aplikasi. `kode.gs`: aksi baru `simpanTentang` (peran `arisan` untuk bagian arisan, `kas` untuk bagian kas, dengan pemeriksaan bentrok antarpengurus), `tentang` di data `daftar` untuk panel, skema `kegiatan`, `tentang_arisan`, `tentang_kas`; `CACHE_KEY` naik ke `data_v13`. Urutan memperbarui: tempel `kode.gs` baru dan terapkan sebagai **versi baru**, baru unggah `index.html`. Tanpa pembaruan `kode.gs`, halaman Tentang majelis tetap tampil dengan tulisan bawaan, tetapi tombol Simpan di dua menu baru gagal dengan pesan "Aksi tidak dikenal".
