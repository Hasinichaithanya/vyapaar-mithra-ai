from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ProductForecastItem(BaseModel):
    product_name: str
    current_stock: int
    predicted_demand: int
    recommended_order: int
    urgency: str  # High, Medium, Low
    reasoning: str

class ForecastResponse(BaseModel):
    id: int
    created_at: datetime
    period: str
    predictions_data: List[ProductForecastItem]
    reorder_suggestions: List[str]
    risk_alerts: List[str]
    confidence_score: float

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: int
    created_at: datetime
    category: str
    title: str
    description: str
    impact_level: str
    action_item: Optional[str] = None

    class Config:
        from_attributes = True
