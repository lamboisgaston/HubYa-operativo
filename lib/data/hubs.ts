import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type HubEstado = "activo" | "pausado" | "inactivo";
export type EstadoHubServicioVinculo = "ACTIVO" | "POSTULANTE" | "SUSPENDIDO" | "FINALIZADO";
export type TipoDestinoContacto = "cliente" | "actor" | "auxiliar" | "ignorar";
export type Cliente = { id: string; nombre: string; email: string; whatsapp: string; referencia?: string; hubId: string; tipoDestino: TipoDestinoContacto; estado: "activo" | "inactivo"; createdAt: string; updatedAt: string };
export type ContactoInput = Partial<Pick<Cliente, "nombre" | "email" | "whatsapp" | "referencia" | "hubId" | "tipoDestino">>;
export type Hub = { id: string; nombre: string; slug: string; zona: string; estado: HubEstado; descripcionPublica: string; rama: string; equipoOperativo: string; activo: boolean; trabajosRealizados?: number; ultimaActividad?: string; createdAt: string; updatedAt: string };
export type HubServicio = { id: string; hub_id: string; nombre_servicio: string; descripcion: string; activo: boolean };
export type HubServicioVinculo = { id: string; hub_servicio_id: string; oferta_nombre: string; estado: EstadoHubServicioVinculo; responsable: string; observaciones: string; created_at: string; updated_at: string };
export type HubServicioPublico = HubServicio & { vinculoActivo: HubServicioVinculo | null; postulantes: HubServicioVinculo[] };
export type HubPublico = Hub & { clientesActivos: number; servicios: HubServicioPublico[] };
export type EstadoReporteHub = "BORRADOR" | "GUARDADO" | "ENVIADO";
export type ReporteHub = { id: string; hubId?: string; hub?: string; estado: EstadoReporteHub; nombre?: string; fecha?: string; totales?: { totalFacturado?: number; totalGastos?: number; totalADistribuir?: number; totalDistribuido?: number }; [key: string]: unknown };
export type HubOperativo = HubPublico & { cantidadClientes: number; cantidadReportesBorrador: number; cantidadReportesGuardados: number; estabilidadOperativa: string; serviciosActivos: HubServicioPublico[] };
export type HubDetalleOperativo = HubOperativo & { ficha: HubPublico; clientes: Cliente[]; reportesBorrador: ReporteHub[]; reportesGuardados: ReporteHub[]; reportesEnviados: ReporteHub[]; vinculos: HubServicioVinculo[]; postulantes: HubServicioVinculo[] };
export type NuevoHubDemandaInput = { nombre: string; zona: string; descripcionPublica?: string; rama?: string; equipoOperativo?: string };

type Store = { hubs: Hub[]; clientes: Cliente[]; solicitudes: unknown[]; hub_servicios: HubServicio[]; hub_servicio_vinculos: HubServicioVinculo[]; reportes?: ReporteHub[] };
const DATA_FILE = path.join(process.cwd(), "data", "hubya-public.json");
const now = new Date().toISOString();
const seedHubs: Hub[] = ["Tipal", "Punto", "Praderas", "Valle Escondido", "Chacras de Santa María", "La Aguada", "Prado", "La Reserva"].map((zona, index) => ({ id: `hub-${index + 1}`, nombre: `Hub ${zona}`, slug: zona.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), zona, estado: "activo", descripcionPublica: `Hub operativo de ${zona} para coordinar demanda recurrente, equipo disponible y trabajos programados sin exponer datos privados de clientes.`, rama: "JardinerosYa", equipoOperativo: "JardinerosYa01", activo: true, trabajosRealizados: 0, ultimaActividad: now, createdAt: now, updatedAt: now }));
const seedClientes: Cliente[] = Array.from({ length: 9 }, (_, index) => ({ id: `cliente-tipal-${index + 1}`, nombre: `Cliente ${index + 1}`, email: "", whatsapp: "", referencia: "Alta inicial", hubId: "hub-1", tipoDestino: "cliente", estado: "activo", createdAt: now, updatedAt: now }));
const servicioBasePorHub = [
  { nombre: "Mantenimiento de espacios verdes", descripcion: "Demanda recurrente de corte, limpieza y mantenimiento de jardines." },
  { nombre: "Control de plagas", descripcion: "Necesidad agrupada de fumigación y prevención sanitaria." },
  { nombre: "Abastecimiento de huevos", descripcion: "Compra recurrente y abastecimiento coordinado para el Hub." },
];
const seedServicios: HubServicio[] = seedHubs.flatMap((hub) => servicioBasePorHub.map((servicio, index) => ({ id: `servicio-${hub.slug}-${index + 1}`, hub_id: hub.id, nombre_servicio: servicio.nombre, descripcion: servicio.descripcion, activo: true })));
const seedVinculosPorServicio: Record<string, Array<{ oferta_nombre: string; estado: EstadoHubServicioVinculo; responsable: string; observaciones: string }>> = {
  "servicio-prado-1": [
    { oferta_nombre: "Cristian El Prado", estado: "ACTIVO", responsable: "Cristian", observaciones: "Resolutor actual del mantenimiento del Hub Prado." },
    { oferta_nombre: "JardinerosYa02", estado: "POSTULANTE", responsable: "JardinerosYa02", observaciones: "Disponible para tomar demanda incremental." },
  ],
  "servicio-prado-2": [
    { oferta_nombre: "FumigadoresYa01", estado: "ACTIVO", responsable: "FumigadoresYa01", observaciones: "Resuelve la demanda vigente de control de plagas." },
    { oferta_nombre: "FumigadoresYa02", estado: "POSTULANTE", responsable: "FumigadoresYa02", observaciones: "Postulante disponible para refuerzos." },
  ],
  "servicio-prado-3": [
    { oferta_nombre: "Huevitos Carlos", estado: "ACTIVO", responsable: "Carlos", observaciones: "Proveedor vigente del abastecimiento." },
    { oferta_nombre: "Huevitos Norte", estado: "POSTULANTE", responsable: "Huevitos Norte", observaciones: "Alternativa disponible para el mismo servicio." },
  ],
};
const seedHubServicioVinculos: HubServicioVinculo[] = seedServicios.flatMap((servicio) => {
  const vinculos = seedVinculosPorServicio[servicio.id] || [
    { oferta_nombre: servicio.nombre_servicio.includes("plagas") ? "FumigadoresYa01" : "JardinerosYa01", estado: "ACTIVO" as const, responsable: servicio.nombre_servicio.includes("plagas") ? "FumigadoresYa01" : "JardinerosYa01", observaciones: "Vínculo activo asociado a esta demanda del Hub." },
  ];
  return vinculos.map((vinculo, index) => ({ id: `vinculo-${servicio.id}-${index + 1}`, hub_servicio_id: servicio.id, created_at: now, updated_at: now, ...vinculo }));
});
export const MODELOS_SUGERIDOS = "Producción real: usar PostgreSQL con Prisma, Supabase, Neon o la base elegida. Modelos sugeridos: Hub, Cliente, hub_servicios y hub_servicio_vinculos. Regla: el vínculo pertenece siempre a una demanda/servicio dentro de un Hub, no a un Hub abstracto.";

export function normalizarClaveHub(valor: string) {
  return valor.replace(/^hub\s+/i, "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

export function nombreHubCanonico(valor: string) {
  const base = valor.replace(/^hub\s+/i, "").trim();
  const prolijo = base.toLowerCase().split(/\s+/).filter(Boolean).map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1)).join(" ");
  return `Hub ${prolijo || "Nuevo"}`;
}

function estabilidadReferencial(cantidadClientes: number) {
  if (cantidadClientes <= 0) return "Sin datos reales";
  return `${Math.max(1, Math.ceil(cantidadClientes / 12))} persona estable`;
}

function mergeById<T extends { id: string }>(actuales: T[] | undefined, semillas: T[]): T[] {
  const idsActuales = new Set((actuales || []).map((item) => item.id));
  return [...(actuales || []), ...semillas.filter((semilla) => !idsActuales.has(semilla.id))];
}

function deduplicarHubs(hubsEntrada: Hub[]) {
  const idCanonico = new Map<string, string>();
  const hubs: Hub[] = [];
  for (const hub of hubsEntrada) {
    const clave = normalizarClaveHub(hub.nombre || hub.zona || hub.slug);
    const existenteId = idCanonico.get(clave);
    if (existenteId) {
      idCanonico.set(hub.id, existenteId);
      continue;
    }
    const slug = slugHub(hub.nombre.replace(/^Hub\s+/i, "") || hub.zona || hub.slug);
    const canonico = { ...hub, nombre: nombreHubCanonico(hub.nombre || hub.zona), slug, zona: hub.zona?.trim() || hub.nombre.replace(/^Hub\s+/i, "").trim() };
    idCanonico.set(clave, canonico.id);
    idCanonico.set(canonico.id, canonico.id);
    idCanonico.set(canonico.slug, canonico.id);
    hubs.push(canonico);
  }
  return { hubs, idCanonico };
}

function normalizeStore(store: Partial<Store>): Store {
  const mezclados = mergeById(store.hubs, seedHubs);
  const { hubs, idCanonico } = deduplicarHubs(mezclados);
  const hub_servicios = mergeById(store.hub_servicios, seedServicios).map((servicio) => ({ ...servicio, hub_id: idCanonico.get(servicio.hub_id) || servicio.hub_id }));
  const hub_servicio_vinculos = mergeById(store.hub_servicio_vinculos, seedHubServicioVinculos);
  const hubPorClave = new Map(hubs.flatMap((hub) => [[normalizarClaveHub(hub.nombre), hub.id], [normalizarClaveHub(hub.zona), hub.id], [hub.slug, hub.id]]));
  const clientes = (store.clientes || seedClientes).map((cliente) => ({ ...cliente, tipoDestino: cliente.tipoDestino || "cliente", hubId: idCanonico.get(cliente.hubId) || hubPorClave.get(normalizarClaveHub(cliente.hubId || "")) || cliente.hubId || "" }));
  const reportes = (store.reportes || []).map((reporte) => ({ ...reporte, hubId: (reporte.hubId && (idCanonico.get(reporte.hubId) || hubPorClave.get(normalizarClaveHub(reporte.hubId)))) || (reporte.hub && hubPorClave.get(normalizarClaveHub(reporte.hub))) || reporte.hubId }));

  return { hubs, clientes, solicitudes: store.solicitudes || [], hub_servicios, hub_servicio_vinculos, reportes };
}
async function readStore(): Promise<Store> { try { return normalizeStore(JSON.parse(await readFile(DATA_FILE, "utf8"))); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; const store = normalizeStore({}); await writeStore(store); return store; } }
async function writeStore(store: Store) { await mkdir(path.dirname(DATA_FILE), { recursive: true }); await writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8"); }
function serviciosPublicos(store: Store, hubId: string): HubServicioPublico[] { return store.hub_servicios.filter((servicio) => servicio.hub_id === hubId && servicio.activo).map((servicio) => { const vinculos = store.hub_servicio_vinculos.filter((vinculo) => vinculo.hub_servicio_id === servicio.id); return { ...servicio, vinculoActivo: vinculos.find((vinculo) => vinculo.estado === "ACTIVO") || null, postulantes: vinculos.filter((vinculo) => vinculo.estado === "POSTULANTE") }; }); }
export async function getHubs(): Promise<HubPublico[]> { const store = await readStore(); return store.hubs.filter((hub) => hub.activo).map((hub) => ({ ...hub, clientesActivos: store.clientes.filter((cliente) => cliente.hubId === hub.id && cliente.estado === "activo").length, servicios: serviciosPublicos(store, hub.id) })); }
export async function getHubBySlug(slug: string): Promise<HubPublico | null> { return (await getHubs()).find((hub) => hub.slug === slug) || null; }
export async function getClientesByHubId(hubId: string): Promise<Cliente[]> { const store = await readStore(); return store.clientes.filter((cliente) => cliente.hubId === hubId && cliente.estado === "activo"); }
export function slugHub(valor: string) { return valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `hub-${Date.now()}`; }
export async function createHubDemanda(input: NuevoHubDemandaInput) { const store = await readStore(); const timestamp = new Date().toISOString(); const nombre = nombreHubCanonico(input.nombre.trim() || input.zona.trim() || "nuevo"); const zona = input.zona.trim() || nombre.replace(/^Hub\s+/i, ""); const claveNueva = normalizarClaveHub(nombre); const existente = store.hubs.find((hub) => normalizarClaveHub(hub.nombre) === claveNueva || normalizarClaveHub(hub.zona) === claveNueva); if (existente) return { ...existente, clientesActivos: store.clientes.filter((cliente) => cliente.hubId === existente.id && cliente.estado === "activo").length, servicios: serviciosPublicos(store, existente.id) }; const baseSlug = slugHub(nombre.replace(/^Hub\s+/i, "")); let slug = baseSlug; let suffix = 2; while (store.hubs.some((hub) => hub.slug === slug)) { slug = `${baseSlug}-${suffix}`; suffix += 1; } const nuevo: Hub = { id: `hub-${Date.now()}`, nombre, slug, zona, estado: "activo", descripcionPublica: input.descripcionPublica?.trim() || `Hub de demanda de ${zona} para agrupar clientes y coordinar oferta operativa disponible.`, rama: input.rama?.trim() || "General", equipoOperativo: input.equipoOperativo?.trim() || "Equipo a asignar", activo: true, trabajosRealizados: 0, ultimaActividad: timestamp, createdAt: timestamp, updatedAt: timestamp }; store.hubs = [nuevo, ...store.hubs]; await writeStore(store); return { ...nuevo, clientesActivos: 0, servicios: [] }; }
export async function addClienteToHub(hubId: string, cliente: Omit<Cliente, "id" | "hubId" | "tipoDestino" | "estado" | "createdAt" | "updatedAt"> & { tipoDestino?: TipoDestinoContacto }) { return createContacto({ ...cliente, hubId }); }

export async function getContactos(): Promise<Cliente[]> { const store = await readStore(); return store.clientes.filter((cliente) => cliente.estado === "activo"); }
export async function createContacto(input: ContactoInput) { const store = await readStore(); const timestamp = new Date().toISOString(); const nuevo: Cliente = { id: `cliente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nombre: String(input.nombre || "").trim() || "Contacto sin nombre", email: String(input.email || "").trim(), whatsapp: String(input.whatsapp || "").trim(), referencia: String(input.referencia || "").trim(), hubId: String(input.hubId || "").trim(), tipoDestino: input.tipoDestino || "cliente", estado: "activo", createdAt: timestamp, updatedAt: timestamp }; store.clientes = [nuevo, ...store.clientes]; await writeStore(store); return nuevo; }
export async function updateContacto(id: string, input: ContactoInput) { const store = await readStore(); const timestamp = new Date().toISOString(); let actualizado: Cliente | null = null; store.clientes = store.clientes.map((cliente) => { if (cliente.id !== id) return cliente; actualizado = { ...cliente, nombre: input.nombre === undefined ? cliente.nombre : String(input.nombre).trim(), email: input.email === undefined ? cliente.email : String(input.email).trim(), whatsapp: input.whatsapp === undefined ? cliente.whatsapp : String(input.whatsapp).trim(), referencia: input.referencia === undefined ? cliente.referencia : String(input.referencia).trim(), hubId: input.hubId === undefined ? cliente.hubId : String(input.hubId).trim(), tipoDestino: input.tipoDestino || cliente.tipoDestino || "cliente", updatedAt: timestamp }; return actualizado; }); if (!actualizado) return null; await writeStore(store); return actualizado; }
export async function deleteContacto(id: string) { const store = await readStore(); const timestamp = new Date().toISOString(); let eliminado: Cliente | null = null; store.clientes = store.clientes.map((cliente) => { if (cliente.id !== id) return cliente; eliminado = { ...cliente, estado: "inactivo", updatedAt: timestamp }; return eliminado; }); if (!eliminado) return null; await writeStore(store); return eliminado; }
export async function updatePublicStore(mutator: (store: Store) => Store | Promise<Store>) { const store = await readStore(); const next = await mutator(store); await writeStore(next); return next; }
export async function getPublicStore() { return readStore(); }
export async function getClientesPorHub(hubId: string) { return getClientesByHubId(hubId); }
export async function getReportesPorHub(hubId: string) { const store = await readStore(); return (store.reportes || []).filter((reporte) => reporte.hubId === hubId || reporte.hub === hubId); }
export async function getHubsOperativos(): Promise<HubOperativo[]> {
  const hubs = await getHubs();
  const store = await readStore();
  return hubs.map((hub) => {
    const reportes = (store.reportes || []).filter((reporte) => reporte.hubId === hub.id || reporte.hub === hub.nombre);
    const serviciosActivos = hub.servicios.filter((servicio) => servicio.activo);
    return { ...hub, cantidadClientes: hub.clientesActivos, cantidadReportesBorrador: reportes.filter((reporte) => reporte.estado === "BORRADOR").length, cantidadReportesGuardados: reportes.filter((reporte) => reporte.estado === "GUARDADO" || reporte.estado === "ENVIADO").length, estabilidadOperativa: estabilidadReferencial(hub.clientesActivos), serviciosActivos };
  });
}
export async function getHubDetalle(hubId: string): Promise<HubDetalleOperativo | null> {
  const hub = (await getHubsOperativos()).find((item) => item.id === hubId || item.slug === hubId);
  if (!hub) return null;
  const clientes = await getClientesPorHub(hub.id);
  const reportes = await getReportesPorHub(hub.id);
  const vinculos = hub.servicios.flatMap((servicio) => [servicio.vinculoActivo, ...servicio.postulantes].filter((vinculo): vinculo is HubServicioVinculo => Boolean(vinculo)));
  return { ...hub, ficha: hub, clientes, reportesBorrador: reportes.filter((reporte) => reporte.estado === "BORRADOR"), reportesGuardados: reportes.filter((reporte) => reporte.estado === "GUARDADO"), reportesEnviados: reportes.filter((reporte) => reporte.estado === "ENVIADO"), vinculos, postulantes: vinculos.filter((vinculo) => vinculo.estado === "POSTULANTE") };
}
