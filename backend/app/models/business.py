from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)  # Kirana, Medical, Bakery, Hardware, Stationery, etc.
    years_in_operation = Column(Integer, default=1)
    employee_count = Column(Integer, default=1)
    monthly_revenue_range = Column(String(50), default="₹50,000 - ₹1,000,000")
    store_size_sqft = Column(Integer, default=500)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    locality = relationship("LocalityProfile", back_populates="business", uselist=False, cascade="all, delete-orphan")


class LocalityProfile(Base):
    __tablename__ = "locality_profiles"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=False)
    area_name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    population_estimate = Column(Integer, default=15000)
    residential_density = Column(String(50), default="High")  # High, Medium, Low
    nearby_schools = Column(Integer, default=2)
    nearby_colleges = Column(Integer, default=1)
    nearby_offices = Column(Integer, default=5)
    nearby_hospitals = Column(Integer, default=1)
    nearby_tourist_spots = Column(Integer, default=0)
    competitor_count = Column(Integer, default=3)
    target_customer_segment = Column(String(200), default="Local residents, students, daily office workers")
    peak_sales_hours = Column(String(100), default="5 PM - 9 PM")
    most_demanded_products = Column(Text, default="Milk, Biscuits, Packaged Water, Cool Drinks, Chips")

    business = relationship("BusinessProfile", back_populates="locality")
