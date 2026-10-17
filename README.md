# JavaLab — Supabase PostgreSQL + Vercel

Paket ini menggantikan Turso. Seluruh database memakai PostgreSQL melalui backend
Next.js. Data praktikan, sesi, kode dan nilai berada di database Supabase yang sama.
35 praktikan asli + 2 dummy; 40 soal; login kode NPM; admin via /admin.

## Cara paling mudah
1. Buat project di https://supabase.com/dashboard. Simpan password DATABASE.
2. Buka SQL Editor > New query, salin seluruh db/schema.sql, klik Run.
   Ini membuat tabel dan mengaktifkan RLS. Browser tidak diberi akses tabel;
   backend memakai koneksi database postgres. Jangan membuat policy public.
3. Klik Connect > pilih Transaction pooler (port6543). Salin URI persis dari
   dashboard, ganti [YOUR-PASSWORD] dengan password DATABASE, bukan password akun.
   Jika password berisi karakter khusus, URL-encode bagian password saja.
   Tambahkan ?sslmode=verify-full (atau &sslmode=verify-full bila sudah ada query).
   Jika sertifikat tidak dipercaya, gunakan CA resmi Supabase melalui konfigurasi
   sertifikat pg; jangan menonaktifkan verifikasi TLS.
4. Ekstrak ZIP, buka folder javalab-supabase di VS Code. Install Node.js22 LTS.

       npm ci

5. Salin .env.example menjadi .env.local; isi DATABASE_URL dari langkah3.
   Isi ADMIN_PASSWORD minimal16 karakter, ADMIN_SESSION_SECRET minimal32 karakter.
   Buat nilai acak berbeda untuk masing-masing dengan menjalankan dua kali:

       node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

6. Jalankan npm run dev, buka http://localhost:3000. Masuk901 atau902 untuk tes;
   buka /admin dan masukkan ADMIN_PASSWORD. Kode115 untuk Mirdha.
7. npm run build untuk memeriksa production build.
8. Upload folder ke repository GitHub PRIVATE, import ke Vercel.
   Framework:Next.js; Root:folder package.json; Install:npm ci; Build:npm run build;
   Output Directory:default (jangan dist/out); Node.js22.x.
9. Isi tiga Environment Variables di Vercel: DATABASE_URL, ADMIN_PASSWORD,
   ADMIN_SESSION_SECRET, dengan nilai seperti .env.local. Pilih Production.
10. Deploy. Buka URL HTTPS yang sama di keenam laptop. Saat ganti peserta gunakan
    Keluar / Ganti praktikan. Untuk perubahan environment lakukan redeploy.

Tidak perlu SUPABASE_ANON_KEY atau SERVICE_ROLE_KEY untuk arsitektur ini.
DATABASE_URL hanya dipakai backend; jangan tambahkan NEXT_PUBLIC_ dan jangan commit
.env.local. db/schema.sql juga bisa dijalankan via npm run db:migrate setelah env diisi.
Skema ini untuk database PostgreSQL baru, bukan untuk menjalankan SQL di Turso.

## Perubahan admin
- Output program menampilkan stdout; pesan compiler/error jika ada, tanpa JSON mentah.
- Kolom Dikirim (WIB) tetap menampilkan waktu pengumpulan.
- Waktu pengerjaan dihitung di server dari login pertama hingga Run/Periksa tersebut.
  Contoh 5 menit12 detik. Bukan waktu compile. Logout/refresh/login ulang tidak
  mereset waktu; waktu di luar halaman juga termasuk. Setiap riwayat menyimpan
  durasinya sendiri. Tidak ada tombol submit final atau penghentian timer baru.
- Durasi tidak dikirim dari browser sehingga tidak bergantung pada jam laptop.

## Penyimpanan dan admin
Database terpusat mendukung enam laptop berbagi URL tanpa berbagi identitas.
Nilai dihitung backend. Input NPM sederhana tetap harus diawasi untuk mencegah
peserta memakai kode orang lain. Login admin memakai cookie HttpOnly bertanda tangan,
berlaku8 jam. Rotasi ADMIN_SESSION_SECRET membatalkan seluruh sesi admin.
Rate limit login admin disimpan dalam PostgreSQL.

## Data lama
Roster dan soal sudah dibawa. Nilai, sesi dan jawaban dari hosting/Turso sebelumnya
belum diekspor atau dipindahkan. Jangan menganggap ZIP ini berisi database produksi.
Durasi historis yang tidak mempunyai waktu mulai tidak bisa dihitung dengan akurat.

## Pengujian
npm test menjalankan SQL PostgreSQL dengan PGlite lokal dan route asli; transport
compiler dimock agar tidak mengirim kode ke layanan luar. Tidak membutuhkan akun
Supabase. npm run build memeriksa build produksi dan TypeScript.
Koneksi Supabase remote, deployment Vercel dan compiler live perlu dicek setelah
kredensial diisi. Compiler tetap memakai Wandbox, bukan Java di Vercel.

## Jika gagal
- Login503: cek DATABASE_URL, password, token URL-encoding dan apakah SQL sudah Run.
- Output JSON error lama: jangan deploy sebagai static export; /api/profile harus JSON.
- Admin503: cek password>=16, secret>=32 dan tabel login_limits.
- Compiler sibuk/error: kode tetap tersimpan, status belum dinilai; jalankan ulang.

Referensi resmi:
https://supabase.com/docs/guides/database/connecting-to-postgres
https://node-postgres.com/features/queries
