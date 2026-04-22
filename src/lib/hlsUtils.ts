/**
 * Utility functions for HLS stream detection and playback.
 * Shared between LiveTVView and PlayerView to ensure consistency.
 */

/**
 * Detects if a URL is a direct HLS/MPEG-TS stream that must be played
 * with a native <video> element + HLS.js.
 * Returns false for embed pages (vidsrc, dlhd, etc.) which need an <iframe>.
 */
export function isHlsStream(url: string): boolean {
  const u = url.toLowerCase();
  // Direct stream file extensions — Must NOT be an embed wrapper like hls-player.html
  if (u.includes('hls-player.html')) return false;
  if (u.includes('.m3u8') || u.includes('.ts')) return true;
  // Common streaming server port patterns with live paths
  if (/:\d{4,5}\/(live|stream|hls|channel|play)\//i.test(url)) return true;
  // High-numbered port streaming servers (wowza, nginx-rtmp, oven media, etc.)
  if (/(:(1935|4433|4443|8080|8081|8088|19360|19000|30443|5443|3391|3332|1234|9981|9982|8888|8554))\//i.test(url)) return true;
  // Explicit live paths even without the port
  if (u.includes('/hls/') || u.includes('/playlist') || u.includes('/manifest')) return true;
  // Streamlock CDN HLS patterns
  if (u.includes('streamlock.net')) return true;
  // Common live streaming CDN patterns
  if (u.includes('.smil/') || u.includes('ngrp:')) return true;
  return false;
}
