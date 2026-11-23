# Dashboard Otomasi Toko (template)

Template Chrome extension dengan satu dashboard untuk menjalankan otomasi
toko: sync stok ke semua tempat jualan, alarm stok menipis, riwayat, dan
cadangan data. Dibuat untuk dikembangkan oleh **AI coding agent** (Claude
Code, Codex, Antigravity) dari sebuah *rancangan otomasi*.

- **Tanpa API key dan tanpa setting Google.** Extension bekerja di halaman
  penjual yang sudah kamu buka dan login di Chrome.
- **Data di komputermu sendiri** (local-first). Tidak ada yang dikirim ke
  internet.
- **Semua dikendalikan dari dashboard**, dengan tampilan yang mudah untuk
  pemula.
- Isinya data contoh fiktif: Toko Kue Ani, dengan tempat jualan simulasi.

## Cara pakai dengan AI coding agent

1. Ambil template ini ke komputermu. Paling mudah, tempel ini ke agent-mu:
   > Ambil template github.com/isnandev/dashboard-otomasi-toko ke folder baru
   > bernama tools-toko. Kalau git tidak ada di komputerku, unduh ZIP-nya lalu
   > ekstrak. Setelah itu jalankan npm install dan npm run build.

   Tanpa agent: tombol **Code → Download ZIP** di GitHub, lalu ekstrak. Tidak
   perlu git.
2. Buka foldernya di agent-mu (Claude Code, Codex, atau Antigravity).
3. Tempel rancangan otomasimu, lalu tulis:
   > Bangun rancangan ini di atas template ini. Ikuti AGENTS.md.
4. Agent akan bertanya kalau ada yang kurang jelas. Jawab dengan bahasa
   sehari-hari.

Aturan untuk agent ada di [AGENTS.md](AGENTS.md). Claude Code membaca
`CLAUDE.md`, yang menunjuk ke file yang sama.

Skill yang sudah disertakan di `.claude/skills/`:
- **bangun-dari-rancangan:** membangun rancanganmu di atas template ini,
  langkah demi langkah.
- **semantic-debugging:** mencari penyebab masalah dari laporanmu, termasuk
  saat tampilan marketplace berubah.
- **react-best-practices:** dari Vercel (lisensi MIT), supaya kode React-nya
  rapi.

## Memasang di Chrome

1. Jalankan `npm install`, lalu `npm run build`. Hasilnya ada di folder `dist`.
2. Buka `chrome://extensions` dan nyalakan **Developer mode** (sekali saja).
3. Klik **Load unpacked**, lalu pilih folder `dist`.
4. Dashboard terbuka otomatis. Untuk membukanya lagi, klik ikon extension.

Setiap kali agent mengubah kode: jalankan `npm run build`, lalu tekan ikon
muat ulang pada extension di `chrome://extensions`.

## Mencoba tanpa memasang

`npm run dev`, lalu buka `http://localhost:5173/dashboard.html`. Semua tombol
bisa dicoba dengan tempat jualan simulasi.

## Impor stok

Halaman **Stok** → **Impor dari file CSV**. Contoh formatnya ada di
[contoh-impor.csv](contoh-impor.csv). Kolom `sumber` diisi `sendiri`,
`supplier`, atau `dropship`.

## Batas yang perlu diketahui

- Otomasi hanya jalan selama Chrome terbuka.
- Kalau tampilan halaman marketplace berubah, extension bisa berhenti. Tekan
  **Salin laporan untuk agent** di Riwayat, lalu minta agent memperbaikinya.
- Cek syarat dan ketentuan tiap marketplace soal otomasi halaman penjual.
- Data hanya ada di komputer ini: buat cadangan seminggu sekali (halaman Stok
  → **Buat cadangan**).

## Teknologi

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, IndexedDB (`idb`), Chrome
Extension Manifest V3.
