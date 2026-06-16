export type EstadoEquipoActivo = "activo" | "en formación" | "pausado" | "cerrado";
export type TipoEquipoActivo = "JardinerosYa" | "FumigadoresYa" | "Paisajismo" | "Mantenimiento" | "Otro";
export type RolIntegrante = "responsable" | "capataz" | "operario" | "técnico" | "paisajista" | "asesor técnico" | "auxiliar" | "otro";
export type EstadoIntegrante = "activo" | "disponible" | "en evaluación" | "pausado" | "fuera del equipo";

export type IntegranteEquipoActivo = {
  id: string;
  nombre: string;
  rol: RolIntegrante;
  email: string;
  whatsapp: string;
  estado: EstadoIntegrante;
  observacion: string;
};

export type MensajeEquipoActivo = { id: string; asunto: string; mensaje: string; fecha: string; destinatarios: string[]; canal: "email" | "whatsapp preparado" };
export type RespuestaConsultaEquipo = { integranteId: string; opcion: "Sí" | "No" | "Puede ser"; respondidoEn: string };
export type ConsultaEquipoActivo = { id: string; pregunta: string; opciones: string[]; fecha: string; respuestas: RespuestaConsultaEquipo[] };

export type EquipoActivo = {
  id: string;
  nombre: string;
  slug: string;
  tipo: TipoEquipoActivo;
  estado: EstadoEquipoActivo;
  zonaBase: string;
  descripcion: string;
  responsable: string;
  integrantes: IntegranteEquipoActivo[];
  hubsDemandaVinculados: string[];
  fechaCreacion: string;
  observaciones: string;
  mensajesEnviados: MensajeEquipoActivo[];
  consultasEnviadas: ConsultaEquipoActivo[];
};

export type SolicitudOferta = {
  id: string;
  nombre: string;
  whatsapp: string;
  email: string;
  zona: string;
  experiencia: string;
  rubroInteres: string;
  mensaje: string;
  equipoInteres: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  fecha: string;
};

export const EQUIPOS_ACTIVOS_STORAGE_KEY = "hubya-equipos-activos";
export const SOLICITUDES_OFERTA_STORAGE_KEY = "hubya-solicitudes-oferta";
export const ESTADOS_EQUIPO_ACTIVO: EstadoEquipoActivo[] = ["activo", "en formación", "pausado", "cerrado"];
export const TIPOS_EQUIPO_ACTIVO: TipoEquipoActivo[] = ["JardinerosYa", "FumigadoresYa", "Paisajismo", "Mantenimiento", "Otro"];
export const ROLES_INTEGRANTE: RolIntegrante[] = ["responsable", "capataz", "operario", "técnico", "paisajista", "asesor técnico", "auxiliar", "otro"];
export const ESTADOS_INTEGRANTE: EstadoIntegrante[] = ["activo", "disponible", "en evaluación", "pausado", "fuera del equipo"];

const hoy = new Date().toISOString();
const integrante = (nombre: string, rol: RolIntegrante = "operario"): IntegranteEquipoActivo => ({ id: `integrante-${nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`, nombre, rol, email: "", whatsapp: "", estado: "activo", observacion: "" });

export const equiposActivosIniciales: EquipoActivo[] = [
  { id: "equipo-jardinerosya01", nombre: "JardinerosYa01", slug: "jardinerosya01", tipo: "JardinerosYa", estado: "activo", zonaBase: "Zona norte", descripcion: "Equipo operativo activo para mantenimiento de espacios verdes.", responsable: "Hernán Llanes", integrantes: ["Hernán Llanes", "Armando D. Castillo", "Lautaro Gutiérrez", "Jorgelina Diez Gómez", "Gastón Lambois", "Mauricio Vallejos", "Exequiel R. Garzón"].map((nombre, index) => integrante(nombre, index === 0 ? "responsable" : "operario")), hubsDemandaVinculados: ["Hub Tipal", "Hub Punto", "Hub Praderas"], fechaCreacion: hoy, observaciones: "Equipo base para vincular demanda recurrente.", mensajesEnviados: [], consultasEnviadas: [] },
  { id: "equipo-jardinerosya02", nombre: "JardinerosYa02", slug: "jardinerosya02", tipo: "JardinerosYa", estado: "en formación", zonaBase: "Zona oeste", descripcion: "Equipo en formación para ampliar cobertura.", responsable: "", integrantes: [], hubsDemandaVinculados: ["Hub Prado"], fechaCreacion: hoy, observaciones: "Completar responsable e integrantes.", mensajesEnviados: [], consultasEnviadas: [] },
  { id: "equipo-fumigadoresya01", nombre: "FumigadoresYa01", slug: "fumigadoresya01", tipo: "FumigadoresYa", estado: "activo", zonaBase: "Salta", descripcion: "Equipo operativo para fumigación y control.", responsable: "Gastón Lambois", integrantes: ["Gastón Lambois", "Exequiel Garzón", "Armando D. Castillo", "Luis Mamani", "Martín Llanes"].map((nombre, index) => integrante(nombre, index === 0 ? "responsable" : "técnico")), hubsDemandaVinculados: [], fechaCreacion: hoy, observaciones: "Oferta especializada disponible.", mensajesEnviados: [], consultasEnviadas: [] },
];

export function slugEquipo(nombre: string) { return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `equipo-${Date.now()}`; }
export function getEquiposActivos() { return equiposActivosIniciales; }
export function getEquipoActivoById(id: string) { return getEquiposActivos().find((equipo) => equipo.id === id) || null; }
export function createEquipoActivo(input: Partial<EquipoActivo>): EquipoActivo { const nombre = input.nombre || "Equipo en formación"; return { id: `equipo-${Date.now()}`, nombre, slug: slugEquipo(nombre), tipo: input.tipo || "Otro", estado: input.estado || "en formación", zonaBase: input.zonaBase || "", descripcion: input.descripcion || "", responsable: input.responsable || "", integrantes: input.integrantes || [], hubsDemandaVinculados: input.hubsDemandaVinculados || [], fechaCreacion: new Date().toISOString(), observaciones: input.observaciones || "", mensajesEnviados: [], consultasEnviadas: [] }; }
export function updateEquipoActivo(equipo: EquipoActivo, cambios: Partial<EquipoActivo>) { return { ...equipo, ...cambios, slug: cambios.nombre ? slugEquipo(cambios.nombre) : equipo.slug }; }
export function addIntegranteToEquipo(equipo: EquipoActivo, integranteNuevo: Omit<IntegranteEquipoActivo, "id">) { return { ...equipo, integrantes: [{ id: `integrante-${Date.now()}`, ...integranteNuevo }, ...equipo.integrantes] }; }
export function removeIntegranteFromEquipo(equipo: EquipoActivo, integranteId: string) { return { ...equipo, integrantes: equipo.integrantes.filter((item) => item.id !== integranteId) }; }
export function vincularHubDemandaAEquipo(equipo: EquipoActivo, hub: string) { return equipo.hubsDemandaVinculados.includes(hub) ? equipo : { ...equipo, hubsDemandaVinculados: [...equipo.hubsDemandaVinculados, hub] }; }
export function getHubsDemandaByEquipo(equipo: EquipoActivo) { return equipo.hubsDemandaVinculados; }
export function createSolicitudOferta(input: Omit<SolicitudOferta, "id" | "estado" | "fecha">): SolicitudOferta { return { id: `solicitud-oferta-${Date.now()}`, estado: "pendiente", fecha: new Date().toISOString(), ...input }; }
export function approveSolicitudOferta(solicitud: SolicitudOferta) { return { ...solicitud, estado: "aprobada" as const }; }
export function rejectSolicitudOferta(solicitud: SolicitudOferta) { return { ...solicitud, estado: "rechazada" as const }; }
