from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services import analytics_service

router = APIRouter(prefix="/api/dashboard", tags=["Business Health Dashboard Metrics"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard performance metrics (Financials, Inventory, AI Scores).
    """
    return analytics_service.get_dashboard_metrics(db)
