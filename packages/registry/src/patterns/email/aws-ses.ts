import type { Pattern } from "../../schema.js";

export const awsSes: Pattern = {
  name: "AWS SES",
  slug: "aws-ses",
  description:
    "Cost-effective email at scale with AWS Simple Email Service. Great for high-volume sending.",
  category: "email",
  tier: "paid",
  complexity: "intermediate",
  tags: ["email", "aws", "ses", "transactional"],
  alternatives: [
    {
      name: "Resend",
      description: "Modern email API with React Email support",
      url: "https://resend.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 3,000 emails/month",
      advantages: [
        "Simple API",
        "Great developer experience",
        "React Email templates",
        "No infrastructure setup",
      ],
      recommended: true,
    },
    {
      name: "SendGrid",
      description: "Reliable email delivery at scale",
      url: "https://sendgrid.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 100 emails/day",
      advantages: [
        "High deliverability",
        "Detailed analytics",
        "Template engine",
        "Webhook support",
      ],
    },
    {
      name: "Postmark",
      description: "Fast, reliable transactional email",
      url: "https://postmarkapp.com",
      pricingTier: "paid",
      pricingNote: "Starting at $15/month for 10,000 emails",
      advantages: [
        "Excellent deliverability",
        "Fast delivery times",
        "Detailed bounce handling",
        "Message streams",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/ses.ts",
        content: `import {
  SESClient,
  SendEmailCommand,
  SendBulkTemplatedEmailCommand,
  SendTemplatedEmailCommand,
  type SendEmailCommandInput,
  type SendBulkTemplatedEmailCommandInput,
} from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo,
  cc,
  bcc,
}: SendEmailOptions) {
  const toAddresses = Array.isArray(to) ? to : [to];

  const params: SendEmailCommandInput = {
    Source: from,
    Destination: {
      ToAddresses: toAddresses,
      CcAddresses: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      BccAddresses: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        ...(html && {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
        }),
        ...(text && {
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        }),
      },
    },
    ReplyToAddresses: replyTo
      ? Array.isArray(replyTo)
        ? replyTo
        : [replyTo]
      : undefined,
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log("Email sent:", response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(
      \`Failed to send email: \${error instanceof Error ? error.message : "Unknown error"}\`
    );
  }
}

interface SendTemplatedEmailOptions {
  to: string | string[];
  templateName: string;
  templateData: Record<string, string>;
  from?: string;
  replyTo?: string | string[];
}

// Send email using SES template
export async function sendTemplatedEmail({
  to,
  templateName,
  templateData,
  from = DEFAULT_FROM,
  replyTo,
}: SendTemplatedEmailOptions) {
  const toAddresses = Array.isArray(to) ? to : [to];

  try {
    const command = new SendTemplatedEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
      ReplyToAddresses: replyTo
        ? Array.isArray(replyTo)
          ? replyTo
          : [replyTo]
        : undefined,
    });

    const response = await sesClient.send(command);
    console.log("Templated email sent:", response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("Failed to send templated email:", error);
    throw new Error(
      \`Failed to send templated email: \${error instanceof Error ? error.message : "Unknown error"}\`
    );
  }
}

interface BulkEmailRecipient {
  to: string;
  templateData: Record<string, string>;
}

// Send bulk templated emails (up to 50 destinations per call)
export async function sendBulkTemplatedEmail({
  recipients,
  templateName,
  defaultTemplateData,
  from = DEFAULT_FROM,
}: {
  recipients: BulkEmailRecipient[];
  templateName: string;
  defaultTemplateData?: Record<string, string>;
  from?: string;
}) {
  // SES allows max 50 destinations per bulk send
  const BATCH_SIZE = 50;
  const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const params: SendBulkTemplatedEmailCommandInput = {
      Source: from,
      Template: templateName,
      DefaultTemplateData: JSON.stringify(defaultTemplateData || {}),
      Destinations: batch.map((recipient) => ({
        Destination: {
          ToAddresses: [recipient.to],
        },
        ReplacementTemplateData: JSON.stringify(recipient.templateData),
      })),
    };

    try {
      const command = new SendBulkTemplatedEmailCommand(params);
      const response = await sesClient.send(command);

      response.Status?.forEach((status, index) => {
        if (status.Status === "Success") {
          results.push({ success: true, messageId: status.MessageId });
        } else {
          results.push({
            success: false,
            error: status.Error || "Unknown error",
          });
        }
      });
    } catch (error) {
      // If the entire batch fails, mark all as failed
      batch.forEach(() => {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Batch send failed",
        });
      });
    }
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    console.warn(\`Failed to send \${failed.length} of \${recipients.length} emails\`);
  }

  return results;
}

// Batch send individual emails with rate limiting
export async function sendBatchEmails(
  emails: SendEmailOptions[],
  options: { delayMs?: number; concurrency?: number } = {}
) {
  const { delayMs = 100, concurrency = 14 } = options; // SES default rate is 14/sec
  const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((email) => sendEmail(email))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({ success: false, error: result.reason?.message });
      }
    }

    // Rate limiting delay between batches
    if (i + concurrency < emails.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export { sesClient };
`,
      },
      {
        path: "lib/ses-templates.ts",
        content: `// HTML Email Templates for AWS SES
// These templates use inline styles for maximum email client compatibility

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function welcomeEmailTemplate({
  name,
  loginUrl = "https://example.com/login",
}: WelcomeEmailProps): { html: string; text: string } {
  const html = \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px 20px;">
          <tr>
            <td>
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Welcome, \${name}!</h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                We're excited to have you on board. Get started by exploring your dashboard.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="\${loginUrl}" style="background-color: #e85a2c; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #8a8a8a; font-size: 14px; margin: 40px 0 0;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@example.com" style="color: #e85a2c;">support@example.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;

  const text = \`Welcome, \${name}!

We're excited to have you on board. Get started by exploring your dashboard.

Go to Dashboard: \${loginUrl}

If you have any questions, reply to this email or contact us at support@example.com
\`;

  return { html, text };
}

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresIn?: string;
}

export function passwordResetEmailTemplate({
  resetUrl,
  expiresIn = "1 hour",
}: PasswordResetEmailProps): { html: string; text: string } {
  const html = \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px 20px;">
          <tr>
            <td>
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Reset Your Password</h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="\${resetUrl}" style="background-color: #e85a2c; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                This link will expire in \${expiresIn}. If you didn't request this, you can safely ignore this email.
              </p>
              <p style="color: #8a8a8a; font-size: 12px; margin: 40px 0 0; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser: \${resetUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;

  const text = \`Reset Your Password

We received a request to reset your password. Click the link below to create a new password.

Reset Password: \${resetUrl}

This link will expire in \${expiresIn}. If you didn't request this, you can safely ignore this email.
\`;

  return { html, text };
}

interface VerificationEmailProps {
  verificationUrl: string;
  expiresIn?: string;
}

export function verificationEmailTemplate({
  verificationUrl,
  expiresIn = "24 hours",
}: VerificationEmailProps): { html: string; text: string } {
  const html = \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px 20px;">
          <tr>
            <td>
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Verify Your Email</h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Please verify your email address by clicking the button below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="\${verificationUrl}" style="background-color: #e85a2c; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                This link will expire in \${expiresIn}.
              </p>
              <p style="color: #8a8a8a; font-size: 12px; margin: 40px 0 0; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser: \${verificationUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;

  const text = \`Verify Your Email

Please verify your email address by clicking the link below.

Verify Email: \${verificationUrl}

This link will expire in \${expiresIn}.
\`;

  return { html, text };
}
`,
      },
      {
        path: "app/api/email/send/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/ses";
import { welcomeEmailTemplate } from "@/lib/ses-templates";

export async function POST(req: NextRequest) {
  try {
    const { email, name, type } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    let subject: string;
    let html: string;
    let text: string;

    switch (type) {
      case "welcome":
      default:
        subject = "Welcome to Our Platform!";
        const template = welcomeEmailTemplate({
          name,
          loginUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/login\`,
        });
        html = template.html;
        text = template.text;
        break;
    }

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/email/bulk/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { sendBulkTemplatedEmail } from "@/lib/ses";

// Example endpoint for sending bulk templated emails
export async function POST(req: NextRequest) {
  try {
    const { recipients, templateName, defaultTemplateData } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 }
      );
    }

    if (!templateName) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Validate recipient format
    for (const recipient of recipients) {
      if (!recipient.to || !recipient.templateData) {
        return NextResponse.json(
          { error: "Each recipient must have 'to' and 'templateData'" },
          { status: 400 }
        );
      }
    }

    const results = await sendBulkTemplatedEmail({
      recipients,
      templateName,
      defaultTemplateData,
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error("Failed to send bulk emails:", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# AWS Credentials
# Get these from AWS IAM console
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"

# Default from address (must be verified in SES)
EMAIL_FROM="Your App <noreply@yourdomain.com>"

# SES Pricing (as of 2024):
# - $0.10 per 1,000 emails sent
# - Free tier: 62,000 emails/month when sending from EC2

# Important: Before sending to unverified addresses,
# you need to move out of the SES sandbox:
# https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html

# Verify your domain or email addresses in SES console:
# https://console.aws.amazon.com/ses/home#verified-senders-domain
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "@aws-sdk/client-ses" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
