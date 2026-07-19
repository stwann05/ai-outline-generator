# Smart Creativity: AI Outline Generator

> Kolaborasi mahasiswa dan AI untuk mengubah ide mentah menjadi outline terstruktur — tanpa menggantikan proses berpikir kreatif mahasiswa.

Dibuat untuk **AI Builders Challenge with IBM Bob** — Juli 2026, tema *"Reimagine Creative Industries with AI"*.

---

## 🎯 Masalah yang Diselesaikan

Mahasiswa sering mengalami *creative block* saat memulai tugas akademik maupun proyek kreatif — esai, presentasi, proposal, hingga konten kreatif seperti storyboard atau video. Titik paling frustrasi bukan di eksekusi, tapi di **awal**: mencari ide, mengembangkan konsep, dan menyusun struktur yang jelas sebelum mulai menulis.

**AI Outline Generator** hadir sebagai *creative partner* — bukan pengganti proses berpikir mahasiswa, tapi akselerator yang membantu mereka menemukan struktur lebih cepat, lalu tetap memberi ruang penuh untuk mengedit, menambah, dan menyesuaikan hasilnya sesuai gaya masing-masing.

## ✨ Fitur Utama

- **Generate outline otomatis** dari topik, mata kuliah, dan jenis tugas (esai, presentasi, proposal, konten kreatif, storyboard)
- **Edit inline** — klik langsung pada heading atau poin manapun untuk mengedit tanpa keluar dari tampilan
- **Tambah bagian/poin manual** — outline dari AI adalah titik awal, bukan hasil final
- **Export multi-format** — Copy ke clipboard, Download Markdown (.md), atau Download PDF (.pdf)
- **Parameter kreativitas adaptif** — jenis tugas akademik menggunakan model dengan output lebih presisi, jenis tugas kreatif menggunakan parameter yang lebih eksploratif

## 🧠 Proses Design Thinking

Project ini dikembangkan melalui proses design thinking penuh sebelum masuk ke tahap build:

1. **Empathize** — riset ke target user (mahasiswa) untuk memahami titik frustrasi dalam proses kreatif
2. **Define** — problem statement: mahasiswa kesulitan menemukan & mengembangkan ide saat mengerjakan tugas akademik maupun proyek kreatif
3. **Ideate** — eksplorasi 4 arah solusi, dengan AI outline generator terpilih sebagai solusi paling feasible dan berdampak
4. **Prototype & Test** — alur input → AI analisis → opsi outline → user edit → outline final, divalidasi ke pengguna nyata

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Python 3.11, Flask |
| AI Model | IBM watsonx.ai (Mistral Small 3.1 24B Instruct) |
| Frontend | React (Vite) |
| Dev Tool | **IBM Bob** — digunakan sepanjang siklus development |

## 🤖 Bagaimana IBM Bob Digunakan

IBM Bob berperan sebagai *coding partner* di sepanjang proses development:

- **Backend**: Bob membantu menyusun struktur endpoint Flask, integrasi dengan watsonx.ai SDK, error handling, dan logika parsing response AI menjadi JSON terstruktur
- **Frontend**: Bob membantu membangun komponen React (form input, hasil outline dengan edit inline, skeleton loading, fitur export)
- **Iterasi**: Bob digunakan untuk debugging integrasi model AI, penyesuaian parameter generasi (temperature) berdasarkan jenis tugas, dan penambahan fitur inkremental (jenis tugas kreatif, export multi-format)

Setiap anggota tim menyelesaikan learning activity IBM SkillsBuild terkait IBM Bob sebagai bagian dari proses onboarding sebelum development dimulai.

## 🚀 Cara Menjalankan

### Prasyarat
- Python 3.11 (bukan versi release candidate seperti 3.13.0rc, karena beberapa dependency belum full-support)
- Node.js (untuk frontend)
- Akun IBM Cloud dengan akses watsonx.ai

### Backend

```bash
# Buat virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux

# Install dependency
pip install -r requirements.txt

# Setup environment variable
copy .env.example .env
# Isi .env dengan WATSONX_API_KEY, WATSONX_PROJECT_ID, WATSONX_URL

# Jalankan server
python app.py
```

Server berjalan di `http://127.0.0.1:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

## 📡 API Reference

### `POST /generate-outline`

**Request body:**
```json
{
  "topik": "Dampak media sosial terhadap produktivitas mahasiswa",
  "matkul": "Psikologi Komunikasi",
  "jenis_tugas": "esai"
}
```

Nilai valid `jenis_tugas`: `esai`, `presentasi`, `proposal`, `konten kreatif`, `storyboard`

**Response sukses (200):**
```json
{
  "success": true,
  "data": {
    "judul": "...",
    "bagian": [
      {"heading": "...", "poin": ["...", "..."]}
    ]
  }
}
```

### `GET /health`

Cek status server tanpa memanggil watsonx.ai.

## 👥 Tim

- [Nama anggota 1]
- [Nama anggota 2]
- [dst.]

## 📄 Lisensi

Project ini dibuat untuk keperluan AI Builders Challenge with IBM Bob, Juli 2026.