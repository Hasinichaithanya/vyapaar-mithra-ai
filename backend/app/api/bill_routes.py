import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Bill, BillItem
from ..schemas import BillResponse, BillCreate
from ..services import ai_service
from ..config import UPLOADS_DIR

router = APIRouter(prefix="/api/bills", tags=["Smart Bill Scanner & Investment Ledger"])

@router.post("/scan", response_model=BillResponse)
async def scan_bill_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a purchase bill image -> OCR Vision AI extraction -> Save Investment Record.
    """
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"bill_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Perform Gemini OCR Extraction
    extracted = ai_service.scan_bill_image(filepath)

    if extracted.get("ocr_error"):
        os.remove(filepath)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ocr_failed",
                "message": extracted.get("message") or (
                    "Could not read this bill image. Please upload a clear, well-lit photo of your "
                    "wholesale or retail purchase invoice and try again."
                ),
            },
        )

    is_valid, rejection_message = ai_service.validate_business_bill(extracted)
    if not is_valid:
        os.remove(filepath)
        raise HTTPException(
            status_code=400,
            detail={
                "error": "non_business_document",
                "message": rejection_message or (
                    "The uploaded document does not appear to be a business-related inventory purchase bill. "
                    "Hospital bills, school fees, utility bills, and other unrelated documents are not allowed."
                ),
            },
        )

    bill = Bill(
        supplier_name=extracted.get("supplier_name", "Metro Cash & Carry"),
        purchase_date=extracted.get("purchase_date", "2026-08-01"),
        total_amount=float(extracted.get("total_amount", 0.0)),
        image_filename=filename,
        notes="Digitized via Smart Bill Scanner OCR"
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    # Add items
    total_calc = 0.0
    for item_data in extracted.get("items", []):
        qty = int(item_data.get("quantity", 1))
        cost = float(item_data.get("cost_price", 0.0))
        tot = float(item_data.get("total_price", qty * cost))
        total_calc += tot

        b_item = BillItem(
            bill_id=bill.id,
            product_name=item_data.get("product_name", "Item"),
            category=item_data.get("category", "General"),
            quantity=qty,
            cost_price=cost,
            total_price=tot
        )
        db.add(b_item)

    if total_calc > 0:
        bill.total_amount = total_calc
    db.commit()
    db.refresh(bill)

    return bill


@router.get("/ledger", response_model=List[BillResponse])
def get_investment_ledger(db: Session = Depends(get_db)):
    """
    Get all recorded purchase bills and items, most recent first.
    If none exist yet, automatically populates sample ledger matching PRD.
    """
    bills = db.query(Bill).order_by(Bill.created_at.desc(), Bill.id.desc()).all()
    if not bills:
        # Create default sample bill matching PRD section 5.2 (Total Investment: ₹48,000)
        sample_extracted = ai_service.scan_bill_image("")
        sample_bill = Bill(
            supplier_name=sample_extracted["supplier_name"],
            purchase_date=sample_extracted["purchase_date"],
            total_amount=sample_extracted["total_amount"],
            notes="Initial Sample Purchase Bill"
        )
        db.add(sample_bill)
        db.commit()
        db.refresh(sample_bill)

        for item in sample_extracted.get("items", []):
            b_item = BillItem(
                bill_id=sample_bill.id,
                product_name=item["product_name"],
                category=item["category"],
                quantity=item["quantity"],
                cost_price=item["cost_price"],
                total_price=item["total_price"]
            )
            db.add(b_item)
        db.commit()
        bills = [sample_bill]

    return bills
