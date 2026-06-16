from pydantic_settings import BaseSettings
from typing import Optional # <-- Make sure this is imported

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GCP_PROJECT_ID: str
    GCS_BUCKET_NAME: str
    
    # Change this line to make it optional:
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None 
    
    class Config:
        env_file = ".env"
        extra = "ignore" # Prevents crashing if extra env vars exist

settings = Settings()