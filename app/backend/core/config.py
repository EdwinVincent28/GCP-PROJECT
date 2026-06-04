from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GCP_PROJECT_ID: str
    GCS_BUCKET_NAME: str
    GOOGLE_APPLICATION_CREDENTIALS: str
    
    class Config:
        env_file = ".env"

settings = Settings()