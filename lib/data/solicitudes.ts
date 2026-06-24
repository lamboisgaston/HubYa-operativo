import { mensajeErrorResend, obtenerRemitenteResend, obtenerReplyToResend } from "@/lib/email/resend";
import { getPublicStore, updatePublicStore, type Cliente } from "./hubs";

export type EstadoSolicitudHub = "pendiente" | "aprobada" | "rechazada";
export type DecisionSolicitudHub = "aprobada" | "rechazada";
export type SolicitudHub = {
  id: string;
  fecha: string;
  nombre: string;
  apellido?: string;
  whatsapp: string;
  email: string;
  direccion: string;
  barrio?: string;
  hubSolicitadoId: string;
  hubSolicitadoNombre: string;
  servicio: string;
  mensaje?: string;
  estado: EstadoSolicitudHub;
  origen: "web pública";
  createdAt: string;
  updatedAt: string;
  fechaRespuesta?: string;
  decision?: DecisionSolicitudHub;
  mailEnviado?: boolean;
  errorMail?: string;
  mensajeAdministrativo?: string;
  clienteId?: string;
};

export type ResultadoResponderSolicitudHub = {
  solicitud: SolicitudHub;
  clienteCreado: boolean;
  clienteExistente: boolean;
  mailEnviado: boolean;
  advertencia?: string;
  errorMail?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const ADVERTENCIA_CONFIG_EMAIL = "Solicitud actualizada, pero no se pudo enviar el mail porque falta configurar el servicio de correo.";
const ADVERTENCIA_SIN_EMAIL = "Solicitud actualizada, pero no se envió mail porque no tiene email cargado.";

export async function getSolicitudesHub() {
  return (await getPublicStore()).solicitudes as SolicitudHub[];
}

export async function createSolicitudHub(input: Omit<SolicitudHub, "id" | "fecha" | "estado" | "origen" | "createdAt" | "updatedAt">) {
  const timestamp = new Date().toISOString();
  const solicitud: SolicitudHub = { id: `solicitud-${Date.now()}`, fecha: timestamp, estado: "pendiente", origen: "web pública", createdAt: timestamp, updatedAt: timestamp, ...input };
  await updatePublicStore((store) => {
    const clienteExistente = store.clientes.find((cliente) => cliente.hubId === solicitud.hubSolicitadoId && ((cliente.email && cliente.email === solicitud.email) || (cliente.whatsapp && cliente.whatsapp === solicitud.whatsapp)));
    const clienteId = clienteExistente?.id || `cliente-${Date.now()}`;
    const solicitudConCliente = { ...solicitud, clienteId };
    const clientes = clienteExistente
      ? store.clientes.map((cliente) => cliente.id === clienteExistente.id ? { ...cliente, estado: cliente.estado === "inactivo" ? "pendiente_aprobacion" as const : cliente.estado, updatedAt: timestamp } : cliente)
      : [
          { id: clienteId, hubId: solicitud.hubSolicitadoId, estado: "pendiente_aprobacion" as const, createdAt: timestamp, updatedAt: timestamp, nombre: nombreCompleto(solicitud), email: solicitud.email, whatsapp: solicitud.whatsapp, referencia: solicitud.direccion || solicitud.barrio || "Solicita sumarse", tarifaCliente: "sin_tarifa" as const, tipoDestino: "cliente" as const },
          ...store.clientes,
        ];
    return { ...store, clientes, solicitudes: [solicitudConCliente, ...(store.solicitudes as SolicitudHub[])] };
  });
  return solicitud;
}

function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function escaparHtml(valor: string) {
  return valor.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function nombreCompleto(solicitud: SolicitudHub) {
  return [solicitud.nombre, solicitud.apellido].filter(Boolean).join(" ").trim() || "cliente";
}

function contenidoMail(solicitud: SolicitudHub, decision: DecisionSolicitudHub, mensajeOpcional: string) {
  const nombre = nombreCompleto(solicitud);
  const hub = solicitud.hubSolicitadoNombre;
  const lineas = decision === "aprobada"
    ? [
        `Hola ${nombre},`,
        "",
        `Te informamos que tu solicitud para sumarte a ${hub} fue aprobada.`,
        "",
        "Desde HUBYA vamos a tener en cuenta tus datos para la organización operativa del Hub correspondiente.",
        "",
        "Próximamente podremos comunicarnos con vos para coordinar detalles del servicio, frecuencia y próximas acciones.",
      ]
    : [
        `Hola ${nombre},`,
        "",
        `Te informamos que por el momento tu solicitud para sumarte a ${hub} no fue aprobada.`,
        "",
        "Esto puede deberse a disponibilidad operativa, zona de cobertura, cupos actuales del Hub o criterios internos de organización.",
        "",
        "Dejamos tus datos registrados para futuras evaluaciones.",
      ];

  if (mensajeOpcional) lineas.push("", "Mensaje administrativo:", mensajeOpcional);
  lineas.push("", "Saludos,", "Equipo HUBYA");
  const text = lineas.join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:680px;margin:0 auto;padding:24px;white-space:pre-line;font-size:14px;line-height:1.5;">${escaparHtml(text)}</div></body></html>`;
  return { subject: decision === "aprobada" ? "Solicitud aprobada — HUBYA" : "Respuesta a tu solicitud — HUBYA", text, html };
}

async function enviarMailSolicitud(solicitud: SolicitudHub, decision: DecisionSolicitudHub, mensajeOpcional: string) {
  const email = campoTexto(solicitud.email);
  if (!email) return { enviado: false, error: ADVERTENCIA_SIN_EMAIL, advertencia: ADVERTENCIA_SIN_EMAIL };

  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFrom = obtenerRemitenteResend();
  const replyTo = obtenerReplyToResend();
  if (!resendApiKey) return { enviado: false, error: ADVERTENCIA_CONFIG_EMAIL, advertencia: ADVERTENCIA_CONFIG_EMAIL };

  const mail = contenidoMail(solicitud, decision, mensajeOpcional);
  const respuesta = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: mailFrom, reply_to: replyTo, to: [email], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  const data = await respuesta.json().catch(() => null);
  if (!respuesta.ok) return { enviado: false, error: mensajeErrorResend(data) };
  return { enviado: true, error: undefined };
}

export async function responderSolicitudHub(id: string, decision: DecisionSolicitudHub, mensajeOpcional = ""): Promise<ResultadoResponderSolicitudHub | null> {
  const mensajeAdministrativo = campoTexto(mensajeOpcional);
  let solicitudRespondida: SolicitudHub | null = null;
  let clienteCreado = false;
  let clienteExistente = false;

  await updatePublicStore((store) => {
    const timestamp = new Date().toISOString();
    const solicitudes = (store.solicitudes as SolicitudHub[]).map((solicitud) => {
      if (solicitud.id !== id) return solicitud;
      const clienteYaCreado = Boolean(solicitud.clienteId) || store.clientes.some((cliente) => cliente.hubId === solicitud.hubSolicitadoId && (cliente.email && cliente.email === solicitud.email || cliente.whatsapp && cliente.whatsapp === solicitud.whatsapp));
      let clienteId = solicitud.clienteId;
      if (decision === "aprobada" && !clienteYaCreado) {
        const nuevo: Cliente = { id: `cliente-${Date.now()}`, hubId: solicitud.hubSolicitadoId, estado: "activo", createdAt: timestamp, updatedAt: timestamp, nombre: nombreCompleto(solicitud), email: solicitud.email, whatsapp: solicitud.whatsapp, referencia: solicitud.direccion || solicitud.barrio || "Solicitud web", tarifaCliente: "sin_tarifa", tipoDestino: "cliente" };
        store.clientes = [nuevo, ...store.clientes];
        clienteId = nuevo.id;
        clienteCreado = true;
      } else if (decision === "aprobada") {
        clienteExistente = true;
        if (decision === "aprobada" && clienteYaCreado) {
          store.clientes = store.clientes.map((cliente) => cliente.id === clienteId || (cliente.hubId === solicitud.hubSolicitadoId && ((cliente.email && cliente.email === solicitud.email) || (cliente.whatsapp && cliente.whatsapp === solicitud.whatsapp))) ? { ...cliente, estado: "activo", updatedAt: timestamp } : cliente);
        }
      }
      solicitudRespondida = { ...solicitud, estado: decision, decision, fechaRespuesta: timestamp, updatedAt: timestamp, mailEnviado: false, errorMail: undefined, mensajeAdministrativo: mensajeAdministrativo || undefined, clienteId };
      return solicitudRespondida;
    });
    return { ...store, solicitudes };
  });

  if (!solicitudRespondida) return null;

  const resultadoMail = await enviarMailSolicitud(solicitudRespondida, decision, mensajeAdministrativo);
  let solicitudFinal: SolicitudHub | null = null;
  await updatePublicStore((store) => ({ ...store, solicitudes: (store.solicitudes as SolicitudHub[]).map((solicitud) => solicitud.id === id ? (solicitudFinal = { ...solicitud, mailEnviado: resultadoMail.enviado, errorMail: resultadoMail.error, updatedAt: new Date().toISOString() }) : solicitud) }));

  return { solicitud: solicitudFinal || solicitudRespondida, clienteCreado, clienteExistente, mailEnviado: resultadoMail.enviado, advertencia: resultadoMail.advertencia, errorMail: resultadoMail.error };
}

export async function approveSolicitudHub(id: string) {
  return responderSolicitudHub(id, "aprobada");
}

export async function rejectSolicitudHub(id: string) {
  return responderSolicitudHub(id, "rechazada");
}
