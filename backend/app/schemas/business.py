from pydantic import BaseModel
from typing import Optional

class LocalityProfileCreate(BaseModel):
    area_name: str
    city: str
    state: str
    population_estimate: Optional[int] = 15000
    residential_density: Optional[str] = "High"
    nearby_schools: Optional[int] = 2
    nearby_colleges: Optional[int] = 1
    nearby_offices: Optional[int] = 5
    nearby_hospitals: Optional[int] = 1
    nearby_tourist_spots: Optional[int] = 0
    competitor_count: Optional[int] = 3
    target_customer_segment: Optional[str] = "Local residents, students, daily office workers"
    peak_sales_hours: Optional[str] = "5 PM - 9 PM"
    most_demanded_products: Optional[str] = "Milk, Biscuits, Packaged Water, Cool Drinks, Chips"

class LocalityProfileResponse(LocalityProfileCreate):
    id: int
    business_id: int

    class Config:
        from_attributes = True


class BusinessProfileCreate(BaseModel):
    business_name: str
    category: str
    years_in_operation: Optional[int] = 2
    employee_count: Optional[int] = 2
    monthly_revenue_range: Optional[str] = "₹1,00,000 - ₹3,00,000"
    store_size_sqft: Optional[int] = 500
    locality: Optional[LocalityProfileCreate] = None

class BusinessProfileResponse(BaseModel):
    id: int
    business_name: str
    category: str
    years_in_operation: int
    employee_count: int
    monthly_revenue_range: str
    store_size_sqft: int
    locality: Optional[LocalityProfileResponse] = None

    class Config:
        from_attributes = True
