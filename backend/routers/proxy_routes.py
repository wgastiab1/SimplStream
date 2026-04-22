from fastapi import APIRouter, HTTPException, Query, Response, Request
import httpx
import logging
import re
from urllib.parse import quote

router = APIRouter(tags=["Proxy"])
logger = logging.getLogger("WilStream.Proxy")

@router.get("", response_class=Response)
@router.get("/", response_class=Response)
async def proxy_get(request: Request, url: str = Query(..., description="The URL to proxy")):
    """
    Enhanced Transparent Proxy for IPTV/VOD.
    """
    logger.info(f"Proxy Request: {url}")
    
    # Block obviously wrong URLs
    if not url.startswith("http"):
        logger.error(f"Invalid URL attempted: {url}")
        return Response(content="Invalid absolute URL required", status_code=400)

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False, verify=False) as client:
            headers = {
                "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 10; SM-G975F Build/QP1A.190711.020)",
                "X-Forwarded-For": "1.1.1.1",
                "Accept": "*/*",
                "Referer": "https://vidsrc.xyz/"
            }
            
            # Handle redirects normally but maintain 'Ghost Stealth'
            # (Blocking redirects to 'sbx.html' proved counter-productive as some players need it for handshake)
            current_url = url
            for _ in range(5):
                remote_response = await client.get(current_url, headers=headers)
                if remote_response.status_code in (301, 302, 307, 308):
                    new_url = remote_response.headers.get("location")
                    if not new_url: break
                    current_url = new_url if "://" in new_url else str(httpx.URL(current_url).join(new_url))
                    logger.info(f"Following redirect to: {current_url}")
                    continue
                else:
                    break
            
            content_type = remote_response.headers.get("content-type", "").lower()
            
            # 1. Check for HTML to inject WilStream Player Shield (Polyfills + AdBlock)
            if "text/html" in content_type:
                logger.info(f"Injecting Player Shield into HTML from: {url}")
                text = remote_response.text
                
                # Determine remote base URL for the <base> tag to fix relative paths
                remote_base_url = url.rsplit('?', 1)[0].rsplit('/', 1)[0] + '/'
                
                injected_shield = f"""
                <base href="{remote_base_url}">
                <script>
                (function(realLocation) {{
                    window._WILSTREAM_SHIELD = true;
                    console.log("[WilStream] Ad-Shield v3.3 Activated (Ghost Stealth Mode)");
                    
                    // 0. LOCATION SHADOWING (Bypass Anti-Proxy Checks)
                    const location = new Proxy(realLocation, {{
                        get: (t, p) => {{
                            if (p === 'host' || p === 'hostname') return '{url.split("//")[-1].split("/")[0]}';
                            if (p === 'origin') return '{url.split("//")[0]}//{url.split("//")[-1].split("/")[0]}';
                            if (p === 'protocol') return 'https:';
                            if (p === 'href') return '{url}';
                            const val = t[p];
                            return typeof val === 'function' ? val.bind(t) : val;
                        }}
                    }});

                    // 1. NETWORK & ELEMENT INTERCEPTION
                    const BLOCKED_PATTERNS = [
                        'mrz.', 'ads.', 'track', 'analytic', 'doubleclick', 'syndication', 
                        'popunder', 'histats', 'whos.amung.us', 'kickads', 'adform',
                        '.cfd', '.xyz/v1/log', '/log/', 'sbx.js', 'sbx.html'
                    ];

                    const originalFetch = window.fetch;
                    window.fetch = function(url, options) {{
                        const urlString = String(url).toLowerCase();
                        if (BLOCKED_PATTERNS.some(p => urlString.includes(p))) {{
                            console.warn("[WilStream Ad-Shield] Blocked Fetch:", urlString);
                            return Promise.reject("Blocked by WilStream");
                        }}
                        return originalFetch.apply(this, arguments);
                    }};

                    const originalOpenXHR = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, url) {{
                        const urlString = String(url).toLowerCase();
                        if (BLOCKED_PATTERNS.some(p => urlString.includes(p))) {{
                            console.warn("[WilStream Ad-Shield] Blocked XHR:", urlString);
                            return; // Error or block
                        }}
                        return originalOpenXHR.apply(this, arguments);
                    }};

                    // Intercept dynamic element creation (RECURSIVE PROXY FOR IFRAMES)
                    const originalCreateElement = document.createElement;
                    const PROXY_ROOT = window.location.origin + '/api/proxy/?url=';
                    
                    document.createElement = function(tagName, ...args) {{
                        const el = originalCreateElement.call(document, tagName, ...args);
                        const tag = tagName.toLowerCase();
                        
                        if (['script', 'iframe', 'img', 'video', 'audio'].includes(tag)) {{
                            const originalSetAttribute = el.setAttribute;
                            el.setAttribute = function(name, value) {{
                                if ((name === 'src' || name === 'href') && value) {{
                                    const val = String(value).toLowerCase();
                                    
                                    // 1. Block if matches patterns
                                    if (BLOCKED_PATTERNS.some(p => val.includes(p))) {{
                                        console.warn("[WilStream Ad-Shield] Blocked " + tag + ": ", val);
                                        return; 
                                    }}
                                    
                                    // 2. Recursive Proxy for Iframes & Scripts (to keep them in our shield context)
                                    if ((tag === 'iframe' || tag === 'script') && val.startsWith('http') && !val.includes('api/proxy')) {{
                                        value = PROXY_ROOT + encodeURIComponent(value);
                                    }}
                                }}
                                return originalSetAttribute.apply(this, arguments);
                            }};
                            
                            // Define property interceptors
                            Object.defineProperty(el, 'src', {{
                                set: function(v) {{ this.setAttribute('src', v); }},
                                get: function() {{ return this.getAttribute('src'); }}
                            }});
                        }}
                        return el;
                    }};

                    // Block Tracking Beacons & Annoying Vibrations
                    if (navigator.sendBeacon) navigator.sendBeacon = function() {{ return true; }};
                    if (navigator.vibrate) navigator.vibrate = function() {{ return false; }};

                    // 2. CRYPTO POLYFILL
                    if (typeof window.crypto === 'undefined') window.crypto = {{}};
                    if (typeof window.crypto.subtle === 'undefined') {{
                        window.crypto.subtle = {{
                            digest: function(algo, data) {{
                                return new Promise(function(resolve) {{
                                    const hash = new Uint8Array(32);
                                    for(let i=0; i<32; i++) hash[i] = Math.floor(Math.random() * 256);
                                    resolve(hash.buffer);
                                }});
                            }},
                            importKey: function() {{ return Promise.resolve({{}}); }},
                            encrypt: function() {{ return Promise.resolve(new ArrayBuffer(0)); }},
                            decrypt: function() {{ return Promise.resolve(new ArrayBuffer(0)); }}
                        }};
                    }}

                    // 3. COMPATIBILITY PATCHES (Fix for player crashes)
                    
                    // A. History API Override (Prevents SecurityError on cross-origin URL updates)
                    try {{
                        const patchHistory = (method) => {{
                            const original = window.history[method];
                            window.history[method] = function(state, title, url) {{
                                try {{ return original.apply(this, arguments); }} 
                                catch(e) {{ console.warn("[WilStream Ad-Shield] Suppressed history."+method+" error"); }}
                            }};
                        }};
                        patchHistory('pushState');
                        patchHistory('replaceState');
                    }} catch(e) {{}}

                    // B. POPUP BLOCKER (GOD MODE)
                    const emptyWindowProxy = new Proxy({{}}, {{
                        get: (t, p) => {{
                            if (p === 'location') return {{ replace: () => {{}}, assign: () => {{}}, href: '' }};
                            return function() {{}};
                        }}
                    }});

                    window.open = function() {{ 
                        console.log("[WilStream Ad-Shield] Blocked popup attempt"); 
                        return emptyWindowProxy; 
                    }};

                    // Block click-hijacking via 'target=_blank' and invisible overlays
                    document.addEventListener('click', function(e) {{
                        const el = e.target;
                        
                        // Rule A: Block A tags with target=_blank
                        if (el.tagName === 'A' && el.target === '_blank') {{
                            console.warn("[WilStream Ad-Shield] Blocked link redirection");
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }}

                        // Rule B: Detect invisible overlays (common in actors players)
                        const style = window.getComputedStyle(el);
                        const isOpaque = parseFloat(style.opacity) < 0.1 || style.visibility === 'hidden';
                        const isGiant = el.offsetWidth > window.innerWidth * 0.8 && el.offsetHeight > window.innerHeight * 0.8;
                        if (isGiant && isOpaque) {{
                            console.warn("[WilStream Ad-Shield] Blocked invisible overlay click");
                            el.remove(); // Nuke the overlay
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }}
                    }}, true);

                    // 4. PERIODIC CLEANUP (Remove ad-divs that spawn)
                    setInterval(() => {{
                        document.querySelectorAll('div[id*="pop"], [class*="pop"], iframe[src*="track"], [id*="ad-"], [class*="ad-"], [src*="vsembed"]').forEach(el => el.remove());
                    }}, 1500);

                }})(window.location);
                </script>
                """
                
                # SURGICAL SOURCE SCRUBBING (Nuke scripts/iframes before they load)
                # This removes tags that my JS shield might be too late to catch
                patterns_to_nuke = [
                    r'<script[^>]*sbx\.js[^>]*>.*?</script>',
                    r'<script[^>]*analytics[^>]*>.*?</script>',
                    r'<script[^>]*ads[^>]*>.*?</script>',
                    r'<iframe[^>]*ads[^>]*>.*?</iframe>',
                    r'<iframe[^>]*popunder[^>]*>.*?</iframe>'
                ]
                for pattern in patterns_to_nuke:
                    text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)

                # RECURSIVE SOURCE REWRITING v2
                proxy_base = f"{request.base_url}api/proxy/?url="
                remote_domain = url.split('//')[0] + '//' + url.split('//')[1].split('/')[0]
                
                # 1. Rewriting Absolute URLs
                text = re.sub(r'src=["\'](https?://(?!localhost|127\.0\.0\.1|192\.168)[^"\']+)["\']', 
                              lambda m: f'src="{proxy_base}{quote(m.group(1))}"', text)
                
                # 2. Rewriting Relative URLs (starting with /)
                text = re.sub(r'src=["\'](/[^/][^"\']*)["\']', 
                              lambda m: f'src="{proxy_base}{quote(remote_domain + m.group(1))}"', text)
                
                # Inject just after <head> or at the beginning
                if "<head>" in text:
                    text = text.replace("<head>", f"<head>{injected_shield}")
                elif "<html>" in text:
                    text = text.replace("<html>", f"<html><head>{injected_shield}</head>")
                else:
                    text = injected_shield + text

                return Response(
                    content=text,
                    media_type=content_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    }
                )

            # 2. Check for M3U8/M3U playlist to rewrite URLs
            is_playlist = any(ext in url.lower() or ext in content_type for ext in [".m3u8", ".m3u", "mpegurl"])
            
            if is_playlist:
                text = remote_response.text
                base_url = str(remote_response.url).rsplit('/', 1)[0] + '/'
                proxy_base = str(request.base_url).rstrip('/')
                
                lines = []
                for line in text.splitlines():
                    line = line.strip()
                    if line and not line.startswith("#"):
                        full_url = line if "://" in line else base_url + line
                        # Proxy the segments/nested playlists too
                        # We use the correct endpoint with trailing slash for better routing
                        lines.append(f"{proxy_base}/api/proxy/?url={quote(full_url)}")
                    else:
                        lines.append(line)
                
                content = "\n".join(lines)
                return Response(
                    content=content,
                    media_type=content_type,
                    headers={"Access-Control-Allow-Origin": "*"}
                )

            # Standard resource proxy
            return Response(
                content=remote_response.content,
                status_code=remote_response.status_code,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache"
                }
            )
            
    except Exception as e:
        logger.error(f"Backend Proxy Exception for {url}: {e}")
        return Response(content=f"Proxy error: {str(e)}", status_code=502)
