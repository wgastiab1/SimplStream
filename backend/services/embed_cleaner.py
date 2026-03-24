import os
import re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

class EmbedCleaner:
    """
    Fetches and cleans embed pages to remove ads and extract video sources.
    Uses BeautifulSoup to parse and clean HTML.
    """

    # Ad-related patterns to remove
    AD_SELECTORS = [
        'script', 'iframe[src*="ads"]', 'iframe[src*="doubleclick"]',
        '[class*="ad-"]', '[class*="ads-"]', '[id*="ad-"]', '[id*="ads-"]',
        '[class*="popup"]', '[class*="modal"]', '[class*="banner"]',
        '[onclick*="window.open"]', '[onclick*="popup"]',
        'a[href*="popup"]', 'a[href*="redirect"]',
    ]

    # Patterns for video player iframes we want to keep
    VIDEO_PATTERNS = [
        'player', 'embed', 'video', 'stream', 'watch', 'play',
        'vidnest', 'vidsrc', 'vidlink', 'vidfast', 'videasy'
    ]

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def fetch_and_clean(self, url: str) -> dict:
        """
        Fetches a URL, cleans it of ads, and extracts the video player URL.
        Returns: {
            'success': bool,
            'video_url': str or None,
            'embed_url': str or None,
            'cleaned_html': str or None,
            'error': str or None
        }
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Try to find video iframe
            video_iframe = self._find_video_iframe(soup)
            if video_iframe:
                embed_url = video_iframe.get('src', '')
                return {
                    'success': True,
                    'video_url': embed_url,
                    'embed_url': embed_url,
                    'cleaned_html': None,
                    'error': None
                }

            # Try to find video source in script tags
            video_url = self._extract_video_url_from_scripts(soup)
            if video_url:
                return {
                    'success': True,
                    'video_url': video_url,
                    'embed_url': video_url,
                    'cleaned_html': None,
                    'error': None
                }

            # If we can't find a video, return the original URL
            return {
                'success': True,
                'video_url': url,
                'embed_url': url,
                'cleaned_html': response.text,
                'error': 'Could not extract video URL, returning original'
            }

        except requests.RequestException as e:
            return {
                'success': False,
                'video_url': None,
                'embed_url': None,
                'cleaned_html': None,
                'error': str(e)
            }

    def _find_video_iframe(self, soup: BeautifulSoup):
        """Find iframe that looks like a video player."""
        iframes = soup.find_all('iframe')

        for iframe in iframes:
            src = iframe.get('src', '') or ''
            # Check if it's a video-related iframe
            if any(pattern in src.lower() for pattern in self.VIDEO_PATTERNS):
                return iframe

        return None

    def _extract_video_url_from_scripts(self, soup: BeautifulSoup) -> str:
        """Try to extract video URL from script tags."""
        scripts = soup.find_all('script')
        for script in scripts:
            text = script.string or ''
            # Look for video URLs in script content
            patterns = [
                r'src["\']?\s*[:=]\s*["\']([^"\']*(?:mp4|m3u8|webm)[^"\']*)["\']',
                r'file["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                r'url["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            ]
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    if 'http' in match:
                        return match
        return None


# Singleton instance
embed_cleaner = EmbedCleaner()


def get_video_embed(url: str) -> dict:
    """Proxy function to clean and extract video embed URL."""
    return embed_cleaner.fetch_and_clean(url)
