# MT. Al-Istiqomah

Aplikasi web Majelis Taklim Al-Istiqomah, Masjid Jami' Al-Ikhlas. Berisi jadwal shalat, info kajian, arisan, kas, dan informasi majelis untuk jamaah.

Alamat aplikasi: https://whyddant.github.io/mt-istiqomah/

## Isi repositori

| Berkas | Fungsi |
|---|---|
| `index.html` | Seluruh aplikasi (tampilan, gaya, dan skrip dalam satu berkas) |
| `config.js` | Alamat sambungan ke Google Sheet (Apps Script). Tidak berubah saat aplikasi diperbarui |
| `manifest.webmanifest` | Data pemasangan aplikasi di layar utama |
| `sw.js` | Service worker: membuat aplikasi tetap terbuka saat tidak ada sinyal |
| `icon-192.png`, `icon-512.png` | Ikon aplikasi dan logo pratinjau tautan WhatsApp |

Semua berkas berada di folder utama. Jangan dipindah ke subfolder, karena pemasangan di layar utama dan service worker bergantung pada letaknya.

## Cara memperbarui aplikasi

1. Unggah `index.html` yang baru ke repositori (timpa berkas lama).
2. **Jangan menimpa `config.js`**, kecuali alamat Apps Script memang berganti.
3. Tunggu sekitar satu menit sampai GitHub Pages selesai memperbarui.
4. Buka aplikasi di HP dan periksa. Anggota yang terhubung internet otomatis mendapat versi terbaru.

Naikkan `VERSI` di `sw.js` hanya bila daftar berkas `INTI` berubah (misalnya menambah berkas baru yang harus tersedia saat offline).

## Mengganti ikon atau logo

Ganti `icon-192.png` (192×192) dan `icon-512.png` (512×512) dengan nama yang sama. Logo ini juga tampil di pratinjau tautan WhatsApp. WhatsApp menyimpan pratinjau lama, jadi untuk mengujinya kirim tautan dengan akhiran baru, misalnya `.../mt-istiqomah/?v=2`.

## Data dari Google Sheet

Jadwal giliran arisan, aturan, lokasi, informasi, dan artikel diisi pengurus lewat Google Sheet / Panel pengurus. Aplikasi tidak menulis ke Sheet dari sisi jamaah.

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
- v14: splash bawaan HP dirapikan. Ikon kini berlatar hijau polos (#0F4D2F) dan `background_color` di manifest disamakan, jadi splash tampil mulus tanpa kotak ikon. Tanpa splash buatan di dalam halaman.
