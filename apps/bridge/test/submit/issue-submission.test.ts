/**
 * Tests for successful issue submission to GitHub issues
 */
import { describe, it, expect } from "vitest";
import { sampleConfigs } from "../helper.js";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - successful issue submission", () => {
  const getContext = setupSubmitTestHooks();

  it("creates a GitHub issue with valid submission data", async () => {
    const { app, mockOctokit } = getContext();

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 42,
        html_url: "https://github.com/testowner/testrepo/issues/42",
        node_id: "I_abc123",
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
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
          message: "This is a test description",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.issueNumber).toBe(42);
    expect(body.issueUrl).toBe(
      "https://github.com/testowner/testrepo/issues/42",
    );

    // Verify issue was created with correct parameters
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
      owner: "testowner",
      repo: "testrepo",
      title: "Test Issue",
      body: expect.stringContaining("Message"),
      labels: ["wafir-feedback"],
      type: "issue", // Form id is used as issue type
    });

    // Verify config was fetched
    expect(mockFetch).toHaveBeenCalledWith(
      TEST_CONFIG_URL,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates issue with custom labels", async () => {
    const { app, mockOctokit } = getContext();

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 43,
        html_url: "https://github.com/testowner/testrepo/issues/43",
        node_id: "I_abc124",
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
        title: "Bug Report",
        formId: "issue",
        labels: ["bug", "priority-high"],
        formFields: {
          title: "Bug Report",
          message: "1. Click button\n2. See error",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ["bug", "priority-high"],
      }),
    );
  });

  it("builds markdown body from form fields in correct order", async () => {
    const { app, mockOctokit } = getContext();

    // Use full config with custom fields
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
      - id: description
        type: textarea
      - id: steps
        type: textarea
      - id: expected
        type: textarea
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 44,
        html_url: "https://github.com/testowner/testrepo/issues/44",
        node_id: "I_abc125",
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
        title: "Ordered Fields Test",
        formId: "issue",
        formFields: {
          title: "Ordered Fields Test",
          description: "First field",
          steps: "Second field",
          expected: "Third field",
        },
        fieldOrder: ["description", "steps", "expected"],
      },
    });

    expect(response.statusCode).toBe(201);

    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    const body = createCall.body;

    // Check fields appear in order
    const descPos = body.indexOf("Description");
    const stepsPos = body.indexOf("Steps");
    const expectedPos = body.indexOf("Expected");

    expect(descPos).toBeLessThan(stepsPos);
    expect(stepsPos).toBeLessThan(expectedPos);
  });

  it("converts rating to star emojis in body", async () => {
    const { app, mockOctokit } = getContext();

    // Config with feedback form that has rating field
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    body:
      - id: title
        type: input
      - id: rating
        type: rating
      - id: comment
        type: textarea
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 45,
        html_url: "https://github.com/testowner/testrepo/issues/45",
        node_id: "I_abc126",
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
        title: "Feedback with Rating",
        formId: "feedback",
        formFields: {
          title: "Feedback with Rating",
          rating: 4,
          comment: "Great product!",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).toContain("⭐⭐⭐⭐");
  });

  it("accepts zero rating and displays 'No rating' in body", async () => {
    const { app, mockOctokit } = getContext();

    // Config with feedback form that has rating field
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    body:
      - id: title
        type: input
      - id: rating
        type: rating
      - id: comment
        type: textarea
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 46,
        html_url: "https://github.com/testowner/testrepo/issues/46",
        node_id: "I_abc127",
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
        title: "Feedback with No Rating",
        formId: "feedback",
        formFields: {
          title: "Feedback with No Rating",
          rating: 0, // Zero rating should be accepted
          comment: "No rating provided",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).toContain("No rating");
  });

  it("includes browser info as form field in issue body when sent in formFields", async () => {
    const { app, mockOctokit } = getContext();

    // This tests the new autofill field approach where browser info
    // is included as a regular form field rather than a separate param
    // Use config with autofill fields defined
    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.withAutofillFields),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 50,
        html_url: "https://github.com/testowner/testrepo/issues/50",
        node_id: "I_abc130",
      },
    });

    const browserInfoText = `URL: https://example.com/page
User Agent: Mozilla/5.0 (Test)
Viewport: 1920x1080
Language: en-US`;

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Issue with Browser Info as Form Field",
        formId: "issue",
        formFields: {
          title: "Issue with Browser Info as Form Field",
          message: "A bug description",
          "browser-info": browserInfoText,
        },
        fieldOrder: ["title", "message", "browser-info"],
        fieldLabels: {
          title: "Issue Title",
          message: "Description",
          "browser-info": "Browser Info",
        },
        // Note: no browserInfo param - it's in formFields instead
      },
    });

    expect(response.statusCode).toBe(201);

    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    // Browser info should appear in body with the configured label
    expect(createCall.body).toContain("Browser Info");
    expect(createCall.body).toContain("https://example.com/page");
    expect(createCall.body).toContain("Mozilla/5.0 (Test)");
    expect(createCall.body).toContain("1920x1080");
  });

  it("gets title from formFields if not provided directly", async () => {
    const { app, mockOctokit } = getContext();

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 48,
        html_url: "https://github.com/testowner/testrepo/issues/48",
        node_id: "I_abc129",
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
        formId: "issue",
        formFields: {
          title: "Title from Form Fields",
          message: "Some description",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Title from Form Fields",
      }),
    );
  });

  it("sets milestone on issue when a field has map: milestone", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: milestone-field
        type: dropdown
        attributes:
          label: "Milestone"
          map: milestone
          options:
            - "Sprint 1"
            - "Sprint 2"
            - "Backlog"
      - id: message
        type: textarea
`),
    );

    mockOctokit.rest.issues.listMilestones.mockResolvedValue({
      data: [
        { number: 3, title: "Sprint 1" },
        { number: 4, title: "Sprint 2" },
        { number: 5, title: "Backlog" },
      ],
    });

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 55,
        html_url: "https://github.com/testowner/testrepo/issues/55",
        node_id: "I_ms1",
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
        title: "Milestone Test",
        formId: "issue",
        formFields: {
          title: "Milestone Test",
          "milestone-field": "Sprint 1",
          message: "Testing milestone",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    // Milestone should be resolved to its number
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        milestone: 3,
      }),
    );

    // Milestone field should NOT appear in the issue body
    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).not.toContain("Milestone");
  });

  it("sets milestone case-insensitively", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
      - id: milestone-field
        type: dropdown
        attributes:
          label: "Milestone"
          map: milestone
          options:
            - "sprint 1"
`),
    );

    mockOctokit.rest.issues.listMilestones.mockResolvedValue({
      data: [{ number: 7, title: "Sprint 1" }],
    });

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 56,
        html_url: "https://github.com/testowner/testrepo/issues/56",
        node_id: "I_ms2",
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
        title: "Case Insensitive Milestone",
        formId: "issue",
        formFields: {
          title: "Case Insensitive Milestone",
          "milestone-field": "sprint 1",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({ milestone: 7 }),
    );
  });

  it("submits without milestone when milestone title is not found", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
      - id: milestone-field
        type: dropdown
        attributes:
          label: "Milestone"
          map: milestone
          options:
            - "Unknown Milestone"
`),
    );

    mockOctokit.rest.issues.listMilestones.mockResolvedValue({ data: [] });

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 57,
        html_url: "https://github.com/testowner/testrepo/issues/57",
        node_id: "I_ms3",
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
        title: "Missing Milestone",
        formId: "issue",
        formFields: {
          title: "Missing Milestone",
          "milestone-field": "Unknown Milestone",
        },
      },
    });

    // Should succeed without milestone
    expect(response.statusCode).toBe(201);
    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.milestone).toBeUndefined();
  });

  it("sets assignees on issue when a field has map: assignees", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: assignee-field
        type: dropdown
        attributes:
          label: "Assignee"
          map: assignees
          options:
            - "alice"
            - "bob"
            - "charlie"
      - id: message
        type: textarea
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 60,
        html_url: "https://github.com/testowner/testrepo/issues/60",
        node_id: "I_as1",
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
        title: "Assignee Test",
        formId: "issue",
        formFields: {
          title: "Assignee Test",
          "assignee-field": "alice",
          message: "Testing assignee",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    // Assignee should be passed to issues.create
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ["alice"],
      }),
    );

    // Assignee field should NOT appear in the issue body
    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).not.toContain("Assignee");
  });

  it("sets multiple assignees when field value is an array", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    body:
      - id: title
        type: input
      - id: assignees-field
        type: dropdown
        attributes:
          label: "Assignees"
          map: assignees
          multiple: true
          options:
            - "alice"
            - "bob"
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 61,
        html_url: "https://github.com/testowner/testrepo/issues/61",
        node_id: "I_as2",
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
        title: "Multi Assignee Test",
        formId: "issue",
        formFields: {
          title: "Multi Assignee Test",
          "assignees-field": ["alice", "bob"],
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ["alice", "bob"],
      }),
    );
  });
});
