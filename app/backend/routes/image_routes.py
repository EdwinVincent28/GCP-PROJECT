from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from core.database import get_db
from core.storage import upload_image_to_gcs
from routes.auth_routes import get_current_user
from models.image import ImageMetadata, ImageResponse

from ultralytics import YOLO

import os
# Get the exact absolute directory path of your running app
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "yolov8n.pt")



import cv2
import numpy as np

router = APIRouter()

#print("Initializing YOLOv8 object detection model...")
#model = YOLO("yolov8n.pt")
print(f"Loading local YOLOv8 weights from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)


@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...), 
    db = Depends(get_db), 
    current_user = Depends(get_current_user) 
):

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        contents = await file.read()
        
        await file.seek(0)

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        detected_items = []
        if img is not None:
            results = model(img, verbose=False)
            for r in results:
                for c in r.boxes.cls:
                    detected_items.append(model.names[int(c)])

            detected_items = list(set(detected_items))

        gcs_url = upload_image_to_gcs(file.file, file.filename, file.content_type)
        
        image_data = ImageMetadata(
            filename=file.filename,
            content_type=file.content_type,
            gcs_url=gcs_url
        )
        
        collection = db["images"]
        doc_to_insert = image_data.model_dump()
        doc_to_insert["owner_email"] = current_user["email"]
        doc_to_insert["detected_objects"] = detected_items  
        
        result = await collection.insert_one(doc_to_insert)
        
        return ImageResponse(
            id=str(result.inserted_id),
            filename=file.filename,
            image_url=gcs_url,
            status="Successfully uploaded to GCP and metadata saved.",
            detected_objects=detected_items  
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/stress-test/detect-only")
async def stress_test_detection(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        detected_items = []
        if img is not None:
            results = model(img, verbose=False)
            for r in results:
                for c in r.boxes.cls:
                    detected_items.append(model.names[int(c)])
        
        detected_items = list(set(detected_items))

        return {
            "status": "success", 
            "message": "Simulated CPU load test complete. Data discarded.",
            "detected_objects": detected_items
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
    
@router.get("/all", response_model=list[ImageResponse])
async def get_all_user_images(
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        collection = db["images"]

        cursor = collection.find({"owner_email": current_user["email"]}).sort("_id", -1)
        documents = await cursor.to_list(length=500)
        
        formatted_images = []
        for doc in documents:
            formatted_images.append(
                ImageResponse(
                    id=str(doc["_id"]),
                    filename=doc.get("filename", "unknown"),
                    image_url=doc.get("gcs_url", ""),
                    status="Fetched from database",
                    detected_objects=doc.get("detected_objects", [])
                )
            )  
        return formatted_images

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch images: {str(e)}")