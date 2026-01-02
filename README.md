# Expo Quiz

Aplikasi live quiz untuk acara atau pameran, lengkap dengan manajemen sesi, jawaban peserta, dan leaderboard realtime.

## Fitur Utama

- Buat, kelola, dan akhiri sesi quiz dari halaman admin.
- Peserta gabung menggunakan kode sesi atau QR.
- Kirim jawaban dan simpan skor ke Supabase.
- Leaderboard realtime melalui Supabase Realtime.
- Layar publik untuk menampilkan leaderboard.

## Teknologi

- Next.js (App Router)
- Supabase (Database + Realtime)
- Tailwind CSS
- TypeScript

## Persyaratan

- Node.js
- Akun Supabase

## Setup Supabase (wajib)

1) Buat project Supabase.
2) Jalankan schema di `supabase/schema.sql` melalui SQL editor.
3) Isi `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Catatan:
- Untuk testing lokal, kamu bisa menonaktifkan RLS atau menambahkan policy `select/insert`.
- Aktifkan Realtime untuk tabel `answers` agar leaderboard live.
- Jika tabel sudah ada, tambahkan kolom: `alter table sessions add column if not exists ended_at timestamptz;`.

## Menjalankan Lokal

1) Install dependency:

```bash
npm install
```

2) Jalankan dev server:

```bash
npm run dev
```

3) Buka http://localhost:3000.

## Rute Penting

- `/` halaman landing dan form join.
- `/admin` halaman admin untuk sesi dan pertanyaan.
- `/join/[code]` proses join peserta berdasarkan kode.
- `/quiz/[code]` halaman quiz peserta.
- `/screen/[code]` layar leaderboard publik.

## Skrip

- `npm run dev` jalankan dev server.
- `npm run build` build production.
- `npm run start` jalankan server production.
- `npm run lint` linting.

## Deploy

Rekomendasi deploy di Vercel atau platform lain yang mendukung Next.js. Pastikan environment variables Supabase sudah terisi.
