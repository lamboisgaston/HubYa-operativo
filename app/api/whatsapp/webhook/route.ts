function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }

  return Response.json({ error: "Verificación inválida." }, { status: 403 });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const entradas = typeof payload === "object" && payload !== null && "entry" in payload && Array.isArray(payload.entry) ? payload.entry : [];
  const mensajes = entradas.flatMap((entry) => {
    const changes = typeof entry === "object" && entry !== null && "changes" in entry && Array.isArray(entry.changes) ? entry.changes : [];
    return changes.flatMap((change: Record<string, unknown>) => {
      const value = typeof change === "object" && change !== null && "value" in change ? change.value : null;
      const incoming = typeof value === "object" && value !== null && "messages" in value && Array.isArray(value.messages) ? value.messages : [];
      return incoming.map((mensaje: Record<string, unknown>) => {
        const text = typeof mensaje.text === "object" && mensaje.text !== null && "body" in mensaje.text ? mensaje.text as Record<string, unknown> : {};
        return {
          from: campoTexto(mensaje?.from),
          id: campoTexto(mensaje?.id),
          type: campoTexto(mensaje?.type),
          text: campoTexto(text.body),
          timestamp: campoTexto(mensaje.timestamp),
        };
      });
    });
  });

  console.info("WhatsApp webhook recibido", { mensajesRecibidos: mensajes.length, mensajes });
  return Response.json({ ok: true, mensajesRecibidos: mensajes.length });
}
