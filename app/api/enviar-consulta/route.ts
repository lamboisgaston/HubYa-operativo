const RESEND_API_URL = "https://api.resend.com/emails";

type DestinatarioConsulta = {
  nombre?: string;
  email?: string;
  links?: Record<string, string>;
};

type EnviarConsultaPayload = {
  hub?: string;
  pregunta?: string;
  destinatarios?: DestinatarioConsulta[];
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

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function armarHtml(nombre: string, hub: string, pregunta: string, links: Record<string, string>) {
  const botones = Object.entries(links).map(([opcion, url]) => `<a href="${escaparHtml(url)}" style="display:inline-block;margin:0 8px 8px 0;border-radius:12px;background:#1f2a1d;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:800;">${escaparHtml(opcion)}</a>`).join("");

  return `<!doctype html><html><body style="margin:0;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:680px;margin:0 auto;padding:24px;"><p style="margin:0 0 14px;font-size:14px;line-height:1.5;">Hola ${escaparHtml(nombre || "cliente")},</p><p style="margin:0 0 18px;font-size:14px;line-height:1.5;">Desde HubYa queremos confirmar la planificación del ${escaparHtml(hub)}.</p><p style="margin:0 0 18px;font-size:18px;line-height:1.45;font-weight:800;">${escaparHtml(pregunta)}</p><div style="margin:0 0 18px;">${botones}</div><p style="margin:0 0 18px;font-size:14px;line-height:1.5;">Tu respuesta nos ayuda a organizar mejor la demanda, el personal, los horarios y la frecuencia del Hub.</p><p style="margin:0;font-size:14px;line-height:1.5;">Saludos,<br/>HubYa</p></div></body></html>`;
}

function armarTexto(nombre: string, hub: string, pregunta: string, links: Record<string, string>) {
  return [`Hola ${nombre || "cliente"},`, "", `Desde HubYa queremos confirmar la planificación del ${hub}.`, "", pregunta, "", ...Object.entries(links).map(([opcion, url]) => `${opcion}: ${url}`), "", "Tu respuesta nos ayuda a organizar mejor la demanda, el personal, los horarios y la frecuencia del Hub.", "", "Saludos,", "HubYa"].join("\n");
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFrom = process.env.MAIL_FROM;

  if (!resendApiKey) return Response.json({ error: "Falta configurar RESEND_API_KEY." }, { status: 500 });
  if (!mailFrom) return Response.json({ error: "Falta configurar MAIL_FROM." }, { status: 500 });

  let payload: EnviarConsultaPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const hub = campoTexto(payload.hub);
  const pregunta = campoTexto(payload.pregunta);
  const destinatarios = Array.isArray(payload.destinatarios) ? payload.destinatarios : [];
  if (!hub || !pregunta) return Response.json({ error: "Faltan Hub o pregunta." }, { status: 400 });
  if (destinatarios.length === 0) return Response.json({ error: "Debe seleccionar al menos un destinatario." }, { status: 400 });
  if (destinatarios.some((destinatario) => !emailValido(campoTexto(destinatario.email)))) return Response.json({ error: "Hay destinatarios sin email válido." }, { status: 400 });

  const resultados = [];
  for (const destinatario of destinatarios) {
    const nombre = campoTexto(destinatario.nombre);
    const email = campoTexto(destinatario.email);
    const links = destinatario.links || {};
    const respuesta = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom, to: [email], subject: `Consulta HubYa — ${hub}`, html: armarHtml(nombre, hub, pregunta, links), text: armarTexto(nombre, hub, pregunta, links) }),
    });
    const data = await respuesta.json().catch(() => null);
    resultados.push({ email, ok: respuesta.ok, id: data?.id ?? null, error: respuesta.ok ? null : (typeof data?.message === "string" ? data.message : "Resend rechazó el envío.") });
  }

  const errores = resultados.filter((resultado) => !resultado.ok);
  if (errores.length > 0) return Response.json({ ok: false, enviados: resultados.length - errores.length, errores }, { status: 502 });
  return Response.json({ ok: true, enviados: resultados.length, resultados });
}
