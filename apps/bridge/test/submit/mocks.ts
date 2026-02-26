/**
 * Mock setup for submit endpoint tests
 * Provides S3 mocking and fetch mocking utilities
 */
import { vi } from "vitest";

// Create a shared mock send function that we can control
export const mockS3Send = vi.fn();

// Create a mock fetch for config URL fetching
export const mockFetch = vi.fn();

// Mock the S3 client module before importing the route
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class MockS3Client {
      send = mockS3Send;
    },
    PutObjectCommand: class MockPutObjectCommand {
      constructor(public params: unknown) {}
    },
    GetObjectCommand: class MockGetObjectCommand {
      constructor(public params: unknown) {}
    },
    DeleteObjectCommand: class MockDeleteObjectCommand {
      constructor(public params: unknown) {}
    },
    HeadObjectCommand: class MockHeadObjectCommand {
      constructor(public params: unknown) {}
    },
  };
});

// Store original fetch for restoration
let originalFetch: typeof global.fetch;

/**
 * Setup mock fetch and store original
 */
export function setupMockFetch(): void {
  originalFetch = global.fetch;
  global.fetch = mockFetch as unknown as typeof fetch;
}

/**
 * Restore original fetch
 */
export function restoreMockFetch(): void {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}

/**
 * Reset all mocks to clean state
 */
export function resetAllMocks(): void {
  mockS3Send.mockReset();
  mockS3Send.mockResolvedValue({});
  mockFetch.mockReset();
}
