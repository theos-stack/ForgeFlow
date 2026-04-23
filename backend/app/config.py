import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH, override=True)

APP_NAME = os.getenv("APP_NAME", "ForgeFlow AI")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY_CONFIGURED = bool(os.getenv("OPENAI_API_KEY"))
raw_output_dir = os.getenv("OUTPUT_DIR", "outputs")
OUTPUT_DIR = raw_output_dir if os.path.isabs(raw_output_dir) else str(BASE_DIR / raw_output_dir)
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_URI_CONFIGURED = bool(MONGODB_URI)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "forgeflow_ai")
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3010,http://127.0.0.1:3010"
    ).split(",")
    if origin.strip()
]
