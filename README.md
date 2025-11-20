# CareerPlay

CareerPlay adalah platform kesiapan karir berbasis web yang memadukan pencarian lowongan, analisis kecocokan, dan simulasi job bergaya quest/gamifikasi. Dibangun dengan Next.js (App Router) + Prisma, dan memanfaatkan AI untuk membuat soal situasional/teknis serta umpan balik instan.

## Fitur Utama
- **Pencarian & Saved Jobs**: Telusuri/filter lowongan (tipe, kategori, lokasi), simpan/unsave, lihat detail perusahaan & status tersimpan.
- **Profil & CV Parsing**: Unggah CV untuk ekstraksi otomatis (skills, pengalaman, proyek, edukasi, sertifikat); hasilnya bisa diedit pengguna.
- **Analisis Kecocokan**: Hitung skill gap, skor kecocokan, dan rekomendasi langkah berikut.
- **Simulasi Job (3 soal/sesi)**: Tiap sesi memuat 3 soal SJT/teknis dengan opsi A/B/C dan XP berbeda, jawaban terbaik tunggal, plus penjelasan per opsi. Setelah 3 soal selesai hanya ada tombol **Tutup**; sesi baru dimulai lewat **“Mulai Simulasi Job (3 soal)”**.
- **UI Modern**: Next.js + Tailwind + shadcn/ui; overlay quest, quick insights, dan navigasi profil ringkas.

## Teknologi
- Frontend: Next.js (React, App Router), TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Next.js route handlers, Prisma ORM, database SQL.
- Auth: NextAuth (OAuth/email).
- AI: Model generatif (Gemini) untuk soal + feedback; parsing CV untuk ekstraksi profil.

## Struktur Folder (ringkas)
```
app/                       # Halaman & route handlers API (App Router)
  api/                     # Endpoint Next.js (simulate, analyze, profile, jobs, auth, quests)
    auth/                  # Register/login handlers
    jobs/                  # Job listing, detail, save, simulate, analyze
    profile/               # CRUD profil, skills, experience, education, certifications, import CV
    quests/                # Submit jawaban quest
  components/              # Komponen UI (JobCard, LeftSidebar, dsb.)
    ui/                    # Komponen dasar shadcn/ui
  jobs/[id]/               # Halaman detail job + overlay simulasi 3 soal
  profile/                 # Halaman profil pengguna
  saved/                   # Halaman saved jobs
  login/, register/        # Auth pages
  providers/               # Penyedia context (theme/auth, dll.)
lib/                       # Auth config, prisma client, utils
types/                     # Deklarasi tipe NextAuth
prisma/                    # schema.prisma & migrasi
public/                    # Aset statis
scripts/                   # Utilitas (import job, seed profil)
next.config.ts, eslint*, tsconfig*  # Konfigurasi proyek
```

## Menjalankan Secara Lokal
1) Instal dependensi
```bash
npm install
```
2) Siapkan environment variables (buat `.env`):
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-key
```
3) Migrasi database (jika diperlukan)
```bash
npx prisma migrate dev
```
4) Jalankan development server
```bash
npm run dev
# buka http://localhost:3000
```

## Skrip NPM
- `npm run dev` – Development server.
- `npm run build` – Build produksi.
- `npm run start` – Menjalankan build produksi.
- `npm run lint` – Pemeriksaan linting.

## Alur Pengguna (singkat)
- Login/registrasi → unggah CV → periksa & edit profil.
- Telusuri/filter lowongan → simpan job → buka detail perusahaan.
- Jalankan analisis kecocokan → dapatkan skor, gap, dan rekomendasi.
- Mulai simulasi → jawab 3 soal berurutan → Tutup → mulai sesi baru bila perlu.

## Catatan Implementasi
- Simulasi menghasilkan batch 3 soal per sesi; status jawaban disimpan per quest.
- Ekstraksi CV mem-populate entitas profil, tetap bisa diedit manual.
- Saved jobs, analisis, dan simulasi terkait sesi pengguna (NextAuth).

## Lisensi
Internal use. Sesuaikan per kebutuhan proyek/lomba Anda.
