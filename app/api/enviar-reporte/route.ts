import { mensajeErrorResend, obtenerRemitenteResend, obtenerReplyToResend } from "@/lib/email/resend";
import { getPublicStore } from "@/lib/data/hubs";
import { crearTokenRespuestaParametro, type ParameterConsultationTokenPayload, type ParameterResponseChoice, type ParameterValueType } from "@/lib/data/parameterResponses";

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
  hubId?: string;
  reportId?: string;
  contactId?: string;
  baseUrl?: string;
  incluirConsultaParametros?: boolean;
};

function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}


const respuestasParametro: Array<{ key: ParameterResponseChoice; label: string }> = [
  { key: "confirmar_valor", label: "Confirmar valor" },
  { key: "sugerir_otro_valor", label: "Sugerir otro valor" },
  { key: "sugerir_subir", label: "Sugerir subir" },
  { key: "sugerir_bajar", label: "Sugerir bajar" },
  { key: "necesito_aclaracion", label: "Necesito aclaración" },
];

function formatoMoneda(valor: number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor || 0); }
function baseUrl(valor?: string) { return (campoTexto(valor) || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""); }

type ParametroConsultable = { key: string; label: string; value: number; type: ParameterValueType; formatted: string };

const MENSAJE_SIN_GASTOS_REALES = "No se registraron gastos adicionales en este reporte.";
const TEXTO_ACLARATORIO_PARAMETROS = "Estos valores no son gastos del día. Son referencias que utiliza el sistema para organizar el funcionamiento del Hub.";

function parametrosPrincipalesJardinerosYa(hub: Awaited<ReturnType<typeof getPublicStore>>["hubs"][number] | undefined): ParametroConsultable[] {
  if (!hub || hub.moduloOperativo !== "jardinerosya") return [];
  const p = hub.parametrosOperativos?.jardinerosYa;
  if (!p) return [];
  const naftaAceite = Number(p.nafta || 0) + Number(p.aceite || 0);
  return [
    { key: "jornal_6_horas", label: "Jornal 6 horas efectivas", value: Number(p.valorHoraTrabajo || 0) * 6, type: "money" as const, formatted: formatoMoneda(Number(p.valorHoraTrabajo || 0) * 6) },
    { key: "traslado", label: "Traslado", value: Number(p.traslado || 0), type: "money" as const, formatted: formatoMoneda(Number(p.traslado || 0)) },
    { key: "nafta_aceite", label: "Nafta + aceite", value: naftaAceite, type: "money" as const, formatted: formatoMoneda(naftaAceite) },
    { key: "comision_capataz", label: "Comisión capataz", value: Number(p.comisionResponsableCuadrillaPorcentaje || 0), type: "percent" as const, formatted: `${Number(p.comisionResponsableCuadrillaPorcentaje || 0)}%` },
    { key: "hora_maquina", label: "Hora de máquina", value: Number(p.valorHoraCortadoraCesped || 0), type: "money" as const, formatted: `${formatoMoneda(Number(p.valorHoraCortadoraCesped || 0))}/h` },
  ].filter((parametro) => parametro.value > 0);
}

async function armarConsultaParametros(payload: EnviarReportePayload) {
  if (!payload.incluirConsultaParametros) return { html: "", text: "" };
  const store = await getPublicStore();
  const hub = store.hubs.find((item) => item.id === campoTexto(payload.hubId) || item.nombre === campoTexto(payload.hub));
  const parametros = parametrosPrincipalesJardinerosYa(hub);
  if (!hub || hub.moduloOperativo !== "jardinerosya") return { html: "", text: "" };
  if (parametros.length === 0) return { html: `<section style="margin-top:16px;border:1px solid #d8dfd1;background:#f8faf5;padding:14px;border-radius:16px;"><h2 style="margin:0 0 8px;font-size:16px;">Parámetros de referencia del Hub</h2><p style="margin:0 0 8px;color:#4f5f47;line-height:1.5;">${escaparHtml(TEXTO_ACLARATORIO_PARAMETROS)}</p><p style="margin:0;">Este Hub todavía no tiene parámetros operativos configurados.</p></section>`, text: `\n\nPARÁMETROS DE REFERENCIA DEL HUB\n${TEXTO_ACLARATORIO_PARAMETROS}\nEste Hub todavía no tiene parámetros operativos configurados.` };
  const reportId = campoTexto(payload.reportId) || `reporte-${Date.now()}`;
  const contactId = campoTexto(payload.contactId) || campoTexto(payload.emailDestino);
  const base = baseUrl(payload.baseUrl);
  const cards = parametros.map((parametro) => {
    const links = respuestasParametro.map((opcion) => {
      const tokenPayload: ParameterConsultationTokenPayload = { hubId: hub.id, reportId, contactId, parameterKey: parametro.key, parameterLabel: parametro.label, currentValue: parametro.value, currentValueType: parametro.type, responseType: opcion.key, createdFor: new Date().toISOString() };
      const href = `${base}/parametros/${encodeURIComponent(crearTokenRespuestaParametro(tokenPayload))}`;
      return `<a href="${href}" style="display:inline-block;margin:4px 4px 0 0;background:#1f2a1d;color:#fff;padding:9px 11px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800;">${escaparHtml(opcion.label)}</a>`;
    }).join("");
    return `<div style="margin-top:10px;border:1px solid #d8dfd1;background:#fff;padding:12px;border-radius:14px;"><h3 style="margin:0 0 6px;font-size:15px;">${escaparHtml(parametro.label)}</h3><p style="margin:0 0 8px;color:#66745c;">Valor actual de referencia: <strong style="color:#1f2a1d;">${escaparHtml(parametro.formatted)}</strong></p><p style="margin:0 0 4px;font-weight:700;">¿Qué opinás de este valor?</p>${links}</div>`;
  }).join("");
  const html = `<section style="margin-top:16px;border:1px solid #9aa78f;background:#fbfdf8;padding:14px;border-radius:16px;"><h2 style="margin:0 0 8px;font-size:16px;">Parámetros de referencia del Hub</h2><p style="margin:0;color:#4f5f47;line-height:1.5;">${escaparHtml(TEXTO_ACLARATORIO_PARAMETROS)} Si considerás que alguno debería ajustarse, podés ayudarnos dejando tu sugerencia. El valor no cambia automáticamente: primero será revisado por el equipo operativo.</p>${cards}</section>`;
  const text = `\n\nPARÁMETROS DE REFERENCIA DEL HUB\n${TEXTO_ACLARATORIO_PARAMETROS} Respondé desde los botones del mail; el equipo operativo revisará las sugerencias antes de cambiar cualquier parámetro.\n${parametros.map((p) => `${p.label}: ${p.formatted}`).join("\n")}`;
  return { html, text };
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function armarHtml(cuerpoMail: string, reporteHtml: string, reporteTexto: string, consultaHtml = "") {
  const reporte = reporteHtml || `<section style="border:1px solid #9aa78f;background:#ffffff;padding:16px;"><h2 style="margin:0 0 10px;font-size:18px;">Reporte formal del Hub</h2><pre style="margin:0;white-space:pre-wrap;font:12px/1.5 Arial,Helvetica,sans-serif;color:#182018;">${escaparHtml(reporteTexto)}</pre></section>`;
  const introduccion = reporteHtml ? "" : `<section style="margin-bottom:16px;border:1px solid #d8dfd1;background:#ffffff;padding:14px;"><p style="margin:0;white-space:pre-line;font-size:14px;line-height:1.5;">${escaparHtml(cuerpoMail)}</p></section>`;
  // Si viene reporteHtml desde la vista previa, se envía el mismo documento formal; queda listo para reutilizarlo como fuente de PDF/adjunto en una segunda etapa.
  return `<!doctype html><html><body style="margin:0;background:#f6f8f3;color:#182018;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:820px;margin:0 auto;padding:24px;">${introduccion}${reporte}${consultaHtml}</div></body></html>`;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFrom = obtenerRemitenteResend();
  const replyTo = obtenerReplyToResend();

  if (!resendApiKey) {
    return Response.json({ error: "Falta configurar RESEND_API_KEY.", from: mailFrom, reply_to: replyTo }, { status: 500 });
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

  const consulta = await armarConsultaParametros(payload);

  const respuesta = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom,
      reply_to: replyTo,
      to: [emailDestino],
      subject: asunto,
      html: armarHtml(cuerpoMail, reporteHtml, reporteTexto, consulta.html),
      text: `REPORTE DEL DÍA\n${cuerpoMail}\n\nGASTOS REALES DEL DÍA\n${reporteTexto || MENSAJE_SIN_GASTOS_REALES}${consulta.text}`,
    }),
  });

  const data = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = mensajeErrorResend(data);
    return Response.json({ error, from: mailFrom, reply_to: replyTo, providerResponse: data }, { status: respuesta.status });
  }

  return Response.json({ ok: true, id: data?.id ?? null, providerMessageId: data?.id ?? null, resendId: data?.id ?? null, from: mailFrom, reply_to: replyTo });
}
