from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
from ..database import get_db
from ..models import (
    Bill, BillItem, 
    InventoryScan, InventoryItem, 
    BusinessProfile, LocalityProfile
)

router = APIRouter(prefix="/api/seed", tags=["AI Training & Backend Seeder"])

@router.post("/generate-data")
def generate_preset_training_data(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Clears current tables and seeds realistic business datasets for Kirana, Pharmacy, Bakery, or Supermarket.
    """
    store_type = payload.get("store_type", "kirana").lower()

    # Clear existing database tables
    db.query(BillItem).delete()
    db.query(Bill).delete()
    db.query(InventoryItem).delete()
    db.query(InventoryScan).delete()
    db.query(LocalityProfile).delete()
    db.query(BusinessProfile).delete()
    db.commit()

    # Preset datasets by store type
    if store_type == "pharmacy":
        b_name = "Arogya Medical & General Pharmacy"
        cat = "Medical & Pharmacy"
        inv_data = [
            ("Paracetamol 650mg (Strip)", "Medicines", 120, 30, 200, 30.0, "Optimal", "Fast Moving"),
            ("Cough Syrup 100ml", "Medicines", 15, 40, 100, 85.0, "Low Stock", "Fast Moving"),
            ("Vitamin C Tablets 500mg", "Supplements", 80, 20, 150, 120.0, "Optimal", "Fast Moving"),
            ("N95 Face Masks (Box)", "Healthcare", 6, 25, 80, 250.0, "Low Stock", "Fast Moving"),
            ("Digital Thermometer", "Devices", 25, 10, 50, 350.0, "Optimal", "Slow Moving"),
            ("Hand Sanitizer 500ml", "Hygiene", 45, 15, 80, 180.0, "Optimal", "Fast Moving"),
            ("Antiseptic Liquid 250ml", "Hygiene", 10, 20, 60, 95.0, "Low Stock", "Fast Moving"),
            ("Bandages & Gauze Pack", "First Aid", 95, 20, 100, 45.0, "Overstocked", "Slow Moving"),
        ]
        supplier = "Apollo Pharma Wholesalers"
        bills_data = [
            ("Pharma Distro Ltd", "2026-07-25", 65000.0),
            ("MedLife Supplies", "2026-07-18", 42000.0),
        ]
    elif store_type == "bakery":
        b_name = "Royal Bakers & Confectionery"
        cat = "Bakery & Cafe"
        inv_data = [
            ("Fresh Butter Bread 400g", "Bakery", 12, 35, 80, 40.0, "Low Stock", "Fast Moving"),
            ("Chocolate Cream Cake 500g", "Cakes", 8, 15, 40, 350.0, "Low Stock", "Fast Moving"),
            ("Fruit Cupcakes (Pack of 4)", "Confectionery", 30, 10, 50, 120.0, "Optimal", "Fast Moving"),
            ("Veg Puff / Patties", "Snacks", 45, 20, 80, 25.0, "Optimal", "Fast Moving"),
            ("Cold Coffee 250ml", "Beverages", 50, 15, 60, 60.0, "Optimal", "Fast Moving"),
            ("Assorted Cookies 500g", "Biscuits", 75, 15, 50, 180.0, "Overstocked", "Slow Moving"),
            ("Garlic Bread Rusk", "Bakery", 60, 10, 40, 55.0, "Overstocked", "Slow Moving"),
        ]
        bills_data = [
            ("Golden Flour Mills", "2026-07-26", 38000.0),
            ("Amul Dairy Suppliers", "2026-07-20", 29000.0),
        ]
    elif store_type == "supermarket":
        b_name = "Grand Mart Supermarket"
        cat = "Supermarket & Retail"
        inv_data = [
            ("Basmati Rice 5kg", "Grains", 40, 15, 60, 450.0, "Optimal", "Fast Moving"),
            ("Sunflower Cooking Oil 5L", "Oil", 18, 25, 80, 680.0, "Low Stock", "Fast Moving"),
            ("Atta Whole Wheat 10kg", "Grains", 35, 15, 50, 380.0, "Optimal", "Fast Moving"),
            ("Washing Powder 2kg", "Detergent", 50, 20, 80, 290.0, "Optimal", "Fast Moving"),
            ("Soft Drinks 2L Bottle", "Beverages", 8, 30, 100, 95.0, "Low Stock", "Fast Moving"),
            ("Toilet Cleaner 1L", "Cleaning", 45, 10, 50, 160.0, "Optimal", "Slow Moving"),
            ("Corn Flakes 500g", "Breakfast", 65, 15, 40, 210.0, "Overstocked", "Slow Moving"),
            ("Dark Chocolate Bar", "Snacks", 90, 20, 50, 150.0, "Overstocked", "Slow Moving"),
        ]
        bills_data = [
            ("Reliance Wholesale Hub", "2026-07-27", 125000.0),
            ("HUL FMCG Wholesaler", "2026-07-21", 88000.0),
        ]
    else:  # Kirana General Store
        b_name = "Sri Lakshmi Kirana & General Store"
        cat = "Kirana & General Store"
        inv_data = [
            ("Soft Drinks (750ml Cans)", "Beverages", 55, 20, 100, 40.0, "Optimal", "Fast Moving"),
            ("Water Bottles 1L", "Beverages", 12, 30, 120, 20.0, "Low Stock", "Fast Moving"),
            ("Chips Packs (Large)", "Snacks", 14, 25, 90, 30.0, "Low Stock", "Fast Moving"),
            ("Cooking Oil 1L", "Grocery", 40, 15, 60, 165.0, "Optimal", "Fast Moving"),
            ("Sprite Bottle (Various)", "Beverages", 35, 15, 80, 40.0, "Optimal", "Fast Moving"),
            ("Cola Bottle (Various)", "Beverages", 42, 15, 80, 40.0, "Optimal", "Fast Moving"),
            ("Glucon-D (500g)", "Healthcare", 8, 15, 50, 140.0, "Low Stock", "Fast Moving"),
            ("Parle-G (Small)", "Biscuits", 50, 20, 100, 10.0, "Optimal", "Fast Moving"),
            ("Colgate Toothpaste", "Personal Care", 9, 20, 60, 75.0, "Low Stock", "Fast Moving"),
            ("Dettol Handwash", "Personal Care", 7, 15, 50, 99.0, "Low Stock", "Fast Moving"),
            ("Biscuit Packs (Assorted)", "Biscuits", 85, 20, 50, 30.0, "Overstocked", "Slow Moving"),
        ]
        bills_data = [
            ("Venkateshwara Traders", "2026-07-28", 54000.0),
            ("Sri Krishna FMCG Distributors", "2026-07-20", 42000.0),
        ]

    # Create Business Profile
    b_profile = BusinessProfile(
        business_name=b_name,
        category=cat,
        years_in_operation=4,
        employee_count=3,
        monthly_revenue_range="₹1,00,000 - ₹3,00,000",
        store_size_sqft=650
    )
    db.add(b_profile)
    db.commit()
    db.refresh(b_profile)

    # Create Locality Profile
    l_profile = LocalityProfile(
        business_id=b_profile.id,
        area_name="Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        population_estimate=22000,
        residential_density="High",
        nearby_schools=3,
        nearby_colleges=2,
        nearby_offices=12,
        nearby_hospitals=2,
        competitor_count=3,
        target_customer_segment="Students, Tech Professionals, Local Families",
        peak_sales_hours="5 PM - 9:30 PM",
        most_demanded_products="Beverages, Quick Snacks, Dairy Products, Water Bottles"
    )
    db.add(l_profile)

    # Create Inventory Scan & Items
    inv_scan = InventoryScan(
        total_items_detected=len(inv_data),
        stock_health_score=86.5,
        notes=f"Auto-generated backend training dataset for {cat}"
    )
    db.add(inv_scan)
    db.commit()
    db.refresh(inv_scan)

    total_inv_val = 0.0
    for name, c_cat, qty, min_r, max_t, price, status, speed in inv_data:
        item = InventoryItem(
            scan_id=inv_scan.id,
            product_name=name,
            category=c_cat,
            quantity_detected=qty,
            min_required=min_r,
            max_threshold=max_t,
            estimated_unit_price=price,
            stock_status=status,
            turnover_speed=speed
        )
        total_inv_val += qty * price
        db.add(item)

    # Create Bills & Bill Items
    total_bills_val = 0.0
    for supplier, date_str, amt in bills_data:
        bill = Bill(
            supplier_name=supplier,
            purchase_date=date_str,
            total_amount=amt,
            notes=f"Purchase bill from {supplier}"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
        total_bills_val += amt

        # Add items to bill
        bill_item = BillItem(
            bill_id=bill.id,
            product_name=f"{cat} Bulk Supplies",
            category="Bulk Wholesale",
            quantity=1,
            cost_price=amt,
            total_price=amt
        )
        db.add(bill_item)

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully trained backend SQLite database with {cat} dataset!",
        "summary": {
            "business_name": b_name,
            "category": cat,
            "bills_count": len(bills_data),
            "total_bills_amount": total_bills_val,
            "inventory_items_count": len(inv_data),
            "inventory_stock_value": total_inv_val
        }
    }


@router.post("/custom-training-data")
def load_custom_training_data(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Populates backend database from user-supplied custom JSON training data.
    """
    # Clear existing tables
    db.query(BillItem).delete()
    db.query(Bill).delete()
    db.query(InventoryItem).delete()
    db.query(InventoryScan).delete()
    db.query(LocalityProfile).delete()
    db.query(BusinessProfile).delete()
    db.commit()

    # Parse Business Profile
    bp_input = payload.get("business_profile", {})
    b_profile = BusinessProfile(
        business_name=bp_input.get("business_name", "My Store"),
        category=bp_input.get("category", "General Retail"),
        years_in_operation=int(bp_input.get("years_in_operation", 2)),
        employee_count=int(bp_input.get("employee_count", 2)),
        monthly_revenue_range=bp_input.get("monthly_revenue_range", "₹1,00,000 - ₹5,00,000"),
        store_size_sqft=int(bp_input.get("store_size_sqft", 500))
    )
    db.add(b_profile)
    db.commit()
    db.refresh(b_profile)

    # Parse Locality Profile
    lp_input = payload.get("locality_profile", {})
    l_profile = LocalityProfile(
        business_id=b_profile.id,
        area_name=lp_input.get("area_name", "Central Market"),
        city=lp_input.get("city", "Bengaluru"),
        state=lp_input.get("state", "Karnataka"),
        population_estimate=int(lp_input.get("population_estimate", 15000)),
        nearby_colleges=int(lp_input.get("nearby_colleges", 2)),
        nearby_offices=int(lp_input.get("nearby_offices", 5))
    )
    db.add(l_profile)

    # Parse Inventory Items
    items_input = payload.get("inventory_items", [])
    inv_scan = InventoryScan(
        total_items_detected=len(items_input),
        stock_health_score=88.0,
        notes="Custom training data uploaded by user"
    )
    db.add(inv_scan)
    db.commit()
    db.refresh(inv_scan)

    for item_data in items_input:
        qty = int(item_data.get("quantity_detected", 10))
        min_req = int(item_data.get("min_required", 20))
        
        # Calculate stock status dynamically if not explicitly provided
        status = item_data.get("stock_status")
        if not status:
            if qty < min_req:
                status = "Low Stock"
            elif qty > min_req * 3:
                status = "Overstocked"
            else:
                status = "Optimal"

        item = InventoryItem(
            scan_id=inv_scan.id,
            product_name=item_data.get("product_name", "Product"),
            category=item_data.get("category", "General"),
            quantity_detected=qty,
            min_required=min_req,
            max_threshold=int(item_data.get("max_threshold", 100)),
            estimated_unit_price=float(item_data.get("estimated_unit_price", 50.0)),
            stock_status=status,
            turnover_speed=item_data.get("turnover_speed", "Fast Moving")
        )
        db.add(item)

    # Parse Bills
    bills_input = payload.get("bills", [])
    for b_data in bills_input:
        amt = float(b_data.get("total_amount", 1000.0))
        bill = Bill(
            supplier_name=b_data.get("supplier_name", "Supplier Wholesaler"),
            purchase_date=b_data.get("purchase_date", datetime.utcnow().strftime("%Y-%m-%d")),
            total_amount=amt,
            notes=b_data.get("notes", "User imported bill")
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)

        for b_item in b_data.get("items", []):
            item_obj = BillItem(
                bill_id=bill.id,
                product_name=b_item.get("product_name", "Item"),
                category=b_item.get("category", "General"),
                quantity=int(b_item.get("quantity", 1)),
                cost_price=float(b_item.get("cost_price", amt)),
                total_price=float(b_item.get("total_price", amt))
            )
            db.add(item_obj)

    db.commit()

    return {
        "status": "success",
        "message": "Backend database successfully trained with your custom JSON dataset!",
        "records_loaded": {
            "inventory_items": len(items_input),
            "bills": len(bills_input)
        }
    }


@router.get("/export-data")
def export_training_data(db: Session = Depends(get_db)):
    """
    Exports all current backend database records as a JSON structure.
    """
    b_profile = db.query(BusinessProfile).first()
    l_profile = db.query(LocalityProfile).first()
    inv_items = db.query(InventoryItem).all()
    bills = db.query(Bill).all()

    return {
        "business_profile": {
            "business_name": b_profile.business_name if b_profile else "Vyapaar Store",
            "category": b_profile.category if b_profile else "Kirana",
            "years_in_operation": b_profile.years_in_operation if b_profile else 3,
            "employee_count": b_profile.employee_count if b_profile else 2,
            "monthly_revenue_range": b_profile.monthly_revenue_range if b_profile else "₹1,00,000 - ₹3,00,000",
            "store_size_sqft": b_profile.store_size_sqft if b_profile else 500
        },
        "locality_profile": {
            "area_name": l_profile.area_name if l_profile else "Central Market",
            "city": l_profile.city if l_profile else "Bengaluru",
            "state": l_profile.state if l_profile else "Karnataka",
            "nearby_colleges": l_profile.nearby_colleges if l_profile else 2,
            "nearby_offices": l_profile.nearby_offices if l_profile else 5
        },
        "inventory_items": [
            {
                "product_name": item.product_name,
                "category": item.category,
                "quantity_detected": item.quantity_detected,
                "min_required": item.min_required,
                "max_threshold": item.max_threshold,
                "estimated_unit_price": item.estimated_unit_price,
                "stock_status": item.stock_status,
                "turnover_speed": item.turnover_speed
            }
            for item in inv_items
        ],
        "bills": [
            {
                "supplier_name": b.supplier_name,
                "purchase_date": b.purchase_date,
                "total_amount": b.total_amount,
                "items": [
                    {
                        "product_name": bi.product_name,
                        "category": bi.category,
                        "quantity": bi.quantity,
                        "cost_price": bi.cost_price,
                        "total_price": bi.total_price
                    }
                    for bi in b.items
                ]
            }
            for b in bills
        ]
    }


@router.delete("/reset")
def reset_backend_database(db: Session = Depends(get_db)):
    """
    Resets/clears the database tables.
    """
    db.query(BillItem).delete()
    db.query(Bill).delete()
    db.query(InventoryItem).delete()
    db.query(InventoryScan).delete()
    db.query(LocalityProfile).delete()
    db.query(BusinessProfile).delete()
    db.commit()
    return {"status": "success", "message": "Database successfully reset."}
