from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: Optional[int] = None
    sender: str = "assistant"
    message: str
    analysis: Optional[str] = None
    reasons: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    timestamp: datetime = datetime.utcnow()

    class Config:
        from_attributes = True
