import { handler } from "../dist/lambda.js";

const event = {
  version: "2.0",
  routeKey: "GET /config",
  rawPath: "/config",
  rawQueryString: "",
  cookies: [],
  headers: {},
  requestContext: {
    http: {
      method: "GET",
      path: "/config",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "custom-agent",
    },
  },
};

console.log("Invoking handler...");
try {
  const response = await handler(event);
  console.log("Response:", response);

  // Expecting 400 because querystring key "installationId", "owner", "repo" are missing
  if (response.statusCode === 400) {
    console.log(
      "Verification SUCCESS: Fastify handled the request and returned 400 as expected.",
    );
  } else {
    console.log(
      `Verification WARNING: Expected 400 but got ${response.statusCode}. Check response body.`,
    );
    // If 500, it might still mean fastify ran but crashed inside.
    // If 404, routing failed?
  }
} catch (err) {
  console.error("Handler threw error:", err);
  process.exit(1);
}
