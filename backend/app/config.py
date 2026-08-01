import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/vyapar_mithra.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

PROJECT_NAME = "Vyapaar Mithra AI API"
VERSION = "1.0.0"
