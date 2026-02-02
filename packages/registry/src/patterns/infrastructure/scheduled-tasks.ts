import type { Pattern } from "../../schema.js";

export const scheduledTasks: Pattern = {
  name: "Scheduled Tasks",
  slug: "scheduled-tasks",
  description:
    "Cron jobs and scheduled tasks for serverless using Inngest and Vercel Cron. Perfect for billing, cleanup, reports, and recurring jobs.",
  category: "infrastructure",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "beginner",
  tags: ["cron", "scheduled", "tasks", "inngest", "vercel"],
  files: {
    nextjs: [
      {
        path: "lib/inngest/scheduled.ts",
        content: `import { inngest } from "./client";

// Daily cleanup - runs at midnight UTC
export const dailyCleanup = inngest.createFunction(
  {
    id: "daily-cleanup",
    retries: 2,
  },
  { cron: "0 0 * * *" }, // Every day at midnight
  async ({ step }) => {
    // Clean up expired sessions
    const sessionsDeleted = await step.run("cleanup-sessions", async () => {
      console.log("Cleaning up expired sessions");
      // await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      return { count: 0 };
    });

    // Clean up old logs
    const logsDeleted = await step.run("cleanup-logs", async () => {
      console.log("Cleaning up old logs");
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      // await db.log.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } });
      return { count: 0 };
    });

    // Clean up temporary files
    await step.run("cleanup-temp-files", async () => {
      console.log("Cleaning up temporary files");
      // await deleteOldTempFiles();
    });

    return {
      sessionsDeleted: sessionsDeleted.count,
      logsDeleted: logsDeleted.count,
    };
  }
);

// Weekly report - runs every Monday at 9am UTC
export const weeklyReport = inngest.createFunction(
  {
    id: "weekly-report",
    retries: 3,
  },
  { cron: "0 9 * * 1" }, // Every Monday at 9am
  async ({ step }) => {
    // Generate weekly metrics
    const metrics = await step.run("calculate-metrics", async () => {
      console.log("Calculating weekly metrics");
      return {
        newUsers: 100,
        revenue: 5000,
        activeUsers: 500,
      };
    });

    // Send report to admins
    await step.run("send-report", async () => {
      console.log("Sending weekly report", metrics);
      // await sendEmail({ to: 'admin@example.com', template: 'weekly-report', data: metrics });
    });

    return metrics;
  }
);

// Hourly sync - runs every hour
export const hourlySyncPrices = inngest.createFunction(
  {
    id: "hourly-sync-prices",
    retries: 3,
    concurrency: {
      limit: 1, // Only one instance at a time
    },
  },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    // Fetch latest prices from external API
    const prices = await step.run("fetch-prices", async () => {
      console.log("Fetching latest prices");
      // const response = await fetch('https://api.example.com/prices');
      // return response.json();
      return { updated: true };
    });

    // Update local cache
    await step.run("update-cache", async () => {
      console.log("Updating price cache");
      // await redis.set('prices', JSON.stringify(prices));
    });

    return prices;
  }
);

// Monthly billing - runs on the 1st of each month
export const monthlyBilling = inngest.createFunction(
  {
    id: "monthly-billing",
    retries: 5,
  },
  { cron: "0 0 1 * *" }, // 1st of every month at midnight
  async ({ step }) => {
    // Get all active subscriptions
    const subscriptions = await step.run("get-subscriptions", async () => {
      console.log("Fetching active subscriptions");
      // return await db.subscription.findMany({ where: { status: 'active' } });
      return [{ id: "sub_1", userId: "user_1" }];
    });

    // Process each subscription
    for (const sub of subscriptions) {
      await step.run(\`process-\${sub.id}\`, async () => {
        console.log(\`Processing subscription \${sub.id}\`);
        // await stripe.subscriptions.update(sub.id, { billing_cycle_anchor: 'now' });
      });
    }

    return { processed: subscriptions.length };
  }
);

// Export all scheduled functions
export const scheduledFunctions = [
  dailyCleanup,
  weeklyReport,
  hourlySyncPrices,
  monthlyBilling,
];
`,
      },
      {
        path: "app/api/cron/daily/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";

// Vercel Cron endpoint for daily tasks
// Configure in vercel.json

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Running daily cron job");

    // Your daily tasks here
    // This is an alternative to Inngest cron for simple tasks

    // Example: Trigger Inngest event instead
    // await inngest.send({ name: 'cron/daily', data: {} });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "vercel.json",
        content: `{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
`,
      },
      {
        path: ".env.example",
        content: `# Inngest (for scheduled functions)
INNGEST_SIGNING_KEY="signkey-prod-..."

# Vercel Cron secret (for simple cron endpoints)
# Generate with: openssl rand -base64 32
CRON_SECRET="your-secret-here"
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
