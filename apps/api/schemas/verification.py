from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class VerificationApplyRequest(BaseModel):
    pass

class VerificationDecisionRequest(BaseModel):
    reason: Optional[str] = None

class VerificationQueueItem(BaseModel):
    artist_id: UUID
    display_name: str
    verification_submitted_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
