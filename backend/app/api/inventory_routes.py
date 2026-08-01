import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import InventoryScan, InventoryItem
from ..schemas import InventoryScanResponse
from ..services import ai_service
from ..config import UPLOADS_DIR

router = APIRouter(prefix="/api/inventory", tags=["Inventory Vision Scanner"])

@router.post("/scan", response_model=InventoryScanResponse)
async def scan_shelf_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a shelf photo -> Object Detection & Classification -> Save inventory snapshot.
    """
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"shelf_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Perform Gemini Vision Object Detection
    extracted = ai_service.scan_shelf_image(filepath)

    scan = InventoryScan(
        image_filename=filename,
        total_items_detected=extracted.get("total_items_detected", 137),
        stock_health_score=float(extracted.get("stock_health_score", 82.5)),
        notes="Automated shelf object detection"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    for item_data in extracted.get("items", []):
        i_item = InventoryItem(
            scan_id=scan.id,
            product_name=item_data.get("product_name", "Product"),
            category=item_data.get("category", "General"),
            quantity_detected=int(item_data.get("quantity_detected", 0)),
            min_required=int(item_data.get("min_required", 20)),
            max_threshold=int(item_data.get("max_threshold", 100)),
            estimated_unit_price=float(item_data.get("estimated_unit_price", 50.0)),
            stock_status=item_data.get("stock_status", "Optimal"),
            turnover_speed=item_data.get("turnover_speed", "Fast Moving")
        )
        db.add(i_item)

    db.commit()
    db.refresh(scan)
    return scan


@router.get("/status", response_model=InventoryScanResponse)
def get_latest_inventory_status(db: Session = Depends(get_db)):
    """
    Get latest inventory snapshot. Populates PRD-aligned default scan if empty.
    """
    latest_scan = db.query(InventoryScan).order_by(InventoryScan.id.desc()).first()
    if not latest_scan:
        sample = ai_service.scan_shelf_image("")
        latest_scan = InventoryScan(
            total_items_detected=sample["total_items_detected"],
            stock_health_score=sample["stock_health_score"],
            notes="Initial Shelf Scan"
        )
        db.add(latest_scan)
        db.commit()
        db.refresh(latest_scan)

        for item in sample["items"]:
            i_item = InventoryItem(
                scan_id=latest_scan.id,
                product_name=item["product_name"],
                category=item["category"],
                quantity_detected=item["quantity_detected"],
                min_required=item["min_required"],
                max_threshold=item["max_threshold"],
                estimated_unit_price=item["estimated_unit_price"],
                stock_status=item["stock_status"],
                turnover_speed=item["turnover_speed"]
            )
            db.add(i_item)
        db.commit()

    return latest_scan
