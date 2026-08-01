from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from ..database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    analysis = Column(Text, nullable=True)
    reasons = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
