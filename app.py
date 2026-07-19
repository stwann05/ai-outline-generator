"""
AI Outline Generator — Flask Backend
Memanggil model IBM Granite lewat watsonx.ai SDK untuk membuat outline
tugas/presentasi/proposal berdasarkan topik dan mata kuliah.
"""

import json
import re
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# Muat credentials dari .env
load_dotenv()

app = Flask(__name__)
CORS(app)  # Izinkan akses dari frontend (semua origin)

# ── Nilai yang boleh diisi untuk jenis_tugas ──────────────────────────────────
VALID_JENIS_TUGAS = {"essay", "report", "research_paper", "proposal", "thesis", "presentation"}

# ── Template prompt ───────────────────────────────────────────────────────────
PROMPT_TEMPLATE = (
    'Create a structured outline for a {jenis_tugas} on the topic "{topik}". '
    "Provide 4-6 main sections, each with 2-4 relevant and specific sub-topic points."
    "{instructions_block}"
    " Reply ONLY with valid JSON, no extra text, using this structure: "
    '{{"judul": "", "bagian": [{{"heading": "", "poin": ["", ""]}}]}}'
)


def build_watsonx_client() -> ModelInference:
    """
    Buat instance ModelInference yang tersambung ke watsonx.ai.

    Ganti nilai 'model_id' di sini jika ingin menggunakan model Granite lain
    (mis. 'ibm/granite-13b-instruct-v2' atau model custom).
    Sesuaikan juga parameter GenParams di bawah jika perlu mengubah
    panjang output (max_new_tokens) atau kreativitas (temperature, top_p).
    """
    credentials = Credentials(
        url=os.environ["WATSONX_URL"],
        api_key=os.environ["WATSONX_API_KEY"],
    )
    client = APIClient(credentials)

    # ── Parameter generasi — sesuaikan sesuai kebutuhan ──────────────────────
    params = {
        GenParams.MAX_NEW_TOKENS: 1024,
        GenParams.TEMPERATURE: 0.3,       # Lebih rendah = lebih deterministik
        GenParams.TOP_P: 0.9,
    }

    model = ModelInference(
        model_id="mistralai/mistral-small-3-1-24b-instruct-2503",   # ← ganti model di sini
        params=params,
        credentials=credentials,
        project_id=os.environ["WATSONX_PROJECT_ID"],
    )
    return model


def extract_json_from_text(text: str) -> dict:
    """
    Coba parsing teks langsung; jika gagal, cari blok JSON pertama
    yang valid menggunakan regex. Melempar ValueError jika tidak ada JSON valid.
    """
    text = text.strip()

    # Coba parsing langsung terlebih dahulu
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Cari substring JSON pertama: mulai dari '{' hingga '}' penutup yang cocok
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Respons model tidak mengandung JSON yang valid.")


@app.route("/generate-outline", methods=["POST"])
def generate_outline():
    # ── 1. Validasi input ─────────────────────────────────────────────────────
    body = request.get_json(silent=True) or {}

    topik = (body.get("topik") or "").strip()
    jenis_tugas = (body.get("jenis_tugas") or "").strip().lower()
    instructions = (body.get("instructions") or "").strip()

    errors = []
    if not topik:
        errors.append("'topik' is required and cannot be empty.")
    if not jenis_tugas:
        errors.append("'jenis_tugas' is required and cannot be empty.")
    elif jenis_tugas not in VALID_JENIS_TUGAS:
        errors.append(
            f"'jenis_tugas' must be one of: {', '.join(sorted(VALID_JENIS_TUGAS))}."
        )

    if errors:
        return jsonify({"success": False, "error": " ".join(errors)}), 400

    # ── 2. Susun prompt ───────────────────────────────────────────────────────
    instructions_block = (
        f" Additional instructions: {instructions}." if instructions else ""
    )
    prompt = PROMPT_TEMPLATE.format(
        jenis_tugas=jenis_tugas,
        topik=topik,
        instructions_block=instructions_block,
    )

    try:
        # ── 3. Panggil watsonx.ai ─────────────────────────────────────────────
        model = build_watsonx_client()
        response = model.generate_text(prompt=prompt)

        # ── 4. Parse respons menjadi JSON ────────────────────────────────────
        outline_data = extract_json_from_text(response)

    except KeyError as exc:
        return jsonify(
            {"success": False, "error": f"Konfigurasi credentials tidak lengkap: {exc}"}
        ), 500
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 500
    except Exception as exc:  # noqa: BLE001
        return jsonify(
            {"success": False, "error": f"Terjadi kesalahan saat memanggil watsonx.ai: {exc}"}
        ), 500

    # ── 5. Kembalikan hasil ───────────────────────────────────────────────────
    return jsonify({"success": True, "data": outline_data}), 200


if __name__ == "__main__":
    app.run(debug=True)
