import { mensajeErrorResend, obtenerRemitenteResend, obtenerReplyToResend } from "@/lib/email/resend";
import { getPublicStore, updatePublicStore, type Cliente, type Hub } from "@/lib/data/hubs";

export type CanalMensajeOperativo = "email" | "whatsapp" | "manual" | "sistema";
export type EstadoDestinatarioMensaje = "enviado" | "abierto" | "respondido" | "sin respuesta" | "error";
export type EstadoMensajeOperativo = "borrador" | "enviado" | "respondido" | "sin respuesta" | "error" | "archivado";
export type EstadoRespuestaOperativa = "nueva" | "leída" | "respondida" | "pendiente" | "archivada";

export type OpcionRespuestaMensaje = { id: string; texto: string };
export type TokenRespuestaMensaje = { token: string; opcionId: string; opcionTexto: string; clienteId: string; hubId: string; usado?: boolean; usadoEn?: string };
export type DestinatarioMensajeOperativo = { id: string; clienteId: string; nombre: string; email: string; whatsapp: string; hubId: string; hubNombre: string; estado: EstadoDestinatarioMensaje; error?: string; tokensRespuesta?: TokenRespuestaMensaje[] };
export type MensajeOperativo = { id: string; fecha: string; asunto: string; mensaje: string; notaInterna?: string; acercaDeHubYa?: string; opcionesRespuesta: OpcionRespuestaMensaje[]; hubsIncluidos: string[]; usuariosIncluidos: string[]; cantidadDestinatarios: number; canal: CanalMensajeOperativo; estado: EstadoMensajeOperativo; destinatarios: DestinatarioMensajeOperativo[]; respuestasAsociadas: string[]; envioEmail?: { intentados: number; enviados: number; errores: string[] }; createdAt: string; updatedAt: string };
export type RespuestaOperativa = { id: string; mensajeId?: string; clienteId: string; hubId: string; fecha: string; texto: string; opcionId?: string; opcionTexto?: string; canal: CanalMensajeOperativo; notaInterna?: string; estado: EstadoRespuestaOperativa; respuestasDelOperador: Array<{ id: string; texto: string; fecha: string; notaInterna?: string }>; createdAt: string; updatedAt: string };
export type MensajesResumen = { mensajes: MensajeOperativo[]; respuestas: RespuestaOperativa[]; hubs: Hub[]; contactos: Cliente[] };

type BaseStore = Omit<Awaited<ReturnType<typeof getPublicStore>>, "mensajes_operativos" | "respuestas_operativas">;
type StoreConMensajes = BaseStore & { mensajes_operativos: MensajeOperativo[]; respuestas_operativas: RespuestaOperativa[]; acerca_de_hubya?: string };

type CrearMensajeInput = { asunto: string; mensaje: string; notaInterna?: string; acercaDeHubYa?: string; alcance?: string; canal?: CanalMensajeOperativo; hubIds?: string[]; clienteIds?: string[]; opcionesRespuesta?: string[]; baseUrl?: string };
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

export async function getMensajesResumen(hubId?: string): Promise<MensajesResumen> { const store = normalizarMensajes(await getPublicStore()); const mensajes = store.mensajes_operativos.filter((m) => !hubId || m.hubsIncluidos.includes(hubId) || m.destinatarios.some((d) => d.hubId === hubId)); const respuestas = store.respuestas_operativas.filter((r) => !hubId || r.hubId === hubId); return { mensajes, respuestas, hubs: store.hubs, contactos: store.clientes.filter((c) => c.estado === "activo") }; }
export async function getAcercaDeHubYa() { const store = normalizarMensajes(await getPublicStore()); return store.acerca_de_hubya || acercaDefault; }

async function enviarEmailMensaje(mensaje: MensajeOperativo, cliente: Cliente, hub: Hub | undefined, destinatario: DestinatarioMensajeOperativo, baseUrl?: string) {
  if (!cliente.email || mensaje.canal !== "email") return { ok: false, error: "Sin email o canal no email." };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "Falta configurar RESEND_API_KEY; el mensaje quedó preparado con links." };
  const cuerpo = aplicarVariables(mensaje.mensaje, cliente, hub);
  const acerca = mensaje.acercaDeHubYa || acercaDefault;
  const botones = (destinatario.tokensRespuesta || []).map((t) => `<p><a href="${linkRespuesta(baseUrl, t.token)}" style="display:inline-block;background:#1f2a1d;color:#fff;padding:12px 16px;border-radius:12px;text-decoration:none;font-weight:800">${htmlEscape(t.opcionTexto)}</a></p>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#1f2a1d"><p>${htmlEscape(cuerpo).replace(/\n/g, "<br>")}</p>${botones}<hr><p style="font-size:12px;color:#66745c">${htmlEscape(acerca).replace(/\n/g, "<br>")}</p></div>`;
  const text = `${cuerpo}\n\n${(destinatario.tokensRespuesta || []).map((t) => `${t.opcionTexto}: ${linkRespuesta(baseUrl, t.token)}`).join("\n")}\n\n${acerca}`;
  const res = await fetch(RESEND_API_URL, { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: obtenerRemitenteResend(), reply_to: obtenerReplyToResend(), to: [cliente.email], subject: mensaje.asunto, html, text }) });
  const data = await res.json().catch(() => null);
  return res.ok ? { ok: true } : { ok: false, error: mensajeErrorResend(data) };
}

export async function crearMensajeOperativoDesdeInput(input: CrearMensajeInput) {
  const asunto = texto(input.asunto); const cuerpo = texto(input.mensaje); if (!asunto || !cuerpo) return { ok: false, message: "Completá asunto y mensaje." };
  const hubIds = new Set((input.hubIds || []).map(String)); const clienteIds = new Set((input.clienteIds || []).map(String)); const alcance = texto(input.alcance); const canal = canales.has(input.canal as CanalMensajeOperativo) ? input.canal as CanalMensajeOperativo : "manual"; const timestamp = new Date().toISOString();
  let creado: MensajeOperativo | null = null;
  await updatePublicStore((base) => { const store = normalizarMensajes(base); if (input.acercaDeHubYa !== undefined) store.acerca_de_hubya = texto(input.acercaDeHubYa) || acercaDefault; const contactos = store.clientes.filter((c) => c.estado === "activo" && (alcance === "todos" || hubIds.has(c.hubId) || clienteIds.has(c.id))); if (contactos.length === 0) return store; const opcionesRespuesta = (input.opcionesRespuesta || []).map(texto).filter(Boolean).map((opcion) => ({ id: uid("opcion"), texto: opcion })); const hubsIncluidos = Array.from(new Set(contactos.map((c) => c.hubId).filter(Boolean))); const id = uid("mensaje"); creado = { id, fecha: timestamp, asunto, mensaje: cuerpo, notaInterna: texto(input.notaInterna) || undefined, acercaDeHubYa: texto(input.acercaDeHubYa) || store.acerca_de_hubya || acercaDefault, opcionesRespuesta, hubsIncluidos, usuariosIncluidos: contactos.map((c) => c.id), cantidadDestinatarios: contactos.length, canal, estado: "enviado", destinatarios: contactos.map((c) => ({ id: uid("destinatario"), clienteId: c.id, nombre: c.nombre, email: c.email, whatsapp: c.whatsapp, hubId: c.hubId, hubNombre: nombreHub(store.hubs, c.hubId), estado: "sin respuesta", tokensRespuesta: opcionesRespuesta.map((o) => ({ token: tokenSeguro(), opcionId: o.id, opcionTexto: o.texto, clienteId: c.id, hubId: c.hubId })) })), respuestasAsociadas: [], createdAt: timestamp, updatedAt: timestamp }; store.mensajes_operativos = [creado, ...store.mensajes_operativos]; return store; });
  if (!creado) return { ok: false, message: "Seleccioná al menos un Hub o usuario/contacto activo." };
  const store = normalizarMensajes(await getPublicStore()); const errores: string[] = []; let enviados = 0;
  for (const destinatario of creado.destinatarios) { const cliente = store.clientes.find((c) => c.id === destinatario.clienteId); if (!cliente) continue; const hub = store.hubs.find((h) => h.id === destinatario.hubId); const resultado = await enviarEmailMensaje(creado, cliente, hub, destinatario, input.baseUrl); if (resultado.ok) enviados += 1; else if (resultado.error) errores.push(`${destinatario.nombre}: ${resultado.error}`); }
  await updatePublicStore((base) => { const store = normalizarMensajes(base); store.mensajes_operativos = store.mensajes_operativos.map((m) => m.id === creado!.id ? { ...m, estado: errores.length && !enviados && m.canal === "email" ? "error" : m.estado, envioEmail: { intentados: m.destinatarios.length, enviados, errores }, destinatarios: m.destinatarios.map((d) => errores.some((e) => e.startsWith(`${d.nombre}:`)) ? { ...d, estado: "error" as EstadoDestinatarioMensaje, error: errores.find((e) => e.startsWith(`${d.nombre}:`)) } : { ...d, estado: m.canal === "email" && enviados > 0 ? "enviado" : d.estado }) } : m); return store; });
  return { ok: true, message: `Mensaje guardado (${creado.id}). Emails enviados: ${enviados}/${creado.cantidadDestinatarios}.`, mensaje: creado, errores };
}

export async function crearMensajeOperativo(formData: FormData, baseUrl?: string) { return crearMensajeOperativoDesdeInput({ asunto: texto(formData.get("asunto")), mensaje: texto(formData.get("mensaje")), notaInterna: texto(formData.get("notaInterna")), acercaDeHubYa: texto(formData.get("acercaDeHubYa")), alcance: texto(formData.get("alcance")), canal: texto(formData.get("canal")) as CanalMensajeOperativo, hubIds: formData.getAll("hubIds").map(String), clienteIds: formData.getAll("clienteIds").map(String), opcionesRespuesta: formData.getAll("opcionesRespuesta").map(String), baseUrl }); }
export async function cargarRespuestaManualDesdeInput(input: CargarRespuestaInput) { const clienteId = texto(input.clienteId); const hubId = texto(input.hubId); const textoRespuesta = texto(input.texto || input.opcionTexto); if (!clienteId || !hubId || !textoRespuesta) return { ok: false, message: "Completá contacto, Hub y texto de la respuesta." }; const timestamp = new Date().toISOString(); let creada: RespuestaOperativa | null = null; await updatePublicStore((base) => { const store = normalizarMensajes(base); const mensajeId = texto(input.mensajeId) || undefined; const estado = estadosRespuesta.has(input.estado as EstadoRespuestaOperativa) ? input.estado as EstadoRespuestaOperativa : "nueva"; const canal = canales.has(input.canal as CanalMensajeOperativo) ? input.canal as CanalMensajeOperativo : "manual"; creada = { id: uid("respuesta"), mensajeId, clienteId, hubId, fecha: texto(input.fecha) || timestamp, texto: textoRespuesta, opcionTexto: texto(input.opcionTexto) || undefined, notaInterna: texto(input.notaInterna) || undefined, estado, canal, respuestasDelOperador: [], createdAt: timestamp, updatedAt: timestamp }; store.respuestas_operativas = [creada, ...store.respuestas_operativas]; if (mensajeId) store.mensajes_operativos = store.mensajes_operativos.map((m) => m.id === mensajeId ? { ...m, estado: "respondido", respuestasAsociadas: Array.from(new Set([...(m.respuestasAsociadas || []), creada!.id])), destinatarios: m.destinatarios.map((d) => d.clienteId === clienteId ? { ...d, estado: "respondido" } : d), updatedAt: timestamp } : m); return store; }); return { ok: true, message: `Respuesta cargada y trazada (${creada?.id}).`, respuesta: creada }; }
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
        const existente = store.respuestas_operativas.find((r) => r.mensajeId === mensaje.id && r.clienteId === tokenInfo.clienteId && r.opcionId === tokenInfo.opcionId);
        if (!existente) {
          const respuesta: RespuestaOperativa = { id: uid("respuesta"), mensajeId: mensaje.id, clienteId: tokenInfo.clienteId, hubId: tokenInfo.hubId, fecha: timestamp, texto: tokenInfo.opcionTexto, opcionId: tokenInfo.opcionId, opcionTexto: tokenInfo.opcionTexto, canal: "email", estado: "nueva", respuestasDelOperador: [], createdAt: timestamp, updatedAt: timestamp };
          store.respuestas_operativas = [respuesta, ...store.respuestas_operativas];
          mensaje.respuestasAsociadas = Array.from(new Set([...(mensaje.respuestasAsociadas || []), respuesta.id]));
        }
        tokenInfo.usado = true;
        tokenInfo.usadoEn = timestamp;
        destinatario.estado = "respondido";
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
