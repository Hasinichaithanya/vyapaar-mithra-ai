from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime
from ..database import Base

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    period = Column(String(50), default="Next Week")
    predictions_data = Column(JSON, nullable=False)  # JSON array of product demand predictions
    reorder_suggestions = Column(JSON, nullable=False)  # JSON array of reorder suggestions
    risk_alerts = Column(JSON, nullable=True)  # JSON array of risk predictions
    confidence_score = Column(Float, default=88.5)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50), default="General")  # Festival, Seasonal, Locality, Pricing
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    impact_level = Column(String(50), default="High")  # High, Medium, Low
    action_item = Column(Text, nullable=True)
