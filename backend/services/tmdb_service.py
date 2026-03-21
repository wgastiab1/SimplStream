import os
import requests
from dotenv import load_dotenv

load_dotenv()

class TMDBService:
    BASE_URL = "https://api.themoviedb.org/3"
    
    def __init__(self):
        self.api_key = os.getenv("TMDB_API_KEY", "335a2d8a6455213ca6201aba18056860") # Using the one from the app as default

    def _get_params(self, extra_params=None):
        params = {"api_key": self.api_key}
        if extra_params:
            params.update(extra_params)
        return params

    def search(self, query: str, region: str = "US"):
        url = f"{self.BASE_URL}/search/multi"
        params = self._get_params({"query": query, "region": region})
        try:
            response = requests.get(url, params=params)
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def get_trending(self, media_type: str = "all"):
        url = f"{self.BASE_URL}/trending/{media_type}/day"
        params = self._get_params()
        try:
            response = requests.get(url, params=params)
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def get_details(self, media_type: str, tmdb_id: int):
        url = f"{self.BASE_URL}/{media_type}/{tmdb_id}"
        params = self._get_params({"append_to_response": "videos,credits,similar"})
        try:
            response = requests.get(url, params=params)
            return response.json()
        except Exception as e:
            return {"error": str(e)}
