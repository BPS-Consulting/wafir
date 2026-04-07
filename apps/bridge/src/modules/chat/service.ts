// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

/**
 * Service for interacting with Amazon Bedrock chat models.
 */
export class ChatService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.modelId =
      process.env.CHAT_BEDROCK_MODEL_ID ||
      "anthropic.claude-3-haiku-20240307-v1:0";
  }

  /**
   * Sends a message to Bedrock and returns the response.
   * @param message - The user's message
   * @returns The AI's reply
   */
  async chat(message: string): Promise<string> {
    // Format for Claude models on Bedrock
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract text from Claude response format
    if (responseBody.content && Array.isArray(responseBody.content)) {
      const textContent = responseBody.content.find(
        (c: { type: string }) => c.type === "text",
      );
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }

    return responseBody.completion || "No response generated";
  }
}
