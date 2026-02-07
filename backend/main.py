from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.routes import projects, configuration

# Use /tmp for uploads on Vercel (serverless), fallback to local dir
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/plc-uploads" if os.environ.get("VERCEL") else "uploads")

# Create uploads directory on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="PLC AutoConfig Backend",
    description="Backend for AI-powered PLC software configuration from CSV data",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow Vercel domains and localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)
app.include_router(configuration.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "PLC AutoConfig Backend",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "PLC AutoConfig Backend API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
