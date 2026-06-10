from fastapi import FastAPI
import uvicorn

from contextlib import asynccontextmanager
from core.database import connect_to_mongo, close_mongo_connection
from routes import auth_routes
from routes import image_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="GAE vs GKE Image Service", lifespan=lifespan)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(image_routes.router, prefix="/api", tags=["Images"])

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "FastAPI is running and connected to MongoDB!"}

@app.get("/health-load")
def run_cpu_load():
    count = 0
    for i in range(5_000_000):
        count += i
        
    return {
        "status": "under-load",
        "message": "CPU task completed successfully!",
        "result_preview": count
    }