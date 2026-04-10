// Copyright (c) BPS-Consulting. Licensed under the AGPLv3 License.
import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import chatFieldStyles from "./styles/wafir-chat-field.css?inline";
import { sendChatMessage } from "./api/client.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { parseMarkdown } from "./utils/markdown.js";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

/**
 * A chat field component that connects to a chat service via REST API.
 * Renders an interactive chat interface with message history.
 */
@customElement("wafir-chat-field")
export class WafirChatField extends LitElement {
  /**
   * Placeholder text for the input field.
   */
  @property({ type: String })
  placeholder = "Type your message...";

  /**
   * Chat messages history.
   */
  @state()
  private _messages: ChatMessage[] = [];

  /**
   * Current input value.
   */
  @state()
  private _inputValue = "";

  /**
   * Whether a request is in progress.
   */
  @state()
  private _isLoading = false;

  /**
   * Whether the user is authorized to use chat.
   */
  @state()
  private _isAuthorized = true;

  static styles = [unsafeCSS(chatFieldStyles)];

  /**
   * Sends a message to the chat API.
   */
  private async _sendMessage(): Promise<void> {
    const message = this._inputValue.trim();
    if (!message || this._isLoading) {
      return;
    }

    // Add user message to history
    this._messages = [...this._messages, { role: "user", content: message }];
    this._inputValue = "";
    this._isLoading = true;

    // Scroll to bottom
    this._scrollToBottom();

    try {
      const result = await sendChatMessage(message);

      if (result.error === "not authorized") {
        // Not authorized
        this._isAuthorized = false;
        this._messages = []; // Clear messages
        return;
      }

      if (result.error) {
        this._messages = [
          ...this._messages,
          { role: "error", content: result.error },
        ];
      } else if (result.reply) {
        this._messages = [
          ...this._messages,
          { role: "assistant", content: result.reply },
        ];
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      this._messages = [
        ...this._messages,
        { role: "error", content: errorMessage },
      ];
    } finally {
      this._isLoading = false;
      this._scrollToBottom();
    }
  }

  /**
   * Scrolls the message container to the bottom.
   */
  private _scrollToBottom(): void {
    this.updateComplete.then(() => {
      const container = this.shadowRoot?.querySelector(".chat-messages");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }

  /**
   * Handles input change.
   */
  private _handleInput(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this._inputValue = target.value;
  }

  /**
   * Handles keydown for sending message with Enter.
   */
  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this._sendMessage();
    }
  }

  /**
   * Renders the not authorized state.
   */
  private _renderNotAuthorized() {
    return html`
      <div class="chat-not-authorized">
        <div class="chat-not-authorized-icon">🔒</div>
        <div class="chat-not-authorized-message">
          The configured site is not authorized for chat.
        </div>
      </div>
    `;
  }

  /**
   * Renders the chat messages.
   */
  private _renderMessages() {
    if (this._messages.length === 0 && !this._isLoading) {
      return html`
        <div class="chat-empty">
          <div class="chat-empty-icon">💬</div>
          <div>Send a message to start chatting</div>
        </div>
      `;
    }

    return html`
      ${this._messages.map(
        (msg) => html`
          <div class="chat-message ${msg.role}">
            ${unsafeHTML(parseMarkdown(msg.content))}
          </div>
        `,
      )}
      ${this._isLoading
        ? html`
            <div class="chat-loading">
              <span class="spinner"></span>
              <span>Thinking...</span>
            </div>
          `
        : ""}
    `;
  }

  render() {
    if (!this._isAuthorized) {
      return this._renderNotAuthorized();
    }

    return html`
      <div class="chat-container">
        <div class="chat-messages">${this._renderMessages()}</div>
        <div class="chat-input-container">
          <textarea
            class="chat-input"
            .value="${this._inputValue}"
            placeholder="${this.placeholder}"
            ?disabled="${this._isLoading}"
            @input="${this._handleInput}"
            @keydown="${this._handleKeydown}"
            rows="1"
          ></textarea>
          <button
            class="chat-send-button"
            ?disabled="${this._isLoading || !this._inputValue.trim()}"
            @click="${this._sendMessage}"
          >
            Send
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-chat-field": WafirChatField;
  }
}
