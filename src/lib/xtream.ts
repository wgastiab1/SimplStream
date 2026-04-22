/**
 * Xtream Codes API Service for WilFlix
 */

import { XtreamCategory, XtreamStream } from '../types';
import { CONFIG } from '../config';

// Ports to try during auto-discovery (in order of likelihood)
// Ports to try during auto-discovery (in order of likelihood)
const XTREAM_PORTS = [80, 8080, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096, 8880, 8443, 25461];
const XTREAM_PATHS = ['/player_api.php', '/api/player_api.php'];

export class XtreamService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private resolvedBaseUrl: string | null = null; // Cached working base URL

  constructor(baseUrl: string = 'https://tv.m3uts.xyz', username: string = 'm', password: string = 'm') {
    let normalized = baseUrl.trim().endsWith('/') ? baseUrl.trim().slice(0, -1) : baseUrl.trim();
    if (!normalized.startsWith('http')) normalized = 'http://' + normalized;
    this.baseUrl = normalized;
    this.username = username;
    this.password = password;
  }

  private isNativePlatform(): boolean {
    return window.location.protocol === 'capacitor:' ||
           (window as any).__CAPACITOR_PLUGIN_AVAILABLE__ === true;
  }

  // Android UA required by most IPTV servers — they block browser/desktop UAs with 401/403/404
  private static readonly ANDROID_UA = 'Dalvik/2.1.0 (Linux; U; Android 12; SM-G991B Build/SP1A.210812.016)';

  private async rawFetch(url: string, init?: RequestInit): Promise<Response> {
    const isLocalIP = url.includes('192.168.') || url.includes('localhost') || url.includes('127.0.0.1');
    const androidHeaders = { 'User-Agent': XtreamService.ANDROID_UA, 'Accept': 'application/json, */*' };

    if (!isLocalIP && !this.isNativePlatform()) {
      // Browser (PC): always use backend proxy to bypass CORS
      // The proxy already sets the Android UA for IPTV requests
      const proxyUrl = `${CONFIG.BACKEND_URL}/api/proxy/?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { ...init, signal: AbortSignal.timeout(12000) });
      return res;
    }

    // Native Android: direct fetch with Android UA, then proxy fallback
    try {
      return await fetch(url, {
        ...init,
        headers: { ...androidHeaders, ...(init?.headers as any) },
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      const proxyUrl = `${CONFIG.BACKEND_URL}/api/proxy/?url=${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, { ...init, signal: AbortSignal.timeout(12000) });
    }
  }



  /**
   * Auto-discovers the working base URL (host + port + path) for this server.
   * Tries multiple ports if the default one fails.
   */
  private async discoverBaseUrl(): Promise<string> {
    if (this.resolvedBaseUrl) return this.resolvedBaseUrl;

    // Extract the host without port from the configured baseUrl
    const urlObj = new URL(this.baseUrl);
    const host = urlObj.hostname;
    // Build list of ports to try: configured port first, then common Xtream ports
    const defaultProtoPort = urlObj.protocol === 'https:' ? 443 : 80;
    const configuredPort = urlObj.port ? parseInt(urlObj.port) : defaultProtoPort;
    const portsToTry = [configuredPort, ...XTREAM_PORTS.filter(p => p !== configuredPort)];

    console.log(`[Xtream] Auto-discovering API for ${host}...`);

    for (const port of portsToTry) {
      for (const proto of ['http:', 'https:']) {
        const base = `${proto}//${host}:${port}`;
        for (const path of XTREAM_PATHS) {
          const testUrl = `${base}${path}?username=${this.username}&password=${this.password}&action=get_live_categories`;
          try {
            console.log(`[Xtream] Trying ${base}${path}...`);
            const res = await this.rawFetch(testUrl, { method: 'GET' });
            if (!res.ok) continue;

            const text = await res.text();
            // Must be JSON array (categories), not HTML or error object
            if (!text.trim().startsWith('[')) continue;

            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              this.resolvedBaseUrl = `${base}${path}?username=${this.username}&password=${this.password}`;
              console.log(`[Xtream] ✅ Found working endpoint: ${base}${path} (${data.length} categories)`);
              return this.resolvedBaseUrl;
            }
          } catch (e) {
            // Timeout or network error — try next
          }
        }
      }
    }

    // Fallback to configured URL
    const fallback = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
    console.warn(`[Xtream] ⚠️ No working endpoint found. Using fallback: ${fallback}`);
    this.resolvedBaseUrl = fallback;
    return fallback;
  }

  private async getUrl(action: string, extraParams: string = ''): Promise<string> {
    const base = await this.discoverBaseUrl();
    return `${base}&action=${action}${extraParams}`;
  }

  async testConnection(): Promise<{ ok: boolean; categories: number; streams: number; error?: string }> {
    try {
      const url = await this.getUrl('get_live_categories');
      const res = await this.rawFetch(url);
      const text = await res.text();

      if (!text.trim().startsWith('[')) {
        let msg = 'Servidor inválido o credenciales incorrectas';
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        return { ok: false, categories: 0, streams: 0, error: msg };
      }

      const cats = JSON.parse(text);
      if (!Array.isArray(cats) || cats.length === 0) {
        return { ok: false, categories: 0, streams: 0, error: 'Sin categorías — credenciales incorrectas' };
      }

      // Quick stream count
      const streamsUrl = await this.getUrl('get_live_streams');
      const sRes = await this.rawFetch(streamsUrl);
      const sText = await sRes.text();
      const streams = sText.trim().startsWith('[') ? JSON.parse(sText) : [];

      return { ok: true, categories: cats.length, streams: Array.isArray(streams) ? streams.length : 0 };
    } catch (e: any) {
      return { ok: false, categories: 0, streams: 0, error: e?.message || 'Error de red' };
    }
  }

  async getCategories(): Promise<XtreamCategory[]> {
    try {
      const url = await this.getUrl('get_live_categories');
      const res = await this.rawFetch(url);
      const text = await res.text();
      if (!text.trim().startsWith('[')) return [];
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[Xtream] getCategories error:', e);
      return [];
    }
  }

  async getStreams(categoryId?: string): Promise<XtreamStream[]> {
    try {
      const extra = categoryId ? `&category_id=${categoryId}` : '';
      const url = await this.getUrl('get_live_streams', extra);
      const res = await this.rawFetch(url);
      const text = await res.text();
      if (!text.trim().startsWith('[')) return [];
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[Xtream] getStreams error:', e);
      return [];
    }
  }

  getStreamUrl(streamId: number, extension: string = 'm3u8'): string {
    // Standard format: http://host:port/live/user/pass/id.ext
    // We prioritize the resolved discovery URL if available
    let host = this.baseUrl;
    if (this.resolvedBaseUrl) {
      try {
        const u = new URL(this.resolvedBaseUrl);
        host = `${u.protocol}//${u.host}`;
      } catch {}
    }
    
    return `${host}/live/${this.username}/${this.password}/${streamId}.${extension}`;
  }

}
