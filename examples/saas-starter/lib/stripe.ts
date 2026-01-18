import Stripe from "stripe";
import { env } from "@/env";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: ["5 projects", "Basic analytics", "Community support"],
  },
  pro: {
    name: "Pro",
    priceId: "price_xxx", // Replace with your Stripe price ID
    price: 19,
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    priceId: "price_yyy", // Replace with your Stripe price ID
    price: 99,
    features: ["Everything in Pro", "SSO", "Dedicated support", "Custom integrations"],
  },
} as const;
