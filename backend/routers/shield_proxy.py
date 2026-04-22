from fastapi import APIRouter, HTTPException, Query, Response, Request
import httpx
import logging
import re
from urllib.parse import quote

router = APIRouter(tags=["Proxy"])
logger = logging.getLogger("WilStream.ShieldProxy")

@router.get("", response_class=Response)
@router.get("/", response_class=Response)
@router.post("", response_class=Response)
@router.post("/", response_class=Response)
async def proxy_request(request: Request, url: str = Query(..., description="The URL to proxy")):
    """
    WilStream Ghost Stealth Proxy v4.1
    Fixed nesting, indentation, and improved IPTV compatibility.
    """
    if not url.startswith("http"):
        return Response(content="Invalid URL", status_code=400)
    
    # KIN Blocklist (Ad/Tracker Domains)
    BLOCKED = ['disable-devtool', 'cordclip', 'nublet.shop', 'cyou', 
               'analytics.', 'doubleclick.net', 'track.adform', 'adnxs.com']
    if any(p in url.lower() for p in BLOCKED):
        return Response(content="/* WilStream Nuked */", media_type="text/javascript")

    # Detect if it's an IPTV request
    is_iptv_request = (
        "player_api.php" in url or
        "/live/" in url or
        "/get.php" in url or
        ".m3u8" in url or
        ".ts" in url
    )

    try:
        # Use a single client for the request
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False, verify=False) as client:
            domain = url.split("//")[-1].split("/")[0]
            origin = f"{url.split('//')[0]}//{domain}"

            # Battle-Ready User-Agent Rotation for IPTV
            # Some servers block Dalvik but allow Smarters, or vice-versa.
            # We also add X-Forwarded-For to bypass some Geo-IP/DNS blocks.
            ua_list = [
                "Dalvik/2.1.0 (Linux; U; Android 10; SM-G975F Build/QP1A.190711.020)",
                "Dalvik/2.1.0 (Linux; U; Android 12; SM-G991B Build/SP1A.210812.016)",
                "IPTVSmartersPlayer/3.0.0 (Linux; Android 12) okhttp/3.12.12",
                "VLC/3.0.18 LibVLC/3.0.18",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ] if is_iptv_request else [

                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ]

            method = request.method
            body = await request.body()
            remote_response = None
            
            # Global Retry/Redirect Loop
            current_url = url
            urls_to_try = [url]
            
            # If it's a 404 on a stream, we might need a different extension (.ts vs .m3u8)
            if is_iptv_request and any(e in url.lower() for e in [".m3u8", ".ts"]):
                alt_ext = ".ts" if ".m3u8" in url.lower() else ".m3u8"
                # Surgical extension replacement (only at the end, before query params)
                base_part, *query_part = url.split('?', 1)
                new_base = re.sub(r'(\.m3u8|\.ts)$', alt_ext, base_part, flags=re.IGNORECASE)
                alt_url = new_base + ('?' + query_part[0] if query_part else '')
                if alt_url != url:
                    urls_to_try.append(alt_url)

            remote_response = None
            for try_url in urls_to_try:
                # Add port shifting (80 -> 8080) as a fallback for specific streams
                current_urls = [try_url]
                if ":80/" in try_url or ("//" in try_url and ":" not in try_url.split("//")[1].split("/")[0]):
                    alt_port_url = try_url.replace(":80/", ":8080/").replace("tv.m3uts.xyz/", "tv.m3uts.xyz:8080/")
                    if alt_port_url != try_url:
                        current_urls.append(alt_port_url)
                
                for final_url in current_urls:
                    for ua in ua_list:
                        headers = {
                            "User-Agent": ua,
                            "Accept": "*/*",
                            "X-Forwarded-For": "1.1.1.1",
                            "Cache-Control": "no-cache",
                        }
                        if not is_iptv_request:
                            headers["Referer"] = origin + "/"
                            headers["Origin"] = origin
                        
                        # Internal Redirect Loop
                        inner_url = final_url
                        for _ in range(3):
                            try:
                                remote_response = await client.request(
                                    method, inner_url, headers=headers, content=body
                                )
                                if remote_response.status_code in (301, 302, 307, 308):
                                    new_url = remote_response.headers.get("location")
                                    if not new_url: break
                                    inner_url = new_url if "://" in new_url else str(httpx.URL(inner_url).join(new_url))
                                    continue
                                break
                            except Exception:
                                break
                        
                        # Success: Stop everything
                        if remote_response and remote_response.status_code < 400:
                            break
                    
                    if remote_response and remote_response.status_code < 400:
                        break
                
                if remote_response and remote_response.status_code < 400:
                    break

            
            if not remote_response:
                return Response(content="Gateway Timeout", status_code=504)



            content_type = remote_response.headers.get("content-type", "").lower()
            resp_headers = {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store",
            }
            if "set-cookie" in remote_response.headers:
                resp_headers["Set-Cookie"] = remote_response.headers["set-cookie"]

            # 1. HLS REWRITING (Specific check to avoid triggering on domains like tv.m3uts.xyz)
            is_playlist = (
                url.lower().split('?')[0].endswith(('.m3u8', '.m3u')) or 
                "mpegurl" in content_type
            )
            if is_playlist:
                try:
                    text = remote_response.text
                    # Use actual response URL (after redirects) for base path
                    effective_base = str(remote_response.url).rsplit('/', 1)[0] + '/'
                    proxy_base = f"{request.base_url}api/proxy/?url="
                    
                    lines = []
                    for line in text.splitlines():
                        line = line.strip()
                        if line and not line.startswith("#"):
                            full_url = line if "://" in line else effective_base + line
                            lines.append(f"{proxy_base}{quote(full_url)}")
                        else:
                            lines.append(line)
                    
                    return Response(
                        content="\n".join(lines),
                        status_code=remote_response.status_code,
                        media_type=content_type,
                        headers=resp_headers
                    )
                except Exception as e:
                    logger.warning(f"Playlist rewrite failed: {e}")

            # 2. HTML AD-SHIELD
            if "text/html" in content_type:
                try:
                    text = remote_response.text
                    if "<html" in text.lower() or "<head" in text.lower():
                        logger.info(f"Protecting HTML: {url}")
                        host_base = url.rsplit('/', 1)[0] if '/' in url.split('//')[1] else url
                        
                        def rewrite_tag_url(match):
                            tag_start, attr, quote_char, val = match.groups()
                            if val.startswith(('http', '//')):
                                full_val = val if val.startswith('http') else f"https:{val}"
                            else:
                                full_val = f"{host_base}/{val.lstrip('/')}"
                            return f'{tag_start}{attr}={quote_char}{request.base_url}api/proxy/?url={quote(full_val)}{quote_char}'

                        text = re.sub(r'(<(?:script|link|img|iframe)[^>]+)(src|href)=([\'"])([^"\']+)\3', rewrite_tag_url, text, flags=re.IGNORECASE)

                        shield_js = f"""
                        <script>
                        (function() {{
                            window._WILSTREAM_SHIELD = true;
                            const PROXY_ROOT = window.location.origin + '/api/proxy/?url=';
                            const proxify = (u) => {{
                                if (!u || String(u).includes(window.location.host) || String(u).startsWith('data:') || String(u).startsWith('blob:')) return u;
                                try {{ return PROXY_ROOT + encodeURIComponent(new URL(u, '{url}').href); }} catch(e) {{ return u; }}
                            }};
                            const oldFetch = window.fetch;
                            window.fetch = function(u, o) {{ return oldFetch(proxify(u), o); }};
                            const oldXHR = XMLHttpRequest.prototype.open;
                            XMLHttpRequest.prototype.open = function(m, u, ...args) {{ return oldXHR.call(this, m, proxify(u), ...args); }};
                        }})();
                        </script>
                        """
                        if "<head>" in text: text = text.replace("<head>", f"<head>{shield_js}")
                        elif "<html>" in text: text = text.replace("<html>", f"<html><head>{shield_js}</head></html>")
                        else: text = shield_js + text
                        
                        return Response(content=text, status_code=remote_response.status_code, media_type=content_type, headers=resp_headers)
                except Exception: pass

            # Default: Raw Content
            return Response(content=remote_response.content, status_code=remote_response.status_code, media_type=content_type, headers=resp_headers)

    except Exception as e:
        logger.error(f"Global Proxy Error: {str(e)}")
        return Response(content=f"Proxy Error: {str(e)}", status_code=502)
