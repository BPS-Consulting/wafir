/**
 * Tests for config-validator utility
 * Tests same-origin validation and form field validation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateSameOrigin,
  validateFormFields,
  WafirConfig,
  fetchConfig,
  resolveTemplateUrl,
} from "../src/shared/utils/config-validator.js";

describe("validateSameOrigin", () => {
  it("accepts config URL from same origin", () => {
    const configUrl = "https://example.com/config/wafir.yaml";
    const requestOrigin = "https://example.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts config URL with same origin and different path", () => {
    const configUrl = "https://example.com/some/deep/path/config.yaml";
    const requestOrigin = "https://example.com/app/page";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects config URL from different hostname", () => {
    const configUrl = "https://evil.com/config.yaml";
    const requestOrigin = "https://example.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("ORIGIN_MISMATCH");
    expect(result.errors[0].message).toContain("evil.com");
    expect(result.errors[0].message).toContain("example.com");
  });

  it("rejects config URL with different protocol", () => {
    const configUrl = "http://example.com/config.yaml";
    const requestOrigin = "https://example.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("ORIGIN_MISMATCH");
  });

  it("rejects config URL with different port", () => {
    const configUrl = "https://example.com:8080/config.yaml";
    const requestOrigin = "https://example.com:3000";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("ORIGIN_MISMATCH");
  });

  it("accepts config URL with explicit default port matching implicit default", () => {
    const configUrl = "https://example.com:443/config.yaml";
    const requestOrigin = "https://example.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("handles invalid config URL", () => {
    const configUrl = "not-a-valid-url";
    const requestOrigin = "https://example.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_URL");
  });

  it("handles invalid request origin", () => {
    const configUrl = "https://example.com/config.yaml";
    const requestOrigin = "not-a-valid-url";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_URL");
  });

  it("provides clear security error message", () => {
    const configUrl = "https://attacker.com/config.yaml";
    const requestOrigin = "https://victim.com";

    const result = validateSameOrigin(configUrl, requestOrigin);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain(
      "For security, config must be hosted on the same domain",
    );
  });
});

describe("validateFormFields", () => {
  const minimalConfig: WafirConfig = {
    targets: [
      {
        id: "default",
        type: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
      },
    ],
  };

  it("accepts valid form fields matching config", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            { id: "title", type: "input" },
            { id: "message", type: "textarea" },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      message: "Test message",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects extra fields not in config", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            { id: "title", type: "input" },
            { id: "message", type: "textarea" },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      message: "Test message",
      extraField: "Should be rejected",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("UNKNOWN_FIELD");
    expect(result.errors[0].field).toBe("extraField");
  });

  it("rejects missing required fields", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            {
              id: "title",
              type: "input",
              validations: { required: true },
            },
            {
              id: "message",
              type: "textarea",
              validations: { required: true },
            },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      // message is missing but required
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("MISSING_REQUIRED_FIELD");
    expect(result.errors[0].field).toBe("message");
  });

  it("validates email format", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            { id: "title", type: "input" },
            { id: "email", type: "email" },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      email: "not-an-email",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_EMAIL");
    expect(result.errors[0].field).toBe("email");
  });

  it("validates rating values", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            { id: "title", type: "input" },
            { id: "rating", type: "rating" },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      rating: 10, // Invalid: must be 1-5
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_RATING");
    expect(result.errors[0].field).toBe("rating");
  });

  it("validates dropdown options", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            { id: "title", type: "input" },
            {
              id: "category",
              type: "dropdown",
              attributes: {
                options: ["Bug", "Feature", "Question"],
              },
            },
          ],
        },
      ],
    };

    const formFields = {
      title: "Test Title",
      category: "InvalidOption",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_DROPDOWN_VALUE");
    expect(result.errors[0].field).toBe("category");
  });

  it("accepts feedback form with rating and description but no title", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            {
              id: "rating",
              type: "rating",
              validations: { required: true },
            },
            {
              id: "description",
              type: "textarea",
              validations: { required: true },
            },
          ],
        },
      ],
    };

    const formFields = {
      rating: 5,
      description: "Great product!",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects feedback form when title is submitted but not in config", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [
            {
              id: "rating",
              type: "rating",
              validations: { required: true },
            },
            {
              id: "description",
              type: "textarea",
              validations: { required: true },
            },
          ],
        },
      ],
    };

    const formFields = {
      rating: 5,
      description: "Great product!",
      title: "This should be rejected",
    };

    const result = validateFormFields(formFields, config, "feedback");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("UNKNOWN_FIELD");
    expect(result.errors[0].field).toBe("title");
  });

  it("rejects form submission with unknown form ID", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [{ id: "rating", type: "rating" }],
        },
      ],
    };

    const formFields = {
      rating: 5,
    };

    const result = validateFormFields(formFields, config, "nonexistent-form");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("UNKNOWN_FORM");
    expect(result.errors[0].field).toBe("formId");
  });

  it("rejects form submission without form ID", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      forms: [
        {
          id: "feedback",
          body: [{ id: "rating", type: "rating" }],
        },
      ],
    };

    const formFields = {
      rating: 5,
    };

    const result = validateFormFields(formFields, config);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("MISSING_FORM_ID");
  });
});

describe("fetchConfig with templateUrl", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const validConfigYaml = `
targets:
  - id: default
    type: github/issues
    target: owner/repo
    authRef: "123"
forms:
  - id: bug
    label: Bug Report
    templateUrl: https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml
`;

  const validTemplateYaml = `
name: Bug Report
description: File a bug report
labels:
  - bug
  - needs-triage
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  - type: input
    id: contact
    attributes:
      label: Contact Details
      description: How can we get in touch with you?
      placeholder: ex. email@example.com
    validations:
      required: false
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
    validations:
      required: true
  - type: dropdown
    id: version
    attributes:
      label: Version
      options:
        - "1.0.0"
        - "1.0.1"
        - "1.0.2"
    validations:
      required: true
`;

  it("fetches and transforms GitHub issue template fields", async () => {
    // First call: fetch config
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validConfigYaml),
    });

    // Second call: fetch template
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validTemplateYaml),
    });

    const config = await fetchConfig("https://example.com/wafir.yaml");

    expect(config.forms).toBeDefined();
    expect(config.forms).toHaveLength(1);

    const bugForm = config.forms![0];
    expect(bugForm.id).toBe("bug");
    expect(bugForm.body).toBeDefined();
    expect(bugForm.body!.length).toBe(4);

    // Verify template labels were applied
    expect(bugForm.labels).toEqual(["bug", "needs-triage"]);

    // Verify field transformations
    const markdownField = bugForm.body![0];
    expect(markdownField.type).toBe("markdown");
    expect((markdownField.attributes as any).value).toContain("bug report");

    const inputField = bugForm.body![1];
    expect(inputField.type).toBe("input");
    expect(inputField.id).toBe("contact");
    expect(inputField.attributes?.label).toBe("Contact Details");
    expect((inputField.attributes as any).description).toBe(
      "How can we get in touch with you?",
    );
    expect(inputField.validations?.required).toBe(false);

    const textareaField = bugForm.body![2];
    expect(textareaField.type).toBe("textarea");
    expect(textareaField.id).toBe("what-happened");
    expect(textareaField.validations?.required).toBe(true);

    const dropdownField = bugForm.body![3];
    expect(dropdownField.type).toBe("dropdown");
    expect(dropdownField.attributes?.options).toEqual([
      "1.0.0",
      "1.0.1",
      "1.0.2",
    ]);
  });

  it("preserves existing form labels over template labels", async () => {
    const configWithLabels = `
targets:
  - id: default
    type: github/issues
    target: owner/repo
    authRef: "123"
forms:
  - id: bug
    label: Bug Report
    labels:
      - my-custom-label
    templateUrl: https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml
`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(configWithLabels),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validTemplateYaml),
    });

    const config = await fetchConfig("https://example.com/wafir.yaml");

    // Form's own labels should take priority
    expect(config.forms![0].labels).toEqual(["my-custom-label"]);
  });

  it("gracefully handles template fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validConfigYaml),
    });

    // Template fetch fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const config = await fetchConfig("https://example.com/wafir.yaml");

    // Config should still be valid, just without template fields
    expect(config.forms).toBeDefined();
    expect(config.forms![0].body).toBeUndefined();
  });

  it("does not fetch template if form already has body", async () => {
    const configWithFields = `
targets:
  - id: default
    type: github/issues
    target: owner/repo
    authRef: "123"
forms:
  - id: bug
    label: Bug Report
    templateUrl: https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml
    body:
      - id: title
        type: input
        attributes:
          label: Title
`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(configWithFields),
    });

    const config = await fetchConfig("https://example.com/wafir.yaml");

    // Only one fetch call (config), not template
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(config.forms![0].body).toHaveLength(1);
    expect(config.forms![0].body![0].id).toBe("title");
  });

  it("resolves relative template URLs against config URL", async () => {
    const configWithRelativeTemplate = `
targets:
  - id: default
    type: github/issues
    target: owner/repo
    authRef: "123"
forms:
  - id: bug
    label: Bug Report
    templateUrl: templates/bug.yaml
`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(configWithRelativeTemplate),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validTemplateYaml),
    });

    const config = await fetchConfig("https://example.com/config/wafir.yaml");

    // Should have fetched the template
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Second call should be the resolved URL
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://example.com/config/templates/bug.yaml"
    );

    expect(config.forms![0].body).toBeDefined();
    expect(config.forms![0].body!.length).toBe(4);
  });

  it("resolves sibling file template URL", async () => {
    const configWithSiblingTemplate = `
targets:
  - id: default
    type: github/issues
    target: owner/repo
    authRef: "123"
forms:
  - id: bug
    label: Bug Report
    templateUrl: bug-template.yaml
`;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(configWithSiblingTemplate),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validTemplateYaml),
    });

    const config = await fetchConfig("https://example.com/public/wafir.yaml");

    // Second call should resolve to sibling file
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://example.com/public/bug-template.yaml"
    );
  });

  it("keeps absolute template URLs unchanged", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validConfigYaml),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/yaml" }),
      text: () => Promise.resolve(validTemplateYaml),
    });

    await fetchConfig("https://example.com/wafir.yaml");

    // Absolute URL should be used as-is
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml"
    );
  });
});

describe("resolveTemplateUrl", () => {
  it("returns absolute URLs unchanged", () => {
    const url = resolveTemplateUrl(
      "https://raw.githubusercontent.com/owner/repo/main/template.yaml",
      "https://example.com/wafir.yaml"
    );
    expect(url).toBe(
      "https://raw.githubusercontent.com/owner/repo/main/template.yaml"
    );
  });

  it("resolves relative URLs against base URL", () => {
    const url = resolveTemplateUrl(
      "templates/bug.yaml",
      "https://example.com/config/wafir.yaml"
    );
    expect(url).toBe("https://example.com/config/templates/bug.yaml");
  });

  it("resolves sibling file URLs", () => {
    const url = resolveTemplateUrl(
      "subform.yaml",
      "https://example.com/public/wafir.yaml"
    );
    expect(url).toBe("https://example.com/public/subform.yaml");
  });

  it("resolves parent directory URLs", () => {
    const url = resolveTemplateUrl(
      "../templates/bug.yaml",
      "https://example.com/config/v1/wafir.yaml"
    );
    expect(url).toBe("https://example.com/config/templates/bug.yaml");
  });

  it("returns template URL as-is when no base URL provided", () => {
    const url = resolveTemplateUrl("subform.yaml");
    expect(url).toBe("subform.yaml");
  });

  it("handles http URLs as absolute", () => {
    const url = resolveTemplateUrl(
      "http://other-server.com/template.yaml",
      "https://example.com/wafir.yaml"
    );
    expect(url).toBe("http://other-server.com/template.yaml");
  });
});

