import hashlib
import re
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from ..models import Bill


def hash_file_contents(contents: bytes) -> str:
    return hashlib.sha256(contents).hexdigest()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def normalize_supplier(value: str) -> str:
    supplier = normalize_text(value)
    supplier = re.sub(r"[^a-z0-9 ]", " ", supplier)
    supplier = re.sub(r"\b(pvt|ltd|limited|inc|corp|company|co)\b", " ", supplier)
    return re.sub(r"\s+", " ", supplier).strip()


def normalize_date(value: str) -> str:
    date = normalize_text(value).replace("/", "-")
    match = re.search(r"(\d{4}-\d{2}-\d{2})", date)
    if match:
        return match.group(1)
    match = re.search(r"(\d{2}-\d{2}-\d{4})", date)
    if match:
        day, month, year = match.group(1).split("-")
        return f"{year}-{month}-{day}"
    return date


def compute_extracted_total(extracted: Dict[str, Any]) -> float:
    items = extracted.get("items") or []
    total_calc = 0.0
    for item in items:
        qty = int(item.get("quantity", 1))
        cost = float(item.get("cost_price", 0.0))
        total_calc += float(item.get("total_price", qty * cost))
    if total_calc > 0:
        return round(total_calc, 2)
    return round(float(extracted.get("total_amount", 0.0)), 2)


def build_item_signature(extracted: Dict[str, Any]) -> str:
    items = extracted.get("items") or []
    if not items:
        return ""

    parts: List[str] = []
    for item in sorted(items, key=lambda row: normalize_text(str(row.get("product_name", "")))):
        product = normalize_text(str(item.get("product_name", "")))
        quantity = int(item.get("quantity", 1))
        total_price = round(float(item.get("total_price", 0.0)), 2)
        if product:
            parts.append(f"{product}|{quantity}|{total_price}")

    return "||".join(parts)


def build_bill_signature(extracted: Dict[str, Any]) -> str:
    supplier = normalize_supplier(extracted.get("supplier_name", ""))
    purchase_date = normalize_date(extracted.get("purchase_date", ""))
    total_amount = compute_extracted_total(extracted)
    item_signature = build_item_signature(extracted)
    return f"{supplier}|{purchase_date}|{total_amount}|{item_signature}"


def bill_record_signature(bill: Bill) -> str:
    extracted = {
        "supplier_name": bill.supplier_name,
        "purchase_date": bill.purchase_date,
        "total_amount": bill.total_amount,
        "items": [
            {
                "product_name": item.product_name,
                "quantity": item.quantity,
                "total_price": item.total_price,
            }
            for item in (bill.items or [])
        ],
    }
    return build_bill_signature(extracted)


def amounts_match(left: float, right: float, tolerance: float = 1.0) -> bool:
    return abs(round(float(left or 0), 2) - round(float(right or 0), 2)) <= tolerance


def find_duplicate_bill(
    db: Session,
    content_hash: str,
    extracted: Dict[str, Any],
) -> Optional[Bill]:
    by_hash = db.query(Bill).filter(Bill.content_hash == content_hash).first()
    if by_hash:
        return by_hash

    incoming_signature = build_bill_signature(extracted)
    supplier = normalize_supplier(extracted.get("supplier_name", ""))
    purchase_date = normalize_date(extracted.get("purchase_date", ""))
    total_amount = compute_extracted_total(extracted)
    item_signature = build_item_signature(extracted)

    if not supplier or not purchase_date:
        return None

    for bill in db.query(Bill).all():
        if bill.content_hash == content_hash:
            return bill

        existing_signature = bill_record_signature(bill)
        if incoming_signature and existing_signature == incoming_signature:
            return bill

        if (
            normalize_supplier(bill.supplier_name) == supplier
            and normalize_date(bill.purchase_date) == purchase_date
            and amounts_match(bill.total_amount, total_amount)
        ):
            return bill

        if (
            item_signature
            and normalize_supplier(bill.supplier_name) == supplier
            and bill_record_signature(bill).endswith(item_signature)
            and amounts_match(bill.total_amount, total_amount, tolerance=5.0)
        ):
            return bill

    return None


def backfill_missing_content_hashes(db: Session, uploads_dir) -> int:
    updated = 0
    bills = db.query(Bill).filter(Bill.content_hash.is_(None), Bill.image_filename.isnot(None)).all()
    for bill in bills:
        image_path = uploads_dir / bill.image_filename
        if not image_path.exists():
            continue
        bill.content_hash = hash_file_contents(image_path.read_bytes())
        updated += 1
    if updated:
        db.commit()
    return updated
