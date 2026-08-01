from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import BusinessProfile, LocalityProfile
from ..schemas import BusinessProfileCreate, BusinessProfileResponse
from ..services import ai_service

router = APIRouter(prefix="/api/business", tags=["Business Intelligence Onboarding"])

@router.post("/onboard", response_model=BusinessProfileResponse)
def onboard_business(data: BusinessProfileCreate, db: Session = Depends(get_db)):
    """
    Onboard or update business profile and locality details.
    """
    profile = db.query(BusinessProfile).first()
    if not profile:
        profile = BusinessProfile(
            business_name=data.business_name,
            category=data.category,
            years_in_operation=data.years_in_operation,
            employee_count=data.employee_count,
            monthly_revenue_range=data.monthly_revenue_range,
            store_size_sqft=data.store_size_sqft
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile.business_name = data.business_name
        profile.category = data.category
        profile.years_in_operation = data.years_in_operation
        profile.employee_count = data.employee_count
        profile.monthly_revenue_range = data.monthly_revenue_range
        profile.store_size_sqft = data.store_size_sqft

    if data.locality:
        loc = profile.locality
        if not loc:
            loc = LocalityProfile(
                business_id=profile.id,
                area_name=data.locality.area_name,
                city=data.locality.city,
                state=data.locality.state,
                population_estimate=data.locality.population_estimate,
                residential_density=data.locality.residential_density,
                nearby_schools=data.locality.nearby_schools,
                nearby_colleges=data.locality.nearby_colleges,
                nearby_offices=data.locality.nearby_offices,
                nearby_hospitals=data.locality.nearby_hospitals,
                nearby_tourist_spots=data.locality.nearby_tourist_spots,
                competitor_count=data.locality.competitor_count,
                target_customer_segment=data.locality.target_customer_segment,
                peak_sales_hours=data.locality.peak_sales_hours,
                most_demanded_products=data.locality.most_demanded_products
            )
            db.add(loc)
        else:
            loc.area_name = data.locality.area_name
            loc.city = data.locality.city
            loc.state = data.locality.state
            loc.population_estimate = data.locality.population_estimate
            loc.residential_density = data.locality.residential_density
            loc.nearby_schools = data.locality.nearby_schools
            loc.nearby_colleges = data.locality.nearby_colleges
            loc.nearby_offices = data.locality.nearby_offices
            loc.nearby_hospitals = data.locality.nearby_hospitals
            loc.nearby_tourist_spots = data.locality.nearby_tourist_spots
            loc.competitor_count = data.locality.competitor_count
            loc.target_customer_segment = data.locality.target_customer_segment
            loc.peak_sales_hours = data.locality.peak_sales_hours
            loc.most_demanded_products = data.locality.most_demanded_products

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/profile", response_model=BusinessProfileResponse)
def get_business_profile(db: Session = Depends(get_db)):
    """
    Get current business profile and locality information.
    Returns standard default profile if not yet onboarded.
    """
    profile = db.query(BusinessProfile).first()
    if not profile:
        profile = BusinessProfile(
            business_name="Mithra Super Mart",
            category="Kirana Store",
            years_in_operation=3,
            employee_count=2,
            monthly_revenue_range="₹1,50,000 - ₹3,00,000",
            store_size_sqft=650
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        loc = LocalityProfile(
            business_id=profile.id,
            area_name="Koramangala 4th Block",
            city="Bengaluru",
            state="Karnataka",
            population_estimate=18500,
            residential_density="High",
            nearby_schools=3,
            nearby_colleges=2,
            nearby_offices=8,
            nearby_hospitals=1,
            nearby_tourist_spots=0,
            competitor_count=2,
            target_customer_segment="Students, tech professionals, local families",
            peak_sales_hours="5 PM - 10 PM",
            most_demanded_products="Soft Drinks, Water Bottles, Chips, Biscuits, Dairy"
        )
        db.add(loc)
        db.commit()
        db.refresh(profile)

    return profile


@router.get("/market-intelligence")
def get_market_intelligence(db: Session = Depends(get_db)):
    """
    Fetch locality market analysis and recommendations.
    """
    profile = get_business_profile(db)
    b_dict = {
        "business_name": profile.business_name,
        "category": profile.category,
        "years_in_operation": profile.years_in_operation,
        "monthly_revenue_range": profile.monthly_revenue_range,
    }
    loc_dict = {}
    if profile.locality:
        loc_dict = {
            "area_name": profile.locality.area_name,
            "city": profile.locality.city,
            "nearby_colleges": profile.locality.nearby_colleges,
            "nearby_schools": profile.locality.nearby_schools,
            "nearby_offices": profile.locality.nearby_offices,
            "competitor_count": profile.locality.competitor_count,
            "target_customer_segment": profile.locality.target_customer_segment,
        }

    return ai_service.generate_market_intelligence(b_dict, loc_dict)
