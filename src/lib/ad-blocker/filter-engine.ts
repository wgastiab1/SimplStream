/**
 * Filter matching engine for ad blocking
 * Evaluates URLs and selectors against filter rules
 */

/**
 * Match a URL against a domain pattern
 * Supports wildcard patterns like *.ads.com
 */
export function matchDomain(url: string, pattern: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // Simple contains check for basic patterns
    if (patternLower.startsWith('*.')) {
      const domain = patternLower.slice(2);
      return hostname.endsWith(domain) || hostname === domain;
    }

    return hostname.includes(patternLower);
  } catch {
    return false;
  }
}

/**
 * Check if a selector should be blocked based on filter rules
 */
export function shouldBlockSelector(selector: string, blockedPatterns: string[]): boolean {
  const selectorLower = selector.toLowerCase();
  return blockedPatterns.some(pattern => selectorLower.includes(pattern.toLowerCase()));
}

/**
 * Parse an EasyList-style domain rule
 * e.g., "||example.com^" means block example.com and all subdomains
 */
export function parseDomainRule(rule: string): string | null {
  // Remove || prefix and ^ suffix (end anchor)
  if (rule.startsWith('||') && rule.endsWith('^')) {
    return rule.slice(2, -1);
  }
  // Handle || prefix only
  if (rule.startsWith('||')) {
    return rule.slice(2);
  }
  // Handle ^ suffix only
  if (rule.endsWith('^')) {
    return rule.slice(0, -1);
  }
  return null;
}
