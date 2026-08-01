from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ForecastResponse
from ..services import forecast_engine

router = APIRouter(prefix="/api/forecast", tags=["AI Demand Forecasting"])

@router.get("/predict", response_model=ForecastResponse)
def get_demand_forecast(db: Session = Depends(get_db)):
    """
    Returns weekly AI demand predictions, reorder quantities, and stockout risk predictions.
    """
    res = forecast_engine.generate_demand_forecast(db)
    # Add dummy ID for response validation schema
    res["id"] = 1
    return res
