/**
 * Test utilities for bridge API tests
 * Provides mock factories for GitHub API and S3
 */
import { vi, Mock } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

// Mock environment variables for tests
export function setupTestEnv(): void {
  process.env.GITHUB_APP_ID = "test-app-id";
  process.env.GITHUB_PRIVATE_KEY = "test-private-key";
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
  process.env.AWS_REGION = "us-east-1";
  process.env.S3_BUCKET_NAME = "test-bucket";
  process.env.BASE_URL = "http://localhost:3000";
}

// Types for mock octokit
export interface MockOctokit {
  rest: {
    repos: {
      getContent: Mock;
    };
    issues: {
      create: Mock;
    };
    users: {
      getByUsername: Mock;
    };
  };
  request: Mock;
  graphql: Mock;
}

// Create a mock Octokit instance
export function createMockOctokit(): MockOctokit {
  return {
    rest: {
      repos: {
        getContent: vi.fn(),
      },
      issues: {
        create: vi.fn(),
      },
      users: {
        getByUsername: vi.fn(),
      },
    },
    request: vi.fn(),
    graphql: vi.fn(),
  };
}

// Mock S3 client response generators
export interface MockS3Client {
  send: Mock;
}

export function createMockS3Client(): MockS3Client {
  return {
    send: vi.fn(),
  };
}

// Token store mock interface
export interface MockTokenStore {
  setUserToken: Mock;
  getUserToken: Mock;
  deleteUserToken: Mock;
  hasUserToken: Mock;
}

export function createMockTokenStore(): MockTokenStore {
  return {
    setUserToken: vi.fn().mockResolvedValue(undefined),
    getUserToken: vi.fn().mockResolvedValue(undefined),
    deleteUserToken: vi.fn().mockResolvedValue(true),
    hasUserToken: vi.fn().mockResolvedValue(false),
  };
}

// Sample wafir.yaml content encoded as base64
export function encodeYamlToBase64(yamlContent: string): string {
  return Buffer.from(yamlContent).toString("base64");
}

// Sample configs for testing
export const sampleConfigs = {
  minimal: `
title: "Feedback"
storage:
  type: issue
`,
  withProject: `
title: "Feedback"
storage:
  type: project
  projectNumber: 1
`,
  withFeedbackProject: `
title: "Feedback"
storage:
  type: issue
feedbackProject:
  projectNumber: 2
  ratingField: "Rating"
`,
  full: `
title: "Full Config"
storage:
  type: both
  projectNumber: 1
telemetry:
  screenshot: true
  browserInfo: true
  consoleLog: true
tabs:
  - id: feedback
    label: "Feedback"
    icon: "thumbsup"
    isFeedback: true
    fields:
      - id: rating
        type: rating
        attributes:
          label: "Rating"
`,
};

// Build a test Fastify app with mocked plugins
export async function buildTestApp(options: {
  mockOctokit?: MockOctokit;
  mockS3Client?: MockS3Client;
  mockTokenStore?: MockTokenStore;
}): Promise<FastifyInstance> {
  const {
    mockOctokit = createMockOctokit(),
    mockTokenStore = createMockTokenStore(),
  } = options;

  const app = Fastify({
    logger: false,
  });

  // Register mock GitHub plugin - use 'any' to avoid type conflicts with real plugin
  await app.register(
    fp(async (fastify) => {
      (fastify as any).decorate(
        "getGitHubClient",
        vi.fn().mockResolvedValue(mockOctokit),
      );
      (fastify as any).decorate(
        "getGitHubClientWithToken",
        vi.fn().mockReturnValue(mockOctokit),
      );
    }),
  );

  // Register mock token store plugin
  await app.register(
    fp(async (fastify) => {
      (fastify as any).decorate("tokenStore", mockTokenStore);
    }),
  );

  // Register sensible for error handling
  await app.register(import("@fastify/sensible"));

  // Register multipart for file uploads
  await app.register(import("@fastify/multipart"));

  return app;
}

// Helper to get mocked decorators from app
export function getAppMocks(app: FastifyInstance): {
  getGitHubClient: Mock;
  getGitHubClientWithToken: Mock;
  tokenStore: MockTokenStore;
} {
  return {
    getGitHubClient: (app as any).getGitHubClient,
    getGitHubClientWithToken: (app as any).getGitHubClientWithToken,
    tokenStore: (app as any).tokenStore,
  };
}
