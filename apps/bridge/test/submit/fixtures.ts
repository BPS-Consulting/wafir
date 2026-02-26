/**
 * Test fixtures for submit endpoint tests
 * Provides sample configs and helper functions
 */

// Sample config URL for tests
export const TEST_CONFIG_URL = "https://example.com/wafir.yaml";

/**
 * Helper to create a mock fetch response for config
 */
export function createMockConfigResponse(yamlContent: string): Response {
  return new Response(yamlContent, {
    status: 200,
    headers: { "content-type": "text/yaml" },
  });
}
