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

      // Block window.open calls
      const originalOpen = window.open;
      window.open = function(url, ...args) {
        if (!url || url === '' || url === 'about:blank') {
          return originalOpen.apply(window, [url, ...args]);
        }
        try {
          const parsed = new URL(url, location.href);
          const hostname = parsed.hostname.toLowerCase();
          const blockedPatterns = ${JSON.stringify(blockedDomains)};
          const isBlocked = blockedPatterns.some(function(d) {
            return hostname.includes(d.toLowerCase());
          });
          if (isBlocked) {
            console.warn('[WilStream AdBlock] Blocked popup:', url);
            return null;
          }
        } catch(e) {}
        return originalOpen.apply(window, [url, ...args]);
      };

      // Block navigation/redirection attempts
      const originalAssign = window.location.assign;
      window.location.assign = function(url) {
        try {
          const parsed = new URL(url, location.href);
          const hostname = parsed.hostname.toLowerCase();
          const blockedPatterns = ${JSON.stringify(blockedDomains)};
          const isBlocked = blockedPatterns.some(function(d) {
            return hostname.includes(d.toLowerCase());
          });
          if (isBlocked) {
            console.warn('[WilStream AdBlock] Blocked navigation:', url);
            return;
          }
        } catch(e) {}
        return originalAssign.apply(window.location, [url]);
      };

      // Block top.location redirects
      Object.defineProperty(window, 'top', {
        get: function() { return window; },
        set: function(val) {
          try {
            if (val && val.location) {
              const hostname = val.location.hostname ? val.location.hostname.toLowerCase() : '';
              const blockedPatterns = ${JSON.stringify(blockedDomains)};
              const isBlocked = blockedPatterns.some(function(d) {
                return hostname.includes(d.toLowerCase());
              });
              if (isBlocked) {
                console.warn('[WilStream AdBlock] Blocked top.location redirect');
                return;
              }
            }
          } catch(e) {}
        }
      });

      // Block fetch/XHR to ad domains
      const originalFetch = window.fetch;
      window.fetch = function(url, ...args) {
        if (typeof url === 'string') {
          try {
            const parsed = new URL(url, location.href);
            const hostname = parsed.hostname.toLowerCase();
            const blockedPatterns = ${JSON.stringify(blockedDomains)};
            const isBlocked = blockedPatterns.some(function(d) {
              return hostname.includes(d.toLowerCase());
            });
            if (isBlocked) {
              console.warn('[WilStream AdBlock] Blocked fetch:', url);
              return Promise.reject(new Error('Blocked'));
            }
          } catch(e) {}
        }
        return originalFetch.apply(window, [url, ...args]);
      };

      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string') {
          try {
            const parsed = new URL(url, location.href);
            const hostname = parsed.hostname.toLowerCase();
            const blockedPatterns = ${JSON.stringify(blockedDomains)};
            const isBlocked = blockedPatterns.some(function(d) {
              return hostname.includes(d.toLowerCase());
            });
            if (isBlocked) {
              console.warn('[WilStream AdBlock] Blocked XHR:', url);
              this._blocked = true;
            }
          } catch(e) {}
        }
        return originalXHROpen.call(this, method, url, ...rest);
      };

      // Function to hide ad elements
      function hideAdElements(root) {
        if (!root) return;
        const selList = ${JSON.stringify(safeSelectors)};
        selList.forEach(function(selector) {
          try {
            var els = root.querySelectorAll(selector);
            els.forEach(function(el) {
              el.style.setProperty('display', 'none', 'important');
              el.style.setProperty('visibility', 'hidden', 'important');
              el.style.setProperty('height', '0', 'important');
              el.style.setProperty('width', '0', 'important');
              el.style.setProperty('pointer-events', 'none', 'important');
              el.style.setProperty('opacity', '0', 'important');
              el.style.setProperty('position', 'absolute', 'important');
              el.style.setProperty('left', '-9999px', 'important');
              el.style.setProperty('top', '-9999px', 'important');
            });
          } catch(e) {
            // querySelector may throw on invalid selectors
          }
        });
      }

      // Initial hide
      hideAdElements(document.body);

      // MutationObserver for dynamically added ads
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hideAdElements(node);
              // Also check children of the added node
              if (node.children && node.children.length) {
                Array.from(node.children).forEach(function(child) {
                  hideAdElements(child);
                });
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Periodic cleanup every 500ms to catch any missed ads
      setInterval(function() {
        hideAdElements(document.body);
      }, 500);

      // Intercept document.write (often used by ads)
      var originalWrite = document.write;
      document.write = function(content) {
        if (content && (content.toLowerCase().includes('ad') ||
            content.toLowerCase().includes('advertisement') ||
            content.toLowerCase().includes('sponsor'))) {
          console.warn('[WilStream AdBlock] Blocked document.write with ad content');
          return;
        }
        return originalWrite.apply(document, [content]);
      };

      // Block eval and setTimeout for suspicious scripts
      var originalSetTimeout = window.setTimeout;
      window.setTimeout = function(func, delay, ...args) {
        if (typeof func === 'string' && (func.includes('popup') || func.includes('redirect') || func.includes('window.open'))) {
          console.warn('[WilStream AdBlock] Blocked suspicious setTimeout');
          return 0;
        }
        return originalSetTimeout.apply(window, [func, delay, ...args]);
      };

      console.log('[WilStream AdBlock] Activated');
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
 * Alternative approach: Create an srcdoc content that embeds the iframe
 * This is useful when we want more control over the inner iframe
 */
export function createInjectedIframeContent(originalUrl: string): string {
  const css = getAdBlockerCSS();
  const js = getAdBlockerJS();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${css}</style>
</head>
<body>
  <script>${js}</script>
  <iframe
    src="${originalUrl.replace(/"/g, '&quot;')}"
    style="width:100%;height:100%;border:none;position:absolute;top:0;left:0;"
    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
  ></iframe>
</body>
</html>`;
}

/**
 * Checks if ad blocking should be applied based on profile settings
 */
export function shouldBlockAds(profile: { ads_removed?: boolean }, mediaType: string): boolean {
  // Don't block ads for live TV (they're part of the stream)
  if (mediaType === 'live') return false;
  return !!profile.ads_removed;
}
