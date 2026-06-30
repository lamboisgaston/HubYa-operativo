import { sendWhatsappMessage } from "@/lib/whatsapp/sendWhatsappMessage";

function textField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const configuredSecret = process.env.WHATSAPP_DEBUG_SECRET;
  const providedSecret = request.headers.get("x-debug-secret")?.trim();

  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const to = textField(body?.to);
  const message = textField(body?.message);

  if (!to || !message) {
    return Response.json({ ok: false, error: "Falta to o message." }, { status: 400 });
  }

  const result = await sendWhatsappMessage({ to, message });
  return Response.json({ ok: result.ok, status: result.status, skipped: result.skipped, messageId: result.messageId ?? null, error: result.error });
}
