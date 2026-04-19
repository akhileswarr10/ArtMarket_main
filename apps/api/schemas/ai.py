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
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class AIJobStatus(BaseModel):
    id: uuid.UUID
    job_type: str
    status: str
    result: Optional[dict] = None
    error_message: Optional[str] = None
    attempts: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIApplyRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
class ArtworkAIStatusResponse(BaseModel):
    artwork_id: uuid.UUID
    jobs: List[AIJobStatus]
    ai_title_suggestion: Optional[str] = None
    ai_description_suggestion: Optional[str] = None
    ai_style_suggestion: Optional[str] = None
    ai_medium_suggestion: Optional[str] = None
    ai_price_suggestion: Optional[float] = None
    ai_price_confidence: Optional[str] = None
    ai_tags_suggestion: Optional[List[str]] = None
    ai_generated_at: Optional[datetime] = None

class ApplyAISuggestionsRequest(BaseModel):
    apply_title: bool = False
    apply_description: bool = False
    apply_style: bool = False
    apply_medium: bool = False
    apply_price: bool = False
    apply_tags: bool = False

class MessageResponse(BaseModel):
    message: str
