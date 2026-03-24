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

  // Other ad networks (from native Android blacklist)
  'adition.com',
  'advertising.com',
  'casalemedia.com',
  'contextweb.com',
  'criteo.com',
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
  'openx.net',
  'pardot.com',
  'perfectaudience.com',
  'pubmatic.com',
  'publishers.ads',
  'quantcount.com',
  'rfihub.com',
  'richaudience.com',
  'rubiconproject.com',
  'sascdn.com',
  'sharethrough.com',
  'simpli.fi',
  'smartadserver.com',
  'spotxchange.com',
  'tacticad.com',
  'tapad.com',
  'tribalfusion.com',
  'turn.com',
  'undertone.com',
  'yieldmo.com',
  'zedo.com',

  // Social media tracking
  'facebook.net',
  'fbcdn.net',
  'connect.facebook.net',
  'twitter.com/widgets',
  'platform.twitter.com',

  // Additional known ad domains
  'realsrv.com',
  'serving-sys.com',
  'sizmeadi.com',
  'staticads',
  'survdirect.com',
  'td573.com',
  'techweb.com',
  'telemetry',
  'thetraffic.com',
  'track.impsnetwork',
  'tracking',
  'trafficjunky.com',
  'trafficz.com',
  'valueclick.com',
  'vcommission.com',
  'vidcard.com',
  'videoadex.com',
  'videosecrets.com',
  'viewable.com',
  'viralniche.com',
  'visistat.com',
  'weborama.com',
  'whadvertising.com',
  'winredirect.com',
  'wtlive.com',
  'xab Sautracking',
  'xapads.com',
  'xhand.co',
  'xtube.com',
  'ybonic.com',
  'yesadvertising.com',
  'yieldmanager.com',
  'z5x.com',
  'zangocash.com',
  'zanox.com',
  'zedo.com',
  'zergnet.com',
  'zipopup.com',
  'zqtk.net',
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
