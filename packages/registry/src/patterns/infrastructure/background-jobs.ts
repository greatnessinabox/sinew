import type { Pattern } from "../../schema.js";

export const backgroundJobs: Pattern = {
  name: "Background Jobs",
  slug: "background-jobs",
  description:
    "Serverless background job processing with Inngest. Includes job definitions, retries, and event-driven workflows.",
  category: "infrastructure",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["jobs", "background", "queue", "inngest", "serverless"],
  alternatives: [
    {
      name: "Inngest",
      description: "Event-driven background jobs with zero infrastructure",
      url: "https://inngest.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 50K steps/month",
      advantages: [
        "Zero infrastructure",
        "Built-in retries and rate limiting",
        "Event-driven workflows",
        "Local development tools",
      ],
      recommended: true,
    },
    {
      name: "Trigger.dev",
      description: "Open-source background jobs for serverless",
      url: "https://trigger.dev",
      pricingTier: "freemium",
      advantages: ["Open source", "Self-hostable", "TypeScript-first", "Long-running jobs"],
    },
    {
      name: "QStash",
      description: "HTTP-based message queue from Upstash",
      url: "https://upstash.com/qstash",
      pricingTier: "freemium",
      pricingNote: "Free tier with 500 messages/day",
      advantages: [
        "Simple HTTP-based API",
        "Works with any endpoint",
        "Built-in retries",
        "Scheduling support",
      ],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/inngest/client.ts",
        content: `import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: "my-app",
  // Optional: Configure event sending
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Define your event types for type safety
export type Events = {
  "user/created": {
    data: {
      userId: string;
      email: string;
      name: string;
    };
  };
  "order/placed": {
    data: {
      orderId: string;
      userId: string;
      items: Array<{ productId: string; quantity: number }>;
      total: number;
    };
  };
  "email/send": {
    data: {
      to: string;
      subject: string;
      template: string;
      variables: Record<string, string>;
    };
  };
  "report/generate": {
    data: {
      reportType: "daily" | "weekly" | "monthly";
      userId: string;
      startDate: string;
      endDate: string;
    };
  };
};
`,
      },
      {
        path: "lib/inngest/functions.ts",
        content: `import { inngest } from "./client";

// Welcome email after user signup
export const sendWelcomeEmail = inngest.createFunction(
  {
    id: "send-welcome-email",
    retries: 3,
  },
  { event: "user/created" },
  async ({ event, step }) => {
    const { userId, email, name } = event.data;

    // Send welcome email
    await step.run("send-email", async () => {
      // Replace with your email service
      console.log(\`Sending welcome email to \${email}\`);
      // await sendEmail({ to: email, template: 'welcome', data: { name } });
    });

    // Wait 24 hours then send tips email
    await step.sleep("wait-for-tips", "24h");

    await step.run("send-tips-email", async () => {
      console.log(\`Sending tips email to \${email}\`);
      // await sendEmail({ to: email, template: 'tips' });
    });

    return { success: true, userId };
  }
);

// Process order after placement
export const processOrder = inngest.createFunction(
  {
    id: "process-order",
    retries: 5,
    // Prevent duplicate processing
    idempotency: "event.data.orderId",
  },
  { event: "order/placed" },
  async ({ event, step }) => {
    const { orderId, userId, items, total } = event.data;

    // Reserve inventory
    const inventory = await step.run("reserve-inventory", async () => {
      // Replace with your inventory service
      console.log(\`Reserving inventory for order \${orderId}\`);
      return { reserved: true };
    });

    if (!inventory.reserved) {
      throw new Error("Failed to reserve inventory");
    }

    // Charge payment
    const payment = await step.run("charge-payment", async () => {
      // Replace with your payment service
      console.log(\`Charging \${total} for order \${orderId}\`);
      return { success: true, transactionId: "txn_123" };
    });

    // Send confirmation email
    await step.run("send-confirmation", async () => {
      console.log(\`Sending confirmation for order \${orderId}\`);
    });

    // Notify fulfillment (fan out)
    await step.sendEvent("notify-fulfillment", {
      name: "fulfillment/requested",
      data: { orderId, items },
    });

    return { orderId, transactionId: payment.transactionId };
  }
);

// Generate report with progress tracking
export const generateReport = inngest.createFunction(
  {
    id: "generate-report",
    retries: 2,
    // Limit concurrent executions
    concurrency: {
      limit: 5,
    },
  },
  { event: "report/generate" },
  async ({ event, step }) => {
    const { reportType, userId, startDate, endDate } = event.data;

    // Fetch data
    const data = await step.run("fetch-data", async () => {
      console.log(\`Fetching \${reportType} report data\`);
      return { rows: 1000 };
    });

    // Process in batches
    const batchSize = 100;
    const batches = Math.ceil(data.rows / batchSize);

    for (let i = 0; i < batches; i++) {
      await step.run(\`process-batch-\${i}\`, async () => {
        console.log(\`Processing batch \${i + 1}/\${batches}\`);
      });
    }

    // Generate PDF
    const report = await step.run("generate-pdf", async () => {
      console.log("Generating PDF report");
      return { url: "https://example.com/report.pdf" };
    });

    // Notify user
    await step.sendEvent("notify-user", {
      name: "email/send",
      data: {
        to: userId,
        subject: \`Your \${reportType} report is ready\`,
        template: "report-ready",
        variables: { reportUrl: report.url },
      },
    });

    return { reportUrl: report.url };
  }
);

// Export all functions for registration
export const functions = [
  sendWelcomeEmail,
  processOrder,
  generateReport,
];
`,
      },
      {
        path: "app/api/inngest/route.ts",
        content: `import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
`,
      },
      {
        path: "lib/inngest/trigger.ts",
        content: `import { inngest } from "./client";
import type { Events } from "./client";

// Helper function to trigger events with type safety
export async function triggerEvent<K extends keyof Events>(
  eventName: K,
  data: Events[K]["data"]
) {
  await inngest.send({
    name: eventName,
    data,
  });
}

// Example usage functions
export async function onUserCreated(user: {
  id: string;
  email: string;
  name: string;
}) {
  await triggerEvent("user/created", {
    userId: user.id,
    email: user.email,
    name: user.name,
  });
}

export async function onOrderPlaced(order: {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}) {
  await triggerEvent("order/placed", {
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    total: order.total,
  });
}

export async function requestReport(params: {
  type: "daily" | "weekly" | "monthly";
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  await triggerEvent("report/generate", {
    reportType: params.type,
    userId: params.userId,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
  });
}
`,
      },
      {
        path: ".env.example",
        content: `# Inngest (https://app.inngest.com)
# For production, set your signing key
INNGEST_SIGNING_KEY="signkey-prod-..."

# Optional: Event key for sending events from outside your app
INNGEST_EVENT_KEY="..."

# For local development, use the Inngest dev server:
# npx inngest-cli@latest dev
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "inngest" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
