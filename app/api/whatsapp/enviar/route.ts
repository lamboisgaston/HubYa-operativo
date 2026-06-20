const WHATSAPP_GRAPH_VERSION = "v20.0";

type EnviarWhatsAppPayload = {
  telefonoDestino?: string;
  nombreCliente?: string;
  hub?: string;
  mensaje?: string;
};

function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarTelefono(valor: string) {
  return valor.replace(/[^\d]/g, "");
}

export async function POST(request: Request) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) return Response.json({ error: "Falta configurar WHATSAPP_ACCESS_TOKEN." }, { status: 500 });
  if (!phoneNumberId) return Response.json({ error: "Falta configurar WHATSAPP_PHONE_NUMBER_ID." }, { status: 500 });

  let payload: EnviarWhatsAppPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const telefonoDestino = normalizarTelefono(campoTexto(payload.telefonoDestino));
  const nombreCliente = campoTexto(payload.nombreCliente);
  const hub = campoTexto(payload.hub);
  const mensaje = campoTexto(payload.mensaje);

  if (!telefonoDestino) return Response.json({ error: "Debe indicar telefonoDestino." }, { status: 400 });
  if (!nombreCliente) return Response.json({ error: "Debe indicar nombreCliente." }, { status: 400 });
  if (!hub) return Response.json({ error: "Debe indicar hub." }, { status: 400 });
  if (!mensaje) return Response.json({ error: "Debe indicar mensaje." }, { status: 400 });

  const texto = `Hola ${nombreCliente}.\n\n${mensaje}\n\nHUBYA · ${hub}`;
  const respuesta = await fetch(`https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telefonoDestino,
      type: "text",
      text: { preview_url: false, body: texto },
    }),
  });

  const data = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = typeof data?.error?.message === "string" ? data.error.message : "WhatsApp Cloud API rechazó el envío.";
    return Response.json({ error, detalle: data }, { status: respuesta.status });
  }

  return Response.json({ ok: true, id: data?.messages?.[0]?.id ?? null, telefonoDestino });
}
