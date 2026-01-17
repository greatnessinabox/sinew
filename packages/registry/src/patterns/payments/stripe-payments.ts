import type { Pattern } from "../../schema.js";

export const stripePayments: Pattern = {
  name: "Stripe Payments",
  slug: "stripe-payments",
  description:
    "Stripe integration with checkout sessions, webhook handling, and subscription management.",
  category: "payments",
  tier: "free",
  complexity: "intermediate",
  tags: ["payments", "stripe", "subscriptions", "webhooks", "checkout"],
  alternatives: [
    {
      name: "LemonSqueezy",
      description: "All-in-one platform for SaaS and digital products with built-in tax handling",
      url: "https://lemonsqueezy.com",
      pricingTier: "paid",
      pricingNote: "5% + $0.50 per transaction (includes all fees)",
      advantages: [
        "Merchant of Record (handles global tax compliance)",
        "Simpler setup than Stripe",
        "License key management included",
        "No separate tax software needed",
      ],
      recommended: true,
    },
    {
      name: "Paddle",
      description: "Payment infrastructure for SaaS with complete tax compliance",
      url: "https://paddle.com",
      pricingTier: "paid",
      pricingNote: "5% + $0.50 per transaction",
      advantages: [
        "Merchant of Record (handles VAT, sales tax globally)",
        "Subscription management built-in",
        "Automatic invoice generation",
        "No need to register for VAT in multiple countries",
      ],
    },
    {
      name: "Polar",
      description: "Open source funding and monetization for developers",
      url: "https://polar.sh",
      pricingTier: "freemium",
      pricingNote: "5% platform fee on transactions",
      advantages: [
        "Built for open source and developers",
        "GitHub integration",
        "Sponsorships and subscriptions",
        "Digital product delivery",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/stripe.ts",
        content: `import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Create a checkout session for one-time payment
export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  return session;
}

// Create a checkout session for subscription
export async function createSubscriptionSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  trialDays,
  metadata,
}: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: trialDays
      ? { trial_period_days: trialDays, metadata }
      : { metadata },
  });

  return session;
}

// Create or retrieve a Stripe customer
export async function getOrCreateCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  // Check if customer exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

// Create a billing portal session
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
`,
      },
      {
        path: "app/api/stripe/checkout/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { createSubscriptionSession, getOrCreateCustomer } from "@/lib/stripe";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();

  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email: session.user.email,
      name: session.user.name || undefined,
      metadata: { userId: session.user.id },
    });

    // Create checkout session
    const checkoutSession = await createSubscriptionSession({
      priceId,
      customerId: customer.id,
      successUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true\`,
      cancelUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true\`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
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
        path: "app/api/stripe/webhook/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  console.log(\`Checkout completed for user \${userId}, customer \${customerId}\`);

  // Update user in database with Stripe customer ID
  // await db.user.update({
  //   where: { id: userId },
  //   data: { stripeCustomerId: customerId },
  // });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;

  console.log(\`Subscription \${status} for customer \${customerId}\`);

  // Update subscription status in database
  // await db.subscription.upsert({
  //   where: { stripeCustomerId: customerId },
  //   create: { stripeCustomerId: customerId, status, priceId },
  //   update: { status, priceId },
  // });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log(\`Subscription canceled for customer \${customerId}\`);

  // Update subscription status in database
  // await db.subscription.update({
  //   where: { stripeCustomerId: customerId },
  //   data: { status: "canceled" },
  // });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(\`Payment succeeded for customer \${customerId}\`);

  // Record payment in database, send receipt email, etc.
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(\`Payment failed for customer \${customerId}\`);

  // Send payment failed email, update status, etc.
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

# For local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook
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
