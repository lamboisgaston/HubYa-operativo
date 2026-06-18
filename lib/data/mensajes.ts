import { getPublicStore, updatePublicStore, type Cliente, type Hub } from "@/lib/data/hubs";

export type CanalMensajeOperativo = "email" | "whatsapp" | "manual" | "sistema";
export type EstadoDestinatarioMensaje = "enviado" | "abierto" | "respondido" | "sin respuesta" | "error";
export type EstadoMensajeOperativo = "borrador" | "enviado" | "respondido" | "sin respuesta" | "archivado";
export type EstadoRespuestaOperativa = "nueva" | "leída" | "respondida" | "pendiente" | "archivada";

export type DestinatarioMensajeOperativo = {
  id: string;
  clienteId: string;
  nombre: string;
  email: string;
  whatsapp: string;
  hubId: string;
  hubNombre: string;
  estado: EstadoDestinatarioMensaje;
  error?: string;
};

export type MensajeOperativo = {
  id: string;
  fecha: string;
  asunto: string;
  mensaje: string;
  notaInterna?: string;
  hubsIncluidos: string[];
  usuariosIncluidos: string[];
  cantidadDestinatarios: number;
  canal: CanalMensajeOperativo;
  estado: EstadoMensajeOperativo;
  destinatarios: DestinatarioMensajeOperativo[];
  respuestasAsociadas: string[];
  createdAt: string;
  updatedAt: string;
};

export type RespuestaOperativa = {
  id: string;
  mensajeId?: string;
  clienteId: string;
  hubId: string;
  fecha: string;
  texto: string;
  notaInterna?: string;
  estado: EstadoRespuestaOperativa;
  respuestasDelOperador: Array<{ id: string; texto: string; fecha: string; notaInterna?: string }>;
  createdAt: string;
  updatedAt: string;
};

export type MensajesResumen = {
  mensajes: MensajeOperativo[];
  respuestas: RespuestaOperativa[];
  hubs: Hub[];
  contactos: Cliente[];
};

type StoreConMensajes = Awaited<ReturnType<typeof getPublicStore>> & {
  mensajes_operativos?: MensajeOperativo[];
  respuestas_operativas?: RespuestaOperativa[];
};

const estadosRespuesta = new Set<EstadoRespuestaOperativa>(["nueva", "leída", "respondida", "pendiente", "archivada"]);
const canales = new Set<CanalMensajeOperativo>(["email", "whatsapp", "manual", "sistema"]);

function texto(valor: FormDataEntryValue | null) {
  return typeof valor === "string" ? valor.trim() : "";
}

function uid(prefijo: string) {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nombreHub(hubs: Hub[], hubId: string) {
  return hubs.find((hub) => hub.id === hubId)?.nombre || "Hub sin asignar";
}

function normalizarMensajes(store: StoreConMensajes) {
  store.mensajes_operativos = Array.isArray(store.mensajes_operativos) ? store.mensajes_operativos : [];
  store.respuestas_operativas = Array.isArray(store.respuestas_operativas) ? store.respuestas_operativas : [];
  return store;
}

export async function getMensajesResumen(hubId?: string): Promise<MensajesResumen> {
  const store = normalizarMensajes(await getPublicStore() as StoreConMensajes);
  const mensajes = store.mensajes_operativos.filter((mensaje) => !hubId || mensaje.hubsIncluidos.includes(hubId) || mensaje.destinatarios.some((destinatario) => destinatario.hubId === hubId));
  const respuestas = store.respuestas_operativas.filter((respuesta) => !hubId || respuesta.hubId === hubId);
  return { mensajes, respuestas, hubs: store.hubs, contactos: store.clientes.filter((cliente) => cliente.estado === "activo") };
}

export async function crearMensajeOperativo(formData: FormData) {
  const asunto = texto(formData.get("asunto"));
  const mensaje = texto(formData.get("mensaje"));
  if (!asunto || !mensaje) return { ok: false, message: "Completá asunto y mensaje." };

  const hubIds = new Set(formData.getAll("hubIds").map(String));
  const clienteIds = new Set(formData.getAll("clienteIds").map(String));
  const alcance = texto(formData.get("alcance"));
  const canalRaw = texto(formData.get("canal")) as CanalMensajeOperativo;
  const canal = canales.has(canalRaw) ? canalRaw : "manual";
  const timestamp = new Date().toISOString();

  let creado: MensajeOperativo | null = null;
  await updatePublicStore((base) => {
    const store = normalizarMensajes(base as StoreConMensajes);
    const contactos = store.clientes.filter((cliente) => cliente.estado === "activo" && (alcance === "todos" || hubIds.has(cliente.hubId) || clienteIds.has(cliente.id)));
    if (contactos.length === 0) return store;
    const hubsIncluidos = Array.from(new Set(contactos.map((cliente) => cliente.hubId).filter(Boolean)));
    creado = {
      id: uid("mensaje"),
      fecha: timestamp,
      asunto,
      mensaje,
      notaInterna: texto(formData.get("notaInterna")) || undefined,
      hubsIncluidos,
      usuariosIncluidos: contactos.map((cliente) => cliente.id),
      cantidadDestinatarios: contactos.length,
      canal,
      estado: "enviado",
      destinatarios: contactos.map((cliente) => ({ id: uid("destinatario"), clienteId: cliente.id, nombre: cliente.nombre, email: cliente.email, whatsapp: cliente.whatsapp, hubId: cliente.hubId, hubNombre: nombreHub(store.hubs, cliente.hubId), estado: "enviado" })),
      respuestasAsociadas: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.mensajes_operativos = [creado, ...store.mensajes_operativos];
    return store;
  });
  if (!creado) return { ok: false, message: "Seleccioná al menos un Hub o usuario/contacto activo." };
  return { ok: true, message: `Mensaje guardado con identificador ${creado.id}.` };
}

export async function cargarRespuestaManual(formData: FormData) {
  const clienteId = texto(formData.get("clienteId"));
  const hubId = texto(formData.get("hubId"));
  const textoRespuesta = texto(formData.get("texto"));
  if (!clienteId || !hubId || !textoRespuesta) return { ok: false, message: "Completá contacto, Hub y texto de la respuesta." };
  const timestamp = new Date().toISOString();
  let creada: RespuestaOperativa | null = null;
  await updatePublicStore((base) => {
    const store = normalizarMensajes(base as StoreConMensajes);
    const mensajeId = texto(formData.get("mensajeId")) || undefined;
    creada = { id: uid("respuesta"), mensajeId, clienteId, hubId, fecha: texto(formData.get("fecha")) || timestamp, texto: textoRespuesta, notaInterna: texto(formData.get("notaInterna")) || undefined, estado: "nueva", respuestasDelOperador: [], createdAt: timestamp, updatedAt: timestamp };
    store.respuestas_operativas = [creada, ...store.respuestas_operativas];
    if (mensajeId) {
      store.mensajes_operativos = store.mensajes_operativos.map((mensaje) => mensaje.id === mensajeId ? { ...mensaje, estado: "respondido", respuestasAsociadas: Array.from(new Set([...(mensaje.respuestasAsociadas || []), creada!.id])), destinatarios: mensaje.destinatarios.map((destinatario) => destinatario.clienteId === clienteId ? { ...destinatario, estado: "respondido" } : destinatario), updatedAt: timestamp } : mensaje);
    }
    return store;
  });
  return { ok: true, message: `Respuesta cargada y trazada (${creada?.id}).` };
}

export async function actualizarRespuestaOperativa(formData: FormData) {
  const id = texto(formData.get("respuestaId"));
  const estadoRaw = texto(formData.get("estado")) as EstadoRespuestaOperativa;
  if (!id || !estadosRespuesta.has(estadoRaw)) return;
  const notaInterna = texto(formData.get("notaInterna"));
  const respuestaOperador = texto(formData.get("respuestaOperador"));
  const timestamp = new Date().toISOString();
  await updatePublicStore((base) => {
    const store = normalizarMensajes(base as StoreConMensajes);
    store.respuestas_operativas = store.respuestas_operativas.map((respuesta) => respuesta.id !== id ? respuesta : { ...respuesta, estado: estadoRaw, notaInterna: notaInterna || respuesta.notaInterna, respuestasDelOperador: respuestaOperador ? [{ id: uid("operador"), texto: respuestaOperador, fecha: timestamp }, ...(respuesta.respuestasDelOperador || [])] : (respuesta.respuestasDelOperador || []), updatedAt: timestamp });
    return store;
  });
}
