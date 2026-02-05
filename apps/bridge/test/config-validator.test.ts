/**
 * Tests for config-validator utility
 * Tests same-origin validation and form field validation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateSameOrigin,
  validateFormFields,
  WafirConfig,
} from "../src/utils/config-validator.js";

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
    installationId: 123,
    storage: {
      owner: "testowner",
      repo: "testrepo",
    },
  };

  it("accepts valid form fields matching config", () => {
    const config: WafirConfig = {
      ...minimalConfig,
      tabs: [
        {
          id: "feedback",
          fields: [
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
      tabs: [
        {
          id: "feedback",
          fields: [
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
      tabs: [
        {
          id: "feedback",
          fields: [
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
      tabs: [
        {
          id: "feedback",
          fields: [
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
      tabs: [
        {
          id: "feedback",
          fields: [
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
      tabs: [
        {
          id: "feedback",
          fields: [
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
});
