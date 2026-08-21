# Pembanding PDF — Laporan Dua Halaman Sampingan

Tool web offline-friendly untuk membandingkan dua PDF (versi lama vs revisi):
setiap halaman yang berubah ditampilkan **lama di kiri, baru di kanan**, bedanya
di-highlight (merah = dihapus, hijau = ditambah). Hasil bisa langsung di-download
menjadi PDF — baik laporan dua-sampingan maupun hanya halaman BARU yang berubah.

## Cara pakai
1. Buka `index.html` di browser (atau akses versi hosting di bawah).
2. Pilih **PDF LAMA** lalu **PDF BARU**.
3. Klik **Bandingkan**.
4. Download:
   - **Laporan dua-sampingan (lama|baru)** → 1 lembar A4 = 1 halaman berubah (kiri lama, kanan baru, ada highlight).
   - **Halaman BARU yang berubah saja** → PDF portrait bersih, hanya halaman baru yang beda.

## Teknis
- 100% di browser (PDF tidak pernah diunggah ke server — aman untuk dokumen rahasia).
- Library di-vendor lokal: `pdf.js` (render), `jsdiff` (diff teks), `jsPDF` (export).
- Tidak butuh internet / CDN saat dipakai.

## Deploy sendiri (opsional)
Cukup upload folder ini ke GitHub Pages / Netlify / Vercel sebagai static site.
