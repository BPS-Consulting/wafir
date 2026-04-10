// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import chatRoute from "../src/modules/chat/routes.js";

// Mock the ChatService class properly
vi.mock("../src/modules/chat/service.js", () => {
  return {
    ChatService: class MockChatService {
      chat = vi.fn().mockResolvedValue("Hello! How can I help you?");
    },
  };
});

describe("POST /chat", () => {
  let app: FastifyInstance;
  const originalEnv = process.env.CHAT_AUTHORIZED_URLS;

  beforeEach(async () => {
    // Set up authorized URLs
    process.env.CHAT_AUTHORIZED_URLS =
      "https://example.com,https://*.agency.gov";

    app = Fastify({ logger: false });
    await app.register(chatRoute, { prefix: "/chat" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    if (originalEnv === undefined) {
      delete process.env.CHAT_AUTHORIZED_URLS;
    } else {
      process.env.CHAT_AUTHORIZED_URLS = originalEnv;
    }
  });

  it("should return 403 for unauthorized origin", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://malicious.com",
        "content-type": "application/json",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: "not authorized" });
  });

  it("should return 403 when origin header is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        "content-type": "application/json",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: "not authorized" });
  });

  it("should return 200 for authorized exact match origin", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://example.com",
        "content-type": "application/json",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty("reply");
  });

  it("should return 200 for authorized wildcard match origin", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://sub.agency.gov",
        "content-type": "application/json",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty("reply");
  });

  it("should return 400 when message is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://example.com",
        "content-type": "application/json",
      },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
  });

  it("should return 400 when message is empty", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://example.com",
        "content-type": "application/json",
      },
      payload: { message: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
  });

  it("should return 403 when no authorized URLs are configured", async () => {
    delete process.env.CHAT_AUTHORIZED_URLS;

    const response = await app.inject({
      method: "POST",
      url: "/chat/",
      headers: {
        origin: "https://example.com",
        "content-type": "application/json",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: "not authorized" });
  });
});
