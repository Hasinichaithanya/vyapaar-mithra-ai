from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ChatRequest, ChatResponse
from ..models import ChatMessage, BusinessProfile, Bill, InventoryScan
from ..services import ai_service

router = APIRouter(prefix="/api/assistant", tags=["AI Business Assistant Chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Interact with business data using natural language queries.
    """
    # Gather context
    b_profile = db.query(BusinessProfile).first()
    bills = db.query(Bill).all()
    latest_scan = db.query(InventoryScan).order_by(InventoryScan.id.desc()).first()

    context = {
        "business": b_profile.business_name if b_profile else "Kirana Store",
        "total_bills_count": len(bills),
        "total_investment": sum(b.total_amount for b in bills) if bills else 48000.0,
        "inventory_health": latest_scan.stock_health_score if latest_scan else 82.5
    }

    # Save user message
    user_msg = ChatMessage(sender="user", message=req.message)
    db.add(user_msg)
    db.commit()

    # Generate response
    resp = ai_service.answer_assistant_query(req.message, context)

    # Save assistant response
    analysis_str = resp.get("analysis", "")
    reasons_list = resp.get("reasons", [])
    recs_list = resp.get("recommendations", [])

    asst_msg = ChatMessage(
        sender="assistant",
        message=analysis_str,
        analysis=analysis_str,
        reasons="\n".join(reasons_list),
        recommendations="\n".join(recs_list)
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return ChatResponse(
        id=asst_msg.id,
        sender="assistant",
        message=analysis_str,
        analysis=analysis_str,
        reasons=reasons_list,
        recommendations=recs_list,
        timestamp=asst_msg.timestamp
    )
