import type { Pattern } from "../../schema.js";

export const contentModeration: Pattern = {
  name: "Content Moderation",
  slug: "content-moderation",
  description:
    "AI-powered content moderation for user-generated content. Uses OpenAI's moderation API for text and supports image moderation policies.",
  category: "developer-experience",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["moderation", "content", "safety", "openai", "ugc"],
  alternatives: [
    {
      name: "OpenAI Moderation",
      description: "Free content moderation API from OpenAI",
      url: "https://platform.openai.com/docs/guides/moderation",
      pricingTier: "free",
      advantages: ["Free to use", "Multiple categories", "Good accuracy", "Fast response"],
      recommended: true,
    },
    {
      name: "Perspective API",
      description: "Google's toxicity detection API",
      url: "https://perspectiveapi.com",
      pricingTier: "free",
      pricingNote: "Free with rate limits",
      advantages: ["Toxicity scoring", "Multiple languages", "Detailed breakdown"],
    },
    {
      name: "AWS Rekognition",
      description: "Image moderation for detecting unsafe content",
      url: "https://aws.amazon.com/rekognition/content-moderation/",
      pricingTier: "paid",
      advantages: ["Image moderation", "Video moderation", "Custom labels"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/moderation/text.ts",
        content: `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Moderation categories from OpenAI
export interface ModerationCategories {
  sexual: boolean;
  hate: boolean;
  harassment: boolean;
  "self-harm": boolean;
  "sexual/minors": boolean;
  "hate/threatening": boolean;
  "violence/graphic": boolean;
  violence: boolean;
  "harassment/threatening": boolean;
  "self-harm/intent": boolean;
  "self-harm/instructions": boolean;
}

export interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  categoryScores: Record<keyof ModerationCategories, number>;
}

// Moderate text content using OpenAI
export async function moderateText(text: string): Promise<ModerationResult> {
  const response = await openai.moderations.create({
    input: text,
  });

  const result = response.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories as ModerationCategories,
    categoryScores: result.category_scores as Record<keyof ModerationCategories, number>,
  };
}

// Moderate multiple texts at once (batch)
export async function moderateTexts(
  texts: string[]
): Promise<ModerationResult[]> {
  const response = await openai.moderations.create({
    input: texts,
  });

  return response.results.map((result) => ({
    flagged: result.flagged,
    categories: result.categories as ModerationCategories,
    categoryScores: result.category_scores as Record<keyof ModerationCategories, number>,
  }));
}

// Check if content is safe
export async function isSafe(text: string): Promise<boolean> {
  const result = await moderateText(text);
  return !result.flagged;
}

// Get detailed violation info
export async function getViolations(
  text: string
): Promise<{ category: string; score: number }[]> {
  const result = await moderateText(text);

  if (!result.flagged) {
    return [];
  }

  const violations: { category: string; score: number }[] = [];

  for (const [category, flagged] of Object.entries(result.categories)) {
    if (flagged) {
      violations.push({
        category,
        score: result.categoryScores[category as keyof ModerationCategories],
      });
    }
  }

  return violations.sort((a, b) => b.score - a.score);
}
`,
      },
      {
        path: "lib/moderation/policies.ts",
        content: `import type { ModerationCategories } from "./text";

// Policy configuration for different content types
export interface ModerationPolicy {
  name: string;
  description: string;
  // Categories to block (true = block if flagged)
  blockedCategories: Partial<Record<keyof ModerationCategories, boolean>>;
  // Score thresholds for categories (0-1)
  thresholds?: Partial<Record<keyof ModerationCategories, number>>;
  // Custom action on violation
  action: "block" | "review" | "warn";
}

// Predefined policies
export const policies: Record<string, ModerationPolicy> = {
  // Strict policy for public content
  strict: {
    name: "Strict",
    description: "Block all potentially harmful content",
    blockedCategories: {
      sexual: true,
      hate: true,
      harassment: true,
      "self-harm": true,
      violence: true,
      "sexual/minors": true,
      "hate/threatening": true,
      "violence/graphic": true,
      "harassment/threatening": true,
      "self-harm/intent": true,
      "self-harm/instructions": true,
    },
    action: "block",
  },

  // Moderate policy for community content
  moderate: {
    name: "Moderate",
    description: "Block severe violations, review others",
    blockedCategories: {
      "sexual/minors": true,
      "hate/threatening": true,
      "violence/graphic": true,
      "harassment/threatening": true,
      "self-harm/intent": true,
      "self-harm/instructions": true,
    },
    thresholds: {
      sexual: 0.8,
      hate: 0.7,
      harassment: 0.7,
      violence: 0.8,
    },
    action: "review",
  },

  // Permissive policy for mature content platforms
  permissive: {
    name: "Permissive",
    description: "Only block illegal content",
    blockedCategories: {
      "sexual/minors": true,
      "self-harm/instructions": true,
    },
    action: "warn",
  },
};

export type PolicyName = keyof typeof policies;

// Check content against a policy
export function checkPolicy(
  policy: ModerationPolicy,
  categories: ModerationCategories,
  scores: Record<keyof ModerationCategories, number>
): { passed: boolean; violations: string[]; action: ModerationPolicy["action"] } {
  const violations: string[] = [];

  // Check blocked categories
  for (const [category, blocked] of Object.entries(policy.blockedCategories)) {
    if (blocked && categories[category as keyof ModerationCategories]) {
      violations.push(category);
    }
  }

  // Check thresholds
  if (policy.thresholds) {
    for (const [category, threshold] of Object.entries(policy.thresholds)) {
      const score = scores[category as keyof ModerationCategories];
      if (score >= threshold && !violations.includes(category)) {
        violations.push(category);
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    action: violations.length > 0 ? policy.action : "block",
  };
}
`,
      },
      {
        path: "lib/moderation/middleware.ts",
        content: `import { moderateText, type ModerationResult } from "./text";
import { policies, checkPolicy, type PolicyName } from "./policies";

export interface ModerationMiddlewareOptions {
  policy?: PolicyName;
  fields?: string[];
  onViolation?: (result: ModerationResult, field: string) => void;
}

// Middleware to moderate request body
export async function moderateRequestBody(
  body: Record<string, unknown>,
  options: ModerationMiddlewareOptions = {}
): Promise<{
  passed: boolean;
  violations: Array<{ field: string; categories: string[] }>;
  action: string;
}> {
  const { policy: policyName = "moderate", fields } = options;
  const policy = policies[policyName];

  // Get text fields to moderate
  const fieldsToCheck = fields || Object.keys(body);
  const textFields = fieldsToCheck.filter(
    (key) => typeof body[key] === "string" && (body[key] as string).length > 0
  );

  const violations: Array<{ field: string; categories: string[] }> = [];
  let overallAction = "allow";

  for (const field of textFields) {
    const text = body[field] as string;
    const result = await moderateText(text);

    if (result.flagged) {
      const policyResult = checkPolicy(
        policy,
        result.categories,
        result.categoryScores
      );

      if (!policyResult.passed) {
        violations.push({ field, categories: policyResult.violations });
        options.onViolation?.(result, field);

        // Escalate action if needed
        if (policyResult.action === "block") {
          overallAction = "block";
        } else if (policyResult.action === "review" && overallAction !== "block") {
          overallAction = "review";
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    action: overallAction,
  };
}
`,
      },
      {
        path: "app/api/moderate/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { moderateText, getViolations } from "@/lib/moderation/text";
import { policies, checkPolicy, type PolicyName } from "@/lib/moderation/policies";

export async function POST(req: NextRequest) {
  try {
    const { text, policy: policyName = "moderate" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Get moderation result
    const result = await moderateText(text);

    // Check against policy
    const policy = policies[policyName as PolicyName] || policies.moderate;
    const policyResult = checkPolicy(
      policy,
      result.categories,
      result.categoryScores
    );

    return NextResponse.json({
      flagged: result.flagged,
      passed: policyResult.passed,
      action: policyResult.action,
      violations: policyResult.violations,
      categories: result.categories,
      scores: result.categoryScores,
    });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: "Moderation failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "hooks/use-moderation.ts",
        content: `"use client";

import { useState, useCallback } from "react";

interface ModerationState {
  isChecking: boolean;
  result: {
    flagged: boolean;
    passed: boolean;
    action: string;
    violations: string[];
  } | null;
  error: string | null;
}

export function useModeration(policy = "moderate") {
  const [state, setState] = useState<ModerationState>({
    isChecking: false,
    result: null,
    error: null,
  });

  const checkContent = useCallback(
    async (text: string) => {
      setState({ isChecking: true, result: null, error: null });

      try {
        const response = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, policy }),
        });

        if (!response.ok) {
          throw new Error("Moderation failed");
        }

        const result = await response.json();
        setState({ isChecking: false, result, error: null });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setState({ isChecking: false, result: null, error: message });
        return null;
      }
    },
    [policy]
  );

  const reset = useCallback(() => {
    setState({ isChecking: false, result: null, error: null });
  }, []);

  return {
    ...state,
    checkContent,
    reset,
  };
}
`,
      },
      {
        path: ".env.example",
        content: `# OpenAI API Key (for moderation API)
# The moderation endpoint is free to use
OPENAI_API_KEY="sk-..."
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "openai" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
