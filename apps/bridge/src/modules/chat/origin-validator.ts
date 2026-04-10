// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

/**
 * Validates if an origin is authorized for chat based on CHAT_AUTHORIZED_URLS.
 * Supports exact matches and wildcard subdomains (e.g., https://*.example.com).
 */

/**
 * Parses the CHAT_AUTHORIZED_URLS environment variable into a list of patterns.
 */
export function getAuthorizedPatterns(): string[] {
  const envValue = process.env.CHAT_AUTHORIZED_URLS || "";
  if (!envValue.trim()) {
    return [];
  }
  return envValue
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

/**
 * Checks if a given origin matches an authorized pattern.
 * Supports wildcard subdomains: https://*.example.com matches https://foo.example.com
 */
export function matchesPattern(origin: string, pattern: string): boolean {
  // Handle wildcard patterns like https://*.example.com
  if (pattern.includes("*.")) {
    try {
      const patternUrl = new URL(pattern.replace("*.", "placeholder."));
      const originUrl = new URL(origin);

      // Protocol must match exactly
      if (patternUrl.protocol !== originUrl.protocol) {
        return false;
      }

      // Port must match (or both be absent)
      if (patternUrl.port !== originUrl.port) {
        return false;
      }

      // Extract the base domain from pattern (e.g., example.com from *.example.com)
      const baseDomain = patternUrl.hostname.replace("placeholder.", "");

      // Origin hostname must end with .baseDomain or be exactly baseDomain
      const originHostname = originUrl.hostname;
      if (
        originHostname === baseDomain ||
        originHostname.endsWith("." + baseDomain)
      ) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Exact match (case-sensitive)
  return origin === pattern;
}

/**
 * Validates if an origin is authorized for chat.
 * @param origin - The Origin header value from the request
 * @returns true if the origin is authorized, false otherwise
 */
export function isOriginAuthorized(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  const patterns = getAuthorizedPatterns();
  if (patterns.length === 0) {
    // No authorized URLs configured = no origins allowed
    return false;
  }

  return patterns.some((pattern) => matchesPattern(origin, pattern));
}
