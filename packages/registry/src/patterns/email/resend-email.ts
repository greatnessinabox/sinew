import type { Pattern } from "../../schema.js";

export const resendEmail: Pattern = {
  name: "Resend Email",
  slug: "resend-email",
  description:
    "Transactional email with Resend. Includes React Email templates, email queue, and common templates.",
  category: "email",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/email.ts",
        content: `import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

export async function sendEmail({
  to,
  subject,
  react,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo,
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    html,
    text,
    replyTo,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(\`Failed to send email: \${error.message}\`);
  }

  return data;
}

// Batch send emails
export async function sendBatchEmails(
  emails: SendEmailOptions[]
) {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(\`Failed to send \${failed.length} emails\`);
  }

  return results;
}
`,
      },
      {
        path: "emails/welcome.tsx",
        content: `import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  name,
  loginUrl = "https://example.com/login",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {name}!</Heading>
          <Text style={text}>
            We&apos;re excited to have you on board. Get started by exploring
            your dashboard.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={footer}>
            If you have any questions, reply to this email or contact us at{" "}
            <Link href="mailto:support@example.com">support@example.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 20px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#e85a2c",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#8a8a8a",
  fontSize: "14px",
  margin: "40px 0 0",
};

export default WelcomeEmail;
`,
      },
      {
        path: "emails/password-reset.tsx",
        content: `import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresIn?: string;
}

export function PasswordResetEmail({
  resetUrl,
  expiresIn = "1 hour",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset Your Password</Heading>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to create a new password.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in {expiresIn}. If you didn&apos;t request
            this, you can safely ignore this email.
          </Text>
          <Text style={footer}>
            If the button doesn&apos;t work, copy and paste this URL into your
            browser: {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 20px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#e85a2c",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#8a8a8a",
  fontSize: "12px",
  margin: "40px 0 0",
  wordBreak: "break-all" as const,
};

export default PasswordResetEmail;
`,
      },
      {
        path: "app/api/auth/send-welcome/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/emails/welcome";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to Our Platform!",
      react: WelcomeEmail({ name, loginUrl: "https://example.com/login" }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
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
        content: `# Resend API Key (get from https://resend.com)
RESEND_API_KEY="re_xxxxx"

# Default from address (must be verified in Resend)
EMAIL_FROM="Your App <noreply@yourdomain.com>"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "resend" }, { name: "@react-email/components" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
