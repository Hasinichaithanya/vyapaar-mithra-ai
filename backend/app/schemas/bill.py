from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BillItemCreate(BaseModel):
    product_name: str
    category: Optional[str] = "General"
    quantity: int
    cost_price: float
    total_price: Optional[float] = None

class BillItemResponse(BillItemCreate):
    id: int
    bill_id: int
    total_price: float

    class Config:
        from_attributes = True

class BillCreate(BaseModel):
    supplier_name: str
    purchase_date: str
    total_amount: float
    notes: Optional[str] = None
    items: List[BillItemCreate] = []

class BillResponse(BaseModel):
    id: int
    supplier_name: str
    purchase_date: str
    total_amount: float
    image_filename: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True
