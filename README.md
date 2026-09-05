# AI English Evaluator

AI English Evaluator adalah aplikasi web yang menilai kemampuan Bahasa Inggris pengguna secara otomatis, lewat tulisan maupun suara. Pengguna menulis esai atau merekam suara berbicara dalam Bahasa Inggris, lalu aplikasi memberikan skor, koreksi grammar, catatan kosakata, dan saran perbaikan — seperti evaluasi yang biasanya diberikan guru atau penguji, tapi instan dan otomatis lewat AI.

Proyek ini dibuat sebagai tugas akhir kelas berbasis LLM (Large Language Model), untuk menunjukkan penerapan LLM dan speech-to-text dalam sebuah aplikasi nyata yang bisa dipakai untuk latihan Bahasa Inggris secara mandiri. Setiap evaluasi yang dilakukan tersimpan otomatis, sehingga pengguna bisa melihat kembali riwayat latihannya dan memantau perkembangan dari waktu ke waktu.

## Fitur

- Evaluasi tulisan: teks langsung dinilai (skor, grammar, vocabulary, saran perbaikan).
- Evaluasi suara: rekam atau unggah audio, otomatis ditranskripsi lalu dinilai (skor, grammar, fluency, vocabulary, saran perbaikan).
- Riwayat evaluasi: daftar semua evaluasi tersimpan, bisa difilter per tipe, dan diekspor ke CSV.

## Tech Stack

- Next.js (App Router) dan TypeScript
- Tailwind CSS v4
- Supabase (Postgres untuk data, Storage untuk file audio)
- OpenRouter (evaluasi teks lewat LLM)
- Groq Whisper (speech-to-text)

## Struktur Proyek

```
app/
  api/
    export/route.ts      
    history/route.ts     
    speaking/route.ts    
    writing/route.ts     
  history/page.tsx       
  speaking/page.tsx      
  writing/page.tsx       
  globals.css            
  layout.tsx             
  page.tsx               

components/
  Navbar.tsx              

lib/
  groq.ts                 
  openrouter.ts           
  rateLimit.ts            
  supabaseAdmin.ts        
```

## Alur Kerja

### Writing

1. Pengguna menulis atau menempel teks di halaman `/writing`, minimal 20 karakter.
2. Tombol Evaluate mengirim permintaan ke `POST /api/writing`.
3. Server memeriksa rate limit dan panjang teks, lalu mengirim teks ke OpenRouter untuk dievaluasi.
4. Hasil evaluasi (skor, grammar, vocabulary, saran perbaikan) disimpan ke tabel `evaluations` di Supabase.
5. Hasil ditampilkan kembali ke pengguna.

### Speaking

1. Pengguna merekam suara langsung di browser atau mengunggah file audio di halaman `/speaking`.
2. Tombol Evaluate mengirim audio ke `POST /api/speaking` sebagai multipart form-data.
3. Server memeriksa rate limit dan ukuran file, lalu mengunggah audio ke Supabase Storage.
4. Audio ditranskripsi menjadi teks lewat Groq Whisper.
5. Transkrip dikirim ke OpenRouter untuk dievaluasi (skor, grammar, fluency, vocabulary, saran perbaikan).
6. Hasil evaluasi beserta tautan audio disimpan ke tabel `evaluations`, lalu ditampilkan ke pengguna.

### History

1. Halaman `/history` memanggil `GET /api/history` untuk memuat seluruh evaluasi tersimpan, bisa difilter berdasarkan tipe.
2. Setiap baris bisa dibuka untuk melihat detail lengkap evaluasi.
3. Tombol Export CSV memanggil `GET /api/export` untuk mengunduh seluruh (atau hasil filter) riwayat sebagai file CSV.

## Skema Database

Aplikasi ini membutuhkan satu tabel bernama `evaluations` di Supabase (Postgres):

```sql
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  evaluation_type text not null check (evaluation_type in ('writing', 'speaking')),
  user_input text not null,
  overall_score numeric not null,
  grammar_feedback text,
  vocabulary_feedback text,
  fluency_feedback text,
  improvement_suggestion text,
  raw_result jsonb,
  audio_url text,
  model_used text,
  created_at timestamptz not null default now()
);
```

Selain tabel di atas, dibutuhkan satu Storage bucket (default bernama `audio-evaluations`) yang diset public, untuk menyimpan file audio dari evaluasi speaking.

## Environment Variables

Buat file `.env.local` di root proyek (tidak ikut ter-commit karena sudah masuk `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini

GROQ_API_KEY=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Menjalankan Secara Lokal

```
npm install
npm run dev
```

Buka `http://localhost:3000` di browser.
