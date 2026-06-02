from fastapi import FastAPI
import uvicorn

from contextlib import asynccontextmanager
from core.database import connect_to_mongo, close_mongo_connection
from routes import auth_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="GAE vs GKE Image Service", lifespan=lifespan)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "FastAPI is running and connected to MongoDB!"}
