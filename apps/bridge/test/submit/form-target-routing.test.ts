/**
 * Tests for form-specific target routing
 */
import { describe, it, expect } from "vitest";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - form-specific target routing", () => {
  const getContext = setupSubmitTestHooks();

  it("routes submission to only targets specified in form.targets array", async () => {
    const { app, mockOctokit } = getContext();

    // Config with multiple targets, but form only uses one
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    targets: [default]
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

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 100,
        html_url: "https://github.com/testowner/testrepo/issues/100",
        node_id: "I_target_test",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Issue Only",
        formId: "issue",
        formFields: {
          title: "Issue Only",
          message: "Should only go to issues, not project",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.issueNumber).toBe(100);

    // Issue should be created
    expect(mockOctokit.rest.issues.create).toHaveBeenCalled();

    // Project should NOT be accessed (no graphql calls)
    expect(mockOctokit.graphql).not.toHaveBeenCalled();
  });

  it("routes submission to multiple targets when form.targets includes multiple IDs", async () => {
    const { app, mockOctokit } = getContext();

    // Config with form specifying both targets
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: [default, project]
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

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 101,
        html_url: "https://github.com/testowner/testrepo/issues/101",
        node_id: "I_multi_target",
      },
    });

    // Mock finding the project
    mockOctokit.graphql.mockResolvedValueOnce({
      organization: { projectV2: { id: "PVT_multi123" } },
    });

    // Mock fetching project fields (for getMappableFieldIds)
    mockOctokit.graphql.mockResolvedValueOnce({
      node: { fields: { nodes: [] } },
    });

    // Mock adding issue to project
    mockOctokit.graphql.mockResolvedValueOnce({
      addProjectV2ItemById: {
        item: { id: "PVTI_multi_item123" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Both Targets",
        formId: "feedback",
        formFields: {
          title: "Both Targets",
          message: "Should go to both issues and project",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.issueNumber).toBe(101);
    expect(body.projectAdded).toBe(true);

    // Both issue and project should be used
    expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
    expect(mockOctokit.graphql).toHaveBeenCalled();
  });

  it("routes to all targets when form.targets is omitted", async () => {
    const { app, mockOctokit } = getContext();

    // Config with multiple targets, form has no targets specified
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: suggestion
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

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 102,
        html_url: "https://github.com/testowner/testrepo/issues/102",
        node_id: "I_all_targets",
      },
    });

    // Mock finding the project
    mockOctokit.graphql.mockResolvedValueOnce({
      organization: { projectV2: { id: "PVT_all123" } },
    });

    // Mock fetching project fields (for getMappableFieldIds)
    mockOctokit.graphql.mockResolvedValueOnce({
      node: { fields: { nodes: [] } },
    });

    // Mock adding issue to project
    mockOctokit.graphql.mockResolvedValueOnce({
      addProjectV2ItemById: {
        item: { id: "PVTI_all_item123" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Default to All",
        formId: "suggestion",
        formFields: {
          title: "Default to All",
          message: "Should go to all targets by default",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.issueNumber).toBe(102);
    expect(body.projectAdded).toBe(true);

    // Both issue and project should be used
    expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
    expect(mockOctokit.graphql).toHaveBeenCalled();
  });

  it("rejects submission when form.targets is empty array (submissionless form)", async () => {
    const { app, mockOctokit } = getContext();

    // Config with form specifying empty targets array (submissionless)
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: []
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

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Empty Targets",
        formId: "feedback",
        formFields: {
          title: "Empty Targets",
          message: "Empty array means submissionless",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain("cannot be submitted");
    expect(body.error).toContain("submissionless");

    // No GitHub API calls should be made
    expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();
    expect(mockOctokit.graphql).not.toHaveBeenCalled();
  });

  it("routes to only project when form.targets specifies only project", async () => {
    const { app, mockOctokit } = getContext();

    // Config with form specifying only project target
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: [project]
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
      organization: { projectV2: { id: "PVT_proj_only123" } },
    });

    // Mock fetching project fields (for getMappableFieldIds)
    mockOctokit.graphql.mockResolvedValueOnce({
      node: { fields: { nodes: [] } },
    });

    // Mock adding draft to project
    mockOctokit.graphql.mockResolvedValueOnce({
      addProjectV2DraftIssue: {
        projectItem: { id: "PVTI_proj_only_item123" },
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
        title: "Project Only",
        formId: "feedback",
        formFields: {
          title: "Project Only",
          message: "Should only go to project, not issues",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.projectAdded).toBe(true);

    // Issue should NOT be created
    expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();

    // Project should be accessed
    expect(mockOctokit.graphql).toHaveBeenCalled();
  });

  it("rejects submission when form.targets references unknown target ID", async () => {
    const { app, mockOctokit } = getContext();

    // Config with form referencing non-existent target
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    targets: [nonexistent]
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

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Invalid Target",
        formId: "issue",
        formFields: {
          title: "Invalid Target",
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");

    // No GitHub API calls should be made
    expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();
    expect(mockOctokit.graphql).not.toHaveBeenCalled();
  });
});
