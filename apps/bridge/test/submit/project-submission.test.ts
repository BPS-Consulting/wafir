/**
 * Tests for project-based submission
 */
import { describe, it, expect } from "vitest";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - project-based submission", () => {
  const getContext = setupSubmitTestHooks();

  it("adds draft issue to project when target type is github/project", async () => {
    const { app, mockOctokit } = getContext();

    // Config with ONLY project storage
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`),
    );

    // Mock finding the project
    mockOctokit.graphql.mockResolvedValueOnce({
      organization: { projectV2: { id: "PVT_abc123" } },
    });

    // Mock fetching project fields (for getMappableFieldIds)
    mockOctokit.graphql.mockResolvedValueOnce({
      node: { fields: { nodes: [] } },
    });

    // Mock adding draft to project
    mockOctokit.graphql.mockResolvedValueOnce({
      addProjectV2DraftIssue: {
        projectItem: { id: "PVTI_item123" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/project",
        target: "testowner/1",
        authRef: "123",
        title: "Project Draft Issue",
        formId: "issue",
        formFields: {
          title: "Project Draft Issue",
          message: "This goes to a project",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.projectAdded).toBe(true);

    // Issue should NOT be created (project only)
    expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();
  });

  it("returns warning when project cannot be found", async () => {
    const { app, mockOctokit } = getContext();

    // Config with ONLY project storage
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`),
    );

    // Mock project not found for both org and user
    mockOctokit.graphql.mockRejectedValue(new Error("Project not found"));

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/project",
        target: "testowner/1",
        authRef: "123",
        title: "Project Issue",
        formId: "issue",
        formFields: {
          title: "Project Issue",
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.projectAdded).toBe(false);
    expect(body.warning).toContain("repository or project was not found");
  });
});
