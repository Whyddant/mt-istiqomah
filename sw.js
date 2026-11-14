/* Service worker MT. Al-Istiqomah.
   - Halaman & berkas aplikasi: coba jaringan dulu, jatuh ke salinan tersimpan saat offline.
   - Font Google: disimpan setelah pertama kali dimuat.
   - API (jadwal shalat, Apps Script): tidak disentuh, aplikasi punya cache sendiri.
   Naikkan VERSI bila mengubah daftar INTI. */
const VERSI = "v4";
const NAMA = "al-istiqomah-" + VERSI;
const INTI = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

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

  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => {
        const salin = res.clone();
        caches.open(NAMA).then(c => c.put(r, salin));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (u.origin !== location.origin) return;

  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) {
        const salin = res.clone();
        caches.open(NAMA).then(c => c.put(r, salin));
      }
      return res;
    }).catch(() => caches.match(r).then(hit => hit || caches.match("./")))
  );
});
