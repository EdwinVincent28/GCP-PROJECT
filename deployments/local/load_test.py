from pydantic_settings import BaseSettings
from typing import Optional # <-- Ensure this is imported

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GCP_PROJECT_ID: str
    GCS_BUCKET_NAME: str
    
    # Setting the default to None makes it completely optional for GAE
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore" # Tells Pydantic not to crash if extra variables exist

settings = Settings()