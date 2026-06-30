import { getAppUrl, getStripe, getStripePriceId } from "@/lib/stripe/server";

export async function POST() {
  try {
    const stripe = getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/membresia/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/membresia/cancelada`,
      subscription_data: {
        metadata: {
          product: "hubya_membership",
        },
      },
      metadata: {
        product: "hubya_membership",
      },
    });

    if (!session.url) {
      return Response.json({ error: "Stripe no devolvió una URL de Checkout." }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar Checkout.";
    return Response.json({ error: message }, { status: 500 });
  }
}
