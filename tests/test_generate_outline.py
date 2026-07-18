"""
Unit tests untuk endpoint POST /generate-outline.

Semua panggilan ke watsonx.ai di-mock sehingga test bisa berjalan
tanpa credentials asli.
"""

import json
import pytest
from unittest.mock import patch, MagicMock

# Pastikan modul app dapat diimpor tanpa credentials .env yang nyata
import os
os.environ.setdefault("WATSONX_API_KEY", "test-key")
os.environ.setdefault("WATSONX_PROJECT_ID", "test-project")
os.environ.setdefault("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

from app import app  # noqa: E402


@pytest.fixture
def client():
    """Flask test client dengan mode testing aktif."""
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ── Contoh respons outline valid yang akan dikembalikan oleh mock ─────────────
MOCK_OUTLINE = {
    "judul": "Dampak Media Sosial terhadap Produktivitas Mahasiswa",
    "bagian": [
        {
            "heading": "Pendahuluan",
            "poin": [
                "Latar belakang penggunaan media sosial di kalangan mahasiswa",
                "Rumusan masalah dan tujuan penelitian",
            ],
        },
        {
            "heading": "Tinjauan Pustaka",
            "poin": [
                "Definisi produktivitas akademik",
                "Teori penggunaan media sosial",
                "Penelitian terdahulu yang relevan",
            ],
        },
        {
            "heading": "Metodologi",
            "poin": [
                "Desain penelitian kuantitatif",
                "Populasi dan sampel",
                "Instrumen pengumpulan data",
            ],
        },
        {
            "heading": "Pembahasan",
            "poin": [
                "Analisis pengaruh durasi penggunaan terhadap nilai akademik",
                "Perbedaan dampak per platform media sosial",
            ],
        },
        {
            "heading": "Kesimpulan",
            "poin": [
                "Ringkasan temuan utama",
                "Saran untuk penelitian selanjutnya",
            ],
        },
    ],
}


class TestGenerateOutline:
    """Uji endpoint POST /generate-outline."""

    @patch("app.build_watsonx_client")
    def test_returns_valid_json_outline(self, mock_build, client):
        """Endpoint harus mengembalikan success=True dan data outline berformat benar."""
        # Siapkan mock: generate_text mengembalikan JSON string dari MOCK_OUTLINE
        mock_model = MagicMock()
        mock_model.generate_text.return_value = json.dumps(MOCK_OUTLINE)
        mock_build.return_value = mock_model

        resp = client.post(
            "/generate-outline",
            json={
                "topik": "Dampak Media Sosial terhadap Produktivitas Mahasiswa",
                "matkul": "Psikologi Pendidikan",
                "jenis_tugas": "esai",
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "data" in data
        assert "judul" in data["data"]
        assert "bagian" in data["data"]
        assert isinstance(data["data"]["bagian"], list)
        assert len(data["data"]["bagian"]) > 0

    def test_missing_topik_returns_400(self, client):
        """Jika 'topik' kosong, harus mengembalikan HTTP 400."""
        resp = client.post(
            "/generate-outline",
            json={"topik": "", "matkul": "Psikologi", "jenis_tugas": "esai"},
        )
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False

    def test_invalid_jenis_tugas_returns_400(self, client):
        """Jika jenis_tugas bukan nilai yang diizinkan, harus mengembalikan HTTP 400."""
        resp = client.post(
            "/generate-outline",
            json={"topik": "Topik", "matkul": "Matkul", "jenis_tugas": "skripsi"},
        )
        assert resp.status_code == 400
        body = resp.get_json()
        assert body["success"] is False
        assert "jenis_tugas" in body["error"]

    def test_missing_body_returns_400(self, client):
        """Request tanpa body JSON harus mengembalikan HTTP 400."""
        resp = client.post("/generate-outline", content_type="application/json", data="")
        assert resp.status_code == 400

    @patch("app.build_watsonx_client")
    def test_model_returns_text_with_extra_content(self, mock_build, client):
        """Endpoint harus tetap berhasil meski model menyertakan teks di luar JSON."""
        noisy_response = "Berikut outline yang diminta:\n" + json.dumps(MOCK_OUTLINE) + "\nSemoga membantu!"
        mock_model = MagicMock()
        mock_model.generate_text.return_value = noisy_response
        mock_build.return_value = mock_model

        resp = client.post(
            "/generate-outline",
            json={"topik": "Topik", "matkul": "Matkul", "jenis_tugas": "proposal"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["success"] is True
