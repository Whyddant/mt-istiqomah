/**
 * Backend Majelis Taklim Al-Istiqomah: Google Sheet <-> aplikasi.
 *  - doGet  : data publik (giliran, lokasi, informasi, artikel, majelis) sebagai JSON, dibaca semua jamaah.
 *  - doPost : panel pengurus. Login sendiri-sendiri, lalu simpan/hapus data dari dalam aplikasi.
 *
 * CARA PASANG (bisa dari HP lewat browser, mode "Situs desktop")
 * 1. Buat Google Sheet baru. Di File > Setelan, set Zona waktu ke "Jakarta".
 * 2. Buat tab dengan nama persis di bawah. Baris 1 = judul kolom (huruf kecil, persis).
 *    Cara tercepat: impor berkas CSV template ke tiap tab.
 *      giliran    : tgl | tipe | nama | no | ket | nominal
 *      lokasi     : tgl | jenis | nama | alamat
 *      informasi  : id | tgl | judul | isi | tampil
 *      artikel    : id | tgl | judul | penulis | ringkasan | link | tampil
 *      majelis    : kunci | nilai                            (profil majelis, diisi lewat Panel pengurus)
 *      admin      : pengguna | sandi | nama | aktif          (AKUN PENGURUS, tidak pernah dikirim ke publik)
 *      log        : waktu | pengguna | aksi | keterangan     (dibuat otomatis bila belum ada)
 *    Tab yang belum ada dibuat otomatis saat pertama kali dipakai dari aplikasi.
 *
 * 3. Akun pengurus: isi tab "admin", satu baris per pengurus.
 *      pengguna = nama login (huruf kecil, tanpa spasi), sandi = sandi awal, nama = nama tampilan.
 *    Sandi awal sebaiknya campuran huruf dan angka. Begitu pengurus berhasil masuk pertama kali,
 *    sandi di Sheet otomatis diganti menjadi kode acak (hash), jadi tidak terbaca lagi.
 *    Pengurus bisa mengganti sandi sendiri di aplikasi. Isi kolom aktif dengan "tidak" untuk menutup akses.
 *    Siapa pun yang punya akses edit ke Sheet ini bisa melihat dan mengubah tab admin,
 *    jadi bagikan Sheet hanya kepada orang yang dipercaya.
 *
 * 4. Di Sheet: Ekstensi > Apps Script. Hapus isi bawaan, tempel seluruh kode ini, simpan.
 * 5. Terapkan > Deployment baru > jenis "Aplikasi web"
 *      Jalankan sebagai: Saya     |     Yang memiliki akses: Siapa saja
 *    Salin URL berakhiran /exec ke CFG.api di file HTML aplikasi.
 *    Setiap mengubah kode ini: Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan.
 *    Pertama kali Google meminta izin akses ke Sheet. Izinkan.
 */

const CACHE_KEY = 'data_v2';
const CACHE_DETIK = 120;
const MAKS_TERBARU = 20;
const TOKEN_DETIK = 21000;   // sesi masuk sekitar 5 jam 50 menit (batas cache Google 6 jam)
const MAKS_GAGAL = 5;        // salah sandi per pengguna sebelum dikunci
const KUNCI_DETIK = 900;     // lama kunci: 15 menit
const SHEET_ID = 'https://docs.google.com/spreadsheets/d/1YAQWa4KjYY2Vp6ctpW6nrk5U3QWRU8Bmn2uxYUl4grc/edit?gid=570119210#gid=570119210';
/* Boleh diisi ID saja ataupun URL lengkap Sheet; ID diambil otomatis dari URL. */
function ambilSS_() {
  const id = String(SHEET_ID).replace(/^.*\/d\/([a-zA-Z0-9_-]+).*$/, '$1');
  return SpreadsheetApp.openById(id);
}

/* Kolom yang boleh dikirim ke PUBLIK. Kolom lain (id, catatan, dll) tidak pernah keluar. */
const FIELD = {
  giliran: ['tgl', 'tipe', 'nama', 'no', 'ket', 'nominal'],
  lokasi: ['tgl', 'jenis', 'nama', 'alamat'],
  informasi: ['tgl', 'judul', 'isi', 'tampil'],
  artikel: ['tgl', 'judul', 'penulis', 'ringkasan', 'link', 'tampil']
};

/* Semua kolom yang dikelola script (urutan dipakai saat membuat tab baru). */
const KOLOM = {
  giliran: ['tgl', 'tipe', 'nama', 'no', 'ket', 'nominal'],
  lokasi: ['tgl', 'jenis', 'nama', 'alamat'],
  informasi: ['id', 'tgl', 'judul', 'isi', 'tampil'],
  artikel: ['id', 'tgl', 'judul', 'penulis', 'ringkasan', 'link', 'tampil'],
  majelis: ['kunci', 'nilai'],
  admin: ['pengguna', 'sandi', 'nama', 'aktif'],
  log: ['waktu', 'pengguna', 'aksi', 'keterangan']
};

/* ============================ PUBLIK (BACA) ============================ */

function doGet() {
  try {
    const cache = CacheService.getScriptCache();
    let teks = cache.get(CACHE_KEY);
    if (!teks) {
      teks = JSON.stringify(susunData_());
      try { cache.put(CACHE_KEY, teks, CACHE_DETIK); } catch (e) { /* terlalu besar untuk cache: tetap kirim */ }
    }
    return json_(teks, true);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Dipanggil otomatis saat Sheet diedit tangan, supaya perubahan cepat terlihat. */
function onEdit() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function json_(obj, sudahTeks) {
  return ContentService
    .createTextOutput(sudahTeks ? obj : JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function susunData_() {
  const ss = ambilSS_();
  const tz = zona_(ss);
  const hariIni = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  const giliran = bacaTab_(ss, 'giliran', FIELD.giliran, tz)
    .filter(r => r.tgl && r.tgl >= hariIni)
    .map(r => { r.tipe = String(r.tipe || 'giliran').toLowerCase(); return r; });

  const lokasi = bacaTab_(ss, 'lokasi', FIELD.lokasi, tz)
    .filter(r => r.tgl && r.tgl >= hariIni)
    .map(r => { r.jenis = String(r.jenis || 'masjid').toLowerCase(); return r; });

  const informasi = terbaru_(bacaTab_(ss, 'informasi', FIELD.informasi, tz));
  const artikel = terbaru_(bacaTab_(ss, 'artikel', FIELD.artikel, tz));

  return { ok: true, giliran: giliran, lokasi: lokasi, informasi: informasi, artikel: artikel, majelis: bacaMajelis_(ss, tz) };
}

/** Buang yang disembunyikan, urutkan tanggal terbaru dulu, batasi jumlahnya. */
function terbaru_(baris) {
  return baris
    .filter(r => r.judul && String(r.tampil || '').toLowerCase() !== 'tidak')
    .sort((a, b) => String(b.tgl || '') < String(a.tgl || '') ? -1 : 1)
    .slice(0, MAKS_TERBARU);
}

function bacaTab_(ss, nama, kolomBoleh, tz) {
  const sh = ss.getSheetByName(nama);
  if (!sh) return [];
  return baca_(sh, tz).rows.map(r => {
    const o = {};
    kolomBoleh.forEach(k => { if (k in r) o[k] = r[k]; });
    return o;
  });
}

/* ========================= UTILITAS SHEET ========================= */

function zona_(ss) {
  return ss.getSpreadsheetTimeZone() || 'Asia/Jakarta';
}

/** Baca seluruh tab: { head: [...], rows: [{_r: nomorBaris, kolom: nilai}] }. Baris kosong dilewati. */
function baca_(sh, tz) {
  const lr = sh.getLastRow(), lc = sh.getLastColumn();
  if (lr < 1 || lc < 1) return { head: [], rows: [] };
  const v = sh.getRange(1, 1, lr, lc).getValues();
  const head = v[0].map(h => String(h).trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < v.length; i++) {
    const o = { _r: i + 1 };
    let ada = false;
    head.forEach((h, k) => {
      if (!h) return;
      let x = v[i][k];
      if (x instanceof Date) x = Utilities.formatDate(x, tz, 'yyyy-MM-dd');
      else if (typeof x === 'string') x = x.trim();
      if (x !== '' && x !== null) ada = true;
      o[h] = x;
    });
    if (ada) rows.push(o);
  }
  return { head: head, rows: rows };
}

/** Ambil tab; buat bila belum ada; tambahkan kolom yang kurang. Mengembalikan { sh, head }. */
function lembar_(ss, nama) {
  const kol = KOLOM[nama];
  let sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama);
    pastikanUkuran_(sh, 2, kol.length);
    sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    return { sh: sh, head: kol.slice() };
  }
  let head = [];
  if (sh.getLastRow() >= 1 && sh.getLastColumn() >= 1) {
    head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
  }
  kol.forEach(k => {
    if (head.indexOf(k) < 0) {
      pastikanUkuran_(sh, 1, head.length + 1);
      sh.getRange(1, head.length + 1).setValue(k);
      head.push(k);
    }
  });
  return { sh: sh, head: head };
}

function pastikanUkuran_(sh, baris, kolom) {
  if (sh.getMaxRows() < baris) sh.insertRowsAfter(sh.getMaxRows(), baris - sh.getMaxRows());
  if (sh.getMaxColumns() < kolom) sh.insertColumnsAfter(sh.getMaxColumns(), kolom - sh.getMaxColumns());
}

/** Tulis sel sebagai TEKS. Ini juga mencegah isian berawalan = + - @ dibaca sebagai rumus. */
function setSel_(sh, r, c, nilai) {
  const sel = sh.getRange(r, c);
  sel.setNumberFormat('@');
  sel.setValue(nilai === undefined || nilai === null ? '' : String(nilai));
}

/** Tambah satu baris di bawah data. obj berisi kolom->nilai; kolom lain dikosongkan. */
function tambah_(sh, head, obj) {
  const r = Math.max(sh.getLastRow(), 1) + 1;
  pastikanUkuran_(sh, r, head.length);
  const rng = sh.getRange(r, 1, 1, head.length);
  rng.setNumberFormat('@');
  rng.setValues([head.map(h => (h in obj && obj[h] !== null && obj[h] !== undefined) ? String(obj[h]) : '')]);
}

/** Ubah kolom tertentu pada baris yang sudah ada, kolom lain dibiarkan. */
function ubah_(sh, head, r, obj) {
  Object.keys(obj).forEach(k => {
    const c = head.indexOf(k);
    if (c >= 0) setSel_(sh, r, c + 1, obj[k]);
  });
}

function hapusBaris_(sh, nomor) {
  nomor.slice().sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
}

function id_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

/* ============================ VALIDASI ============================ */

function gagal_(pesan, kode) {
  return { pengguna: true, pesan: pesan, kode: kode || 'tidak_valid' };
}

function tgl_(x) {
  x = String(x || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw gagal_('Tanggal tidak valid.');
  const d = new Date(x + 'T00:00:00Z');
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== x) throw gagal_('Tanggal tidak valid.');
  return x;
}

function satu_(x, maks, nama, wajib) {
  x = String(x === null || x === undefined ? '' : x).replace(/\s+/g, ' ').trim();
  if (wajib && !x) throw gagal_(nama + ' wajib diisi.');
  if (x.length > maks) throw gagal_(nama + ' terlalu panjang (maksimal ' + maks + ' karakter).');
  return x;
}

function banyak_(x, maks, nama, wajib) {
  x = String(x === null || x === undefined ? '' : x).replace(/\r\n?/g, '\n').trim();
  if (wajib && !x) throw gagal_(nama + ' wajib diisi.');
  if (x.length > maks) throw gagal_(nama + ' terlalu panjang (maksimal ' + maks + ' karakter).');
  return x;
}

function tautan_(x) {
  x = String(x || '').trim();
  if (!x) return '';
  if (x.length > 300 || !/^https?:\/\/[^\s]+$/i.test(x)) throw gagal_('Tautan harus diawali https:// dan tanpa spasi.');
  return x;
}

function bulat_(x, min, maks, nama) {
  const s = String(x === null || x === undefined ? '' : x).replace(/[.\s]/g, '');
  if (!/^\d+$/.test(s)) throw gagal_(nama + ' harus berupa angka.');
  const n = parseInt(s, 10);
  if (n < min || n > maks) throw gagal_(nama + ' di luar batas.');
  return n;
}

/* ====================== AKUN, SESI, KEAMANAN ====================== */

function garam_() {
  const p = PropertiesService.getScriptProperties();
  let g = p.getProperty('garam');
  if (!g) {
    g = Utilities.getUuid() + Utilities.getUuid();
    p.setProperty('garam', g);
  }
  return g;
}

function hash_(pengguna, sandi) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, garam_() + '|' + pengguna + '|' + sandi);
  return 'h1:' + bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function cocokSandi_(tersimpan, pengguna, sandi) {
  tersimpan = String(tersimpan === null || tersimpan === undefined ? '' : tersimpan).trim();
  if (!tersimpan) return false;
  if (tersimpan.indexOf('h1:') === 0) return tersimpan === hash_(pengguna, sandi);
  return tersimpan === sandi;  // sandi awal belum di-hash; langsung di-hash setelah masuk berhasil
}

function cariAdmin_(ss, pengguna) {
  const a = lembar_(ss, 'admin');
  const t = baca_(a.sh, zona_(ss));
  const baris = t.rows.find(r =>
    String(r.pengguna || '').trim().toLowerCase() === pengguna &&
    String(r.aktif || '').trim().toLowerCase() !== 'tidak');
  return { sh: a.sh, head: a.head, baris: baris || null };
}

function masuk_(req) {
  const u = String(req.u || '').trim().toLowerCase();
  const p = String(req.p === null || req.p === undefined ? '' : req.p);
  if (!u || !p || u.length > 40 || p.length > 100) throw gagal_('Isi nama pengguna dan kata sandi.');

  const cache = CacheService.getScriptCache();
  const kU = 'gagal_' + u, kS = 'gagal_semua';
  if ((+cache.get(kU) || 0) >= MAKS_GAGAL || (+cache.get(kS) || 0) >= MAKS_GAGAL * 6) {
    throw gagal_('Terlalu banyak percobaan gagal. Coba lagi sekitar 15 menit lagi.', 'dikunci');
  }

  const ss = ambilSS_();
  const a = cariAdmin_(ss, u);
  if (!a.baris || !cocokSandi_(a.baris.sandi, u, p)) {
    // CacheService hanya menerima teks, jadi angka diubah ke String dulu
    cache.put(kU, String((+cache.get(kU) || 0) + 1), KUNCI_DETIK);
    cache.put(kS, String((+cache.get(kS) || 0) + 1), KUNCI_DETIK);
    throw gagal_('Nama pengguna atau kata sandi salah.', 'salah');
  }
  cache.remove(kU);

  if (String(a.baris.sandi).indexOf('h1:') !== 0) {   // ganti sandi awal menjadi hash
    ubah_(a.sh, a.head, a.baris._r, { sandi: hash_(u, p) });
  }

  const nama = String(a.baris.nama || u);
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('tok_' + token, JSON.stringify({ u: u, nama: nama }), TOKEN_DETIK);
  catat_(u, 'masuk', '');
  return { ok: true, token: token, nama: nama };
}

function sesi_(token) {
  token = String(token || '');
  const teks = token.length >= 32 ? CacheService.getScriptCache().get('tok_' + token) : null;
  if (!teks) throw gagal_('Sesi berakhir. Silakan masuk lagi.', 'belum_masuk');
  return JSON.parse(teks);
}

function gantiSandi_(s, req) {
  const lama = String(req.lama === null || req.lama === undefined ? '' : req.lama);
  const baru = String(req.baru === null || req.baru === undefined ? '' : req.baru);
  if (baru.length < 8 || baru.length > 100) throw gagal_('Kata sandi baru minimal 8 karakter.');
  if (baru === lama) throw gagal_('Kata sandi baru harus berbeda dari yang lama.');
  const ss = ambilSS_();
  const a = cariAdmin_(ss, s.u);
  if (!a.baris || !cocokSandi_(a.baris.sandi, s.u, lama)) throw gagal_('Kata sandi lama salah.', 'salah');
  ubah_(a.sh, a.head, a.baris._r, { sandi: hash_(s.u, baru) });
  catat_(s.u, 'ganti sandi', '');
  return { ok: true };
}

function catat_(pengguna, aksi, keterangan) {
  try {
    const ss = ambilSS_();
    const l = lembar_(ss, 'log');
    tambah_(l.sh, l.head, {
      waktu: Utilities.formatDate(new Date(), zona_(ss), 'yyyy-MM-dd HH:mm:ss'),
      pengguna: pengguna, aksi: aksi, keterangan: String(keterangan || '').slice(0, 200)
    });
  } catch (err) { /* catatan bersifat tambahan; jangan menggagalkan simpan */ }
}

/* ============================ PANEL (TULIS) ============================ */

/**
 * Permintaan dikirim dari aplikasi sebagai teks JSON (Content-Type text/plain, tanpa preflight):
 * { aksi, token, ... }. Semua aksi kecuali "masuk" wajib membawa token sesi yang sah.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasil;
  try {
    lock.waitLock(20000);
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    hasil = tangani_(req);
  } catch (err) {
    if (err && err.pengguna) hasil = { ok: false, pesan: err.pesan, kode: err.kode };
    else {
      console.error(err);
      hasil = {
        ok: false, kode: 'server',
        pesan: 'Server sedang sibuk atau terjadi kesalahan. Coba lagi sebentar lagi.',
        rinci: String(err && err.message ? err.message : err).slice(0, 140)   // untuk melacak penyebab
      };
    }
  } finally {
    try { lock.releaseLock(); } catch (x) { /* sudah dilepas */ }
  }
  return json_(hasil);
}

function tangani_(req) {
  const aksi = String(req.aksi || '');
  if (aksi === 'masuk') return masuk_(req);
  const s = sesi_(req.token);
  switch (aksi) {
    case 'keluar':
      CacheService.getScriptCache().remove('tok_' + req.token);
      return { ok: true };
    case 'gantiSandi': return gantiSandi_(s, req);
    case 'daftar': return daftar_();
    case 'simpanGiliran': return tulis_(s, simpanGiliran_(req), 'giliran ' + req.tgl);
    case 'hapusGiliran': return tulis_(s, hapusTgl_('giliran', req.tgl), 'hapus giliran ' + req.tgl);
    case 'simpanLokasi': return tulis_(s, simpanLokasi_(req), 'lokasi ' + req.tgl);
    case 'hapusLokasi': return tulis_(s, hapusTgl_('lokasi', req.tgl), 'hapus lokasi ' + req.tgl);
    case 'simpanInformasi': return tulis_(s, simpanItem_('informasi', req), 'informasi');
    case 'hapusInformasi': return tulis_(s, hapusItem_('informasi', req.id), 'hapus informasi');
    case 'simpanArtikel': return tulis_(s, simpanItem_('artikel', req), 'artikel');
    case 'hapusArtikel': return tulis_(s, hapusItem_('artikel', req.id), 'hapus artikel');
    case 'simpanMajelis': return tulis_(s, simpanMajelis_(req), 'majelis ' + req.kunci);
    default: throw gagal_('Aksi tidak dikenal.');
  }
}

/** Setelah tulis berhasil: hapus cache publik supaya jamaah melihat perubahan, lalu catat. */
function tulis_(s, ket, aksi) {
  CacheService.getScriptCache().remove(CACHE_KEY);
  catat_(s.u, aksi, ket && ket.catatan ? ket.catatan : '');
  return { ok: true };
}

/** Isi lengkap untuk panel: termasuk informasi/artikel yang disembunyikan, plus id. */
function daftar_() {
  const ss = ambilSS_();
  const tz = zona_(ss);
  const hariIni = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const hasil = { ok: true, hariIni: hariIni };

  ['giliran', 'lokasi'].forEach(n => {
    const l = lembar_(ss, n);
    hasil[n] = baca_(l.sh, tz).rows
      .filter(r => r.tgl && r.tgl >= hariIni)
      .sort((a, b) => String(a.tgl) < String(b.tgl) ? -1 : 1)
      .map(r => { const o = {}; FIELD[n].forEach(k => { if (k in r) o[k] = r[k]; }); return o; });
  });

  ['informasi', 'artikel'].forEach(n => {
    const l = lembar_(ss, n);
    const t = baca_(l.sh, tz);
    const ci = l.head.indexOf('id') + 1;
    t.rows.forEach(r => {
      if (!r.id && r.judul) { r.id = id_(); setSel_(l.sh, r._r, ci, r.id); }
    });
    hasil[n] = t.rows
      .filter(r => r.judul && r.id)
      .sort((a, b) => String(b.tgl || '') < String(a.tgl || '') ? -1 : 1)
      .slice(0, 100)
      .map(r => { const o = { id: String(r.id) }; FIELD[n].forEach(k => { if (k in r) o[k] = r[k]; }); return o; });
  });
  return hasil;
}

/** Ganti semua baris pada satu tanggal dengan baris baru (atau hapus bila baru kosong). */
function gantiTgl_(nama, tgl, barisBaru) {
  const ss = ambilSS_();
  const l = lembar_(ss, nama);
  const lama = baca_(l.sh, zona_(ss)).rows.filter(r => r.tgl === tgl).map(r => r._r);
  hapusBaris_(l.sh, lama);
  barisBaru.forEach(o => tambah_(l.sh, l.head, o));
}

function hapusTgl_(nama, tgl) {
  tgl = tgl_(tgl);
  gantiTgl_(nama, tgl, []);
  return { catatan: tgl };
}

function simpanGiliran_(req) {
  const tgl = tgl_(req.tgl);
  const tipe = String(req.tipe || 'giliran');
  let baris;
  if (tipe === 'penutupan') {
    baris = [{
      tgl: tgl, tipe: 'penutupan', nama: '', no: '',
      ket: satu_(req.ket, 80, 'Keterangan', false),
      nominal: bulat_(req.nominal, 0, 100000000, 'Nominal')
    }];
  } else if (tipe === 'giliran') {
    const a = Array.isArray(req.anggota) ? req.anggota.slice(0, 2) : [];
    if (!a.length) throw gagal_('Isi minimal satu nama anggota.');
    baris = a.map((x, i) => ({
      tgl: tgl, tipe: 'giliran',
      nama: satu_(x && x.nama, 60, 'Nama anggota ' + (i + 1), true),
      no: bulat_(x && x.no, 1, 999, 'Nomor anggota ' + (i + 1)),
      ket: satu_(x && x.ket, 40, 'Keterangan', false),
      nominal: ''
    }));
  } else throw gagal_('Jenis tidak dikenal.');
  gantiTgl_('giliran', tgl, baris);
  return { catatan: tgl + ' ' + tipe };
}

const JENIS_LOKASI = ['masjid', 'takziah', 'syukuran', 'haul', 'lainnya'];

function simpanLokasi_(req) {
  const tgl = tgl_(req.tgl);
  const jenis = String(req.jenis || '').toLowerCase();
  if (JENIS_LOKASI.indexOf(jenis) < 0) throw gagal_('Jenis lokasi tidak dikenal.');
  if (jenis === 'masjid') {            // masjid = bawaan, tidak perlu baris khusus
    gantiTgl_('lokasi', tgl, []);
    return { catatan: tgl + ' masjid' };
  }
  const baris = [{
    tgl: tgl, jenis: jenis,
    nama: satu_(req.nama, 80, 'Nama tempat', true),
    alamat: satu_(req.alamat, 200, 'Alamat', true)
  }];
  gantiTgl_('lokasi', tgl, baris);
  return { catatan: tgl + ' ' + jenis };
}

/** Informasi dan artikel: tanpa id = baru; dengan id = ubah. */
function simpanItem_(nama, req) {
  const ss = ambilSS_();
  const data = { tgl: tgl_(req.tgl), judul: satu_(req.judul, 120, 'Judul', true) };
  if (nama === 'informasi') {
    data.isi = banyak_(req.isi, 2000, 'Isi', true);
  } else {
    data.penulis = satu_(req.penulis, 80, 'Penulis', false);
    data.ringkasan = banyak_(req.ringkasan, 2000, 'Ringkasan', false);
    data.link = tautan_(req.link);
  }
  data.tampil = String(req.tampil || '').toLowerCase() === 'tidak' ? 'tidak' : '';

  const l = lembar_(ss, nama);
  if (req.id) {
    const r = baca_(l.sh, zona_(ss)).rows.find(x => String(x.id) === String(req.id));
    if (!r) throw gagal_('Data tidak ditemukan. Mungkin sudah dihapus pengurus lain.', 'hilang');
    ubah_(l.sh, l.head, r._r, data);
  } else {
    data.id = id_();
    tambah_(l.sh, l.head, data);
  }
  return { catatan: data.judul.slice(0, 60) };
}

function hapusItem_(nama, id) {
  const ss = ambilSS_();
  const l = lembar_(ss, nama);
  const r = baca_(l.sh, zona_(ss)).rows.find(x => id && String(x.id) === String(id));
  if (!r) throw gagal_('Data tidak ditemukan. Mungkin sudah dihapus pengurus lain.', 'hilang');
  hapusBaris_(l.sh, [r._r]);
  return { catatan: String(r.judul || '').slice(0, 60) };
}

/* ===================== PROFIL MAJELIS (BARU) ===================== */

/* Bagian yang boleh disimpan: kolom -> [panjang maksimal, banyak baris (1) atau satu baris (0)] */
const MAJELIS_SKEMA = {
  identitas: { tagline: [100, 0], berdiri: [40, 0] },
  guru: { nama: [80, 0], sapaan: [200, 0] },
  sejarah: { teks: [3000, 1] },
  visimisi: { visi: [300, 1], misi: [1200, 1] },
  pengurus: { ketua: [80, 0], sekretaris: [80, 0], bendahara: [80, 0], sarana: [80, 0] },
  kontak: {
    ketua_n: [80, 0], ketua_hp: [20, 0], ketua_u: [120, 0],
    sekretaris_n: [80, 0], sekretaris_hp: [20, 0], sekretaris_u: [120, 0],
    bendahara_n: [80, 0], bendahara_hp: [20, 0], bendahara_u: [120, 0]
  },
  acara: { arisan: [120, 0], tahlil: [120, 0], pengumuman: [120, 0], doa: [120, 0] }
};

/** Baca tab majelis menjadi { kunci: {kolom: nilai} }. Hanya kunci dan kolom yang dikenal yang keluar. */
function bacaMajelis_(ss, tz) {
  const hasil = {};
  const sh = ss.getSheetByName('majelis');
  if (!sh) return hasil;
  baca_(sh, tz).rows.forEach(r => {
    const k = String(r.kunci || '').trim();
    const skema = MAJELIS_SKEMA[k];
    if (!skema) return;
    try {
      const o = JSON.parse(String(r.nilai || '{}'));
      if (!o || typeof o !== 'object' || Array.isArray(o)) return;
      const bersih = {};
      Object.keys(skema).forEach(f => { if (typeof o[f] === 'string') bersih[f] = o[f]; });
      hasil[k] = bersih;
    } catch (e) { /* baris rusak dilewati */ }
  });
  return hasil;
}

/** Simpan satu bagian profil (ganti seluruh isi bagian itu). Dipanggil dari panel pengurus. */
function simpanMajelis_(req) {
  const kunci = String(req.kunci || '');
  const skema = MAJELIS_SKEMA[kunci];
  if (!skema) throw gagal_('Bagian profil tidak dikenal.');
  const masuk = req.nilai && typeof req.nilai === 'object' ? req.nilai : {};
  const nilai = {};
  Object.keys(skema).forEach(f => {
    const maks = skema[f][0];
    const v = skema[f][1] ? banyak_(masuk[f], maks, kunci + ' / ' + f, false)
                          : satu_(masuk[f], maks, kunci + ' / ' + f, false);
    if (/_hp$/.test(f) && v) {
      const digit = v.replace(/\D/g, '');
      if (!/^[0-9+\-\s().]+$/.test(v) || digit.length < 10 || digit.length > 15) {
        throw gagal_('Nomor WhatsApp tidak valid.');
      }
    }
    nilai[f] = v;
  });

  const ss = ambilSS_();
  const l = lembar_(ss, 'majelis');
  const ada = baca_(l.sh, zona_(ss)).rows.find(r => String(r.kunci || '').trim() === kunci);
  const teks = JSON.stringify(nilai);
  if (ada) ubah_(l.sh, l.head, ada._r, { nilai: teks });
  else tambah_(l.sh, l.head, { kunci: kunci, nilai: teks });
  return { catatan: kunci };   // isi (termasuk nomor WhatsApp) sengaja tidak masuk ke tab log
}
