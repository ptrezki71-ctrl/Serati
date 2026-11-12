// Konfigurasi Serati versi mandiri.
// Biarkan kosong untuk mode lokal (semua fitur inti jalan; diskusi tersimpan di perangkat masing-masing).
// Isi sesuai PANDUAN_DEPLOY.md untuk mengaktifkan diskusi bersama, foto/video katalog, dan Serati Lens AI.
window.SERATI_CONFIG = {
  // Dari Supabase: Project Settings → API → Project URL dan anon public key (kunci ini memang aman dipakai di browser).
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  // Alamat fungsi Lens. Di Vercel isi "/api/lens". Kosongkan bila Lens AI tidak dipakai.
  LENS_ENDPOINT: "/api/lens",
  // Nama bucket Storage untuk foto & video katalog.
  MEDIA_BUCKET: "media"
};
