"""
AI Outline Generator — Flask Backend
Memanggil model AI lewat watsonx.ai SDK untuk membuat outline
tugas/presentasi/proposal/konten kreatif berdasarkan topik, mata kuliah,
dan konteks tambahan yang diberikan mahasiswa.
"""

import json
import logging
import re
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

VALID_JENIS_TUGAS = {"esai", "presentasi", "proposal", "konten kreatif", "storyboard"}
JENIS_TUGAS_KREATIF = {"konten kreatif", "storyboard"}

# ── Template prompt — sekarang menerima instructions_block untuk konteks tambahan ──
PROMPT_TEMPLATE_AKADEMIK = (
    'Buat outline terstruktur untuk {jenis_tugas} dengan topik "{topik}" '
    "pada mata kuliah {matkul}.{instructions_block} Berikan 4-6 bagian utama, "
    "masing-masing dengan 2-4 poin sub-topik yang relevan dan spesifik, "
    "disesuaikan dengan konteks yang diberikan. "
    'Jawab HANYA dalam format JSON valid, tanpa teks tambahan, dengan struktur: '
    '{{"judul": "", "bagian": [{{"heading": "", "poin": ["", ""]}}]}}'
)

PROMPT_TEMPLATE_KREATIF = (
    'Buat outline {jenis_tugas} yang kreatif dan menarik dengan topik "{topik}" '
    "untuk konteks {matkul}.{instructions_block} Berikan 4-6 bagian utama yang "
    "eksploratif (bisa berupa alur cerita, konsep visual, atau struktur konten), "
    "masing-masing dengan 2-4 poin ide spesifik yang bisa menginspirasi. "
    'Jawab HANYA dalam format JSON valid, tanpa teks tambahan, dengan struktur: '
    '{{"judul": "", "bagian": [{{"heading": "", "poin": ["", ""]}}]}}'
)


def build_watsonx_client(temperature: float) -> ModelInference:
    """
    Buat instance ModelInference yang tersambung ke watsonx.ai.
    temperature: 0.3 untuk jenis akademik (presisi), 0.6 untuk jenis kreatif (variatif).
    """
    credentials = Credentials(
        url=os.environ["WATSONX_URL"],
        api_key=os.environ["WATSONX_API_KEY"],
    )

    params = {
        GenParams.MAX_NEW_TOKENS: 1024,
        GenParams.TEMPERATURE: temperature,
        GenParams.TOP_P: 0.9,
    }

    model = ModelInference(
        model_id="mistralai/mistral-small-3-1-24b-instruct-2503",
        params=params,
        credentials=credentials,
        project_id=os.environ["WATSONX_PROJECT_ID"],
    )
    return model


def extract_json_from_text(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Respons model tidak mengandung JSON yang valid.")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/generate-outline", methods=["POST"])
def generate_outline():
    body = request.get_json(silent=True) or {}

    topik = (body.get("topik") or "").strip()
    matkul = (body.get("matkul") or "").strip()
    jenis_tugas = (body.get("jenis_tugas") or "").strip().lower()
    # Field baru — opsional, untuk memperjelas konteks spesifik (mis. "proposal skripsi psikologi")
    instructions = (body.get("instructions") or "").strip()

    # matkul opsional — fallback ke "umum" jika tidak diisi (sesuai frontend)
    if not matkul:
        matkul = "umum"

    errors = []
    if not topik:
        errors.append("'topik' wajib diisi dan tidak boleh kosong.")
    if not jenis_tugas:
        errors.append("'jenis_tugas' wajib diisi dan tidak boleh kosong.")
    elif jenis_tugas not in VALID_JENIS_TUGAS:
        errors.append(
            f"'jenis_tugas' harus salah satu dari: {', '.join(sorted(VALID_JENIS_TUGAS))}."
        )

    if errors:
        logger.info("Request ditolak (validasi gagal): %s", " ".join(errors))
        return jsonify({"success": False, "error": " ".join(errors)}), 400

    is_kreatif = jenis_tugas in JENIS_TUGAS_KREATIF
    template = PROMPT_TEMPLATE_KREATIF if is_kreatif else PROMPT_TEMPLATE_AKADEMIK
    temperature = 0.6 if is_kreatif else 0.3

    instructions_block = f" Konteks spesifik: {instructions}." if instructions else ""

    prompt = template.format(
        jenis_tugas=jenis_tugas,
        topik=topik,
        matkul=matkul,
        instructions_block=instructions_block,
    )

    logger.info(
        "Request masuk: topik=%r matkul=%r jenis_tugas=%r instructions=%r",
        topik, matkul, jenis_tugas, instructions,
    )

    try:
        model = build_watsonx_client(temperature)
        response = model.generate_text(prompt=prompt)
        outline_data = extract_json_from_text(response)

    except KeyError as exc:
        logger.error("Konfigurasi credentials tidak lengkap: %s", exc)
        return jsonify(
            {"success": False, "error": f"Konfigurasi credentials tidak lengkap: {exc}"}
        ), 500
    except ValueError as exc:
        logger.error("Gagal parsing JSON dari model: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
    except Exception as exc:  # noqa: BLE001
        logger.error("Kesalahan watsonx.ai: %s", exc)
        return jsonify(
            {"success": False, "error": f"Terjadi kesalahan saat memanggil watsonx.ai: {exc}"}
        ), 500

    logger.info("Request berhasil: judul=%r", outline_data.get("judul"))
    return jsonify({"success": True, "data": outline_data}), 200


if __name__ == "__main__":
    app.run(debug=True)