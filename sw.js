/* Service worker MT. Al-Istiqomah.
   - Halaman & berkas aplikasi: coba jaringan dulu, jatuh ke salinan tersimpan saat offline.
   - Cache disimpan per alamat tanpa parameter (?v=, ?dev=, ?buka=), jadi tidak menumpuk.
   - API (jadwal shalat, Apps Script) dan situs lain: tidak disentuh, aplikasi punya cache sendiri.
   Naikkan VERSI bila mengubah daftar INTI. */
const VERSI = "v5";
const NAMA = "al-istiqomah-" + VERSI;
const INTI = [
  "./", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  "fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2",
  "data/tahlil.js", "data/doa.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(NAMA).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith("al-istiqomah-") && k !== NAMA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  const kunci = u.origin + u.pathname; /* tanpa query */

  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) {
        const salin = res.clone();
        caches.open(NAMA).then(c => c.put(kunci, salin));
      }
      return res;
    }).catch(() => caches.match(kunci).then(hit => hit || caches.match("./")))
  );
});
