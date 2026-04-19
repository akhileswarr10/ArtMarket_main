from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class AIJobResult(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    suggested_price: Optional[float] = None
    
    class Config:
        extra = "allow"

class AIJobResponse(BaseModel):
    id: UUID
    artwork_id: UUID
    job_type: str
    status: str
    result: Optional[AIJobResult] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIApplyRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
