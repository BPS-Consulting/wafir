// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAuthorizedPatterns,
  matchesPattern,
  isOriginAuthorized,
} from "../src/modules/chat/origin-validator.js";

describe("Chat Origin Validator", () => {
  const originalEnv = process.env.CHAT_AUTHORIZED_URLS;

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CHAT_AUTHORIZED_URLS;
    } else {
      process.env.CHAT_AUTHORIZED_URLS = originalEnv;
    }
  });

  describe("getAuthorizedPatterns", () => {
    it("should return empty array when env var is not set", () => {
      delete process.env.CHAT_AUTHORIZED_URLS;
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual([]);
    });

    it("should return empty array when env var is empty", () => {
      process.env.CHAT_AUTHORIZED_URLS = "";
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual([]);
    });

    it("should parse single URL", () => {
      process.env.CHAT_AUTHORIZED_URLS = "https://example.com";
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual(["https://example.com"]);
    });

    it("should parse multiple URLs", () => {
      process.env.CHAT_AUTHORIZED_URLS =
        "https://example.com,https://test.org,https://*.agency.gov";
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual([
        "https://example.com",
        "https://test.org",
        "https://*.agency.gov",
      ]);
    });

    it("should trim whitespace from URLs", () => {
      process.env.CHAT_AUTHORIZED_URLS =
        " https://example.com , https://test.org ";
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual(["https://example.com", "https://test.org"]);
    });

    it("should filter out empty entries", () => {
      process.env.CHAT_AUTHORIZED_URLS =
        "https://example.com,,https://test.org";
      const patterns = getAuthorizedPatterns();
      expect(patterns).toEqual(["https://example.com", "https://test.org"]);
    });
  });

  describe("matchesPattern", () => {
    describe("exact matches", () => {
      it("should match exact URL", () => {
        expect(
          matchesPattern("https://example.com", "https://example.com"),
        ).toBe(true);
      });

      it("should not match different protocol", () => {
        expect(
          matchesPattern("http://example.com", "https://example.com"),
        ).toBe(false);
      });

      it("should not match different domain", () => {
        expect(matchesPattern("https://other.com", "https://example.com")).toBe(
          false,
        );
      });

      it("should not match subdomain against exact domain", () => {
        expect(
          matchesPattern("https://sub.example.com", "https://example.com"),
        ).toBe(false);
      });
    });

    describe("wildcard matches", () => {
      it("should match subdomain with wildcard pattern", () => {
        expect(
          matchesPattern("https://sub.example.com", "https://*.example.com"),
        ).toBe(true);
      });

      it("should match deep subdomain with wildcard pattern", () => {
        expect(
          matchesPattern(
            "https://deep.sub.example.com",
            "https://*.example.com",
          ),
        ).toBe(true);
      });

      it("should match exact domain with wildcard pattern", () => {
        expect(
          matchesPattern("https://example.com", "https://*.example.com"),
        ).toBe(true);
      });

      it("should not match different protocol with wildcard", () => {
        expect(
          matchesPattern("http://sub.example.com", "https://*.example.com"),
        ).toBe(false);
      });

      it("should not match different base domain with wildcard", () => {
        expect(
          matchesPattern("https://sub.other.com", "https://*.example.com"),
        ).toBe(false);
      });

      it("should handle wildcard with port", () => {
        expect(
          matchesPattern(
            "https://sub.example.com:8080",
            "https://*.example.com:8080",
          ),
        ).toBe(true);
      });

      it("should not match when port differs", () => {
        expect(
          matchesPattern(
            "https://sub.example.com:8080",
            "https://*.example.com",
          ),
        ).toBe(false);
      });
    });
  });

  describe("isOriginAuthorized", () => {
    beforeEach(() => {
      process.env.CHAT_AUTHORIZED_URLS =
        "https://example.com,https://*.agency.gov";
    });

    it("should return false when origin is undefined", () => {
      expect(isOriginAuthorized(undefined)).toBe(false);
    });

    it("should return false when origin is empty string", () => {
      expect(isOriginAuthorized("")).toBe(false);
    });

    it("should return true for exact match", () => {
      expect(isOriginAuthorized("https://example.com")).toBe(true);
    });

    it("should return true for wildcard match", () => {
      expect(isOriginAuthorized("https://sub.agency.gov")).toBe(true);
    });

    it("should return false for unauthorized origin", () => {
      expect(isOriginAuthorized("https://malicious.com")).toBe(false);
    });

    it("should return false when no patterns are configured", () => {
      delete process.env.CHAT_AUTHORIZED_URLS;
      expect(isOriginAuthorized("https://example.com")).toBe(false);
    });
  });
});
