/**
 * Tests for form field validation
 */
import { describe, it, expect } from "vitest";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - form field validation", () => {
  const getContext = setupSubmitTestHooks();

  it("rejects submission with extra fields not in config", async () => {
    const { app } = getContext();

    // Config with specific fields
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
      - id: message
        type: textarea
`),
    );

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
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          message: "Valid field",
          maliciousField: "Should be rejected", // Not in config
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("UNKNOWN_FIELD");
    expect(body.details[0].field).toBe("maliciousField");
  });

  it("rejects submission with missing required fields", async () => {
    const { app } = getContext();

    // Config with required field
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
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          // message is missing but required
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(
      body.details.some(
        (e: { code: string }) => e.code === "MISSING_REQUIRED_FIELD",
      ),
    ).toBe(true);
  });

  it("rejects submission with invalid email format", async () => {
    const { app } = getContext();

    // Config with email field
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
      - id: email
        type: email
      - id: message
        type: textarea
`),
    );

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
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          email: "not-an-email",
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("INVALID_EMAIL");
  });

  it("rejects submission with invalid rating value", async () => {
    const { app } = getContext();

    // Config with rating field
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
      - id: message
        type: textarea
`),
    );

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
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          rating: 10, // Invalid: must be 0-5
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("INVALID_RATING");
  });

  it("rejects submission with invalid dropdown value", async () => {
    const { app } = getContext();

    // Config with dropdown field
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
      - id: category
        type: dropdown
        attributes:
          options:
            - Bug
            - Feature
            - Question
      - id: message
        type: textarea
`),
    );

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
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          category: "InvalidOption", // Not in options
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("INVALID_DROPDOWN_VALUE");
  });

  it("accepts valid submission with all field types", async () => {
    const { app, mockOctokit } = getContext();

    // Config with multiple field types
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
      - id: email
        type: email
      - id: rating
        type: rating
      - id: category
        type: dropdown
        attributes:
          options:
            - Bug
            - Feature
      - id: message
        type: textarea
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 200,
        html_url: "https://github.com/testowner/testrepo/issues/200",
        node_id: "I_valid",
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
        formId: "feedback",
        formFields: {
          title: "Test Issue",
          email: "valid@example.com",
          rating: 5,
          category: "Bug",
          message: "This is a valid submission",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });
});
