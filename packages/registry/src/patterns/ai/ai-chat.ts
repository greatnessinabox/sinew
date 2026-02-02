import type { Pattern } from "../../schema.js";

export const aiChat: Pattern = {
  name: "AI Chat",
  slug: "ai-chat",
  description:
    "Production-ready AI chat with streaming responses, conversation history, and provider abstraction supporting OpenAI and Anthropic.",
  category: "ai",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["ai", "chat", "streaming", "openai", "anthropic", "vercel-ai-sdk"],
  alternatives: [
    {
      name: "LangChain",
      description: "Framework for building LLM applications with extensive tooling",
      url: "https://langchain.com",
      pricingTier: "free",
      advantages: [
        "Extensive ecosystem of integrations",
        "Built-in memory and retrieval patterns",
        "Agent frameworks included",
      ],
    },
    {
      name: "LlamaIndex",
      description: "Data framework for LLM applications with focus on RAG",
      url: "https://llamaindex.ai",
      pricingTier: "free",
      advantages: [
        "Excellent for RAG applications",
        "Strong document processing",
        "Multi-modal support",
      ],
    },
    {
      name: "Amazon Bedrock",
      description: "Fully managed foundation models from AWS",
      url: "https://aws.amazon.com/bedrock",
      pricingTier: "paid",
      advantages: [
        "Multiple model providers in one API",
        "AWS ecosystem integration",
        "Enterprise security and compliance",
      ],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/ai/providers.ts",
        content: `import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

// Provider configuration with environment-based selection
export type AIProvider = "openai" | "anthropic";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model mappings for each provider
export const models = {
  openai: {
    default: openai("gpt-4o"),
    fast: openai("gpt-4o-mini"),
    reasoning: openai("o1-preview"),
  },
  anthropic: {
    default: anthropic("claude-sonnet-4-20250514"),
    fast: anthropic("claude-3-5-haiku-20241022"),
    reasoning: anthropic("claude-sonnet-4-20250514"),
  },
} as const;

export type ModelType = "default" | "fast" | "reasoning";

// Get the configured provider from environment
export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider;
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return "openai"; // Default to OpenAI
}

// Get model by type for current provider
export function getModel(type: ModelType = "default") {
  const provider = getProvider();
  return models[provider][type];
}
`,
      },
      {
        path: "lib/ai/chat.ts",
        content: `import { streamText, generateText, CoreMessage } from "ai";
import { Redis } from "@upstash/redis";
import { getModel, type ModelType } from "./providers";

const redis = Redis.fromEnv();

// Chat session with persistent history
export interface ChatSession {
  id: string;
  userId: string;
  messages: CoreMessage[];
  createdAt: number;
  updatedAt: number;
}

// Store conversation history in Redis
export async function saveMessages(
  sessionId: string,
  messages: CoreMessage[]
): Promise<void> {
  const key = \`chat:\${sessionId}\`;
  await redis.set(key, JSON.stringify(messages));
  // Expire after 24 hours of inactivity
  await redis.expire(key, 60 * 60 * 24);
}

// Retrieve conversation history
export async function getMessages(sessionId: string): Promise<CoreMessage[]> {
  const key = \`chat:\${sessionId}\`;
  const data = await redis.get<string>(key);
  if (!data) return [];
  return JSON.parse(data) as CoreMessage[];
}

// Stream chat response
export async function streamChat({
  sessionId,
  message,
  systemPrompt,
  modelType = "default",
}: {
  sessionId: string;
  message: string;
  systemPrompt?: string;
  modelType?: ModelType;
}) {
  // Get existing messages
  const messages = await getMessages(sessionId);

  // Add user message
  const userMessage: CoreMessage = { role: "user", content: message };
  messages.push(userMessage);

  const model = getModel(modelType);

  const result = streamText({
    model,
    system: systemPrompt ?? "You are a helpful assistant.",
    messages,
    onFinish: async ({ text }) => {
      // Save assistant response to history
      messages.push({ role: "assistant", content: text });
      await saveMessages(sessionId, messages);
    },
  });

  return result;
}

// Non-streaming chat for simple use cases
export async function chat({
  sessionId,
  message,
  systemPrompt,
  modelType = "default",
}: {
  sessionId: string;
  message: string;
  systemPrompt?: string;
  modelType?: ModelType;
}) {
  const messages = await getMessages(sessionId);
  const userMessage: CoreMessage = { role: "user", content: message };
  messages.push(userMessage);

  const model = getModel(modelType);

  const { text } = await generateText({
    model,
    system: systemPrompt ?? "You are a helpful assistant.",
    messages,
  });

  // Save to history
  messages.push({ role: "assistant", content: text });
  await saveMessages(sessionId, messages);

  return text;
}

// Clear chat history
export async function clearChat(sessionId: string): Promise<void> {
  const key = \`chat:\${sessionId}\`;
  await redis.del(key);
}
`,
      },
      {
        path: "app/api/chat/route.ts",
        content: `import { NextRequest } from "next/server";
import { streamChat } from "@/lib/ai/chat";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, systemPrompt } = await req.json();

    if (!message || !sessionId) {
      return Response.json(
        { error: "Missing required fields: message, sessionId" },
        { status: 400 }
      );
    }

    const result = await streamChat({
      sessionId,
      message,
      systemPrompt,
    });

    // Return streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "components/chat-ui.tsx",
        content: `"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";

interface ChatUIProps {
  sessionId: string;
  systemPrompt?: string;
  placeholder?: string;
}

export function ChatUI({
  sessionId,
  systemPrompt,
  placeholder = "Type a message...",
}: ChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: { sessionId, systemPrompt },
    });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Start a conversation by typing a message below.
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`flex \${
              message.role === "user" ? "justify-end" : "justify-start"
            }\`}
          >
            <div
              className={\`max-w-[80%] rounded-lg px-4 py-2 \${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }\`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          Error: {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
`,
      },
      {
        path: ".env.example",
        content: `# AI Provider Configuration
# Set to "openai" or "anthropic" (defaults to openai)
AI_PROVIDER="openai"

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-..."

# Anthropic (https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY="sk-ant-..."

# Upstash Redis for conversation history (https://console.upstash.com)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "ai" },
      { name: "@ai-sdk/openai" },
      { name: "@ai-sdk/anthropic" },
      { name: "@upstash/redis" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
