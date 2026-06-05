import type { Pattern } from "../../schema.js";

export const aiToolCalling: Pattern = {
  name: "AI Tool Calling",
  slug: "ai-tool-calling",
  description:
    "Function/tool calling pattern for agentic AI workflows. Includes type-safe tool definitions with Zod schemas and execution handling.",
  category: "ai",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "advanced",
  tags: ["ai", "tools", "function-calling", "agents", "zod"],
  files: {
    nextjs: [
      {
        path: "lib/ai/tools.ts",
        content: `import { tool } from "ai";
import { evaluate } from "mathjs";
import { z } from "zod";

// Define reusable tools for AI agents
// Each tool has a description, parameters schema, and execute function

export const weatherTool = tool({
  description: "Get the current weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The city and country, e.g., London, UK"),
    unit: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .default("celsius")
      .describe("Temperature unit"),
  }),
  execute: async ({ location, unit }) => {
    // Replace with actual weather API call
    // Example: OpenWeatherMap, WeatherAPI, etc.
    const temp = Math.round(Math.random() * 30);
    return {
      location,
      temperature: temp,
      unit,
      conditions: "partly cloudy",
    };
  },
});

export const searchTool = tool({
  description: "Search the web for information",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z.number().optional().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    // Replace with actual search API (Tavily, Brave, SerpAPI, etc.)
    return {
      query,
      results: [
        {
          title: \`Result for: \${query}\`,
          url: "https://example.com",
          snippet: "This is a sample search result...",
        },
      ],
    };
  },
});

export const calculatorTool = tool({
  description: "Perform mathematical calculations",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("Mathematical expression to evaluate, e.g., '2 + 2 * 3'"),
  }),
  execute: async ({ expression }) => {
    try {
      // mathjs.evaluate parses a math grammar — it does not run arbitrary
      // JS, so model/user-supplied expressions can't reach the runtime the
      // way Function()/eval would.
      const result = evaluate(expression);
      return { expression, result };
    } catch {
      return { expression, error: "Invalid expression" };
    }
  },
});

export const databaseQueryTool = tool({
  description: "Query the database for information",
  inputSchema: z.object({
    table: z.enum(["users", "orders", "products"]).describe("Table to query"),
    filter: z
      .record(z.string(), z.string())
      .optional()
      .describe("Filter conditions"),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ table, filter, limit }) => {
    // Replace with actual database query
    // This is a placeholder that would integrate with Prisma/Drizzle
    return {
      table,
      filter,
      results: [],
      count: 0,
    };
  },
});

// Export all tools as a registry
export const tools = {
  weather: weatherTool,
  search: searchTool,
  calculator: calculatorTool,
  databaseQuery: databaseQueryTool,
};

export type ToolName = keyof typeof tools;
`,
      },
      {
        path: "lib/ai/agent.ts",
        content: `import { streamText, generateText, stepCountIs, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { tools, type ToolName } from "./tools";

// Uses OpenAI by default. Swap this for your own provider/model selection.
const model = openai("gpt-4o");

export interface AgentConfig {
  systemPrompt: string;
  availableTools: ToolName[];
  maxSteps?: number;
}

// Pick the enabled tools out of the registry, preserving their types.
function pickTools(names: ToolName[]) {
  return Object.fromEntries(
    names.map((name) => [name, tools[name]] as const)
  ) as Pick<typeof tools, ToolName>;
}

// Run agent with tool calling (non-streaming)
export async function runAgent({
  config,
  messages,
}: {
  config: AgentConfig;
  messages: ModelMessage[];
}) {
  const { systemPrompt, availableTools, maxSteps = 5 } = config;

  const result = await generateText({
    model,
    system: systemPrompt,
    messages,
    tools: pickTools(availableTools),
    // Allow the model to call tools and then continue, up to maxSteps.
    stopWhen: stepCountIs(maxSteps),
  });

  return {
    text: result.text,
    steps: result.steps,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
  };
}

// Stream agent responses with tool calling
export async function streamAgent({
  config,
  messages,
}: {
  config: AgentConfig;
  messages: ModelMessage[];
}) {
  const { systemPrompt, availableTools, maxSteps = 5 } = config;

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: pickTools(availableTools),
    stopWhen: stepCountIs(maxSteps),
  });

  return result;
}

// Predefined agent configurations
export const agentConfigs: Record<string, AgentConfig> = {
  assistant: {
    systemPrompt: \`You are a helpful AI assistant with access to various tools.
Use the available tools when needed to provide accurate and helpful responses.
Always explain your reasoning and the results of any tool calls.\`,
    availableTools: ["weather", "search", "calculator"],
    maxSteps: 5,
  },

  dataAnalyst: {
    systemPrompt: \`You are a data analyst assistant.
Help users query and understand their data.
Use the database query tool to fetch relevant information.
Always explain the results in a clear and understandable way.\`,
    availableTools: ["databaseQuery", "calculator"],
    maxSteps: 3,
  },

  researcher: {
    systemPrompt: \`You are a research assistant.
Help users find and synthesize information from the web.
Use the search tool to find relevant information.
Always cite your sources and provide balanced perspectives.\`,
    availableTools: ["search"],
    maxSteps: 5,
  },
};
`,
      },
      {
        path: "app/api/agent/route.ts",
        content: `import { NextRequest } from "next/server";
import { streamAgent, agentConfigs } from "@/lib/ai/agent";
import type { ModelMessage } from "ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, agentType = "assistant" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const config = agentConfigs[agentType];
    if (!config) {
      return Response.json(
        { error: \`Unknown agent type: \${agentType}\` },
        { status: 400 }
      );
    }

    const result = await streamAgent({
      config,
      messages: messages as ModelMessage[],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Agent error:", error);
    return Response.json(
      { error: "Failed to process agent request" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# AI Provider (OpenAI or Anthropic)
OPENAI_API_KEY="sk-..."

# Optional: For search tool integration
# TAVILY_API_KEY="tvly-..."
# SERP_API_KEY="..."
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
      { name: "ai", version: "^6.0.0" },
      { name: "@ai-sdk/openai", version: "^3.0.0" },
      { name: "@ai-sdk/anthropic", version: "^3.0.0" },
      { name: "zod", version: "^4.0.0" },
      { name: "mathjs", version: "^15.0.0" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
