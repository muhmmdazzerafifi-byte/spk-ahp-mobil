# 🚗 Web SPK Pemilihan Mobil - Metode AHP (Analytic Hierarchy Process)

Aplikasi web modern, bersih, dan interaktif untuk **Sistem Pendukung Keputusan (SPK) Pemilihan Mobil Keluarga (MPV)** menggunakan metode **AHP (Analytic Hierarchy Process)**.

Data awal dan perhitungan dalam aplikasi ini **100% cocok dan terintegrasi** dengan lembar kerja Excel pada screenshot Anda (`AHP_PemilihanMobil`).

---

## 📸 Kesesuaian dengan Lembar Excel Anda

1. **Matriks Kriteria**:
   - Kriteria: **Style (S)**, **Keandalan (K)**, **Konsumsi BBM (B)**.
   - Nilai Perbandingan:
     - Style vs Keandalan = `0,500` (Keandalan vs Style = `2,000`)
     - Style vs BBM = `3,000` (BBM vs Style = `0,333`)
     - Keandalan vs BBM = `4,000` (BBM vs Keandalan = `0,250`)
   - Bobot Prioritas:
     - **Keandalan**: `0,557` (55,7%)
     - **Style**: `0,320` (32,0%)
     - **Konsumsi BBM**: `0,123` (12,3%)
   - Uji Konsistensi: $\lambda = 3,023$, $CI = 0,012$, $RI = 0,58$, $CR = 0,020$ $\le 0,1$ (**Konsisten** ✅).

2. **Matriks Alternatif untuk Kriteria Style**:
   - Alternatif: **Toyota Avanza**, **Daihatsu Xenia**, **Suzuki Ertiga**, **Grand Livina**.
   - Bobot yang dihasilkan:
     - Avanza: `0,133`
     - Xenia: `0,108`
     - Ertiga: `0,390`
     - Grand Livina: `0,369`
   - Uji Konsistensi: $\lambda = 4,393$, $CI = 0,131$, $RI = 0,90$, $CR = 0,146$ (**Tidak konsisten** / peringatan sesuai Excel Anda). Tersedia tombol interaktif **"Optimalkan Konsistensi"** jika ingin menjadikannya konsisten secara otomatis!

3. **Matriks Alternatif untuk Keandalan**:
   - Bobot yang dihasilkan:
     - Ertiga: `0,526`
     - Grand Livina: `0,273`
     - Avanza: `0,124`
     - Xenia: `0,077`
   - Uji Konsistensi: $\lambda = 4,171$, $CI = 0,057$, $RI = 0,90$, $CR = 0,063$ $\le 0,1$ (**Konsisten** ✅).

4. **Matriks Alternatif untuk Konsumsi BBM**:
   - Bobot yang dihasilkan:
     - Ertiga: `0,398`
     - Avanza: `0,305`
     - Xenia: `0,217`
     - Grand Livina: `0,081`
   - Uji Konsistensi: $\lambda = 4,119$, $CI = 0,040$, $RI = 0,90$, $CR = 0,044$ $\le 0,1$ (**Konsisten** ✅).

5. **Sintesis Akhir & Peringkat (Sheet Hasil)**:
   - 🥇 **Peringkat 1: Suzuki Ertiga** — Skor: **`0,467`** (46,7%)
   - 🥈 **Peringkat 2: Nissan Grand Livina** — Skor: **`0,280`** (28,0%)
   - 🥉 **Peringkat 3: Toyota Avanza** — Skor: **`0,149`** (14,9%)
   - 4️⃣ **Peringkat 4: Daihatsu Xenia** — Skor: **`0,104`** (10,4%)
   - Dilengkapi podium juara, diagram batang interaktif, dan rincian perkalian bobot.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dibuat secara **Client-side Single Page Application (SPA)** murni, sehingga tidak membutuhkan instalasi server atau dependensi rumit:

### Cara 1: Langsung Buka di Browser (Paling Mudah)
1. Buka folder:
   ```
   C:\Users\Asus\.gemini\antigravity\scratch\spk-ahp-mobil
   ```
2. Klik dua kali (*double click*) pada file **`index.html`** untuk membukanya di Google Chrome, Microsoft Edge, atau browser favorit Anda.

### Cara 2: Lewat PowerShell / Command Prompt
Jalankan perintah berikut:
```powershell
Start-Process "C:\Users\Asus\.gemini\antigravity\scratch\spk-ahp-mobil\index.html"
```

---

## ✨ Fitur-Fitur Utama

1. **Dashboard Hasil & Podium**:
   - Menampilkan mobil rekomendasi terbaik (Juara 1) secara menonjol.
   - Podium visual interaktif untuk Juara 1, 2, dan 3.
   - Tabel ranking lengkap dengan skor akhir dan persentase kontribusi.

2. **Grafik Interaktif (Chart.js)**:
   - **Bar Chart**: Visualisasi skor akhir AHP tiap alternatif.
   - **Radar Chart**: Menunjukkan keunggulan relatif masing-masing mobil di setiap kriteria (Style, Keandalan, BBM).

3. **Tabel Interaktif Mirip Excel**:
   - Bagian 1: Matriks Perbandingan Berpasangan (dapat diedit langsung, sel kebalikan $1/x$ terhitung otomatis).
   - Bagian 2: Normalisasi (Nilai / Total Kolom), P. Vektor, Bobot, dan Bobot $\times$ Total Kolom.
   - Bagian 3: Uji Konsistensi ($n$, $\lambda_{max}$, $CI$, $RI$, $CR$, dan badge status Konsisten/Tidak Konsisten).

4. **Fitur Pendukung**:
   - 🔄 **Reset ke Excel**: Mengembalikan seluruh data ke angka awal persis screenshot lembar kerja Anda kapan saja.
   - 🖨️ **Cetak / Ekspor PDF**: Tampilan ramah cetak (print stylesheet) yang rapi untuk tugas kuliah, skripsi, atau laporan pengambilan keputusan.
   - 📖 **Panduan Teori & Skala Saaty**: Penjelasan lengkap skala nilai Saaty 1-9, tabel Random Index (RI), dan rumus matematika AHP.

---

## 📁 Struktur Berkas

- `index.html` : Struktur antarmuka web, navigasi tab, dan layout kartu dashboard.
- `style.css` : Desain modern glassmorphism, styling tabel ala Excel, animasi, dan format cetak.
- `ahp.js` : Mesin kalkulasi matematis murni metode AHP (normalisasi, eigenvector, eigenvalue, CI, RI, CR).
- `app.js` : Logika interaksi, perbaruan real-time, grafik Chart.js, dan sinkronisasi data.
- `README.md` : Dokumentasi lengkap aplikasi.
