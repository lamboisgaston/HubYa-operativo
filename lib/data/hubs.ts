import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type HubEstado = "activo" | "pausado" | "inactivo";
export type EstadoHubServicioVinculo = "ACTIVO" | "POSTULANTE" | "SUSPENDIDO" | "FINALIZADO";
export type Cliente = { id: string; nombre: string; email: string; whatsapp: string; referencia?: string; hubId: string; estado: "activo" | "inactivo"; createdAt: string; updatedAt: string };
export type Hub = { id: string; nombre: string; slug: string; zona: string; estado: HubEstado; descripcionPublica: string; rama: string; equipoOperativo: string; activo: boolean; trabajosRealizados?: number; ultimaActividad?: string; createdAt: string; updatedAt: string };
export type HubServicio = { id: string; hub_id: string; nombre_servicio: string; descripcion: string; activo: boolean };
export type HubServicioVinculo = { id: string; hub_servicio_id: string; oferta_nombre: string; estado: EstadoHubServicioVinculo; responsable: string; observaciones: string; created_at: string; updated_at: string };
export type HubServicioPublico = HubServicio & { vinculoActivo: HubServicioVinculo | null; postulantes: HubServicioVinculo[] };
export type HubPublico = Hub & { clientesActivos: number; servicios: HubServicioPublico[] };
export type NuevoHubDemandaInput = { nombre: string; zona: string; descripcionPublica?: string; rama?: string; equipoOperativo?: string };

type Store = { hubs: Hub[]; clientes: Cliente[]; solicitudes: unknown[]; hub_servicios: HubServicio[]; hub_servicio_vinculos: HubServicioVinculo[] };
const DATA_FILE = path.join(process.cwd(), "data", "hubya-public.json");
const now = new Date().toISOString();
const seedHubs: Hub[] = ["Tipal", "Punto", "Praderas", "Valle Escondido", "Chacras de Santa María", "La Aguada", "Prado", "La Reserva"].map((zona, index) => ({ id: `hub-${index + 1}`, nombre: `Hub ${zona}`, slug: zona.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), zona, estado: "activo", descripcionPublica: `Hub operativo de ${zona} para coordinar demanda recurrente, equipo disponible y trabajos programados sin exponer datos privados de clientes.`, rama: "JardinerosYa", equipoOperativo: "JardinerosYa01", activo: true, trabajosRealizados: 0, ultimaActividad: now, createdAt: now, updatedAt: now }));
const seedClientes: Cliente[] = Array.from({ length: 9 }, (_, index) => ({ id: `cliente-tipal-${index + 1}`, nombre: `Cliente ${index + 1}`, email: "", whatsapp: "", referencia: "Alta inicial", hubId: "hub-1", estado: "activo", createdAt: now, updatedAt: now }));
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

function mergeById<T extends { id: string }>(actuales: T[] | undefined, semillas: T[]): T[] {
  const idsActuales = new Set((actuales || []).map((item) => item.id));
  return [...(actuales || []), ...semillas.filter((semilla) => !idsActuales.has(semilla.id))];
}

function normalizeStore(store: Partial<Store>): Store {
  const hubs = mergeById(store.hubs, seedHubs);
  const hub_servicios = mergeById(store.hub_servicios, seedServicios);
  const hub_servicio_vinculos = mergeById(store.hub_servicio_vinculos, seedHubServicioVinculos);

  return { hubs, clientes: store.clientes || seedClientes, solicitudes: store.solicitudes || [], hub_servicios, hub_servicio_vinculos };
}
async function readStore(): Promise<Store> { try { return normalizeStore(JSON.parse(await readFile(DATA_FILE, "utf8"))); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; const store = normalizeStore({}); await writeStore(store); return store; } }
async function writeStore(store: Store) { await mkdir(path.dirname(DATA_FILE), { recursive: true }); await writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8"); }
function serviciosPublicos(store: Store, hubId: string): HubServicioPublico[] { return store.hub_servicios.filter((servicio) => servicio.hub_id === hubId && servicio.activo).map((servicio) => { const vinculos = store.hub_servicio_vinculos.filter((vinculo) => vinculo.hub_servicio_id === servicio.id); return { ...servicio, vinculoActivo: vinculos.find((vinculo) => vinculo.estado === "ACTIVO") || null, postulantes: vinculos.filter((vinculo) => vinculo.estado === "POSTULANTE") }; }); }
export async function getHubs(): Promise<HubPublico[]> { const store = await readStore(); return store.hubs.filter((hub) => hub.activo).map((hub) => ({ ...hub, clientesActivos: store.clientes.filter((cliente) => cliente.hubId === hub.id && cliente.estado === "activo").length, servicios: serviciosPublicos(store, hub.id) })); }
export async function getHubBySlug(slug: string): Promise<HubPublico | null> { return (await getHubs()).find((hub) => hub.slug === slug) || null; }
export function slugHub(valor: string) { return valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `hub-${Date.now()}`; }
export async function createHubDemanda(input: NuevoHubDemandaInput) { const store = await readStore(); const timestamp = new Date().toISOString(); const nombre = input.nombre.trim() || `Hub ${input.zona.trim() || "nuevo"}`; const zona = input.zona.trim() || nombre.replace(/^Hub\s+/i, ""); const baseSlug = slugHub(nombre.replace(/^Hub\s+/i, "")); let slug = baseSlug; let suffix = 2; while (store.hubs.some((hub) => hub.slug === slug)) { slug = `${baseSlug}-${suffix}`; suffix += 1; } const nuevo: Hub = { id: `hub-${Date.now()}`, nombre, slug, zona, estado: "activo", descripcionPublica: input.descripcionPublica?.trim() || `Hub de demanda de ${zona} para agrupar clientes y coordinar oferta operativa disponible.`, rama: input.rama?.trim() || "General", equipoOperativo: input.equipoOperativo?.trim() || "Equipo a asignar", activo: true, trabajosRealizados: 0, ultimaActividad: timestamp, createdAt: timestamp, updatedAt: timestamp }; store.hubs = [nuevo, ...store.hubs]; await writeStore(store); return { ...nuevo, clientesActivos: 0, servicios: [] }; }
export async function addClienteToHub(hubId: string, cliente: Omit<Cliente, "id" | "hubId" | "estado" | "createdAt" | "updatedAt">) { const store = await readStore(); const timestamp = new Date().toISOString(); const nuevo: Cliente = { id: `cliente-${Date.now()}`, hubId, estado: "activo", createdAt: timestamp, updatedAt: timestamp, ...cliente }; store.clientes = [nuevo, ...store.clientes]; await writeStore(store); return nuevo; }
export async function updatePublicStore(mutator: (store: Store) => Store | Promise<Store>) { const store = await readStore(); const next = await mutator(store); await writeStore(next); return next; }
export async function getPublicStore() { return readStore(); }
