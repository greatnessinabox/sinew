import { Resend } from "resend";
import { env } from "@/env";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "onboarding@yourdomain.com",
    to: email,
    subject: "Welcome to Our App!",
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for signing up. We're excited to have you on board.</p>
      <p>Get started by <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard">visiting your dashboard</a>.</p>
    `,
  });
}

export async function sendSubscriptionEmail(email: string, plan: string) {
  await resend.emails.send({
    from: "billing@yourdomain.com",
    to: email,
    subject: `You're now on the ${plan} plan!`,
    html: `
      <h1>Subscription Updated</h1>
      <p>Your subscription has been updated to the <strong>${plan}</strong> plan.</p>
      <p>Thanks for your support!</p>
    `,
  });
}
