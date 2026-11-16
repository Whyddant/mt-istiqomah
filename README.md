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
| `super` | Semua bagian, termasuk profil majelis |
| `arisan` | Giliran arisan dan lokasi acara |
| `artikel` | Informasi dan kajian |
| `kas` | Laporan kas: kas rutin, kegiatan, bank penerima, bendahara |
| `verifikator` | Hanya memeriksa kiriman kajian jamaah (setujui atau tolak). Peran `artikel` dan `super` juga boleh memeriksa |

- Kolom dikosongkan = `super`, supaya akun lama tetap berfungsi.
- Salah ketik (mis. `arsian`) tidak menjadi `super`: akun bisa masuk tetapi tidak bisa mengubah apa pun.
- Mengubah peran atau mengisi `aktif` dengan `tidak` berlaku pada permintaan berikutnya, tanpa menunggu pengurus keluar.
- Laporan kas diisi dari Panel pengurus > Laporan kas (tab `kas` di Sheet dibuat otomatis). Kas rutin hanya satu baris; kegiatan bisa ditambah, diubah, disembunyikan, dan dihapus. Tanggal "Data per" ikut diperbarui otomatis setiap kas disimpan. Selama tab `kas` belum diisi, halaman Kas di aplikasi menampilkan "Laporan kas belum diisi pengurus"; data contoh hanya tampil bila aplikasi belum tersambung ke backend terbaru.
- Usaha anggota: jamaah mengajukan dari aplikasi (tanpa login), pengajuan masuk tab `usaha` berstatus `menunggu` dan belum tampil. Pengurus peran `artikel` atau `super` memeriksa di Panel pengurus > Usaha anggota: Setujui, ubah, tolak (dengan alasan), sembunyikan, atau hapus. Pembatasan: 3 pengajuan per nomor WhatsApp per 6 jam, 20 pengajuan per jam untuk semua jamaah, dan antrean menunggu maksimal 100. Usaha yang sudah tayang tidak bisa ditimpa dari sisi jamaah; perubahannya lewat pengurus. Foto usaha hanya bisa diisi pengurus. Baris yang diisi tangan di Sheet tanpa isi kolom `status` dianggap tayang. Nomor WhatsApp disimpan dalam bentuk 62xxxxxxxxxx.
- Libur nasional dan Ketentuan arisan: peran `arisan` (dan `super`) mengelolanya di Panel pengurus > Libur nasional / Ketentuan arisan. Libur yang diisi (tab `libur`, jenis `libur` atau `cuti`) menambah atau mengoreksi daftar bawaan kalender pada tanggal yang sama; satu tanggal hanya punya satu baris. Ketentuan arisan ditulis satu ketentuan per baris tanpa nomor (maksimal 40 ketentuan, 300 karakter per ketentuan) dan disimpan di tab `majelis` pada baris `aturan`. Selama belum diisi, halaman Ketentuan menampilkan "Belum ada ketentuan arisan yang diisi pengurus".
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
- **Dicatat, belum diperbaiki:** `kode.gs` punya backend lengkap untuk "Profil majelis" (tab `majelis`, skema identitas/guru/sejarah/visi-misi/pengurus/kontak/acara, fungsi `bacaMajelis_`/`simpanMajelis_`) sesuai yang disebut tabel peran `super` di atas. Tapi `index.html` tidak pernah membaca data itu (kecuali `DATA.majelis.kas` untuk halaman Kas) dan Panel pengurus tidak punya menu untuk mengisinya. Akibatnya halaman Profil majelis, Acara malam Jumat, Hubungi pengurus, dan Kirim masukan hanya bisa diubah dengan mengedit `const MAJELIS={...}` langsung di `index.html`, bukan dari Sheet/Panel pengurus seperti yang tersirat di README. Menyambungkannya adalah pekerjaan baru (bukan sekadar perbaikan), jadi belum dikerjakan.
