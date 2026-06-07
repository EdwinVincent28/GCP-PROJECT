# app/backend/core/storage.py
from google.cloud import storage
from core.config import settings
import uuid

storage_client = storage.Client(project=settings.GCP_PROJECT_ID)
bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)

def upload_image_to_gcs(file_obj, filename: str, content_type: str) -> str:
    unique_filename = f"{uuid.uuid4()}-{filename}"
    
    blob = bucket.blob(unique_filename)
    blob.upload_from_file(file_obj, content_type=content_type)
    # blob.make_public()
    
    return blob.public_url