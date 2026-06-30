import { normalizeIncomingMessages } from "@/lib/whatsapp/normalizeIncomingMessage";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const normalized = normalizeIncomingMessages(payload);
  const firstMessage = normalized[0];

  return Response.json({
    normalized,
    hasMessage: normalized.length > 0,
    fromPhone: firstMessage?.fromPhone ?? null,
    messageText: firstMessage?.messageText ?? null,
    messageId: firstMessage?.messageId ?? null,
    timestamp: firstMessage?.timestamp ?? null,
    source: firstMessage?.source ?? null,
  });
}
