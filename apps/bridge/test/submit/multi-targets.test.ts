/**
 * Tests for multiple targets (issue + project)
 */
import { describe, it, expect } from "vitest";
import { sampleConfigs } from "../helper.js";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - multiple targets (issue + project)", () => {
  const getContext = setupSubmitTestHooks();

  it("creates issue and adds to project when targets include both github/issues and github/project", async () => {
    const { app, mockOctokit } = getContext();

    // Config with both target types
    mockFetch.mockResolvedValue(createMockConfigResponse(sampleConfigs.full));

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 60,
        html_url: "https://github.com/testowner/testrepo/issues/60",
        node_id: "I_issue60",
      },
    });

    // Mock finding the project
    mockOctokit.graphql.mockResolvedValueOnce({
      organization: { projectV2: { id: "PVT_both123" } },
    });

    // Mock fetching project fields (for getMappableFieldIds)
    mockOctokit.graphql.mockResolvedValueOnce({
      node: { fields: { nodes: [] } },
    });

    // Mock adding issue to project
    mockOctokit.graphql.mockResolvedValueOnce({
      addProjectV2ItemById: {
        item: { id: "PVTI_both_item123" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Issue for Both",
        formId: "issue",
        formFields: {
          title: "Issue for Both",
          message: "Goes to issue and project",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.issueNumber).toBe(60);
    expect(body.projectAdded).toBe(true);

    // Both issue creation and project addition should happen
    expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
    expect(mockOctokit.graphql).toHaveBeenCalled();
  });
});
