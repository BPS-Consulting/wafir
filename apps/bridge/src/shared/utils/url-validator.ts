// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

/**
 * SSRF (Server-Side Request Forgery) protection utilities.
 * Validates URLs to prevent requests to internal/private networks.
 */

/**
 * List of blocked hostname patterns for SSRF protection.
 * Includes private IP ranges, localhost, and cloud metadata endpoints.
 */
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  // Localhost variations
  /^localhost$/i,
  /^localhost\.localdomain$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^\[::1\]$/,

  // Private IPv4 ranges (RFC 1918)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,

  // Link-local (APIPA)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,

  // Loopback range
  /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,

  // AWS/Cloud metadata endpoints
  /^169\.254\.169\.254$/,
  /^metadata\.google\.internal$/i,
  /^metadata\.goog$/i,

  // Azure metadata
  /^169\.254\.169\.253$/,

  // Kubernetes internal
  /\.cluster\.local$/i,
  /^kubernetes\.default/i,

  // Docker internal
  /^host\.docker\.internal$/i,
  /^gateway\.docker\.internal$/i,

  // Common internal hostnames
  /^internal$/i,
  /^intranet$/i,
  /^corp$/i,
  /^private$/i,
];

/**
 * Blocked ports that are commonly used for internal services.
 */
const BLOCKED_PORTS = new Set([
  22,    // SSH
  23,    // Telnet
  25,    // SMTP
  135,   // MS RPC
  137,   // NetBIOS
  138,   // NetBIOS
  139,   // NetBIOS
  445,   // SMB
  1433,  // MSSQL
  1521,  // Oracle
  3306,  // MySQL
  3389,  // RDP
  5432,  // PostgreSQL
  5900,  // VNC
  6379,  // Redis
  11211, // Memcached
  27017, // MongoDB
]);

/**
 * Allowed URL schemes for external requests.
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  resolvedUrl?: string;
}

/**
 * Validates a URL for SSRF protection.
 * Blocks requests to private networks, localhost, and cloud metadata endpoints.
 *
 * @param url - The URL to validate
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Validation result with error message if invalid
 */
export function validateUrl(url: string, baseUrl?: string): UrlValidationResult {
  try {
    // Resolve relative URLs if baseUrl is provided
    let resolvedUrl: URL;
    if (baseUrl && !url.startsWith("http://") && !url.startsWith("https://")) {
      const base = new URL(baseUrl);
      resolvedUrl = new URL(url, base);
    } else {
      resolvedUrl = new URL(url);
    }

    // Check scheme
    if (!ALLOWED_SCHEMES.has(resolvedUrl.protocol)) {
      return {
        valid: false,
        error: `Blocked URL scheme: ${resolvedUrl.protocol}. Only http: and https: are allowed.`,
      };
    }

    // Check hostname against blocked patterns
    const hostname = resolvedUrl.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          error: `Blocked hostname: ${hostname}. Requests to private/internal networks are not allowed.`,
        };
      }
    }

    // Check for IPv6 private addresses
    if (hostname.startsWith("[")) {
      const ipv6 = hostname.slice(1, -1).toLowerCase();
      if (
        ipv6 === "::1" ||
        ipv6.startsWith("fe80:") ||
        ipv6.startsWith("fc") ||
        ipv6.startsWith("fd")
      ) {
        return {
          valid: false,
          error: `Blocked IPv6 address: ${hostname}. Requests to private/internal networks are not allowed.`,
        };
      }
    }

    // Check port if specified
    if (resolvedUrl.port) {
      const port = parseInt(resolvedUrl.port, 10);
      if (BLOCKED_PORTS.has(port)) {
        return {
          valid: false,
          error: `Blocked port: ${port}. This port is commonly used for internal services.`,
        };
      }
    }

    // Check for URL with credentials (user:pass@host)
    if (resolvedUrl.username || resolvedUrl.password) {
      return {
        valid: false,
        error: "URLs with embedded credentials are not allowed.",
      };
    }

    return {
      valid: true,
      resolvedUrl: resolvedUrl.toString(),
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validates a URL and throws an error if invalid.
 * Convenience wrapper around validateUrl for use in async/await contexts.
 *
 * @param url - The URL to validate
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns The resolved URL string if valid
 * @throws Error if the URL is invalid or blocked
 */
export function assertSafeUrl(url: string, baseUrl?: string): string {
  const result = validateUrl(url, baseUrl);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return result.resolvedUrl!;
}
