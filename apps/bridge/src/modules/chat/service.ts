// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

/**
 * Service for interacting with Amazon Bedrock Agents.
 */
export class ChatService {
  private client: BedrockAgentRuntimeClient;
  private agentId: string;
  private agentAliasId: string;

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    // These IDs are found in the AWS Console under Bedrock > Agents
    this.agentId = process.env.BEDROCK_AGENT_ID || "";
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || "TSTALIASID"; // "TSTALIASID" is default for draft
  }

  /**
   * Sends a message to a Bedrock Agent and returns the aggregated response.
   * @param message - The user's message
   * @param sessionId - Optional session ID to maintain conversation context
   * @returns The Agent's reply
   */
  async chat(
    message: string,
    sessionId: string = "default-session",
  ): Promise<string> {
    const command = new InvokeAgentCommand({
      agentId: this.agentId,
      agentAliasId: this.agentAliasId,
      sessionId: sessionId,
      inputText: message,
    });

    try {
      const response = await this.client.send(command);
      let fullResponse = "";

      // Bedrock Agents return a stream of events
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk && chunk.chunk.bytes) {
            // Decode the binary chunk into text
            const text = new TextDecoder("utf-8").decode(chunk.chunk.bytes);
            fullResponse += text;
          }
        }
      }

      return fullResponse || "No response generated";
    } catch (error) {
      console.error("Error invoking Bedrock Agent:", error);
      throw new Error("Failed to get response from AI Agent");
    }
  }
}
