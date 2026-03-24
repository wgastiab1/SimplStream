"""
Playwright-based embed cleaner for VidNest and similar streaming sites.
Uses a headless browser to execute JavaScript and extract video URLs.
"""

import os
import re
import asyncio
from typing import Optional
from playwright.sync_api import sync_playwright, Browser, Page

# Ad domains to block
AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'googletag.com', 'adnxs.com', 'taboola.com', 'outbrain.com',
    'popads.net', 'popcash.net', 'mgid.com', 'propellerads.com',
    'trafficjunky.com', 'exoclick.com', 'criteo.com', 'zedo.com',
]

# Selectors for ad elements to remove
AD_SELECTORS = [
    'iframe[src*="ads"]', 'iframe[src*="doubleclick"]',
    '[class*="ad-"]', '[id*="ad-"]', '[class*="popup"]',
    '[class*="modal"]', '[class*="banner"]', '.adsbox',
    '[onclick*="popup"]', '[onclick*="window.open"]',
]

# Video player selectors
VIDEO_SELECTORS = [
    'video', 'iframe[src*="player"]', 'iframe[src*="embed"]',
    'iframe[src*="vidnest"]', 'iframe[src*="vidsrc"]',
]


class PlaywrightCleaner:
    """Uses Playwright to load embed pages and extract clean video URLs."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None

    def _get_browser(self) -> Browser:
        """Lazy initialization of browser."""
        if self.browser is None or not self.browser.is_connected():
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                ]
            )
        return self.browser

    def extract_video_url(self, embed_url: str, timeout: int = 15000) -> dict:
        """
        Loads an embed URL in a headless browser, blocks ads, and extracts video URL.

        Returns: {
            'success': bool,
            'video_url': str or None,
            'embed_url': str or None,
            'error': str or None
        }
        """
        browser = self._get_browser()

        try:
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
            )

            page = context.new_page()

            # Block ad requests
            def handle_route(route):
                url = route.request.url
                if any(ad_domain in url.lower() for ad_domain in AD_DOMAINS):
                    route.abort()
                else:
                    route.continue_()

            context.route('**/*', handle_route)

            # Navigate and wait for video element
            page.goto(embed_url, wait_until='networkidle', timeout=timeout)

            # Wait a bit for any dynamic content
            page.wait_for_timeout(2000)

            video_url = None

            # Try to find video element
            try:
                video = page.query_selector('video')
                if video:
                    src = video.get_attribute('src')
                    if src:
                        video_url = src

                # Try iframe
                if not video_url:
                    iframe = page.query_selector('iframe')
                    if iframe:
                        src = iframe.get_attribute('src')
                        if src and 'vidnest' in src.lower():
                            video_url = src
            except Exception:
                pass

            # Try to execute script to find video URL
            if not video_url:
                try:
                    # Look for video sources in page
                    video_src = page.evaluate('''
                        () => {
                            const video = document.querySelector('video');
                            if (video && video.src) return video.src;

                            const iframe = document.querySelector('iframe');
                            if (iframe && iframe.src) return iframe.src;

                            return null;
                        }
                    ''')
                    if video_src:
                        video_url = video_src
                except Exception:
                    pass

            context.close()

            if video_url:
                return {
                    'success': True,
                    'video_url': video_url,
                    'embed_url': embed_url,
                    'error': None
                }
            else:
                # Return original embed URL if we couldn't find video
                return {
                    'success': True,
                    'video_url': embed_url,
                    'embed_url': embed_url,
                    'error': 'Could not extract video URL, using embed URL'
                }

        except Exception as e:
            return {
                'success': False,
                'video_url': None,
                'embed_url': embed_url,
                'error': str(e)
            }

    def close(self):
        """Clean up resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()


# Singleton instance
_cleaner: Optional[PlaywrightCleaner] = None


def get_cleaner() -> PlaywrightCleaner:
    """Get or create the cleaner singleton."""
    global _cleaner
    if _cleaner is None:
        _cleaner = PlaywrightCleaner()
    return _cleaner


def extract_vidnest_video(tmdb_id: int, media_type: str, season: int = None, episode: int = None) -> dict:
    """Convenience function to get cleaned VidNest embed."""
    cleaner = get_cleaner()

    if media_type == 'movie':
        embed_url = f'https://vidnest.fun/movie/{tmdb_id}'
    else:
        embed_url = f'https://vidnest.fun/tv/{tmdb_id}/{season}/{episode}'

    return cleaner.extract_video_url(embed_url)
