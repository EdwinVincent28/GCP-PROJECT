from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from core.database import get_db
from core.storage import upload_image_to_gcs
from routes.auth_routes import get_current_user
from models.image import ImageMetadata, ImageResponse

router = APIRouter()

@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...), 
    db = Depends(get_db), 
    current_user = Depends(get_current_user) 
):

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        gcs_url = upload_image_to_gcs(file.file, file.filename, file.content_type)
        
        image_data = ImageMetadata(
            filename=file.filename,
            content_type=file.content_type,
            gcs_url=gcs_url
        )
        
        collection = db["images"]
        doc_to_insert = image_data.model_dump()
        doc_to_insert["owner_email"] = current_user["email"]
        
        result = await collection.insert_one(doc_to_insert)
        
        return ImageResponse(
            id=str(result.inserted_id),
            filename=file.filename,
            image_url=gcs_url,
            status="Successfully uploaded to GCP and metadata saved."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")