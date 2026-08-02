from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(150), nullable=False)
    purchase_date = Column(String(50), nullable=False)
    total_amount = Column(Float, default=0.0)
    image_filename = Column(String(255), nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    category = Column(String(100), default="General")
    quantity = Column(Integer, default=1)
    cost_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    bill = relationship("Bill", back_populates="items")
