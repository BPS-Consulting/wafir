// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { isOriginAuthorized } from "./origin-validator.js";
import { ChatService } from "./service.js";

interface ChatBody {
  message: string;
}

const chatRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const chatService = new ChatService();

  fastify.post<{ Body: ChatBody }>(
    "/",
    {
      schema: {
        tags: ["Chat"],
        summary: "Send a chat message",
        description:
          "Sends a message to the AI chat service and returns a response. Only authorized origins can use this endpoint.",
        body: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              description: "The user's message to send to the chat service",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              reply: {
                type: "string",
                description: "The AI's response",
              },
            },
          },
          403: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Error message for unauthorized access",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Check origin authorization
      const origin = request.headers.origin;

      if (!isOriginAuthorized(origin)) {
        request.log.warn({ origin }, "Unauthorized chat origin");
        return reply.code(403).send({
          error: "not authorized",
        });
      }

      try {
        const { message } = request.body;

        if (!message || typeof message !== "string" || message.trim() === "") {
          return reply.code(400).send({
            error: "Message is required",
          });
        }

        const chatReply = await chatService.chat(message.trim());

        return reply.send({
          reply: chatReply,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        request.log.error({ error: errorMessage }, "Chat request failed");

        return reply.code(500).send({
          error: "Chat service unavailable",
        });
      }
    },
  );
};

export default chatRoute;
