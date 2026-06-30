import { generateElIngenieroReply } from "@/lib/ai/elIngeniero";
import { getWhatsappPayloadDiagnostics, normalizeIncomingMessages } from "@/lib/whatsapp/normalizeIncomingMessage";
import { sendWhatsappMessage } from "@/lib/whatsapp/sendWhatsappMessage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return Response.json({ error: "Verificación inválida." }, { status: 403 });
}

export async function POST(request: Request) {
  const receivedAt = new Date().toISOString();
  const payload = await request.json().catch(() => null);
  const diagnostics = getWhatsappPayloadDiagnostics(payload);
  const messages = normalizeIncomingMessages(payload);

  console.info("[WHATSAPP_WEBHOOK] POST recibido", {
    timestamp: receivedAt,
    object: diagnostics.object,
    entryCount: diagnostics.entryCount,
    hasChanges: diagnostics.hasChanges,
    hasMessages: diagnostics.hasMessages,
    hasContacts: diagnostics.hasContacts,
    messagesCount: diagnostics.messagesCount,
    contactsCount: diagnostics.contactsCount,
    phoneNumberId: diagnostics.phoneNumberId,
    normalizedMessagesCount: messages.length,
    firstFromPhone: messages[0]?.fromPhone,
    firstMessageText: messages[0]?.messageText,
    firstMessageId: messages[0]?.messageId,
  });

  if (messages.length === 0) {
    console.info("[WHATSAPP_WEBHOOK] Mensaje ignorado", {
      reason: diagnostics.hasMessages ? "No hay texto válido para responder." : "El payload no incluye messages.",
      timestamp: receivedAt,
      object: diagnostics.object,
      phoneNumberId: diagnostics.phoneNumberId,
    });
  }

  for (const message of messages) {
    console.info("[WHATSAPP_WEBHOOK] Mensaje WhatsApp recibido", {
      fromPhone: message.fromPhone,
      messageText: message.messageText,
      messageId: message.messageId,
      timestamp: message.timestamp,
      source: message.source,
      phoneNumberId: diagnostics.phoneNumberId,
    });

    const reply = await generateElIngenieroReply({
      message: message.messageText,
      fromPhone: message.fromPhone,
      source: message.source,
    });

    console.info("[WHATSAPP_WEBHOOK] Respuesta generada por El Ingeniero", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
      needsHuman: reply.needsHuman,
    });

    console.info("[WHATSAPP_WEBHOOK] Intentando enviar respuesta por WhatsApp", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
    });

    const sendResult = await sendWhatsappMessage({ to: message.fromPhone, message: reply.reply });

    console.info("[WHATSAPP_WEBHOOK] Resultado envío WhatsApp", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
      ok: sendResult.ok,
      skipped: sendResult.skipped,
      status: sendResult.status,
      error: sendResult.error,
    });
  }

  return Response.json({ ok: true, mensajesProcesados: messages.length });
}
