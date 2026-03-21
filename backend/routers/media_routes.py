from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.tmdb_service import TMDBService

router = APIRouter(prefix="/api", tags=["Media"])
tmdb_service = TMDBService()

@router.get("/search")
def search_media(query: str, region: Optional[str] = Query("US")):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    return tmdb_service.search(query, region)

@router.get("/trending")
def get_trending(media_type: str = "all"):
    return tmdb_service.get_trending(media_type)

@router.get("/details/{media_type}/{tmdb_id}")
def get_details(media_type: str, tmdb_id: int):
    if media_type not in ['movie', 'tv']:
        raise HTTPException(status_code=400, detail="Invalid media type")
    return tmdb_service.get_details(media_type, tmdb_id)
