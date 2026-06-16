import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { equiposActivosIniciales } from "@/lib/data/equiposActivos";
import { type EstadoHubVinculo, type HubVinculo, type HubVinculoEquipo } from "@/lib/data/hubVinculosTypes";

const DATA_FILE = path.join(process.cwd(), "data", "hub-vinculos.json");
type Store = { hub_vinculos: HubVinculo[]; hub_vinculo_equipos: HubVinculoEquipo[] };
const now = new Date().toISOString();
const seedVinculos: HubVinculo[] = [
  { id: "vinculo-hub-tipal-jardinerosya01", hub_id: "Hub Tipal", oferta_id: "equipo-jardinerosya01", estado: "ACTIVO", rol: "Resolutor principal", fecha_inicio: now.slice(0, 10), fecha_fin: "", capacidad: "Mantenimiento recurrente", observaciones: "Resuelve demanda base del Hub Tipal.", created_at: now, updated_at: now },
  { id: "vinculo-hub-tipal-fumigadoresya01", hub_id: "Hub Tipal", oferta_id: "equipo-fumigadoresya01", estado: "ACTIVO", rol: "Resolutor especializado", fecha_inicio: now.slice(0, 10), fecha_fin: "", capacidad: "Fumigación y control", observaciones: "Oferta especializada vinculada a demanda agrupada.", created_at: now, updated_at: now },
  { id: "vinculo-hub-prado-jardinerosya02", hub_id: "Hub Prado", oferta_id: "equipo-jardinerosya02", estado: "POSTULANTE", rol: "Postulante", fecha_inicio: "", fecha_fin: "", capacidad: "Equipo en formación", observaciones: "Postulación para participar en la resolución.", created_at: now, updated_at: now },
];
const seedEquipos: HubVinculoEquipo[] = seedVinculos.flatMap((vinculo) => {
  const equipo = equiposActivosIniciales.find((item) => item.id === vinculo.oferta_id);
  return equipo?.integrantes[0] ? [{ id: `vinculo-equipo-${vinculo.id}`, vinculo_id: vinculo.id, persona_id: equipo.integrantes[0].id, tipo_equipo: "PRINCIPAL" as const }] : [];
});

async function readStore(): Promise<Store> {
  try { return JSON.parse(await readFile(DATA_FILE, "utf8")); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const store = { hub_vinculos: seedVinculos, hub_vinculo_equipos: seedEquipos };
    await writeStore(store);
    return store;
  }
}
async function writeStore(store: Store) { await mkdir(path.dirname(DATA_FILE), { recursive: true }); await writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8"); }
function clean(input: Partial<HubVinculo>, existing?: HubVinculo): HubVinculo {
  const timestamp = new Date().toISOString();
  return { id: existing?.id || input.id || `vinculo-${Date.now()}`, hub_id: String(input.hub_id || existing?.hub_id || ""), oferta_id: String(input.oferta_id || existing?.oferta_id || ""), estado: (input.estado || existing?.estado || "POSTULANTE") as EstadoHubVinculo, rol: String(input.rol ?? existing?.rol ?? "Resolutor"), fecha_inicio: String(input.fecha_inicio ?? existing?.fecha_inicio ?? ""), fecha_fin: String(input.fecha_fin ?? existing?.fecha_fin ?? ""), capacidad: String(input.capacidad ?? existing?.capacidad ?? ""), observaciones: String(input.observaciones ?? existing?.observaciones ?? ""), created_at: existing?.created_at || timestamp, updated_at: timestamp };
}
export async function getHubVinculos(hubId?: string) { const store = await readStore(); return hubId ? store.hub_vinculos.filter((v) => v.hub_id === hubId) : store.hub_vinculos; }
export async function createHubVinculo(input: Partial<HubVinculo>) { if (!input.hub_id || !input.oferta_id) throw new Error("hub_id y oferta_id son obligatorios."); const store = await readStore(); const vinculo = clean(input); store.hub_vinculos = [vinculo, ...store.hub_vinculos]; await writeStore(store); return vinculo; }
export async function updateHubVinculo(id: string, input: Partial<HubVinculo>) { const store = await readStore(); const existing = store.hub_vinculos.find((v) => v.id === id); if (!existing) return null; const updated = clean(input, existing); store.hub_vinculos = store.hub_vinculos.map((v) => v.id === id ? updated : v); await writeStore(store); return updated; }
export async function deleteHubVinculo(id: string) { const store = await readStore(); const existed = store.hub_vinculos.some((v) => v.id === id); store.hub_vinculos = store.hub_vinculos.filter((v) => v.id !== id); store.hub_vinculo_equipos = store.hub_vinculo_equipos.filter((e) => e.vinculo_id !== id); if (existed) await writeStore(store); return existed; }
export async function getHubVinculoEquipos(vinculoId?: string) { const store = await readStore(); return vinculoId ? store.hub_vinculo_equipos.filter((e) => e.vinculo_id === vinculoId) : store.hub_vinculo_equipos; }
