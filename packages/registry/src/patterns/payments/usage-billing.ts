import type { Pattern } from "../../schema.js";

export const usageBilling: Pattern = {
  name: "Usage-Based Billing",
  slug: "usage-billing",
  description:
    "Metered billing with Stripe. Track usage, report to Stripe, and charge customers based on consumption.",
  category: "payments",
  tier: "free",
  complexity: "advanced",
  tags: ["payments", "stripe", "metered", "usage-based"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/usage-billing.ts",
        content: `import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Usage record types
export type UsageAction =
  | "api_call"
  | "storage_gb"
  | "compute_minutes"
  | "bandwidth_gb"
  | "tokens"
  | "requests";

export interface UsageRecord {
  customerId: string;
  subscriptionItemId: string;
  action: UsageAction;
  quantity: number;
  timestamp?: number;
  idempotencyKey?: string;
}

export interface UsageSummary {
  action: UsageAction;
  totalQuantity: number;
  periodStart: Date;
  periodEnd: Date;
}

// Report usage to Stripe
export async function reportUsage({
  subscriptionItemId,
  quantity,
  timestamp,
  action = "increment",
  idempotencyKey,
}: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: "increment" | "set";
  idempotencyKey?: string;
}) {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action,
    },
    {
      idempotencyKey,
    }
  );

  return usageRecord;
}

// Get usage records for a subscription item
export async function getUsageRecords(
  subscriptionItemId: string,
  options?: {
    startingAfter?: string;
    endingBefore?: string;
    limit?: number;
  }
) {
  const usageRecordSummaries =
    await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      {
        limit: options?.limit || 100,
      }
    );

  return usageRecordSummaries;
}

// Create a metered price
export async function createMeteredPrice({
  productId,
  unitAmount,
  currency = "usd",
  usageType = "metered",
  aggregateUsage = "sum",
  interval = "month",
  nickname,
}: {
  productId: string;
  unitAmount: number;
  currency?: string;
  usageType?: "metered" | "licensed";
  aggregateUsage?: "sum" | "last_during_period" | "last_ever" | "max";
  interval?: "day" | "week" | "month" | "year";
  nickname?: string;
}) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    recurring: {
      interval,
      usage_type: usageType,
      aggregate_usage: aggregateUsage,
    },
    nickname,
  });

  return price;
}

// Create a subscription with metered billing
export async function createMeteredSubscription({
  customerId,
  priceId,
  metadata,
}: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
  });

  return subscription;
}

// Get subscription item ID for usage reporting
export async function getSubscriptionItemId(
  subscriptionId: string,
  priceId: string
): Promise<string | null> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data"],
  });

  const item = subscription.items.data.find(
    (item) => item.price.id === priceId
  );

  return item?.id || null;
}

// Get current period usage for a subscription
export async function getCurrentPeriodUsage(subscriptionItemId: string) {
  const summaries = await stripe.subscriptionItems.listUsageRecordSummaries(
    subscriptionItemId,
    { limit: 1 }
  );

  if (summaries.data.length === 0) {
    return {
      totalUsage: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    };
  }

  const summary = summaries.data[0];
  return {
    totalUsage: summary.total_usage,
    periodStart: new Date(summary.period.start * 1000),
    periodEnd: new Date(summary.period.end * 1000),
  };
}

// Estimate upcoming invoice amount
export async function estimateUpcomingInvoice(customerId: string) {
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: customerId,
  });

  return {
    amountDue: upcomingInvoice.amount_due,
    currency: upcomingInvoice.currency,
    periodStart: new Date(upcomingInvoice.period_start * 1000),
    periodEnd: new Date(upcomingInvoice.period_end * 1000),
    lines: upcomingInvoice.lines.data.map((line) => ({
      description: line.description,
      amount: line.amount,
      quantity: line.quantity,
    })),
  };
}
`,
      },
      {
        path: "lib/usage-tracker.ts",
        content: `import { reportUsage, type UsageAction } from "./usage-billing";

// In-memory buffer for batching usage records
// In production, use Redis or a database for persistence
interface UsageBuffer {
  subscriptionItemId: string;
  action: UsageAction;
  quantity: number;
  lastFlushed: number;
}

const usageBuffers = new Map<string, UsageBuffer>();
const FLUSH_INTERVAL_MS = 60000; // Flush every minute
const FLUSH_THRESHOLD = 100; // Or when reaching 100 units

// Track usage for a user/subscription
export async function trackUsage({
  userId,
  subscriptionItemId,
  action,
  quantity = 1,
}: {
  userId: string;
  subscriptionItemId: string;
  action: UsageAction;
  quantity?: number;
}) {
  const bufferKey = \`\${subscriptionItemId}:\${action}\`;
  const now = Date.now();

  const buffer = usageBuffers.get(bufferKey);

  if (buffer) {
    buffer.quantity += quantity;

    // Check if we should flush
    const shouldFlush =
      buffer.quantity >= FLUSH_THRESHOLD ||
      now - buffer.lastFlushed >= FLUSH_INTERVAL_MS;

    if (shouldFlush) {
      await flushBuffer(bufferKey, buffer);
    }
  } else {
    usageBuffers.set(bufferKey, {
      subscriptionItemId,
      action,
      quantity,
      lastFlushed: now,
    });
  }

  return { buffered: true, currentQuantity: usageBuffers.get(bufferKey)?.quantity || quantity };
}

// Flush a specific buffer to Stripe
async function flushBuffer(key: string, buffer: UsageBuffer) {
  if (buffer.quantity === 0) return;

  try {
    await reportUsage({
      subscriptionItemId: buffer.subscriptionItemId,
      quantity: buffer.quantity,
      idempotencyKey: \`\${key}:\${Date.now()}\`,
    });

    // Reset buffer
    buffer.quantity = 0;
    buffer.lastFlushed = Date.now();
  } catch (error) {
    console.error(\`Failed to flush usage buffer \${key}:\`, error);
    // Keep the buffer to retry later
  }
}

// Flush all buffers (call on shutdown or periodically)
export async function flushAllBuffers() {
  const promises: Promise<void>[] = [];

  for (const [key, buffer] of usageBuffers.entries()) {
    promises.push(flushBuffer(key, buffer));
  }

  await Promise.allSettled(promises);
}

// Immediate usage report (bypasses buffer)
export async function trackUsageImmediate({
  subscriptionItemId,
  action,
  quantity,
}: {
  subscriptionItemId: string;
  action: UsageAction;
  quantity: number;
}) {
  return reportUsage({
    subscriptionItemId,
    quantity,
    idempotencyKey: \`\${subscriptionItemId}:\${action}:\${Date.now()}\`,
  });
}

// Create a usage tracker middleware
export function createUsageMiddleware(
  getSubscriptionItemId: (userId: string) => Promise<string | null>
) {
  return async function usageMiddleware(
    userId: string,
    action: UsageAction,
    quantity: number = 1
  ) {
    const subscriptionItemId = await getSubscriptionItemId(userId);
    if (!subscriptionItemId) {
      console.warn(\`No subscription item found for user \${userId}\`);
      return null;
    }

    return trackUsage({
      userId,
      subscriptionItemId,
      action,
      quantity,
    });
  };
}

// Start periodic flushing
let flushInterval: NodeJS.Timeout | null = null;

export function startPeriodicFlush(intervalMs: number = FLUSH_INTERVAL_MS) {
  if (flushInterval) return;

  flushInterval = setInterval(() => {
    flushAllBuffers().catch(console.error);
  }, intervalMs);
}

export function stopPeriodicFlush() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

// Graceful shutdown
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    console.log("Flushing usage buffers before shutdown...");
    await flushAllBuffers();
  });
}
`,
      },
      {
        path: "app/api/usage/track/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { trackUsage, type UsageAction } from "@/lib/usage-tracker";
import { auth } from "@/lib/auth";

// Track usage for the authenticated user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, quantity = 1 } = await req.json();

  if (!action) {
    return NextResponse.json(
      { error: "Action is required" },
      { status: 400 }
    );
  }

  // Validate action type
  const validActions: UsageAction[] = [
    "api_call",
    "storage_gb",
    "compute_minutes",
    "bandwidth_gb",
    "tokens",
    "requests",
  ];

  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: "Invalid action type" },
      { status: 400 }
    );
  }

  try {
    // Get subscription item ID from database
    // const user = await db.user.findUnique({
    //   where: { id: session.user.id },
    //   select: { stripeSubscriptionItemId: true },
    // });

    // if (!user?.stripeSubscriptionItemId) {
    //   return NextResponse.json(
    //     { error: "No active subscription" },
    //     { status: 400 }
    //   );
    // }

    const subscriptionItemId = "si_xxx"; // Replace with actual ID from database

    const result = await trackUsage({
      userId: session.user.id,
      subscriptionItemId,
      action,
      quantity,
    });

    return NextResponse.json({
      success: true,
      buffered: result.buffered,
      currentQuantity: result.currentQuantity,
    });
  } catch (error) {
    console.error("Usage tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/usage/summary/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentPeriodUsage,
  estimateUpcomingInvoice,
} from "@/lib/usage-billing";
import { auth } from "@/lib/auth";

// Get usage summary for the authenticated user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's subscription info from database
    // const user = await db.user.findUnique({
    //   where: { id: session.user.id },
    //   select: {
    //     stripeCustomerId: true,
    //     stripeSubscriptionItemId: true,
    //   },
    // });

    // if (!user?.stripeCustomerId || !user?.stripeSubscriptionItemId) {
    //   return NextResponse.json(
    //     { error: "No active subscription" },
    //     { status: 400 }
    //   );
    // }

    const customerId = "cus_xxx"; // Replace with actual ID from database
    const subscriptionItemId = "si_xxx"; // Replace with actual ID from database

    // Get current period usage
    const usage = await getCurrentPeriodUsage(subscriptionItemId);

    // Get upcoming invoice estimate
    const estimate = await estimateUpcomingInvoice(customerId);

    return NextResponse.json({
      currentPeriod: {
        totalUsage: usage.totalUsage,
        periodStart: usage.periodStart.toISOString(),
        periodEnd: usage.periodEnd.toISOString(),
      },
      upcomingInvoice: {
        amountDue: estimate.amountDue / 100, // Convert cents to dollars
        currency: estimate.currency,
        periodStart: estimate.periodStart.toISOString(),
        periodEnd: estimate.periodEnd.toISOString(),
        lineItems: estimate.lines,
      },
    });
  } catch (error) {
    console.error("Usage summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage summary" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/usage/webhook/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/usage-billing";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "invoice.created": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceCreated(invoice);
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFinalized(invoice);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(\`Invoice created for customer \${customerId}\`);

  // For metered billing, the invoice is created with pending usage
  // Usage records are finalized when the invoice is finalized

  // Log or store the pending invoice
  // await db.invoice.create({
  //   data: {
  //     stripeInvoiceId: invoice.id,
  //     customerId,
  //     status: "draft",
  //   },
  // });
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const total = invoice.total;

  console.log(\`Invoice finalized for customer \${customerId}, total: \${total}\`);

  // The usage has been tallied and the invoice is ready for payment
  // Log metered usage line items
  for (const line of invoice.lines.data) {
    if (line.price?.recurring?.usage_type === "metered") {
      console.log(\`  Metered item: \${line.description}, quantity: \${line.quantity}, amount: \${line.amount}\`);
    }
  }

  // Update invoice status
  // await db.invoice.update({
  //   where: { stripeInvoiceId: invoice.id },
  //   data: { status: "finalized", total },
  // });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(\`Invoice paid for customer \${customerId}\`);

  // Record successful payment
  // await db.invoice.update({
  //   where: { stripeInvoiceId: invoice.id },
  //   data: { status: "paid", paidAt: new Date() },
  // });

  // Reset usage limits if applicable
  // await db.usageLimit.reset({ customerId });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(\`Invoice payment failed for customer \${customerId}\`);

  // Handle failed payment
  // - Send notification email
  // - Implement grace period logic
  // - Potentially restrict service

  // await db.invoice.update({
  //   where: { stripeInvoiceId: invoice.id },
  //   data: { status: "payment_failed" },
  // });

  // await sendPaymentFailedEmail(customerId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(\`Subscription updated for customer \${customerId}: \${status}\`);

  // Check for usage-related subscription changes
  for (const item of subscription.items.data) {
    if (item.price.recurring?.usage_type === "metered") {
      console.log(\`  Metered item: \${item.id}, price: \${item.price.id}\`);
    }
  }

  // Update subscription status in database
  // await db.subscription.update({
  //   where: { stripeCustomerId: customerId },
  //   data: { status },
  // });
}
`,
      },
      {
        path: "lib/usage-limits.ts",
        content: `import { getCurrentPeriodUsage } from "./usage-billing";

export interface UsageLimit {
  action: string;
  limit: number;
  resetPeriod: "daily" | "monthly" | "billing_cycle";
}

export interface UsageLimitCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
}

// Define usage limits per plan
const planLimits: Record<string, Record<string, number>> = {
  free: {
    api_call: 1000,
    storage_gb: 1,
    compute_minutes: 100,
    tokens: 10000,
  },
  pro: {
    api_call: 50000,
    storage_gb: 50,
    compute_minutes: 5000,
    tokens: 500000,
  },
  enterprise: {
    api_call: -1, // unlimited
    storage_gb: -1,
    compute_minutes: -1,
    tokens: -1,
  },
};

// Check if usage is within limits
export async function checkUsageLimit({
  subscriptionItemId,
  action,
  plan,
  requestedQuantity = 1,
}: {
  subscriptionItemId: string;
  action: string;
  plan: string;
  requestedQuantity?: number;
}): Promise<UsageLimitCheck> {
  const limits = planLimits[plan];
  if (!limits) {
    throw new Error(\`Unknown plan: \${plan}\`);
  }

  const limit = limits[action];
  if (limit === undefined) {
    throw new Error(\`Unknown action: \${action}\`);
  }

  // Unlimited
  if (limit === -1) {
    return {
      allowed: true,
      currentUsage: 0,
      limit: -1,
      remaining: -1,
      resetsAt: new Date(),
    };
  }

  // Get current usage from Stripe
  const usage = await getCurrentPeriodUsage(subscriptionItemId);

  const remaining = Math.max(0, limit - usage.totalUsage);
  const allowed = usage.totalUsage + requestedQuantity <= limit;

  return {
    allowed,
    currentUsage: usage.totalUsage,
    limit,
    remaining,
    resetsAt: usage.periodEnd,
  };
}

// Get all usage limits for a user
export async function getAllUsageLimits({
  subscriptionItemId,
  plan,
}: {
  subscriptionItemId: string;
  plan: string;
}): Promise<Record<string, UsageLimitCheck>> {
  const limits = planLimits[plan];
  if (!limits) {
    throw new Error(\`Unknown plan: \${plan}\`);
  }

  const results: Record<string, UsageLimitCheck> = {};

  for (const action of Object.keys(limits)) {
    results[action] = await checkUsageLimit({
      subscriptionItemId,
      action,
      plan,
    });
  }

  return results;
}

// Middleware to enforce usage limits
export function createUsageLimitMiddleware(
  getUserPlanAndSubscription: (
    userId: string
  ) => Promise<{ plan: string; subscriptionItemId: string } | null>
) {
  return async function usageLimitMiddleware(
    userId: string,
    action: string,
    quantity: number = 1
  ): Promise<{ allowed: boolean; error?: string; remaining?: number }> {
    const userInfo = await getUserPlanAndSubscription(userId);
    if (!userInfo) {
      return { allowed: false, error: "No active subscription" };
    }

    const check = await checkUsageLimit({
      subscriptionItemId: userInfo.subscriptionItemId,
      action,
      plan: userInfo.plan,
      requestedQuantity: quantity,
    });

    if (!check.allowed) {
      return {
        allowed: false,
        error: \`Usage limit exceeded. Limit: \${check.limit}, Current: \${check.currentUsage}\`,
        remaining: check.remaining,
      };
    }

    return { allowed: true, remaining: check.remaining };
  };
}
`,
      },
      {
        path: ".env.example",
        content: `# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"

# Stripe Webhook Secret (from webhook settings)
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# For local testing: stripe listen --forward-to localhost:3000/api/usage/webhook

# Metered Billing Configuration
# Price ID for your metered product (from Stripe Dashboard)
STRIPE_METERED_PRICE_ID="price_xxx"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "stripe" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
