import { mensajeErrorResend, obtenerRemitenteResend, obtenerReplyToResend } from "@/lib/email/resend";
import { getPublicStore, updatePublicStore, type Cliente, type Hub } from "@/lib/data/hubs";

export type CanalMensajeOperativo = "email" | "whatsapp" | "manual" | "sistema";
export type EstadoDestinatarioMensaje = "pendiente" | "enviado" | "enviado a proveedor" | "entregado" | "respondido" | "sin respuesta" | "error" | "email inválido" | "reintentado" | "archivado";
export type EstadoMensajeOperativo = "borrador" | "enviado" | "enviado a proveedor" | "respondido" | "sin respuesta" | "error" | "parcial" | "archivado";
export type EstadoRespuestaOperativa = "nueva" | "leída" | "respondida" | "pendiente" | "archivada";

export type OpcionRespuestaMensaje = { id: string; texto: string };
export type TokenRespuestaMensaje = { token: string; opcionId: string; opcionTexto: string; clienteId: string; hubId: string; usado?: boolean; usadoEn?: string };
export type DestinatarioMensajeOperativo = { id: string; clienteId: string; nombre: string; email: string; whatsapp: string; hubId: string; hubNombre: string; estado: EstadoDestinatarioMensaje; error?: string; errorMessage?: string; providerMessageId?: string; resendId?: string; createdAt?: string; sentAt?: string; attemptedAt?: string; respondedAt?: string; respuestaElegida?: string; tokensRespuesta?: TokenRespuestaMensaje[]; historial?: Array<{ fecha: string; estado: EstadoDestinatarioMensaje; detalle?: string; providerMessageId?: string }> };
export type MensajeOperativo = { id: string; fecha: string; asunto: string; titulo?: string; preguntaEncuesta?: string; mensaje: string; remitenteUsado?: string; replyToUsado?: string; notaInterna?: string; acercaDeHubYa?: string; opcionesRespuesta: OpcionRespuestaMensaje[]; hubsIncluidos: string[]; usuariosIncluidos: string[]; cantidadDestinatarios: number; canal: CanalMensajeOperativo; estado: EstadoMensajeOperativo; destinatarios: DestinatarioMensajeOperativo[]; respuestasAsociadas: string[]; envioEmail?: { intentados: number; enviados: number; errores: string[]; validos?: number; invalidos?: number; pendientes?: number; fallidos?: number; respondidos?: number; providerAceptados?: number }; createdAt: string; updatedAt: string };
export type RespuestaOperativa = { id: string; mensajeId?: string; clienteId: string; hubId: string; fecha: string; texto: string; opcionId?: string; opcionTexto?: string; canal: CanalMensajeOperativo; notaInterna?: string; estado: EstadoRespuestaOperativa; respuestasDelOperador: Array<{ id: string; texto: string; fecha: string; notaInterna?: string }>; createdAt: string; updatedAt: string };
export type MensajesResumen = { mensajes: MensajeOperativo[]; respuestas: RespuestaOperativa[]; hubs: Hub[]; contactos: Cliente[] };

type BaseStore = Omit<Awaited<ReturnType<typeof getPublicStore>>, "mensajes_operativos" | "respuestas_operativas">;
type StoreConMensajes = BaseStore & { mensajes_operativos: MensajeOperativo[]; respuestas_operativas: RespuestaOperativa[]; acerca_de_hubya?: string };

type CrearMensajeInput = { asunto: string; titulo?: string; preguntaEncuesta?: string; mensaje: string; notaInterna?: string; acercaDeHubYa?: string; alcance?: string; canal?: CanalMensajeOperativo; hubIds?: string[]; clienteIds?: string[]; opcionesRespuesta?: string[]; baseUrl?: string };
export type EnviarPruebaMensajeInput = { asunto: string; titulo?: string; preguntaEncuesta?: string; mensaje: string; emailPrueba: string; acercaDeHubYa?: string; opcionesRespuesta?: string[]; baseUrl?: string };
type CargarRespuestaInput = { clienteId: string; hubId: string; texto: string; mensajeId?: string; opcionTexto?: string; fecha?: string; notaInterna?: string; estado?: EstadoRespuestaOperativa; canal?: CanalMensajeOperativo };
type ActualizarRespuestaInput = { respuestaId: string; estado: EstadoRespuestaOperativa; notaInterna?: string; respuestaOperador?: string };

const RESEND_API_URL = "https://api.resend.com/emails";
const estadosRespuesta = new Set<EstadoRespuestaOperativa>(["nueva", "leída", "respondida", "pendiente", "archivada"]);
const canales = new Set<CanalMensajeOperativo>(["email", "whatsapp", "manual", "sistema"]);
const acercaDefault = "HubYa agrupa demanda por Hub, coordina información operativa y escucha respuestas para organizar próximos pasos.";

function texto(valor: unknown) { return typeof valor === "string" ? valor.trim() : ""; }
function uid(prefijo: string) { return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function tokenSeguro() { return `${Date.now().toString(36)}-${crypto.randomUUID()}`; }
function nombreHub(hubs: Hub[], hubId: string) { return hubs.find((hub) => hub.id === hubId)?.nombre || "Hub sin asignar"; }
function normalizarMensajes(base: unknown) {
  const store = base as StoreConMensajes;
  const mensajes = Array.isArray(store.mensajes_operativos) ? store.mensajes_operativos as MensajeOperativo[] : [];
  const respuestas = Array.isArray(store.respuestas_operativas) ? store.respuestas_operativas as RespuestaOperativa[] : [];
  store.mensajes_operativos = mensajes.map((m) => ({ ...m, opcionesRespuesta: Array.isArray(m.opcionesRespuesta) ? m.opcionesRespuesta : [], destinatarios: Array.isArray(m.destinatarios) ? m.destinatarios : [], respuestasAsociadas: Array.isArray(m.respuestasAsociadas) ? m.respuestasAsociadas : [] }));
  store.respuestas_operativas = respuestas.map((r) => ({ ...r, canal: r.canal || "manual", respuestasDelOperador: Array.isArray(r.respuestasDelOperador) ? r.respuestasDelOperador : [] }));
  store.acerca_de_hubya = texto(store.acerca_de_hubya) || acercaDefault;
  return store;
}
function aplicarVariables(plantilla: string, cliente: Cliente, hub: Hub | undefined) { const hoy = new Date().toLocaleDateString("es-AR"); return plantilla.replaceAll("{nombre}", cliente.nombre || "").replaceAll("{hub}", hub?.nombre || "").replaceAll("{zona}", hub?.zona || "").replaceAll("{fecha}", hoy).replaceAll("{servicio}", cliente.referencia || hub?.rama || ""); }
function htmlEscape(s: string) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c)); }
function linkRespuesta(baseUrl: string | undefined, token: string) { const base = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""); return `${base}/r/${encodeURIComponent(token)}`; }
export function emailValido(valor: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(valor)); }
function estadoGeneral(destinatarios: DestinatarioMensajeOperativo[], canal: CanalMensajeOperativo): EstadoMensajeOperativo { if (destinatarios.some((d) => d.estado === "respondido")) return "respondido"; if (destinatarios.length && destinatarios.every((d) => d.estado === "error" || d.estado === "email inválido")) return "error"; if (destinatarios.some((d) => d.estado === "error" || d.estado === "email inválido")) return "parcial"; if (canal === "email" && destinatarios.some((d) => d.estado === "enviado a proveedor" || d.estado === "enviado" || d.estado === "sin respuesta")) return "enviado a proveedor"; return "sin respuesta"; }

export async function getMensajesResumen(hubId?: string): Promise<MensajesResumen> { const store = normalizarMensajes(await getPublicStore()); const mensajes = store.mensajes_operativos.filter((m) => !hubId || m.hubsIncluidos.includes(hubId) || m.destinatarios.some((d) => d.hubId === hubId)); const respuestas = store.respuestas_operativas.filter((r) => !hubId || r.hubId === hubId); return { mensajes, respuestas, hubs: store.hubs, contactos: store.clientes.filter((c) => c.estado === "activo") }; }
export async function getAcercaDeHubYa() { const store = normalizarMensajes(await getPublicStore()); return store.acerca_de_hubya || acercaDefault; }

async function enviarEmailMensaje(mensaje: MensajeOperativo, cliente: Cliente, hub: Hub | undefined, destinatario: DestinatarioMensajeOperativo, baseUrl?: string): Promise<{ ok: true; providerMessageId?: string } | { ok: false; error: string }> {
  if (!cliente.email || mensaje.canal !== "email") return { ok: false, error: "Sin email o canal no email." };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "Falta configurar RESEND_API_KEY; el mensaje quedó preparado con links." };
  const cuerpo = aplicarVariables(mensaje.mensaje, cliente, hub);
  const acerca = mensaje.acercaDeHubYa || acercaDefault;
  const titulo = texto(mensaje.titulo);
  const pregunta = texto(mensaje.preguntaEncuesta);
  const botones = (destinatario.tokensRespuesta || []).map((t) => `<p><a href="${linkRespuesta(baseUrl, t.token)}" style="display:inline-block;background:#1f2a1d;color:#fff;padding:12px 16px;border-radius:12px;text-decoration:none;font-weight:800">${htmlEscape(t.opcionTexto)}</a></p>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#1f2a1d">${titulo ? `<h1>${htmlEscape(titulo)}</h1>` : ""}<p>${htmlEscape(cuerpo).replace(/\n/g, "<br>")}</p>${pregunta ? `<p style="font-weight:800">${htmlEscape(pregunta)}</p>` : ""}${botones}<hr><p style="font-size:12px;color:#66745c">${htmlEscape(acerca).replace(/\n/g, "<br>")}</p></div>`;
  const text = `${titulo ? `${titulo}\n\n` : ""}${cuerpo}\n\n${pregunta ? `${pregunta}\n` : ""}${(destinatario.tokensRespuesta || []).map((t) => `${t.opcionTexto}: ${linkRespuesta(baseUrl, t.token)}`).join("\n")}\n\n${acerca}`;
  const res = await fetch(RESEND_API_URL, { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: obtenerRemitenteResend(), reply_to: obtenerReplyToResend(), to: [cliente.email], subject: mensaje.asunto, html, text }) });
  const data = await res.json().catch(() => null);
  return res.ok ? { ok: true, providerMessageId: data?.id ? String(data.id) : undefined } : { ok: false, error: mensajeErrorResend(data) };
}

export async function crearMensajeOperativoDesdeInput(input: CrearMensajeInput) {
  const asunto = texto(input.asunto);
  const cuerpo = texto(input.mensaje);
  if (!asunto || !cuerpo) return { ok: false, message: "Completá asunto y mensaje." };

  const hubIds = new Set((input.hubIds || []).map(String));
  const clienteIds = new Set((input.clienteIds || []).map(String));
  const alcance = texto(input.alcance);
  const canal = canales.has(input.canal as CanalMensajeOperativo) ? input.canal as CanalMensajeOperativo : "manual";
  const timestamp = new Date().toISOString();
  let creado: MensajeOperativo | null = null;

  await updatePublicStore((base) => {
    const store = normalizarMensajes(base);
    if (input.acercaDeHubYa !== undefined) store.acerca_de_hubya = texto(input.acercaDeHubYa) || acercaDefault;
    const contactos = store.clientes.filter((c) => {
      if (c.estado !== "activo") return false;
      if (alcance === "todos") return hubIds.size === 0 || hubIds.has(c.hubId);
      return clienteIds.has(c.id) && (hubIds.size === 0 || hubIds.has(c.hubId));
    });
    if (contactos.length === 0) return store;
    const opcionesRespuesta = (input.opcionesRespuesta || []).map(texto).filter(Boolean).map((opcion) => ({ id: uid("opcion"), texto: opcion }));
    const esEncuesta = opcionesRespuesta.length > 0;
    if (esEncuesta && !texto(input.preguntaEncuesta)) return store;
    const hubsIncluidos = Array.from(new Set(contactos.map((c) => c.hubId).filter(Boolean)));
    const id = uid("envio");
    const remitenteUsado = obtenerRemitenteResend();
    const replyToUsado = obtenerReplyToResend();
    const destinatarios = contactos.map((c) => {
      const valido = emailValido(c.email);
      const estado: EstadoDestinatarioMensaje = canal === "email" ? (valido ? "pendiente" : "email inválido") : "sin respuesta";
      return { id: uid("destinatario"), clienteId: c.id, nombre: c.nombre, email: c.email, whatsapp: c.whatsapp, hubId: c.hubId, hubNombre: nombreHub(store.hubs, c.hubId), estado, errorMessage: valido || canal !== "email" ? undefined : "Email vacío o mal formado. No se intentó enviar.", createdAt: timestamp, historial: [{ fecha: timestamp, estado, detalle: estado === "email inválido" ? "No se intentó enviar: email inválido." : "Nuevo envío generado." }], tokensRespuesta: opcionesRespuesta.map((o) => ({ token: tokenSeguro(), opcionId: o.id, opcionTexto: o.texto, clienteId: c.id, hubId: c.hubId })) };
    });
    creado = { id, fecha: timestamp, asunto, titulo: texto(input.titulo) || undefined, preguntaEncuesta: texto(input.preguntaEncuesta) || undefined, mensaje: cuerpo, remitenteUsado, replyToUsado, notaInterna: texto(input.notaInterna) || undefined, acercaDeHubYa: texto(input.acercaDeHubYa) || store.acerca_de_hubya || acercaDefault, opcionesRespuesta, hubsIncluidos, usuariosIncluidos: contactos.map((c) => c.id), cantidadDestinatarios: contactos.length, canal, estado: "borrador", destinatarios, respuestasAsociadas: [], createdAt: timestamp, updatedAt: timestamp };
    store.mensajes_operativos = [creado, ...store.mensajes_operativos];
    return store;
  });

  if (!creado) return { ok: false, message: "Seleccioná al menos un Hub o usuario/contacto activo." };
  const creadoFinal = creado as MensajeOperativo;
  const resultados = new Map<string, Partial<DestinatarioMensajeOperativo>>();
  const errores: string[] = [];
  let enviados = 0;
  const store = normalizarMensajes(await getPublicStore());
  for (const destinatario of creadoFinal.destinatarios) {
    if (canal !== "email") continue;
    if (!emailValido(destinatario.email)) { errores.push(`${destinatario.nombre}: email inválido`); continue; }
    const cliente = store.clientes.find((c) => c.id === destinatario.clienteId);
    const hub = store.hubs.find((h) => h.id === destinatario.hubId);
    const intento = new Date().toISOString();
    if (!cliente) continue;
    const resultado = await enviarEmailMensaje(creadoFinal, cliente, hub, destinatario, input.baseUrl);
    if (resultado.ok) {
      enviados += 1;
      resultados.set(destinatario.id, { estado: "enviado a proveedor", providerMessageId: resultado.providerMessageId, resendId: resultado.providerMessageId, attemptedAt: intento, sentAt: intento, errorMessage: undefined });
    } else {
      const errorMessage = resultado.error || "Resend rechazó el envío.";
      errores.push(`${destinatario.nombre}: ${errorMessage}`);
      resultados.set(destinatario.id, { estado: "error", attemptedAt: intento, errorMessage, error: errorMessage });
    }
  }

  await updatePublicStore((base) => {
    const store = normalizarMensajes(base);
    store.mensajes_operativos = store.mensajes_operativos.map((m) => {
      if (m.id !== creadoFinal.id) return m;
      const destinatarios = m.destinatarios.map((d) => {
        const r = resultados.get(d.id);
        if (!r) return d;
        return { ...d, ...r, historial: [...(d.historial || []), { fecha: r.attemptedAt || new Date().toISOString(), estado: r.estado as EstadoDestinatarioMensaje, detalle: r.errorMessage || "Resend aceptó el mail. Enviado a proveedor; no es entrega confirmada.", providerMessageId: r.providerMessageId }] };
      });
      const validos = destinatarios.filter((d) => emailValido(d.email)).length;
      const invalidos = destinatarios.filter((d) => d.estado === "email inválido").length;
      const fallidos = destinatarios.filter((d) => d.estado === "error").length;
      const pendientes = destinatarios.filter((d) => d.estado === "pendiente" || d.estado === "sin respuesta" || d.estado === "enviado a proveedor" || d.estado === "enviado").length;
      const respondidos = destinatarios.filter((d) => d.estado === "respondido").length;
      return { ...m, estado: estadoGeneral(destinatarios, m.canal), envioEmail: { intentados: validos, enviados, providerAceptados: enviados, errores, validos, invalidos, fallidos, pendientes, respondidos }, destinatarios, updatedAt: new Date().toISOString() };
    });
    return store;
  });
  return { ok: true, message: `Nuevo envío generado (${creadoFinal.id}). Resend aceptó ${enviados}/${creadoFinal.destinatarios.filter((d) => emailValido(d.email)).length}. Inválidos: ${creadoFinal.destinatarios.filter((d) => !emailValido(d.email)).length}.`, mensaje: creadoFinal, errores };
}

export async function enviarPruebaMensajeDesdeInput(input: EnviarPruebaMensajeInput) {
  const asunto = texto(input.asunto);
  const cuerpo = texto(input.mensaje);
  const emailPrueba = texto(input.emailPrueba);
  if (!asunto || !cuerpo || !emailPrueba) return { ok: false, message: "Completá asunto, mensaje y email de prueba." };
  if (!emailValido(emailPrueba)) return { ok: false, message: "El email de prueba no tiene un formato válido.", error: "Email inválido." };
  const timestamp = new Date().toISOString();
  const cliente: Cliente = { id: "prueba", nombre: "Email de prueba", email: emailPrueba, whatsapp: "", hubId: "prueba", tipoDestino: "cliente", estado: "activo", createdAt: timestamp, updatedAt: timestamp };
  const opcionesRespuesta = (input.opcionesRespuesta || []).map(texto).filter(Boolean).map((opcion) => ({ id: uid("opcion-prueba"), texto: opcion }));
  const destinatario: DestinatarioMensajeOperativo = { id: uid("destinatario-prueba"), clienteId: cliente.id, nombre: cliente.nombre, email: cliente.email, whatsapp: "", hubId: cliente.hubId, hubNombre: "Prueba", estado: "pendiente", createdAt: timestamp, tokensRespuesta: opcionesRespuesta.map((o) => ({ token: tokenSeguro(), opcionId: o.id, opcionTexto: o.texto, clienteId: cliente.id, hubId: cliente.hubId })) };
  const mensaje: MensajeOperativo = { id: uid("prueba"), fecha: timestamp, asunto, titulo: texto(input.titulo) || undefined, preguntaEncuesta: texto(input.preguntaEncuesta) || undefined, mensaje: cuerpo, remitenteUsado: obtenerRemitenteResend(), replyToUsado: obtenerReplyToResend(), acercaDeHubYa: texto(input.acercaDeHubYa) || acercaDefault, opcionesRespuesta, hubsIncluidos: [], usuariosIncluidos: [cliente.id], cantidadDestinatarios: 1, canal: "email", estado: "borrador", destinatarios: [destinatario], respuestasAsociadas: [], createdAt: timestamp, updatedAt: timestamp };
  const resultado = await enviarEmailMensaje(mensaje, cliente, undefined, destinatario, input.baseUrl);
  return resultado.ok ? { ok: true, message: "Resend aceptó el envío de prueba. Enviado a proveedor; no es entrega confirmada.", remitenteUsado: mensaje.remitenteUsado, replyToUsado: mensaje.replyToUsado, asunto, providerMessageId: resultado.providerMessageId } : { ok: false, message: "Falló el envío de prueba.", remitenteUsado: mensaje.remitenteUsado, replyToUsado: mensaje.replyToUsado, asunto, error: resultado.error };
}

export async function crearMensajeOperativo(formData: FormData, baseUrl?: string) { return crearMensajeOperativoDesdeInput({ asunto: texto(formData.get("asunto")), titulo: texto(formData.get("titulo")), preguntaEncuesta: texto(formData.get("preguntaEncuesta")), mensaje: texto(formData.get("mensaje")), notaInterna: texto(formData.get("notaInterna")), acercaDeHubYa: texto(formData.get("acercaDeHubYa")), alcance: texto(formData.get("alcance")), canal: texto(formData.get("canal")) as CanalMensajeOperativo, hubIds: formData.getAll("hubIds").map(String), clienteIds: formData.getAll("clienteIds").map(String), opcionesRespuesta: formData.getAll("opcionesRespuesta").map(String), baseUrl }); }
export async function cargarRespuestaManualDesdeInput(input: CargarRespuestaInput) { const clienteId = texto(input.clienteId); const hubId = texto(input.hubId); const textoRespuesta = texto(input.texto || input.opcionTexto); if (!clienteId || !hubId || !textoRespuesta) return { ok: false, message: "Completá contacto, Hub y texto de la respuesta." }; const timestamp = new Date().toISOString(); let creada: RespuestaOperativa | null = null; let creadaId = ""; await updatePublicStore((base) => { const store = normalizarMensajes(base); const mensajeId = texto(input.mensajeId) || undefined; const estado = estadosRespuesta.has(input.estado as EstadoRespuestaOperativa) ? input.estado as EstadoRespuestaOperativa : "nueva"; const canal = canales.has(input.canal as CanalMensajeOperativo) ? input.canal as CanalMensajeOperativo : "manual"; creadaId = uid("respuesta"); creada = { id: creadaId, mensajeId, clienteId, hubId, fecha: texto(input.fecha) || timestamp, texto: textoRespuesta, opcionTexto: texto(input.opcionTexto) || undefined, notaInterna: texto(input.notaInterna) || undefined, estado, canal, respuestasDelOperador: [], createdAt: timestamp, updatedAt: timestamp }; store.respuestas_operativas = [creada, ...store.respuestas_operativas]; if (mensajeId) store.mensajes_operativos = store.mensajes_operativos.map((m) => m.id === mensajeId ? { ...m, estado: "respondido", respuestasAsociadas: Array.from(new Set([...(m.respuestasAsociadas || []), creadaId])), destinatarios: m.destinatarios.map((d) => d.clienteId === clienteId ? { ...d, estado: "respondido", respondedAt: timestamp, respuestaElegida: texto(input.opcionTexto) || textoRespuesta, historial: [...(d.historial || []), { fecha: timestamp, estado: "respondido", detalle: `Respuesta manual: ${texto(input.opcionTexto) || textoRespuesta}` }] } : d), updatedAt: timestamp } : m); return store; }); return { ok: true, message: `Respuesta cargada y trazada (${creadaId}).`, respuesta: creada }; }
export async function cargarRespuestaManual(formData: FormData) { return cargarRespuestaManualDesdeInput({ clienteId: texto(formData.get("clienteId")), hubId: texto(formData.get("hubId")), texto: texto(formData.get("texto")), mensajeId: texto(formData.get("mensajeId")), opcionTexto: texto(formData.get("opcionTexto")), fecha: texto(formData.get("fecha")), notaInterna: texto(formData.get("notaInterna")), estado: texto(formData.get("estado")) as EstadoRespuestaOperativa, canal: texto(formData.get("canal")) as CanalMensajeOperativo }); }
export async function actualizarRespuestaOperativaDesdeInput(input: ActualizarRespuestaInput) { const id = texto(input.respuestaId); const estado = input.estado; if (!id || !estadosRespuesta.has(estado)) return { ok: false, message: "Estado inválido." }; const timestamp = new Date().toISOString(); await updatePublicStore((base) => { const store = normalizarMensajes(base); store.respuestas_operativas = store.respuestas_operativas.map((r) => r.id !== id ? r : { ...r, estado, notaInterna: texto(input.notaInterna) || r.notaInterna, respuestasDelOperador: texto(input.respuestaOperador) ? [{ id: uid("operador"), texto: texto(input.respuestaOperador), fecha: timestamp }, ...(r.respuestasDelOperador || [])] : (r.respuestasDelOperador || []), updatedAt: timestamp }); return store; }); return { ok: true, message: "Respuesta actualizada." }; }
export async function actualizarRespuestaOperativa(formData: FormData) { return actualizarRespuestaOperativaDesdeInput({ respuestaId: texto(formData.get("respuestaId")), estado: texto(formData.get("estado")) as EstadoRespuestaOperativa, notaInterna: texto(formData.get("notaInterna")), respuestaOperador: texto(formData.get("respuestaOperador")) }); }
export async function registrarRespuestaPorToken(token: string) {
  const timestamp = new Date().toISOString();
  let resultado: { ok: boolean; message: string; hubNombre?: string } = { ok: false, message: "Token inválido o vencido." };
  await updatePublicStore((base) => {
    const store = normalizarMensajes(base);
    for (const mensaje of store.mensajes_operativos) {
      for (const destinatario of mensaje.destinatarios) {
        const tokenInfo = (destinatario.tokensRespuesta || []).find((t) => t.token === token);
        if (!tokenInfo) continue;
        const existente = store.respuestas_operativas.find((r) => r.mensajeId === mensaje.id && r.clienteId === tokenInfo.clienteId);
        if (existente) {
          existente.fecha = timestamp;
          existente.texto = tokenInfo.opcionTexto;
          existente.opcionId = tokenInfo.opcionId;
          existente.opcionTexto = tokenInfo.opcionTexto;
          existente.estado = "nueva";
          existente.updatedAt = timestamp;
          mensaje.respuestasAsociadas = Array.from(new Set([...(mensaje.respuestasAsociadas || []), existente.id]));
        } else {
          const respuesta: RespuestaOperativa = { id: uid("respuesta"), mensajeId: mensaje.id, clienteId: tokenInfo.clienteId, hubId: tokenInfo.hubId, fecha: timestamp, texto: tokenInfo.opcionTexto, opcionId: tokenInfo.opcionId, opcionTexto: tokenInfo.opcionTexto, canal: "email", estado: "nueva", respuestasDelOperador: [], createdAt: timestamp, updatedAt: timestamp };
          store.respuestas_operativas = [respuesta, ...store.respuestas_operativas];
          mensaje.respuestasAsociadas = Array.from(new Set([...(mensaje.respuestasAsociadas || []), respuesta.id]));
        }
        for (const t of destinatario.tokensRespuesta || []) t.usado = t.token === token;
        tokenInfo.usado = true;
        tokenInfo.usadoEn = timestamp;
        destinatario.estado = "respondido";
        destinatario.respondedAt = timestamp;
        destinatario.respuestaElegida = tokenInfo.opcionTexto;
        destinatario.historial = [...(destinatario.historial || []), { fecha: timestamp, estado: "respondido", detalle: `Respuesta por botón: ${tokenInfo.opcionTexto}` }];
        mensaje.estado = "respondido";
        mensaje.updatedAt = timestamp;
        resultado = { ok: true, message: "Gracias, tu respuesta fue registrada.", hubNombre: nombreHub(store.hubs, tokenInfo.hubId) };
        return store;
      }
    }
    return store;
  });
  return resultado;
}
