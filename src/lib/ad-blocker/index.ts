/**
 * WilFlix Ad Blocker Module
 *
 * Provides Brave-style ad blocking for the video player iframe.
 * Uses CSS injection and JavaScript interception to hide and block ads.
 *
 * @example
 * import { wrapIframeContent, shouldBlockAds } from '../lib/ad-blocker';
 *
 * const playerSrc = shouldBlockAds(profile, mediaType)
 *   ? wrapIframeContent(embedUrl)
 *   : embedUrl;
 */

export { wrapIframeContent, createInjectedIframeContent, shouldBlockAds } from './iframe-injector';
export { isBlockedDomain } from './blocked-domains';
export { EASYLIST_SELECTORS, WHITELIST_SELECTORS } from './filter-lists/easylist';
export { CUSTOM_SELECTORS, AD_TRACKING_DOMAINS } from './filter-lists/custom-selectors';
export { BLOCKED_DOMAINS } from './blocked-domains';
export { matchDomain, shouldBlockSelector, parseDomainRule } from './filter-engine';
