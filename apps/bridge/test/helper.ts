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
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    label: "Report Issue"
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`,
  withProject: `
title: "Feedback"
targets:
  - id: github-issues
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    label: "Report Issue"
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`,
  withFeedbackProject: `
title: "Feedback"
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    label: "Feedback"
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: rating
        type: rating
        validations:
          required: true
      - id: message
        type: textarea
`,
  full: `
title: "Full Config"
targets:
  - id: github-issues
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    label: "Report Issue"
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
  - id: feedback
    label: "Feedback"
    icon: "thumbsup"
    body:
      - id: rating
        type: rating
        attributes:
          label: "Rating"
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`,
  withAutofillFields: `
title: "Config with Autofill Fields"
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    label: "Report Issue"
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
      - id: browser-info
        type: textarea
        attributes:
          label: "Browser Info"
          autofill: browserInfo
        validations:
          required: false
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
