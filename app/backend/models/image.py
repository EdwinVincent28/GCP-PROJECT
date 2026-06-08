from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ImageMetadata(BaseModel):
    filename: str
    content_type: str
    gcs_url: Optional[str] = None
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)

class ImageResponse(BaseModel):
    id: str
    filename: str
    image_url: str
    status: str