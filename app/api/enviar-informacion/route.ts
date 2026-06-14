const RESEND_API_URL = "https://api.resend.com/emails";

type DestinatarioInformacion = {
  nombre?: string;
  email?: string;
};

type EnviarInformacionPayload = {
  hub?: string;
  asunto?: string;
  mensaje?: string;
  nota?: string;
  destinatarios?: DestinatarioInformacion[];
};

function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function armarHtml(nombre: string, hub: string, mensaje: string, nota: string) {
  const saludo = nombre ? `Hola ${escaparHtml(nombre)},` : "Hola,";
  const notaHtml = nota ? `<div style="margin-top:18px;border-top:1px solid #d8dfd1;padding-top:12px;"><strong>Nota:</strong><p style="margin:6px 0 0;white-space:pre-line;">${escaparHtml(nota)}</p></div>` : "";

  return `<!doctype html><html><body style="margin:0;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:680px;margin:0 auto;padding:24px;"><p style="margin:0 0 14px;font-size:14px;line-height:1.5;">${saludo}</p><p style="margin:0 0 18px;white-space:pre-line;font-size:14px;line-height:1.5;">${escaparHtml(mensaje)}</p>${notaHtml}<p style="margin:22px 0 0;color:#66745c;font-size:12px;font-weight:700;">HubYa · ${escaparHtml(hub)}</p></div></body></html>`;
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFrom = process.env.MAIL_FROM;

  if (!resendApiKey) {
    return Response.json({ error: "Falta configurar RESEND_API_KEY." }, { status: 500 });
  }

  if (!mailFrom) {
    return Response.json({ error: "Falta configurar MAIL_FROM." }, { status: 500 });
  }

  let payload: EnviarInformacionPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const hub = campoTexto(payload.hub);
  const asunto = campoTexto(payload.asunto);
  const mensaje = campoTexto(payload.mensaje);
  const nota = campoTexto(payload.nota);
  const destinatarios = Array.isArray(payload.destinatarios) ? payload.destinatarios : [];

  if (!hub) return Response.json({ error: "Debe seleccionar un Hub." }, { status: 400 });
  if (!asunto) return Response.json({ error: "Debe escribir un asunto." }, { status: 400 });
  if (!mensaje) return Response.json({ error: "Debe escribir un mensaje." }, { status: 400 });
  if (destinatarios.length === 0) return Response.json({ error: "Debe seleccionar al menos un destinatario." }, { status: 400 });

  const destinatariosSinEmail = destinatarios.filter((destinatario) => !campoTexto(destinatario.email));
  if (destinatariosSinEmail.length > 0) {
    return Response.json({ error: "Hay destinatarios seleccionados sin email." }, { status: 400 });
  }

  const destinatariosInvalidos = destinatarios.filter((destinatario) => !emailValido(campoTexto(destinatario.email)));
  if (destinatariosInvalidos.length > 0) {
    return Response.json({ error: "Hay destinatarios seleccionados con email inválido." }, { status: 400 });
  }

  const resultados = [];
  for (const destinatario of destinatarios) {
    const nombre = campoTexto(destinatario.nombre);
    const email = campoTexto(destinatario.email);
    const respuesta = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [email],
        subject: asunto,
        html: armarHtml(nombre, hub, mensaje, nota),
        text: `${nombre ? `Hola ${nombre},\n\n` : "Hola,\n\n"}${mensaje}${nota ? `\n\nNota: ${nota}` : ""}\n\nHubYa · ${hub}`,
      }),
    });

    const data = await respuesta.json().catch(() => null);
    resultados.push({ email, ok: respuesta.ok, id: data?.id ?? null, error: respuesta.ok ? null : (typeof data?.message === "string" ? data.message : "Resend rechazó el envío.") });
  }

  const errores = resultados.filter((resultado) => !resultado.ok);
  if (errores.length > 0) {
    return Response.json({ ok: false, enviados: resultados.length - errores.length, errores }, { status: 502 });
  }

  return Response.json({ ok: true, enviados: resultados.length, resultados });
}
