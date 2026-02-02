import type { Pattern } from "../../schema.js";

export const aiStreamingUi: Pattern = {
  name: "AI Streaming UI",
  slug: "ai-streaming-ui",
  description:
    "React components for streaming AI responses. Includes typing indicators, message lists, and input handling with the Vercel AI SDK.",
  category: "ai",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "beginner",
  tags: ["ai", "streaming", "react", "ui", "components"],
  files: {
    nextjs: [
      {
        path: "components/ai/streaming-text.tsx",
        content: `"use client";

import { useEffect, useRef } from "react";

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingText({
  text,
  isStreaming = false,
  className = "",
}: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as content streams in
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  return (
    <div ref={containerRef} className={\`relative \${className}\`}>
      <p className="whitespace-pre-wrap">{text}</p>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
      )}
    </div>
  );
}
`,
      },
      {
        path: "components/ai/chat-messages.tsx",
        content: `"use client";

import { useRef, useEffect } from "react";
import type { Message } from "ai";
import { StreamingText } from "./streaming-text";

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function ChatMessages({
  messages,
  isLoading = false,
  className = "",
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={\`flex flex-col space-y-4 overflow-y-auto \${className}\`}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastAssistant =
          !isUser && index === messages.length - 1 && isLoading;

        return (
          <div
            key={message.id}
            className={\`flex \${isUser ? "justify-end" : "justify-start"}\`}
          >
            <div
              className={\`max-w-[80%] rounded-2xl px-4 py-3 \${
                isUser
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }\`}
            >
              {isLastAssistant ? (
                <StreamingText
                  text={message.content}
                  isStreaming={true}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading indicator when waiting for response */}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex space-x-1">
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
`,
      },
      {
        path: "components/ai/chat-input.tsx",
        content: `"use client";

import { useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxRows?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Type a message...",
  maxRows = 5,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * maxRows;
      textarea.style.height = \`\${Math.min(textarea.scrollHeight, maxHeight)}px\`;
    }
  }, [value, maxRows]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-4 border-t bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className="flex-1 resize-none px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Send message"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <SendIcon />
        )}
      </button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
`,
      },
      {
        path: "hooks/use-ai-chat.ts",
        content: `"use client";

import { useChat as useVercelChat, type UseChatOptions } from "ai/react";
import { useCallback, useMemo } from "react";

interface UseAIChatOptions extends Omit<UseChatOptions, "api"> {
  apiEndpoint?: string;
  sessionId?: string;
  systemPrompt?: string;
}

export function useAIChat({
  apiEndpoint = "/api/chat",
  sessionId,
  systemPrompt,
  ...options
}: UseAIChatOptions = {}) {
  const chat = useVercelChat({
    api: apiEndpoint,
    body: {
      sessionId,
      systemPrompt,
    },
    ...options,
  });

  // Clear chat and reset state
  const clearChat = useCallback(() => {
    chat.setMessages([]);
  }, [chat]);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const messages = chat.messages;
    if (messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        // Remove last assistant message if exists
        const newMessages = messages.filter(
          (m) => m.id !== messages[messages.length - 1].id
        );
        chat.setMessages(newMessages);
        chat.append(lastUserMessage);
      }
    }
  }, [chat]);

  // Helper to check if chat is empty
  const isEmpty = useMemo(
    () => chat.messages.length === 0,
    [chat.messages.length]
  );

  // Helper to get last message
  const lastMessage = useMemo(
    () => (chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null),
    [chat.messages]
  );

  return {
    ...chat,
    clearChat,
    retryLastMessage,
    isEmpty,
    lastMessage,
  };
}
`,
      },
      {
        path: "components/ai/chat-container.tsx",
        content: `"use client";

import { useAIChat } from "@/hooks/use-ai-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

interface ChatContainerProps {
  sessionId: string;
  systemPrompt?: string;
  placeholder?: string;
  className?: string;
}

export function ChatContainer({
  sessionId,
  systemPrompt,
  placeholder,
  className = "",
}: ChatContainerProps) {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    clearChat,
  } = useAIChat({
    sessionId,
    systemPrompt,
  });

  return (
    <div className={\`flex flex-col h-full \${className}\`}>
      {/* Header with clear button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a conversation
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            className="h-full p-4"
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          Error: {error.message}
        </div>
      )}

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => handleSubmit()}
        isLoading={isLoading}
        placeholder={placeholder}
      />
    </div>
  );
}
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "ai" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
