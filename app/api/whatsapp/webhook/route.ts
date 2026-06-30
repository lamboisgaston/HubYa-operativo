import { generateElIngenieroReply } from "@/lib/ai/elIngeniero";
import { normalizeIncomingMessages } from "@/lib/whatsapp/normalizeIncomingMessage";
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
  const payload = await request.json().catch(() => null);
  const messages = normalizeIncomingMessages(payload);

  for (const message of messages) {
    console.info("Mensaje WhatsApp recibido", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
      timestamp: message.timestamp,
    });

    const reply = await generateElIngenieroReply({
      message: message.messageText,
      fromPhone: message.fromPhone,
      source: message.source,
    });

    console.info("Respuesta generada por El Ingeniero", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
      needsHuman: reply.needsHuman,
    });

    const sendResult = await sendWhatsappMessage({ to: message.fromPhone, message: reply.reply });

    console.info("Respuesta enviada por WhatsApp", {
      fromPhone: message.fromPhone,
      messageId: message.messageId,
      ok: sendResult.ok,
      skipped: sendResult.skipped,
      status: sendResult.status,
    });
  }

  return Response.json({ ok: true, mensajesProcesados: messages.length });
}
