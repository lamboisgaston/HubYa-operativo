import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type EstadoConsultaHub = "borrador" | "activa" | "cerrada";
export type ClienteConsultaHub = { id: number; nombre: string; telefono: string; email: string; token?: string };
export type RespuestaConsultaHub = { clienteId: number; opcion: string; respondidoEn: string };
export type ConsultaHubPersistida = {
  id: string;
  hub: string;
  titulo: string;
  pregunta: string;
  opciones: string[];
  clientesDestinatarios: ClienteConsultaHub[];
  respuestas: RespuestaConsultaHub[];
  fechaCreacion: string;
  estado: EstadoConsultaHub;
};

const CONSULTAS_FILE = path.join(process.cwd(), "data", "consultas-hub.json");
const OPCIONES_CANONICAS: Record<string, string> = { si: "Sí", no: "No", "puede-ser": "Puede ser" };

export function normalizarRespuestaConsulta(respuesta: string) {
  const slug = respuesta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return OPCIONES_CANONICAS[slug] || respuesta.trim();
}

function normalizarConsulta(consulta: Partial<ConsultaHubPersistida>): ConsultaHubPersistida | null {
  if (!consulta.id || !consulta.hub) return null;
  return {
    id: consulta.id,
    hub: consulta.hub,
    titulo: consulta.titulo || "Consulta del Hub",
    pregunta: consulta.pregunta || "",
    opciones: Array.isArray(consulta.opciones) && consulta.opciones.length ? consulta.opciones : ["Sí", "No", "Puede ser"],
    clientesDestinatarios: Array.isArray(consulta.clientesDestinatarios) ? consulta.clientesDestinatarios : [],
    respuestas: Array.isArray(consulta.respuestas) ? consulta.respuestas : [],
    fechaCreacion: consulta.fechaCreacion || new Date().toISOString(),
    estado: consulta.estado || "borrador",
  };
}

export async function leerConsultasPersistidas() {
  try {
    const contenido = await readFile(CONSULTAS_FILE, "utf8");
    const consultas = JSON.parse(contenido) as Partial<ConsultaHubPersistida>[];
    return consultas.map(normalizarConsulta).filter((consulta): consulta is ConsultaHubPersistida => Boolean(consulta));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function guardarConsultasPersistidas(consultas: ConsultaHubPersistida[]) {
  await mkdir(path.dirname(CONSULTAS_FILE), { recursive: true });
  await writeFile(CONSULTAS_FILE, `${JSON.stringify(consultas, null, 2)}\n`, "utf8");
}

export async function upsertConsultaPersistida(consulta: ConsultaHubPersistida) {
  const consultas = await leerConsultasPersistidas();
  const existentes = consultas.filter((item) => item.id !== consulta.id);
  await guardarConsultasPersistidas([consulta, ...existentes]);
  return consulta;
}

export async function registrarRespuestaConsulta(token: string, respuesta: string) {
  const consultas = await leerConsultasPersistidas();
  const opcion = normalizarRespuestaConsulta(respuesta);
  const respondidoEn = new Date().toISOString();
  let resultado: { consulta: ConsultaHubPersistida; cliente: ClienteConsultaHub; opcion: string; respondidoEn: string } | null = null;

  const actualizadas = consultas.map((consulta) => {
    const cliente = consulta.clientesDestinatarios.find((destinatario) => destinatario.token === token);
    if (!cliente) return consulta;
    const respuestas = consulta.respuestas.filter((item) => item.clienteId !== cliente.id);
    const actualizada = { ...consulta, respuestas: [...respuestas, { clienteId: cliente.id, opcion, respondidoEn }] };
    resultado = { consulta: actualizada, cliente, opcion, respondidoEn };
    return actualizada;
  });

  if (resultado) await guardarConsultasPersistidas(actualizadas);
  return resultado;
}
