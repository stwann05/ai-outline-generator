"""
AI Outline Generator — Flask Backend
Memanggil model AI lewat watsonx.ai SDK untuk membuat outline
tugas/presentasi/proposal/konten kreatif berdasarkan topik dan jenis dokumen.
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

# Values must match DOCUMENT_TYPE_OPTIONS in frontend/src/components/OutlineForm.jsx
VALID_JENIS_TUGAS = {"essay", "report", "research_paper", "proposal", "thesis", "presentation"}

# Presentation leans more creative/visual than pure academic writing
JENIS_TUGAS_KREATIF = {"presentation"}

PROMPT_TEMPLATE_AKADEMIK = (
    'Create a structured outline for a {jenis_tugas} on the topic "{topik}". '
    "Provide 4-6 main sections, each with 2-4 relevant and specific sub-topic points."
    "{instructions_block}"
    " Answer ONLY in valid JSON format, with no additional text, using the structure: "
    '{{"judul": "", "bagian": [{{"heading": "", "poin": ["", ""]}}]}}'
)

PROMPT_TEMPLATE_KREATIF = (
    'Create a creative and engaging outline for a {jenis_tugas} on the topic "{topik}". '
    "Provide 4-6 main sections that are exploratory (can include visual concepts, "
    "story structure, or content flow), each with 2-4 specific idea points that inspire."
    "{instructions_block}"
    " Answer ONLY in valid JSON format, with no additional text, using the structure: "
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

    topik        = (body.get("topik") or "").strip()
    jenis_tugas  = (body.get("jenis_tugas") or "").strip().lower()
    instructions = (body.get("instructions") or "").strip()

    errors = []
    if not topik:
        errors.append("'topik' is required and must not be empty.")
    if not jenis_tugas:
        errors.append("'jenis_tugas' is required and must not be empty.")
    elif jenis_tugas not in VALID_JENIS_TUGAS:
        errors.append(
            f"'jenis_tugas' must be one of: {', '.join(sorted(VALID_JENIS_TUGAS))}."
        )

    if errors:
        logger.info("Request ditolak (validasi gagal): %s", " ".join(errors))
        return jsonify({"success": False, "error": " ".join(errors)}), 400

    is_kreatif = jenis_tugas in JENIS_TUGAS_KREATIF
    template   = PROMPT_TEMPLATE_KREATIF if is_kreatif else PROMPT_TEMPLATE_AKADEMIK
    temperature = 0.6 if is_kreatif else 0.3

    # Build optional instructions block injected into the prompt
    instructions_block = (
        f" Additional instructions: {instructions}" if instructions else ""
    )

    prompt = template.format(
        jenis_tugas=jenis_tugas,
        topik=topik,
        instructions_block=instructions_block,
    )

    logger.info(
        "Request masuk: topik=%r jenis_tugas=%r instructions=%r",
        topik, jenis_tugas, instructions or "(none)",
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
