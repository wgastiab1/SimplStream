from fastapi import APIRouter, Query
from typing import Optional
from services.embed_cleaner import get_video_embed
from services.playwright_cleaner import get_cleaner

router = APIRouter(prefix="/api/embed", tags=["Embed"])

@router.get("/clean")
def clean_embed(
    url: str = Query(..., description="Embed URL to clean"),
    use_playwright: bool = Query(False, description="Force Playwright (slower but more thorough)")
):
    """
    Cleans an embed URL to extract the actual video source.
    Uses lightweight BeautifulSoup cleaning by default.
    Falls back to Playwright if lightweight method fails (optional).
    """
    # Try lightweight method first
    result = get_video_embed(url)

    if result.get('success') or use_playwright is False:
        return result

    # Fallback to Playwright if lightweight failed and user allows it
    if use_playwright:
        cleaner = get_cleaner()
        return cleaner.extract_video_url(url)

    return result


@router.get("/vidnest/{media_type}/{tmdb_id}")
def get_vidnest_embed(
    media_type: str,
    tmdb_id: int,
    season: Optional[int] = None,
    episode: Optional[int] = None
):
    """
    Convenience endpoint to get a VidNest embed URL for a movie or TV show.
    """
    from services.playwright_cleaner import extract_vidnest_video

    if media_type not in ['movie', 'tv']:
        return {"success": False, "error": "Invalid media type"}

    return extract_vidnest_video(tmdb_id, media_type, season, episode)
