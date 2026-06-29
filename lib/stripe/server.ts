import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno.");
  }

  return new Stripe(secretKey);
}
