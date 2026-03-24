/**
 * WilFlix-specific ad selectors for streaming embed sites
 * These target common patterns seen in movie/TV streaming sites
 */
export const CUSTOM_SELECTORS: string[] = [
  // Common streaming site ad patterns
  '[class*="ad-popup"]',
  '[class*="ad-modal"]',
  '[class*="ad-box"]',
  '[class*="ad-close"]',
  '[class*="close-ad"]',

  // Pre-roll skip buttons (often styled as ads)
  '[class*="skip-ad"]',
  '[class*="ad-skip"]',
  '.skip-button',

  // Fake play buttons / clickbait
  '[class*="fake-play"]',
  '[class*="clickbait"]',

  // Survey/poll overlays
  '[class*="survey"]',
  '[class*="poll-overlay"]',

  // Lock/verification overlays (often ad-related)
  '[class*="lock-overlay"]',
  '[class*="verify-overlay"]',
  '[class*="unlock-overlay"]',

  // Generic ad-related close buttons
  '[class*="ad-close"]',
  '[class*="close-add"]',
  '.ad .close',

  // Streaming site specific
  '[class*="stream-ad"]',
  '[class*="movie-ad"]',

  // Download buttons (often ad-laden)
  '[class*="download-btn"]',
  '[class*="download-wrapper"]',

  // Share/copy overlays
  '[class*="share-overlay"]',
  '[class*="copy-overlay"]',

  // Video player overlays (fake close buttons)
  '.vjs-overlay',
  '.vjs-overlay-click',
  '[class*="overlay-close"]',
  '[class*="close-overlay"]',

  // Common ad container classes
  '.adsbox',
  '.adframe',
  '.ad-content',
  '.ad-wrapper',
  '.ad-container',
  '.advert-block',
  '.sponsored-content',

  // Popup/tabunder elements
  '[id*="popup"]',
  '[class*="popup"]',
  '[id*="tab-under"]',
  '[class*="tab-under"]',

  // Floating/fixed ad elements
  '.float-ads',
  '.fixed-ads',
  '[class*="float-ad"]',
  '[class*="fixed-ad"]',

  // Redirect warning pages
  '[class*="redirect"]',
  '[class*="gate"]',
  '[class*="captcha"]',

  // Video ad overlays
  '.preroll',
  '.midroll',
  '.postroll',
  '[class*="preroll"]',
  '[class*="midroll"]',
  '[class*="video-ads"]',

  // VidNest and similar streaming site patterns
  '[class*="banner"]',
  '[class*="sponsor"]',
  '[id*="banner"]',
  'iframe[src*="banner"]',
  'iframe[src*="sponsor"]',

  // Generic ad patterns
  '[class*="advertisement"]',
  '[id*="advertisement"]',
  '[class*="promo"]',
  '[class*="promotion"]',
];

/**
 * Domains that are known ad/tracking networks
 * Used for blocking via fetch/XHR interception
 */
export const AD_TRACKING_DOMAINS: string[] = [
  // Google ad networks
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'googletag.com',
  'googletagmanager.com',
  'google-analytics.com',
  'googleads.com',

  // Major ad networks
  'adsrvr.org',
  'adnxs.com',
  'adsymptotic.com',
  'adform.net',
  'adcolony.com',
  'admob.com',
  'adsense.com',

  // Tracking networks
  'scorecardresearch.com',
  'quantserve.com',
  'bluekai.com',
  'exelator.com',
  'krxd.net',
  'taboola.com',
  'outbrain.com',

  // Popup/clickbait networks
  'popads.net',
  'popcash.net',
  'popunder.net',
  'cpmstar.com',
  'propellerads.com',
  'mgid.com',

  // Other ad networks
  'adition.com',
  'adition.de',
  'advertising.com',
  'casalemedia.com',
  'contextweb.com',
  'criteo.com',
  'criteo.net',
  'demdex.net',
  'dntrk.com',
  'dotomi.com',
  'exponential.com',
  'eyeota.net',
  'gumgum.com',
  'industrybrains.com',
  'intentclick.com',
  'lijit.com',
  'liveintent.com',
  'liveramp.com',
  'mathtag.com',
  'mfadsrvr.com',
  'mookie1.com',
  'myvisualiq.net',
  'nativo.com',
  'nativo.net',
  'openx.net',
  'outbrain.com',
  'pardot.com',
  'perfectaudience.com',
  'pubmatic.com',
  'publishers.ads',
  'quantcount.com',
  'rfihub.com',
  'richaudience.com',
  'rosetta.33across.com',
  'rubiconproject.com',
  'sascdn.com',
  'sharethrough.com',
  'simpli.fi',
  'smartadserver.com',
  'spotxchange.com',
  'taboola.com',
  'tacticad.com',
  'tapad.com',
  'teads.tv',
  'tribalfusion.com',
  'turn.com',
  'undertone.com',
  'yahoo.com',
  'yahooads.com',
  'yieldmo.com',
  'zedo.com',
  'zergnet.com',

  // Additional known redirect/popup domains
  'trafficjunky.com',
  'exoclick.com',
  'a-ads.com',
  'bidvertiser.com',
  'megapopads.com',
  'popularix.com',
];
