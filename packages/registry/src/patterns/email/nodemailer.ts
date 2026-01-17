import type { Pattern } from "../../schema.js";

export const nodemailer: Pattern = {
  name: "Nodemailer Setup",
  slug: "nodemailer",
  description: "Free email sending with Nodemailer. Supports SMTP, Gmail, and other providers.",
  category: "email",
  tier: "free",
  complexity: "beginner",
  tags: ["email", "nodemailer", "smtp", "transactional"],
  alternatives: [
    {
      name: "Resend",
      description: "Modern email API with React Email support",
      url: "https://resend.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 3,000 emails/month",
      advantages: [
        "React Email templates",
        "Simple API",
        "Great developer experience",
        "Built-in analytics",
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
        path: "lib/email.ts",
        content: `import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

// SMTP Configuration
const smtpConfig: SMTPTransport.Options = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

// Verify SMTP connection
export async function verifyConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error);
    return false;
  }
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo,
  cc,
  bcc,
  attachments,
}: SendEmailOptions) {
  const mailOptions = {
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text,
    replyTo,
    cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
    bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
    attachments,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(
      \`Failed to send email: \${error instanceof Error ? error.message : "Unknown error"}\`
    );
  }
}

// Batch send emails with rate limiting
export async function sendBatchEmails(
  emails: SendEmailOptions[],
  options: { delayMs?: number; concurrency?: number } = {}
) {
  const { delayMs = 100, concurrency = 5 } = options;
  const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

  // Process emails in batches
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

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    console.warn(\`Failed to send \${failed.length} of \${emails.length} emails\`);
  }

  return results;
}
`,
      },
      {
        path: "lib/email-templates.ts",
        content: `// HTML Email Templates
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
import { sendEmail } from "@/lib/email";
import { welcomeEmailTemplate } from "@/lib/email-templates";

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
        path: ".env.example",
        content: `# SMTP Configuration
# For Gmail: Enable "Less secure app access" or use App Passwords
# https://support.google.com/accounts/answer/185833

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Default from address
EMAIL_FROM="Your App <noreply@yourdomain.com>"

# Common SMTP providers:
# Gmail:     smtp.gmail.com (port 587)
# Outlook:   smtp.office365.com (port 587)
# Yahoo:     smtp.mail.yahoo.com (port 587)
# Mailgun:   smtp.mailgun.org (port 587)
# SendGrid:  smtp.sendgrid.net (port 587)
# Amazon SES: email-smtp.{region}.amazonaws.com (port 587)
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "nodemailer" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "@types/nodemailer", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
