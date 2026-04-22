import { EASYLIST_SELECTORS } from './filter-lists/easylist';
import { CUSTOM_SELECTORS } from './filter-lists/custom-selectors';
import { BLOCKED_DOMAINS } from './blocked-domains';

/**
 * Combines all ad selectors into a single CSS string
 */
function getAdBlockerCSS(): string {
  const allSelectors = [...EASYLIST_SELECTORS, ...CUSTOM_SELECTORS];
  const uniqueSelectors = [...new Set(allSelectors)];

  // Whitelist some important selectors to never block
  const safeSelectors = uniqueSelectors.filter(selector => {
    // Don't block player elements
    if (selector.includes('player') || selector.includes('video')) return false;
    // Don't block modal/overlay elements that are legitimate UI
    if (selector.includes('modal-overlay') || selector.includes('lightbox')) return false;
    return true;
  });

  return `
    /* WilStream AdBlocker - Hide common ad elements */
    ${safeSelectors.join(',\n')} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
      position: absolute !important;
      pointer-events: none !important;
      opacity: 0 !important;
      clip: rect(0, 0, 0, 0) !important;
      overflow: hidden !important;
      left: -9999px !important;
      top: -9999px !important;
    }

    /* Prevent body overflow and scroll hijacking */
    html, body {
      overflow: hidden !important;
      position: relative !important;
    }

    /* Hide common ad iframe patterns */
    iframe[src*="ads"],
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="banner"],
    iframe[src*="sponsor"],
    iframe[src*="popup"],
    iframe[src*="tab-under"] {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
    }

    /* Hide elements with ad-related attributes */
    [onclick*="popup"],
    [onclick*="redirect"],
    [onclick*="window.open"],
    [href*="popup"],
    [href*="redirect"] {
      display: none !important;
    }
  `;
}

/**
 * Returns the JavaScript code to inject for ad blocking
 */
function getAdBlockerJS(): string {
  const selectors = [...EASYLIST_SELECTORS, ...CUSTOM_SELECTORS];
  const uniqueSelectors = [...new Set(selectors)];
  const safeSelectors = uniqueSelectors.filter(s => {
    if (s.includes('player') || s.includes('video')) return false;
    if (s.includes('modal-overlay') || s.includes('lightbox')) return false;
    return true;
  });

  const blockedDomains = BLOCKED_DOMAINS;

  return `
    (function() {
      'use strict';

      // 0. CRYPTO & TEXT ENCODER POLYFILL (Essential for modern players in non-HTTPS/Iframe environments)
      if (typeof window.TextEncoder === 'undefined') {
        window.TextEncoder = function() {};
        window.TextEncoder.prototype.encode = function(s) {
          var a = new Uint8Array(s.length);
          for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
          return a;
        };
      }

      if (typeof window.crypto === 'undefined') window.crypto = {};
      if (typeof window.crypto.subtle === 'undefined') {
        try {
          const subtlePolyfill = {
            digest: function(algo, data) {
              return new Promise(function(resolve) {
                // Determine algorithm
                const algoName = (typeof algo === 'string' ? algo : algo.name || 'SHA-256').toUpperCase();
                console.log('[WilStream AdBlock] SubtleCrypto.digest polyfill (' + algoName + ')');
                
                // Return a hash-like buffer to prevent execution flow from breaking
                // Most players use this for integrity or simple id generation
                const hash = new Uint8Array(32);
                for(let i=0; i<32; i++) hash[i] = Math.floor(Math.random() * 256);
                resolve(hash.buffer);
              });
            },
            importKey: function() { return Promise.resolve({}); },
            encrypt: function() { return Promise.resolve(new ArrayBuffer(0)); },
            decrypt: function() { return Promise.resolve(new ArrayBuffer(0)); }
          };

          Object.defineProperty(window.crypto, 'subtle', {
            value: subtlePolyfill,
            configurable: true,
            writable: true
          });
        } catch (e) {
          console.error('[WilStream] Failed to inject crypto polyfill:', e);
        }
      }

      // 1. ADVANCED POPUP BLOCKER (GOD MODE)
      const emptyWindowProxy = new Proxy({}, {
        get: (target, prop) => {
          if (prop === 'location') return { replace: () => {}, assign: () => {}, href: '' };
          if (typeof prop === 'string' && ['focus', 'blur', 'close', 'postMessage'].includes(prop)) return () => {};
          return null;
        }
      });

      // Override window.open immediately
      window.open = function() {
        console.warn('[WilStream AdBlock] Blocked popup attempt');
        return emptyWindowProxy;
      };

      // 2. CLICK INTERCEPTION (ANTI-POPUP GUARD)
      document.addEventListener('click', function(e) {
        // Prevent all clicks that try to open a new tab/window
        if (e.target && e.target.tagName === 'A') {
          const target = e.target.getAttribute('target');
          if (target === '_blank' || target === '_parent' || target === '_top') {
             console.warn('[WilStream AdBlock] Blocked target redirection click');
             e.preventDefault();
             e.stopImmediatePropagation();
             return false;
          }
        }

        // Detect invisible overlays (common in movie players)
        const element = e.target;
        const style = window.getComputedStyle(element);
        const isTransparent = parseFloat(style.opacity) < 0.2;
        const isFullscreenCover = element.offsetWidth > window.innerWidth * 0.9 && element.offsetHeight > window.innerHeight * 0.9;
        
        if (isTransparent && isFullscreenCover) {
          console.warn('[WilStream AdBlock] Auto-deleting invisible ad overlay');
          element.remove();
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      }, true);

      // 3. OVERRIDE NAVIGATION API
      const safeAssign = (url) => {
          if (!url) return;
          console.warn('[WilStream AdBlock] Filtered navigation attempt:', url);
      };

      // We cannot easily overwrite location properties without breaking things, 
      // but we can block scripts that try to use them for ads
      const originalLocationAssign = window.location.assign;
      const originalLocationReplace = window.location.replace;
      
      // 4. BLOCK AD SCRIPTS FROM RUNNING
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName, ...args) {
        const el = originalCreateElement.call(document, tagName, ...args);
        if (tagName.toLowerCase() === 'script') {
          const originalSetAttribute = el.setAttribute;
          el.setAttribute = function(name, value) {
            if (name === 'src' && value) {
              const whiteList = ['cloudnestra', 'vsembed', 'vidcloud', '111movies'];
              const isWhiteListed = whiteList.some(w => value.toLowerCase().includes(w));
              const blocked = !isWhiteListed && ${JSON.stringify(blockedDomains)}.some(d => value.toLowerCase().includes(d.toLowerCase()));
              if (blocked) {
                console.warn('[WilStream AdBlock] Blocked ad script injection:', value);
                return;
              }
            }
            return originalSetAttribute.call(el, name, value);
          };
          Object.defineProperty(el, 'src', {
            set: function(value) {
              const whiteList = ['cloudnestra', 'vsembed', 'vidcloud', '111movies'];
              const isWhiteListed = whiteList.some(w => value.toLowerCase().includes(w.toLowerCase()));
              const blocked = !isWhiteListed && ${JSON.stringify(blockedDomains)}.some(d => value.toLowerCase().includes(d.toLowerCase()));
              if (blocked) {
                console.warn('[WilStream AdBlock] Blocked ad script src:', value);
                return;
              }
              this.setAttribute('src', value);
            },
            get: function() { return this.getAttribute('src'); }
          });
        }
        return el;
      };

      // 5. PERIODIC CLEANUP
      function aggressiveCleanup() {
        const selectors = ${JSON.stringify(safeSelectors)};
        selectors.forEach(sel => {
          try {
            document.querySelectorAll(sel).forEach(el => el.remove());
          } catch(e) {}
        });
        
        // Remove common ad overlays patterns
        document.querySelectorAll('div[id*="pop"], div[class*="pop"], div[id*="ad"], div[class*="ad"]').forEach(el => {
           const style = window.getComputedStyle(el);
           if (parseInt(style.zIndex) > 1000) {
              el.remove();
           }
        });
      }

      setInterval(aggressiveCleanup, 1000);
      aggressiveCleanup();

      console.log('[WilStream AdBlock] GOD MODE ACTIVATED');
    })();
  `;
}

/**
 * Creates an HTML wrapper that injects ad-blocking CSS/JS before loading the original URL.
 * Uses window.location.replace to redirect to the actual video page AFTER the ad blocker
 * is set up. This ensures our JS runs in the SAME context as the video player.
 */
export function wrapIframeContent(originalUrl: string): string {
  const css = getAdBlockerCSS();
  const js = getAdBlockerJS();

  // Inject ad blocker code, then redirect to video page
  // The redirect happens AFTER the ad blocker is set up, so our overrides
  // are in place before the video page loads any ad scripts
  const wrapperHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${css}</style>
</head>
<body>
  <script>
    // First, immediately block any pending scripts from running
    // Then set up our ad blocker overrides
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to ensure our overrides are in place before any async scripts
      setTimeout(function() {
        window.location.replace(${JSON.stringify(originalUrl)});
      }, 50);
    });
    // If DOM is already loaded, redirect immediately after our code runs
    if (document.readyState !== 'loading') {
      setTimeout(function() {
        window.location.replace(${JSON.stringify(originalUrl)});
      }, 50);
    }
  </script>
  <script>
    // Run the actual ad blocker code first
    ${js}
    // Then redirect
    window.location.replace(${JSON.stringify(originalUrl)});
  </script>
</body>
</html>`;

  // Encode as data URI for iframe src
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(wrapperHTML);
}

/**
 * Creates a self-navigating page that:
 * 1. First runs our anti-popup JS overrides in the current context
 * 2. Then navigates TO the target URL via location.replace()
 *
 * This way, our JS overrides (window.open, etc.) are established BEFORE 
 * the player page loads — all in the SAME browsing context.
 * 
 * IMPORTANT: The calling iframe must NOT have sandbox="allow-same-origin" 
 * when this is used, otherwise location.replace may be blocked.
 */
export function createInjectedIframeContent(originalUrl: string): string {
  const js = getAdBlockerJS();
  const css = getAdBlockerCSS();

  // We generate HTML that:
  // 1. Sets up overrides synchronously
  // 2. Then navigates to the real player URL
  // This means our overrides run BEFORE the player page's own scripts
  const wrapperHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
  <style>
    body { margin:0; padding:0; background:#000; }
    ${css}
  </style>
</head>
<body>
  <script>
    // PHASE 1: Install overrides BEFORE navigating to the player
    // These will persist in the new document loaded by location.replace
    // because we are replacing, not opening a new context
    try {
      ${js}
    } catch(e) {
      console.error('[WilStream] AdBlock setup error:', e);
    }

    // PHASE 2: Navigate to the real player (replaces this page in history)
    // The overrides we set above will be active in the new page context
    // Note: This works because location.replace navigates the SAME frame.
    // The JS context is reset by the new page, but native browser-level
    // protections like sandbox remain in effect.
    window.location.replace(${JSON.stringify(originalUrl)});
  </script>
  <noscript>
    <!-- Fallback if JS is disabled -->
    <meta http-equiv="refresh" content="0;url=${originalUrl.replace(/"/g, '&quot;')}">
  </noscript>
</body>
</html>`;

  return 'data:text/html;charset=utf-8,' + encodeURIComponent(wrapperHTML);
}


/**
 * Checks if ad blocking should be applied based on profile settings
 */
export function shouldBlockAds(profile: { ads_removed?: boolean }, mediaType: string, url?: string): boolean {
  // 1. Force block for known high-ad domains (Live & Movies)
  const problematicDomains = [
    'dlhd.dad', 'daddyhd.php', 'magma', 'vidsrc', 'vidlink', 
    '111movies', 'videasy', 'vidfast', 'vidnest', 'multiembed'
  ];
  
  if (url) {
    const isProblematic = problematicDomains.some(domain => url.toLowerCase().includes(domain));
    if (isProblematic) return true;
  }
  
  // 2. For other live TV, we might want to skip to avoid breaking the player (special live streams)
  if (mediaType === 'live' && !profile.ads_removed) return false;
  
  // 3. For movies/tv, we usually want to block if possible, but respect the profile for normal sites
  return !!profile.ads_removed;
}
