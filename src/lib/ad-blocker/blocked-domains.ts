/**
 * Combined list of blocked advertising and tracking domains
 * Unified from native Android blacklist + additional known ad domains
 */
export const BLOCKED_DOMAINS: string[] = [
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

  // Tracking & Analytics
  'scorecardresearch.com',
  'quantserve.com',
  'bluekai.com',
  'exelator.com',
  'krxd.net',
  'taboola.com',
  'outbrain.com',
  'segment.com',
  'mixpanel.com',
  'hotjar.com',
  'clicky.com',

  // Popup/Aggressive networks
  'popads.net',
  'popcash.net',
  'popunder.net',
  'cpmstar.com',
  'propellerads.com',
  'mgid.com',
  'realsrv.com',
  'onclickads.net',
  'adsterra.com',
  'adcash.com',
  'shorte.st',
  'ouo.io',
  'clk.sh',
  'bc.vc',

  // Video Ad Networks
  'spotxchange.com',
  'tremorhub.com',
  'videoplaza.com',
  'vungle.com',
  'applovin.com',
  'unityads.unity3d.com',

  // Common Ad-Server Patterns
  'ad-delivery.net',
  'ad-system.com',
  'adnuntius.com',
  'adserv.com',
  'adsky.com',
  'adverticum.net',

  // Cryptojacking/Mining (Often in pirated streams)
  'coinhive.com',
  'coin-have.com',
  'crypto-loot.com',

  // Malware/Scam patterns
  'win-update.com',
  'system-update.com',
  'security-check.com',
  
  // Specific domains found in movie players (Blocked ads BUT NOT the domain itself)
  'mundodrama.site',
  'pelisplus.icu',
  'vidcloud.icu',
  'mystream.to',
  'rabbitstream.net',
  'doodstream.com',
  'streamtape.com',
  'mixdrop.co',
  'upstream.to',
  'voe.sx',
  'vidoza.net',
  'waaw.to',
  'evoload.io',
  'uptobox.com',
  'gounlimited.to',
  'clipwatching.com',
  'vidfast.co',
  'vidshare.tv',
  'speedvideo.net',
  'wstream.video',
  'direct-link.net',
  'linkvertise.com',
  
  // More aggressive lists
  'a.realsrv.com',
  'syndication.realsrv.com',
  'creative.realsrv.com',
  'asrv-a.akamaihd.net',
  'cdn.popcash.net',
  'engine.popads.net',
  'adinfo.co.za',
  'adk2.co',
  'adk2x.com',
  'adsafeprotected.com',
  'adspirit.net',
  'adtech.de',
  'adtechus.com',
  'airpush.com',
  'amazon-adsystem.com',
  'apxv.com',
  'atdmt.com',
  'bidswitch.net',
  'casalemedia.com',
  'chartbeat.com',
  'conviva.com',
  'crwdcntrl.net',
  'dotomi.com',
  'everesttech.net',
  'fastclick.net',
  'flashtalking.com',
  'imrworldwide.com',
  'insightexpressai.com',
  'kontera.com',
  'legendads.com',
  'lijit.com',
  'moatads.com',
  'mookie1.com',
  'nmlsq.com',
  'openx.net',
  'p-n.io',
  'pubmatic.com',
  'revcontent.com',
  'rlcdn.com',
  'rubiconproject.com',
  'serving-sys.com',
  'sharethrough.com',
  'smartadserver.com',
  'tapad.com',
  'turn.com',
  'yieldmo.com',
  'zedo.com',
];

/**
 * Check if a URL's domain matches any blocked domain
 */
export function isBlockedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(blocked =>
      hostname.includes(blocked.toLowerCase())
    );
  } catch {
    return false;
  }
}
