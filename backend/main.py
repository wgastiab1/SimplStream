from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from routers import media_routes, embed_routes, shield_proxy

# Configure Logging to be more visible
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WilStream")

app = FastAPI(
    title="WilStream API",
    description="Dedicated backend for WilStream Streaming App",
    version="1.0.0"
)

# CORS Middleware to allow Capacitor and Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5180",
        "capacitor://localhost",
        "*" # In production you might want to restrict this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "WilStream Backend is operational",
        "version": "1.0.0"
    }
# Include routers
app.include_router(media_routes.router)
app.include_router(embed_routes.router)
app.include_router(shield_proxy.router, prefix="/api/proxy")
