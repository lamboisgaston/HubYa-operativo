import Stripe from "stripe";

export const HUBYA_MEMBERSHIP_PRICE_ID = "price_1TnQP0Csi5bFeeBgKj7OsG2X";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno.");
  }

  return new Stripe(secretKey);
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Falta STRIPE_WEBHOOK_SECRET en las variables de entorno.");
  }

  return webhookSecret;
}

export function getStripePriceId() {
  return process.env.STRIPE_PRICE_ID || HUBYA_MEMBERSHIP_PRICE_ID;
}

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("Falta NEXT_PUBLIC_APP_URL en las variables de entorno.");
  }

  return appUrl.replace(/\/$/, "");
}
