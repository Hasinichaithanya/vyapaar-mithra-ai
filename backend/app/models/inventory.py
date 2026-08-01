from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class InventoryScan(Base):
    __tablename__ = "inventory_scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_date = Column(DateTime, default=datetime.utcnow)
    image_filename = Column(String(255), nullable=True)
    total_items_detected = Column(Integer, default=0)
    stock_health_score = Column(Float, default=85.0)
    notes = Column(Text, nullable=True)

    items = relationship("InventoryItem", back_populates="scan", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("inventory_scans.id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    category = Column(String(100), default="General")
    quantity_detected = Column(Integer, default=0)
    min_required = Column(Integer, default=20)
    max_threshold = Column(Integer, default=100)
    estimated_unit_price = Column(Float, default=50.0)
    stock_status = Column(String(50), default="Optimal")  # Low Stock, Optimal, Overstocked
    turnover_speed = Column(String(50), default="Fast Moving")  # Fast Moving, Slow Moving, Dead Stock

    scan = relationship("InventoryScan", back_populates="items")
