import type { Pattern } from "../../schema.js";

export const lemonsqueezy: Pattern = {
  name: "LemonSqueezy",
  slug: "lemonsqueezy",
  description:
    "Payment integration with LemonSqueezy. Includes checkout, webhooks, and subscriptions with built-in tax handling.",
  category: "payments",
  tier: "free",
  complexity: "intermediate",
  tags: ["payments", "lemonsqueezy", "subscriptions", "webhooks"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/lemonsqueezy.ts",
        content: `import {
  getAuthenticatedUser,
  lemonSqueezySetup,
  createCheckout,
  listProducts,
  listVariants,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  listSubscriptions,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";

// Initialize the LemonSqueezy client
export function initLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set");
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("LemonSqueezy API error:", error);
    },
  });
}

// Verify API connection
export async function verifyConnection() {
  initLemonSqueezy();
  const { data, error } = await getAuthenticatedUser();
  if (error) {
    throw new Error(\`Failed to authenticate with LemonSqueezy: \${error.message}\`);
  }
  return data;
}

// Get all products for your store
export async function getProducts() {
  initLemonSqueezy();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  }

  const { data, error } = await listProducts({
    filter: { storeId },
    include: ["variants"],
  });

  if (error) {
    throw new Error(\`Failed to fetch products: \${error.message}\`);
  }

  return data;
}

// Get variants for a specific product
export async function getProductVariants(productId: string) {
  initLemonSqueezy();

  const { data, error } = await listVariants({
    filter: { productId },
  });

  if (error) {
    throw new Error(\`Failed to fetch variants: \${error.message}\`);
  }

  return data;
}

// Create a checkout session
export async function createCheckoutSession({
  variantId,
  email,
  name,
  userId,
  redirectUrl,
  customData,
}: {
  variantId: string;
  email?: string;
  name?: string;
  userId?: string;
  redirectUrl?: string;
  customData?: Record<string, string>;
}) {
  initLemonSqueezy();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email,
      name,
      custom: customData ? { ...customData, userId } : { userId },
    },
    productOptions: {
      redirectUrl: redirectUrl || process.env.NEXT_PUBLIC_APP_URL,
      receiptButtonText: "Return to Dashboard",
      receiptThankYouNote: "Thank you for your purchase!",
    },
  });

  if (error) {
    throw new Error(\`Failed to create checkout: \${error.message}\`);
  }

  return data;
}

// Get subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  initLemonSqueezy();

  const { data, error } = await getSubscription(subscriptionId);

  if (error) {
    throw new Error(\`Failed to fetch subscription: \${error.message}\`);
  }

  return data;
}

// Get all subscriptions for a customer
export async function getCustomerSubscriptions(customerId: string) {
  initLemonSqueezy();

  const { data, error } = await listSubscriptions({
    filter: { customerId },
  });

  if (error) {
    throw new Error(\`Failed to fetch subscriptions: \${error.message}\`);
  }

  return data;
}

// Update subscription (change plan)
export async function changeSubscriptionPlan(
  subscriptionId: string,
  variantId: string
) {
  initLemonSqueezy();

  const { data, error } = await updateSubscription(subscriptionId, {
    variantId,
  });

  if (error) {
    throw new Error(\`Failed to update subscription: \${error.message}\`);
  }

  return data;
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string) {
  initLemonSqueezy();

  const { data, error } = await updateSubscription(subscriptionId, {
    pause: {
      mode: "void",
    },
  });

  if (error) {
    throw new Error(\`Failed to pause subscription: \${error.message}\`);
  }

  return data;
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  initLemonSqueezy();

  const { data, error } = await updateSubscription(subscriptionId, {
    pause: null,
  });

  if (error) {
    throw new Error(\`Failed to resume subscription: \${error.message}\`);
  }

  return data;
}

// Cancel subscription
export async function cancelUserSubscription(subscriptionId: string) {
  initLemonSqueezy();

  const { data, error } = await cancelSubscription(subscriptionId);

  if (error) {
    throw new Error(\`Failed to cancel subscription: \${error.message}\`);
  }

  return data;
}

// Get customer details
export async function getCustomerDetails(customerId: string) {
  initLemonSqueezy();

  const { data, error } = await getCustomer(customerId);

  if (error) {
    throw new Error(\`Failed to fetch customer: \${error.message}\`);
  }

  return data;
}

// Get customer portal URL
export async function getCustomerPortalUrl(customerId: string) {
  const customer = await getCustomerDetails(customerId);
  return customer?.data?.attributes?.urls?.customer_portal || null;
}
`,
      },
      {
        path: "app/api/lemonsqueezy/checkout/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/lemonsqueezy";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variantId } = await req.json();

  if (!variantId) {
    return NextResponse.json(
      { error: "Variant ID is required" },
      { status: 400 }
    );
  }

  try {
    const checkout = await createCheckoutSession({
      variantId,
      email: session.user.email,
      name: session.user.name || undefined,
      userId: session.user.id,
      redirectUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true\`,
      customData: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkout?.data?.attributes?.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/lemonsqueezy/webhook/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Webhook event types
type WebhookEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "order_created"
  | "order_refunded"
  | "license_key_created";

interface WebhookPayload {
  meta: {
    event_name: WebhookEvent;
    custom_data?: {
      userId?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships: Record<string, unknown>;
  };
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: WebhookPayload = JSON.parse(rawBody);
  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.userId;

  console.log(\`Received webhook: \${eventName}\`, { userId });

  try {
    switch (eventName) {
      case "subscription_created":
        await handleSubscriptionCreated(payload, userId);
        break;

      case "subscription_updated":
        await handleSubscriptionUpdated(payload, userId);
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        await handleSubscriptionEnded(payload, userId);
        break;

      case "subscription_paused":
        await handleSubscriptionPaused(payload, userId);
        break;

      case "subscription_resumed":
      case "subscription_unpaused":
        await handleSubscriptionResumed(payload, userId);
        break;

      case "subscription_payment_success":
        await handlePaymentSuccess(payload, userId);
        break;

      case "subscription_payment_failed":
        await handlePaymentFailed(payload, userId);
        break;

      case "order_created":
        await handleOrderCreated(payload, userId);
        break;

      case "order_refunded":
        await handleOrderRefunded(payload, userId);
        break;

      default:
        console.log(\`Unhandled event: \${eventName}\`);
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

async function handleSubscriptionCreated(
  payload: WebhookPayload,
  userId?: string
) {
  const { id, attributes } = payload.data;
  const customerId = (attributes.customer_id as number).toString();
  const variantId = (attributes.variant_id as number).toString();
  const status = attributes.status as string;

  console.log(\`Subscription created: \${id} for user \${userId}\`);

  // Save subscription to database
  // await db.subscription.create({
  //   data: {
  //     userId,
  //     lemonSqueezyId: id,
  //     customerId,
  //     variantId,
  //     status,
  //   },
  // });
}

async function handleSubscriptionUpdated(
  payload: WebhookPayload,
  userId?: string
) {
  const { id, attributes } = payload.data;
  const status = attributes.status as string;
  const variantId = (attributes.variant_id as number).toString();

  console.log(\`Subscription updated: \${id}, status: \${status}\`);

  // Update subscription in database
  // await db.subscription.update({
  //   where: { lemonSqueezyId: id },
  //   data: { status, variantId },
  // });
}

async function handleSubscriptionEnded(
  payload: WebhookPayload,
  userId?: string
) {
  const { id } = payload.data;

  console.log(\`Subscription ended: \${id}\`);

  // Update subscription status in database
  // await db.subscription.update({
  //   where: { lemonSqueezyId: id },
  //   data: { status: "cancelled" },
  // });
}

async function handleSubscriptionPaused(
  payload: WebhookPayload,
  userId?: string
) {
  const { id } = payload.data;

  console.log(\`Subscription paused: \${id}\`);

  // await db.subscription.update({
  //   where: { lemonSqueezyId: id },
  //   data: { status: "paused" },
  // });
}

async function handleSubscriptionResumed(
  payload: WebhookPayload,
  userId?: string
) {
  const { id } = payload.data;

  console.log(\`Subscription resumed: \${id}\`);

  // await db.subscription.update({
  //   where: { lemonSqueezyId: id },
  //   data: { status: "active" },
  // });
}

async function handlePaymentSuccess(
  payload: WebhookPayload,
  userId?: string
) {
  const { id, attributes } = payload.data;

  console.log(\`Payment succeeded for subscription: \${id}\`);

  // Record payment, send receipt email, etc.
}

async function handlePaymentFailed(
  payload: WebhookPayload,
  userId?: string
) {
  const { id } = payload.data;

  console.log(\`Payment failed for subscription: \${id}\`);

  // Send payment failed email, update status, etc.
}

async function handleOrderCreated(
  payload: WebhookPayload,
  userId?: string
) {
  const { id, attributes } = payload.data;
  const total = attributes.total as number;

  console.log(\`Order created: \${id}, total: \${total}\`);

  // Record one-time purchase, send confirmation email, etc.
}

async function handleOrderRefunded(
  payload: WebhookPayload,
  userId?: string
) {
  const { id } = payload.data;

  console.log(\`Order refunded: \${id}\`);

  // Handle refund, revoke access, etc.
}
`,
      },
      {
        path: "app/api/lemonsqueezy/portal/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalUrl } from "@/lib/lemonsqueezy";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the customer ID from your database
  // const user = await db.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { lemonSqueezyCustomerId: true },
  // });

  // if (!user?.lemonSqueezyCustomerId) {
  //   return NextResponse.json(
  //     { error: "No subscription found" },
  //     { status: 404 }
  //   );
  // }

  try {
    // Replace with actual customer ID from database
    const customerId = "example-customer-id";
    const portalUrl = await getCustomerPortalUrl(customerId);

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Could not get portal URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal URL error:", error);
    return NextResponse.json(
      { error: "Failed to get portal URL" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# LemonSqueezy Keys (from https://app.lemonsqueezy.com/settings/api)
LEMONSQUEEZY_API_KEY="your-api-key"

# Store ID (from your store settings URL)
LEMONSQUEEZY_STORE_ID="your-store-id"

# Webhook Secret (from webhook settings)
LEMONSQUEEZY_WEBHOOK_SECRET="your-webhook-secret"

# App URL for redirects
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "@lemonsqueezy/lemonsqueezy.js" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
