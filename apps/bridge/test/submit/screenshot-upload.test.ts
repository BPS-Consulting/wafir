/**
 * Tests for screenshot upload to S3
 */
import { describe, it, expect } from "vitest";
import { setupSubmitTestHooks } from "./setup.js";
import { mockS3Send } from "./mocks.js";
import { TEST_CONFIG_URL } from "./fixtures.js";

describe("POST /submit - screenshot upload to S3", () => {
  const getContext = setupSubmitTestHooks();

  it("uploads screenshot to S3 and includes in issue body", async () => {
    const { app, mockOctokit } = getContext();

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 50,
        html_url: "https://github.com/testowner/testrepo/issues/50",
        node_id: "I_abc130",
      },
    });

    // Use multipart form data
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const screenshotBuffer = Buffer.from("fake-png-data");

    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="configUrl"',
      "",
      TEST_CONFIG_URL,
      `--${boundary}`,
      'Content-Disposition: form-data; name="installationId"',
      "",
      "123",
      `--${boundary}`,
      'Content-Disposition: form-data; name="owner"',
      "",
      "testowner",
      `--${boundary}`,
      'Content-Disposition: form-data; name="repo"',
      "",
      "testrepo",
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      "",
      "Issue with Screenshot",
      `--${boundary}`,
      'Content-Disposition: form-data; name="formId"',
      "",
      "issue",
      `--${boundary}`,
      'Content-Disposition: form-data; name="formFields"',
      "",
      '{"title":"Issue with Screenshot","message":"Bug with screenshot"}',
      `--${boundary}`,
      'Content-Disposition: form-data; name="screenshot"; filename="screenshot.png"',
      "Content-Type: image/png",
      "",
      screenshotBuffer.toString(),
      `--${boundary}--`,
    ].join("\r\n");

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: body,
    });

    expect(response.statusCode).toBe(201);

    // Verify S3 upload was called
    expect(mockS3Send).toHaveBeenCalled();

    // Verify issue body contains screenshot URL
    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).toContain("![Screenshot]");
    expect(createCall.body).toContain(
      "https://test-bucket.s3.us-east-1.amazonaws.com/snapshots/",
    );
  });

  it("continues without screenshot if S3 upload fails", async () => {
    const { app, mockOctokit } = getContext();

    mockS3Send.mockRejectedValue(new Error("S3 upload failed"));

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 51,
        html_url: "https://github.com/testowner/testrepo/issues/51",
        node_id: "I_abc131",
      },
    });

    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="configUrl"',
      "",
      TEST_CONFIG_URL,
      `--${boundary}`,
      'Content-Disposition: form-data; name="installationId"',
      "",
      "123",
      `--${boundary}`,
      'Content-Disposition: form-data; name="owner"',
      "",
      "testowner",
      `--${boundary}`,
      'Content-Disposition: form-data; name="repo"',
      "",
      "testrepo",
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      "",
      "Issue with Failed Screenshot",
      `--${boundary}`,
      'Content-Disposition: form-data; name="formId"',
      "",
      "issue",
      `--${boundary}`,
      'Content-Disposition: form-data; name="formFields"',
      "",
      '{"title":"Issue with Failed Screenshot","message":"Bug"}',
      `--${boundary}`,
      'Content-Disposition: form-data; name="screenshot"; filename="screenshot.png"',
      "Content-Type: image/png",
      "",
      "fake-png-data",
      `--${boundary}--`,
    ].join("\r\n");

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: body,
    });

    // Should still succeed, just without screenshot
    expect(response.statusCode).toBe(201);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.success).toBe(true);

    // Issue should not contain screenshot
    const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
    expect(createCall.body).not.toContain("![Screenshot]");
  });
});
