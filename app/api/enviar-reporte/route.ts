const RESEND_API_URL = "https://api.resend.com/emails";

type EnviarReportePayload = {
  emailDestino?: string;
  nombreCliente?: string;
  hub?: string;
  fecha?: string;
  asunto?: string;
  cuerpoMail?: string;
  reporteHtml?: string;
  reporteTexto?: string;
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

function armarHtml(cuerpoMail: string, reporteHtml: string, reporteTexto: string) {
  const reporte = reporteHtml || `<pre style="margin:0;white-space:pre-wrap;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;color:#182018;">${escaparHtml(reporteTexto)}</pre>`;

  return `<!doctype html><html><body style="margin:0;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:760px;margin:0 auto;padding:24px;"><p style="margin:0 0 18px;white-space:pre-line;font-size:14px;line-height:1.5;">${escaparHtml(cuerpoMail)}</p>${reporte}</div></body></html>`;
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

  let payload: EnviarReportePayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const emailDestino = campoTexto(payload.emailDestino);
  const nombreCliente = campoTexto(payload.nombreCliente);
  const hub = campoTexto(payload.hub);
  const fecha = campoTexto(payload.fecha);
  const asunto = campoTexto(payload.asunto) || `Reporte diario HubYa — ${hub} — ${fecha}`;
  const cuerpoMail = campoTexto(payload.cuerpoMail);
  const reporteHtml = campoTexto(payload.reporteHtml);
  const reporteTexto = campoTexto(payload.reporteTexto);

  if (!emailDestino) {
    return Response.json({ error: "El cliente seleccionado no tiene email." }, { status: 400 });
  }

  if (!nombreCliente || !hub || !fecha || !cuerpoMail || (!reporteHtml && !reporteTexto)) {
    return Response.json({ error: "Faltan datos obligatorios para enviar el reporte." }, { status: 400 });
  }

  const respuesta = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [emailDestino],
      subject: asunto,
      html: armarHtml(cuerpoMail, reporteHtml, reporteTexto),
      text: `${cuerpoMail}\n\n${reporteTexto}`,
    }),
  });

  const data = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = typeof data?.message === "string" ? data.message : "Resend rechazó el envío.";
    return Response.json({ error }, { status: respuesta.status });
  }

  return Response.json({ ok: true, id: data?.id ?? null });
}
