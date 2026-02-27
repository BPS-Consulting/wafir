/**
 * Common setup for submit endpoint tests
 * Provides beforeEach/afterEach logic and app initialization
 */
import { beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  setupTestEnv,
  createMockOctokit,
  createMockTokenStore,
  sampleConfigs,
  MockOctokit,
  MockTokenStore,
} from "../helper.js";
import {
  mockS3Send,
  mockFetch,
  setupMockFetch,
  restoreMockFetch,
  resetAllMocks,
} from "./mocks.js";
import { createMockConfigResponse } from "./fixtures.js";

// Import the submit route after mocking
import submitRoute from "../../src/modules/submit/routes.js";

export interface TestContext {
  app: FastifyInstance;
  mockOctokit: MockOctokit;
  mockTokenStore: MockTokenStore;
}

/**
 * Setup function to be called in beforeEach
 */
export async function setupSubmitTest(): Promise<TestContext> {
  setupTestEnv();
  const mockOctokit = createMockOctokit();
  const mockTokenStore = createMockTokenStore();
  resetAllMocks();

  // Setup fetch mock
  setupMockFetch();

  const app = Fastify({ logger: false });

  // Register mock GitHub plugin
  await app.register(
    fp(async (fastify) => {
      fastify.decorate(
        "getGitHubClient",
        vi.fn().mockResolvedValue(mockOctokit),
      );
      fastify.decorate(
        "getGitHubClientWithToken",
        vi.fn().mockReturnValue(mockOctokit),
      );
    }),
  );

  // Register mock token store plugin
  await app.register(
    fp(async (fastify) => {
      fastify.decorate("tokenStore", mockTokenStore);
    }),
  );

  // Register sensible for error handling
  await app.register(import("@fastify/sensible"));

  // Register multipart for file uploads
  await app.register(import("@fastify/multipart"));

  // Register the submit route
  await app.register(submitRoute, { prefix: "/submit" });
  await app.ready();

  // Default mock for config fetch - returns minimal config
  mockFetch.mockResolvedValue(createMockConfigResponse(sampleConfigs.minimal));

  return { app, mockOctokit, mockTokenStore };
}

/**
 * Teardown function to be called in afterEach
 */
export async function teardownSubmitTest(app: FastifyInstance): Promise<void> {
  await app.close();
  vi.clearAllMocks();
  restoreMockFetch();
}

/**
 * Helper function to setup standard beforeEach/afterEach hooks
 * Returns a getter function for the context
 */
export function setupSubmitTestHooks(): () => TestContext {
  let context: TestContext;

  beforeEach(async () => {
    context = await setupSubmitTest();
  });

  afterEach(async () => {
    await teardownSubmitTest(context.app);
  });

  return () => context;
}
