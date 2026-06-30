import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";

type MembershipInput = {
  email?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: Date | null;
  priceId?: string | null;
};

function asString(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function dateFromUnix(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

async function upsertMembership(input: MembershipInput) {
  const email = input.email || null;
  const stripeSubscriptionId = input.stripeSubscriptionId || null;
  const stripeCustomerId = input.stripeCustomerId || null;

  if (!email && !stripeSubscriptionId && !stripeCustomerId) return;

  const data = {
    email: email || "stripe-customer-without-email@hubya.local",
    stripeCustomerId,
    stripeSubscriptionId,
    status: input.status || "active",
    currentPeriodEnd: input.currentPeriodEnd || undefined,
    priceId: input.priceId || undefined,
  };

  if (stripeSubscriptionId) {
    await prisma.membership.upsert({
      where: { stripeSubscriptionId },
      create: data,
      update: data,
    });
    return;
  }

  if (stripeCustomerId) {
    await prisma.membership.upsert({
      where: { stripeCustomerId },
      create: data,
      update: data,
    });
    return;
  }

  if (email) {
    await prisma.membership.upsert({
      where: { email },
      create: data,
      update: data,
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const stripeSubscriptionId = asString(session.subscription as string | null);
  let subscription: Stripe.Subscription | null = null;

  if (stripeSubscriptionId) {
    subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
  }

  await upsertMembership({
    email: session.customer_details?.email || session.customer_email,
    stripeCustomerId: asString(session.customer),
    stripeSubscriptionId,
    status: subscription?.status || "active",
    currentPeriodEnd: dateFromUnix((subscription as any)?.current_period_end),
    priceId: subscription?.items.data[0]?.price.id,
  });
}

async function handleSubscription(subscription: Stripe.Subscription) {
  const customerId = asString(subscription.customer);
  let email: string | null = null;

  if (customerId) {
    const customer = await getStripe().customers.retrieve(customerId);
    if (!customer.deleted) email = customer.email;
  }

  await upsertMembership({
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: dateFromUnix((subscription as any).current_period_end),
    priceId: subscription.items.data[0]?.price.id,
  });
}

async function handleInvoice(invoice: Stripe.Invoice, status: "active" | "past_due") {
  const stripeSubscriptionId = asString((invoice as any).subscription);
  const stripeCustomerId = asString(invoice.customer);

  await upsertMembership({
    email: invoice.customer_email,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
  });
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
      await handleInvoice(event.data.object as Stripe.Invoice, "active");
      break;
    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice, "past_due");
      break;
    default:
      break;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Falta firma de Stripe." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firma de webhook inválida.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const existingEvent = await prisma.stripeEvent.findUnique({ where: { stripeEventId: event.id } });

    if (existingEvent?.processed) {
      return Response.json({ received: true, duplicate: true });
    }

    await prisma.stripeEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        id: event.id,
        stripeEventId: event.id,
        type: event.type,
        payload: event as unknown as object,
        processed: false,
      },
      update: {
        type: event.type,
        payload: event as unknown as object,
      },
    });

    await processEvent(event);

    await prisma.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el webhook.";
    return Response.json({ error: message }, { status: 500 });
  }
}
