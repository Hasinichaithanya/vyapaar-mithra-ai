from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    product_name: str
    category: Optional[str] = "General"
    quantity_detected: int
    min_required: Optional[int] = 20
    max_threshold: Optional[int] = 100
    estimated_unit_price: Optional[float] = 50.0
    stock_status: Optional[str] = "Optimal"
    turnover_speed: Optional[str] = "Fast Moving"

class InventoryItemResponse(InventoryItemCreate):
    id: int
    scan_id: int

    class Config:
        from_attributes = True

class InventoryScanCreate(BaseModel):
    total_items_detected: Optional[int] = 0
    stock_health_score: Optional[float] = 85.0
    notes: Optional[str] = None
    items: List[InventoryItemCreate] = []

class InventoryScanResponse(BaseModel):
    id: int
    scan_date: datetime
    image_filename: Optional[str] = None
    total_items_detected: int
    stock_health_score: float
    notes: Optional[str] = None
    items: List[InventoryItemResponse] = []

    class Config:
        from_attributes = True
