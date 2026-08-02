from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from .config import PROJECT_NAME, VERSION, UPLOADS_DIR
from .database import engine, Base, SessionLocal
from .services.bill_service import backfill_missing_content_hashes
from .api import (
    business_router,
    bill_router,
    inventory_router,
    forecast_router,
    chat_router,
    dashboard_router,
    seed_router,
)

# Auto-create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)


def _ensure_bill_content_hash_column() -> None:
    inspector = inspect(engine)
    if "bills" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("bills")}
    if "content_hash" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE bills ADD COLUMN content_hash VARCHAR(64)"))


_ensure_bill_content_hash_column()

with SessionLocal() as db:
    backfilled = backfill_missing_content_hashes(db, UPLOADS_DIR)
    if backfilled:
        print(f"[Startup] Backfilled content_hash for {backfilled} existing bill(s).")

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description="AI-Powered Business Intelligence Assistant API for Small Businesses (Vyapaar Mithra AI)"
)

# Allow CORS for independent frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include Routers
app.include_router(business_router)
app.include_router(bill_router)
app.include_router(inventory_router)
app.include_router(forecast_router)
app.include_router(chat_router)
app.include_router(dashboard_router)
app.include_router(seed_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "app": PROJECT_NAME,
        "version": VERSION,
        "docs_url": "/docs"
    }
