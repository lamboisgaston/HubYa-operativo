const WHATSAPP_GRAPH_VERSION = "v20.0";

type SendWhatsappMessageInput = {
  to: string;
  message: string;
};

export type SendWhatsappMessageResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  messageId?: string | null;
  error?: string;
  detail?: unknown;
};

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function sendWhatsappMessage(input: SendWhatsappMessageInput): Promise<SendWhatsappMessageResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("Faltan variables de WhatsApp", {
      hasAccessToken: Boolean(accessToken),
      hasPhoneNumberId: Boolean(phoneNumberId),
    });
    return { ok: false, skipped: true, error: "Faltan variables de WhatsApp." };
  }

  const to = normalizePhone(input.to);
  const message = input.message.trim();

  if (!to || !message) {
    return { ok: false, skipped: true, error: "Falta destinatario o mensaje para WhatsApp." };
  }

  const response = await fetch(`https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: message },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = typeof data?.error?.message === "string" ? data.error.message : "WhatsApp Cloud API rechazó el envío.";
    return { ok: false, status: response.status, error, detail: data };
  }

  return { ok: true, status: response.status, messageId: data?.messages?.[0]?.id ?? null };
}
