from fastapi import FastAPI
import uvicorn

from contextlib import asynccontextmanager

from core.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="GAE vs GKE Image Service", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "FastAPI is running and connected to MongoDB!"}
