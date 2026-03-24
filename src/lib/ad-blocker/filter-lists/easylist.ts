/**
 * EasyList-style CSS selectors for hiding ad elements
 * Based on common ad container patterns used by uBlock Origin / EasyList
 */
export const EASYLIST_SELECTORS: string[] = [
  // Common ad containers
  '.ad-container',
  '.ad-wrapper',
  '.ad-banner',
  '.advertisement',
  '.ad-container',
  '.ad-unit',
  '.ad-section',
  '.ad-block',
  '.adblock',

  // ID patterns
  '[id^="google_ads"]',
  '[id^="div-gpt-ad"]',
  '[id^="ad-"]',
  '[id*="advertisement"]',
  '[id*="ad-slot"]',
  '[id*="adunit"]',

  // Class patterns
  '[class*="ad-container"]',
  '[class*="ad-wrapper"]',
  '[class*="ad-banner"]',
  '[class*="ad-slot"]',
  '[class*="advertisement"]',
  '[class*="advert-"]',
  '[class*="promoted-"]',
  '[class*="sponsor-"]',

  // Video ads (preroll/midroll overlays)
  '.video-ad-overlay',
  '.preroll-ad',
  '.preroll-overlay',
  '.midroll-ad',
  '[class*="video-ad"]',
  '[class*="preroll"]',
  '[class*="midroll"]',
  '.ad-overlay',
  '.overlay-ad',
  '[class*="ad-overlay"]',
  '[class*="ad-overlay-"]',

  // Popup containers
  '.popup-ad',
  '.popunder-ad',
  '.modal-ad',
  '[class*="popup-container"]',
  '[class*="popup-wrapper"]',
  '[class*="popunder-"]',

  // Sticky/fixed ads
  '.sticky-ad',
  '.fixed-ad',
  '.floating-ad',
  '[class*="sticky-ad"]',
  '[class*="fixed-ad"]',
  '[class*="floating-ad"]',
  '[class*="floating_"]',

  // Drawer/slide-in ads
  '.drawer-ad',
  '.slide-ad',
  '[class*="drawer-ad"]',

  // Native ads
  '.native-ad',
  '.native-advert',
  '[class*="native-ad"]',

  // Interstitial ads
  '.interstitial-ad',
  '.fullscreen-ad',
  '[class*="interstitial"]',

  // Generic patterns that catch many ad elements
  '.adsbygoogle',
  '.adsense',
  '[id^="ads"]',
  '[class*="ads-"]',
  'ins.adsbygoogle',

  // iframe ads (often used for ad networks)
  'iframe[src*="ads"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="adnxs"]',
  'iframe[src*="taboola"]',
  'iframe[src*="outbrain"]',
  'iframe[src*="popads"]',
  'iframe[src*="popcash"]',

  // Specific ad network containers
  '#taboola-below-article',
  '#outbrain-widget',
  '.taboola',
  '.outbrain',
  '.revcontent',
  '.mgid',

  // Cookie/privacy notices that block content (sometimes bundled with ads)
  '.cookie-notice',
  '.cookie-banner',
  '[class*="cookie-notice"]',

  // Generic overlay patterns used by streaming sites
  '[class*="overlay-close"]',
  '[class*="skip-ad"]',
  '[class*="ad-skip"]',

  // Tracking pixels (hidden)
  'img[src*="pixel"]',
  'img[src*="tracking"]',
  '[class*="tracking-pixel"]',
];

/**
 * Selectors for elements that are NOT ads but often blocked by mistake
 * These should be excluded from blocking
 */
export const WHITELIST_SELECTORS: string[] = [
  // Video player elements (NOT ads)
  '.video-container',
  '.player-container',
  '.player-wrapper',
  '[class*="player"]',
  '[class*="video-player"]',

  // Legitimate overlays
  '.modal-overlay',
  '.lightbox',
  '.popup-overlay',

  // Navigation elements
  '.nav-overlay',
  '.menu-overlay',

  // Content recommendations (NOT ads)
  '.recommendations',
  '.suggestions',
  '.related-content',
];
