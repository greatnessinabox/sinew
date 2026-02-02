import type { Pattern } from "../../schema.js";

export const webhooks: Pattern = {
  name: "Webhooks",
  slug: "webhooks",
  description:
    "Receive webhooks securely with signature verification, idempotency handling, and provider-specific implementations for Stripe, GitHub, and more.",
  category: "infrastructure",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "intermediate",
  tags: ["webhooks", "signature", "verification", "stripe", "github"],
  files: {
    nextjs: [
      {
        path: "lib/webhooks/verify.ts",
        content: `import crypto from "crypto";

// Generic signature verification utilities

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

// HMAC-SHA256 verification (used by many providers)
export function verifyHmacSha256(
  payload: string,
  signature: string,
  secret: string
): VerificationResult {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid: isValid };
  } catch (error) {
    return { valid: false, error: "Verification failed" };
  }
}

// HMAC-SHA256 with prefix (e.g., "sha256=...")
export function verifyHmacSha256WithPrefix(
  payload: string,
  signature: string,
  secret: string,
  prefix = "sha256="
): VerificationResult {
  if (!signature.startsWith(prefix)) {
    return { valid: false, error: "Invalid signature format" };
  }

  const actualSignature = signature.slice(prefix.length);
  return verifyHmacSha256(payload, actualSignature, secret);
}

// Stripe signature verification
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance = 300 // 5 minutes
): VerificationResult {
  try {
    const parts = signature.split(",").reduce(
      (acc, part) => {
        const [key, value] = part.split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const timestamp = parseInt(parts.t, 10);
    const signatures = Object.entries(parts)
      .filter(([key]) => key.startsWith("v1"))
      .map(([, value]) => value);

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return { valid: false, error: "Timestamp out of tolerance" };
    }

    // Verify signature
    const signedPayload = \`\${timestamp}.\${payload}\`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const isValid = signatures.some((sig) =>
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
    );

    return { valid: isValid };
  } catch (error) {
    return { valid: false, error: "Stripe verification failed" };
  }
}

// GitHub signature verification
export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): VerificationResult {
  return verifyHmacSha256WithPrefix(payload, signature, secret, "sha256=");
}
`,
      },
      {
        path: "lib/webhooks/handlers.ts",
        content: `// Webhook handler registry
// Add your webhook handlers here

export interface WebhookContext {
  provider: string;
  event: string;
  payload: unknown;
  headers: Headers;
}

export type WebhookHandler = (ctx: WebhookContext) => Promise<void>;

// Handler registry
const handlers: Map<string, Map<string, WebhookHandler>> = new Map();

// Register a handler for a specific provider and event
export function registerHandler(
  provider: string,
  event: string,
  handler: WebhookHandler
) {
  if (!handlers.has(provider)) {
    handlers.set(provider, new Map());
  }
  handlers.get(provider)!.set(event, handler);
}

// Get handler for provider and event
export function getHandler(
  provider: string,
  event: string
): WebhookHandler | undefined {
  return handlers.get(provider)?.get(event);
}

// Default handlers

// Stripe handlers
registerHandler("stripe", "checkout.session.completed", async (ctx) => {
  const session = ctx.payload as { id: string; customer: string };
  console.log("Checkout completed:", session.id);
  // await processCheckout(session);
});

registerHandler("stripe", "customer.subscription.updated", async (ctx) => {
  const subscription = ctx.payload as { id: string; status: string };
  console.log("Subscription updated:", subscription.id, subscription.status);
  // await updateSubscription(subscription);
});

registerHandler("stripe", "invoice.payment_failed", async (ctx) => {
  const invoice = ctx.payload as { id: string; customer: string };
  console.log("Payment failed:", invoice.id);
  // await handleFailedPayment(invoice);
});

// GitHub handlers
registerHandler("github", "push", async (ctx) => {
  const push = ctx.payload as { ref: string; commits: unknown[] };
  console.log("Push to:", push.ref);
  // await triggerDeployment(push);
});

registerHandler("github", "pull_request", async (ctx) => {
  const pr = ctx.payload as { action: string; number: number };
  console.log("PR:", pr.action, pr.number);
  // await handlePullRequest(pr);
});
`,
      },
      {
        path: "lib/webhooks/idempotency.ts",
        content: `import { Redis } from "@upstash/redis";

// Idempotency handling to prevent duplicate processing

const redis = Redis.fromEnv();
const IDEMPOTENCY_TTL = 60 * 60 * 24; // 24 hours

export interface IdempotencyResult {
  isNew: boolean;
  processedAt?: number;
}

// Check if webhook was already processed
export async function checkIdempotency(
  provider: string,
  eventId: string
): Promise<IdempotencyResult> {
  const key = \`webhook:idempotency:\${provider}:\${eventId}\`;
  const processed = await redis.get<number>(key);

  if (processed) {
    return { isNew: false, processedAt: processed };
  }

  return { isNew: true };
}

// Mark webhook as processed
export async function markProcessed(
  provider: string,
  eventId: string
): Promise<void> {
  const key = \`webhook:idempotency:\${provider}:\${eventId}\`;
  await redis.set(key, Date.now(), { ex: IDEMPOTENCY_TTL });
}

// Wrapper for idempotent processing
export async function processIdempotent<T>(
  provider: string,
  eventId: string,
  processor: () => Promise<T>
): Promise<{ result: T; wasProcessed: boolean }> {
  const { isNew, processedAt } = await checkIdempotency(provider, eventId);

  if (!isNew) {
    console.log(\`Webhook \${eventId} already processed at \${processedAt}\`);
    return { result: undefined as T, wasProcessed: true };
  }

  const result = await processor();
  await markProcessed(provider, eventId);

  return { result, wasProcessed: false };
}
`,
      },
      {
        path: "app/api/webhooks/stripe/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/webhooks/verify";
import { getHandler } from "@/lib/webhooks/handlers";
import { processIdempotent } from "@/lib/webhooks/idempotency";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Verify signature
  const verification = verifyStripeSignature(payload, signature, secret);
  if (!verification.valid) {
    console.error("Invalid Stripe signature:", verification.error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  try {
    const event = JSON.parse(payload);
    const eventId = event.id;
    const eventType = event.type;

    // Process with idempotency
    const { wasProcessed } = await processIdempotent(
      "stripe",
      eventId,
      async () => {
        const handler = getHandler("stripe", eventType);
        if (handler) {
          await handler({
            provider: "stripe",
            event: eventType,
            payload: event.data.object,
            headers: req.headers,
          });
        } else {
          console.log(\`No handler for Stripe event: \${eventType}\`);
        }
      }
    );

    return NextResponse.json({
      received: true,
      processed: !wasProcessed,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/webhooks/github/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { verifyGitHubSignature } from "@/lib/webhooks/verify";
import { getHandler } from "@/lib/webhooks/handlers";
import { processIdempotent } from "@/lib/webhooks/idempotency";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  // Verify signature
  const verification = verifyGitHubSignature(payload, signature, secret);
  if (!verification.valid) {
    console.error("Invalid GitHub signature:", verification.error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  try {
    const event = JSON.parse(payload);
    const eventType = req.headers.get("x-github-event") || "unknown";
    const deliveryId = req.headers.get("x-github-delivery") || crypto.randomUUID();

    // Process with idempotency
    const { wasProcessed } = await processIdempotent(
      "github",
      deliveryId,
      async () => {
        const handler = getHandler("github", eventType);
        if (handler) {
          await handler({
            provider: "github",
            event: eventType,
            payload: event,
            headers: req.headers,
          });
        } else {
          console.log(\`No handler for GitHub event: \${eventType}\`);
        }
      }
    );

    return NextResponse.json({
      received: true,
      processed: !wasProcessed,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Stripe Webhooks
# Get from Stripe Dashboard > Developers > Webhooks
STRIPE_WEBHOOK_SECRET="whsec_..."

# GitHub Webhooks
# Set when creating the webhook in repository settings
GITHUB_WEBHOOK_SECRET="your-secret"

# Upstash Redis (for idempotency)
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
    nextjs: [{ name: "@upstash/redis" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
