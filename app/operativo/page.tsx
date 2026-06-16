"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EQUIPOS_ACTIVOS_STORAGE_KEY, ESTADOS_EQUIPO_ACTIVO, ESTADOS_INTEGRANTE, ROLES_INTEGRANTE, SOLICITUDES_OFERTA_STORAGE_KEY, TIPOS_EQUIPO_ACTIVO, createEquipoActivo, equiposActivosIniciales, slugEquipo, type ConsultaEquipoActivo, type EquipoActivo, type IntegranteEquipoActivo, type MensajeEquipoActivo, type SolicitudOferta } from "@/lib/data/equiposActivos";

type CampoNumerico = number | "";

type FilaClienteIngreso = {
  id: number;
  origen: string;
  nombre: string;
  referencia?: string;
  email: string;
  telefono: string;
  importe: CampoNumerico;
  trabajoRealizado: string;
  trabajoPendiente: string;
};

type FilaGasto = { id: number; concepto: string; importe: CampoNumerico };
type FilaActor = { id: number; nombre: string; activo: boolean; participacion: CampoNumerico; ajusteManual: CampoNumerico };

type ResumenHubManual = {
  tiempoEfectivo: string;
  estadoOperativo: string;
  observacionGeneral: string;
};

type HubDisponible = (typeof HUBS_DISPONIBLES)[number];
type DatosHub = {
  clientesIngresos: FilaClienteIngreso[];
  gastos: FilaGasto[];
  actores: FilaActor[];
  resumen: ResumenHubManual;
  clienteActivoId: number;
};
type DatosPorHub = Record<HubDisponible, DatosHub>;

type TotalesResumenHub = {
  totalFacturado: number;
  totalGastos: number;
  totalADistribuir: number;
  totalDistribuido: number;
};

type ResumenGuardadoHub = {
  id: string;
  hub: HubDisponible;
  fecha: string;
  nombre: string;
  guardadoEn: string;
  datos: DatosHub;
  gastos: FilaGasto[];
  distribucion: (FilaActor & { importeDistribuido: number; importeFinal: number })[];
  totales: TotalesResumenHub;
  tiempoEfectivo: string;
  estadoOperativo: string;
  observacion: string;
  notaInstitucional: string[];
  reporteTexto: string;
};

type HistorialResumenesPorHub = Record<HubDisponible, ResumenGuardadoHub[]>;

type JornadaOperativa = {
  hub: HubDisponible;
  fecha: string;
  nombreResumen: string;
  datosPorHub: DatosPorHub;
};

type DestinatarioSeleccionado = {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  incluido: boolean;
};


type RolContactoImportado = "CLIENTE" | "JARDINERO" | "MANOVERDE" | "USUARIO" | "OTRO";
type HubImportacion = HubDisponible | "Sin Hub asignado";
type TipoDestinoImportacion = "cliente" | "actor" | "auxiliar" | "ignorar";

type ContactoImportado = {
  id: string;
  incluir: boolean;
  rol: RolContactoImportado;
  nombre: string;
  referencia: string;
  whatsapp: string;
  email: string;
  fechaRegistro: string;
  pinAcceso: string;
  hub: HubImportacion;
  tipoDestino: TipoDestinoImportacion;
  observacion: string;
};

type ContactoSinHub = Omit<ContactoImportado, "incluir"> & { guardadoEn: string };
type ResumenGuardadoContactos = { clientesConHub: number; clientesSinHub: number; actores: number; auxiliares: number; ignorados: number };

type EstadoConsultaHub = "borrador" | "activa" | "cerrada";
type ClienteConsultaHub = { id: number; nombre: string; telefono: string; email: string; token?: string };
type RespuestaConsultaHub = { clienteId: number; opcion: string; respondidoEn: string };
type ConsultaHub = {
  id: string;
  hub: HubDisponible;
  titulo: string;
  pregunta: string;
  opciones: string[];
  clientesDestinatarios: ClienteConsultaHub[];
  respuestas: RespuestaConsultaHub[];
  fechaCreacion: string;
  estado: EstadoConsultaHub;
};

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";
const HISTORIAL_RESUMENES_STORAGE_KEY = "hubya-historial-resumenes";
const INFORMACION_STORAGE_KEY = "hubya-envio-informacion-borrador";
const CONTACTOS_SIN_HUB_STORAGE_KEY = "clientesSinHub";
const CONTACTOS_SIN_HUB_LEGACY_STORAGE_KEY = "hubya-contactos-sin-hub";
const CLIENTES_POR_HUB_STORAGE_KEY = "clientesPorHub";
const CONTACTOS_TRABAJO_STORAGE_KEY = "hubya-contactos-trabajo";
const LISTA_GENERAL_CONTACTOS_STORAGE_KEY = "listaGeneralContactos";
const ACTORES_EQUIPO_STORAGE_KEY = "actoresEquipo";
const AUXILIARES_STORAGE_KEY = "auxiliares";
const CONSULTAS_HUB_STORAGE_KEY = "hubya-consultas-hub";

const HUBS_DISPONIBLES = [
  "Hub Tipal",
  "Hub Punto",
  "Hub Praderas",
  "Hub Valle Escondido",
  "Hub Chacras de Santa María",
  "Hub La Aguada",
  "Hub Prado",
  "Hub La Reserva",
] as const;

const trabajoRealizadoInicial = "Mantenimiento integral de espacios verdes, corte, bordes y limpieza general.";
const trabajoPendienteInicial = "Validación final con cada cliente y próximos repasos programados.";
const observacionGeneralInicial = "Resumen cargado manualmente. Sin cálculos automáticos obligatorios.";
const sobreHubYaLineas = [
  "HubYa es una tecnología cooperativista de inteligencia salteña.",
  "Agrupa demanda para coordinar mejor la oferta disponible y ejecutar procesos específicos según cada rama de servicio.",
  "La lógica es simple: una demanda agrupada permite organizar mejor horarios, tareas, personal, traslados y recursos. Por eso un Hub es más eficiente que clientes aislados y dispersos.",
  "En JardinerosYa hablamos de usuarios del sistema. En HubYa hablamos de clientes, porque el Hub se construye desde la demanda.",
  "Filosofía HubYa: el agrupamiento de la demanda mejora el agrupamiento de la oferta, y el agrupamiento de la oferta mejora la capacidad de abastecer la demanda.",
];
const clientesBasePorHub: Record<HubDisponible, string[]> = {
  "Hub Tipal": [],
  "Hub Punto": [],
  "Hub Praderas": [],
  "Hub Valle Escondido": [],
  "Hub Chacras de Santa María": [],
  "Hub La Aguada": [],
  "Hub Prado": [],
  "Hub La Reserva": [],
};

function crearId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function crearImportId(index = 0, semilla = "") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const base = normalizarTextoBusqueda(semilla).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "contacto";
  return `import-${Date.now()}-${index}-${base}-${Math.random().toString(36).slice(2, 10)}`;
}

function idNumericoEstable(valor: string) {
  let hash = 0;
  for (let index = 0; index < valor.length; index += 1) hash = (hash * 31 + valor.charCodeAt(index)) >>> 0;
  return hash || crearId();
}

function normalizarNumero(valor: string): CampoNumerico {
  return valor === "" ? "" : Number(valor);
}

function formatoMoneda(valor: CampoNumerico | undefined) {
  return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoPlano(valor: CampoNumerico | undefined) {
  return valor === "" || valor === undefined ? "" : formatoMoneda(valor);
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR");
}

function resumenInicial(): ResumenHubManual {
  return {
    tiempoEfectivo: "",
    estadoOperativo: "Operativo",
    observacionGeneral: observacionGeneralInicial,
  };
}

function clienteIngresoInicial(nombre: string, index = 0, baseId = 1000): FilaClienteIngreso {
  return {
    id: baseId + index,
    origen: "JardinerosYa",
    nombre,
    email: "",
    telefono: "",
    importe: 0,
    trabajoRealizado: trabajoRealizadoInicial,
    trabajoPendiente: trabajoPendienteInicial,
  };
}

function datosHubInicial(hub: HubDisponible): DatosHub {
  const hubIndex = HUBS_DISPONIBLES.indexOf(hub) + 1;
  const clientesIngresos = clientesBasePorHub[hub].map((nombre, index) => clienteIngresoInicial(nombre, index, hubIndex * 1000));
  return {
    clientesIngresos,
    gastos: ["Nafta", "Maquinaria", "JardinerosYa", "Tanza"].map((concepto, index) => ({ id: hubIndex * 10000 + index, concepto, importe: 0 })),
    actores: ["Hernán Llanes", "Armando Castillo", "Mauricio Vallejos"].map((nombre, index) => ({ id: hubIndex * 100000 + index, nombre, activo: true, participacion: 1, ajusteManual: 0 })),
    resumen: resumenInicial(),
    clienteActivoId: clientesIngresos[0]?.id || 0,
  };
}

const datosInicialesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, datosHubInicial(hub)])) as DatosPorHub;

const fechaInicial = new Date().toISOString().slice(0, 10);

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: fechaInicial,
  nombreResumen: "",
  datosPorHub: datosInicialesPorHub,
};

function leerBorradorInformacion() {
  if (typeof window === "undefined") return { asunto: "", mensaje: "", nota: "" };
  const borrador = window.localStorage.getItem(INFORMACION_STORAGE_KEY);
  if (!borrador) return { asunto: "", mensaje: "", nota: "" };
  try {
    const datos = JSON.parse(borrador) as { asunto?: string; mensaje?: string; nota?: string };
    return { asunto: datos.asunto || "", mensaje: datos.mensaje || "", nota: datos.nota || "" };
  } catch {
    window.localStorage.removeItem(INFORMACION_STORAGE_KEY);
    return { asunto: "", mensaje: "", nota: "" };
  }
}

function normalizarCliente(cliente: Partial<FilaClienteIngreso>): FilaClienteIngreso {
  return {
    id: cliente.id || crearId(),
    origen: "JardinerosYa",
    nombre: cliente.nombre || "",
    referencia: cliente.referencia || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    importe: cliente.importe ?? 0,
    trabajoRealizado: cliente.trabajoRealizado || trabajoRealizadoInicial,
    trabajoPendiente: cliente.trabajoPendiente || trabajoPendienteInicial,
  };
}

function normalizarActor(actor: Partial<FilaActor> & { actor?: string; importe?: CampoNumerico }): FilaActor {
  return {
    id: actor.id || crearId(),
    nombre: actor.nombre || actor.actor || "",
    activo: actor.activo ?? true,
    participacion: actor.participacion ?? 1,
    ajusteManual: actor.ajusteManual ?? actor.importe ?? 0,
  };
}

function numero(valor: CampoNumerico | undefined) {
  return Number(valor || 0);
}

function normalizarDatosHub(datos: (Partial<DatosHub> & { distribucion?: (Partial<FilaActor> & { actor?: string; importe?: CampoNumerico })[] }) | undefined, hub: HubDisponible): DatosHub {
  const base = datosHubInicial(hub);
  const clientesIngresos = (datos?.clientesIngresos || base.clientesIngresos).map(normalizarCliente);
  return {
    clientesIngresos,
    gastos: (datos?.gastos || base.gastos).map((gasto) => ({ id: gasto.id || crearId(), concepto: gasto.concepto || "", importe: gasto.importe ?? 0 })),
    actores: (datos?.actores || datos?.distribucion || base.actores).map(normalizarActor),
    resumen: { ...resumenInicial(), ...datos?.resumen },
    clienteActivoId: clientesIngresos.some((cliente) => cliente.id === datos?.clienteActivoId) ? Number(datos?.clienteActivoId) : clientesIngresos[0]?.id || 0,
  };
}

function historialVacio(): HistorialResumenesPorHub {
  return Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, []])) as unknown as HistorialResumenesPorHub;
}

function normalizarResumenGuardado(resumen: Partial<ResumenGuardadoHub>, hub: HubDisponible): ResumenGuardadoHub {
  const datos = normalizarDatosHub(resumen.datos, hub);
  const totalesBase = resumen.totales || { totalFacturado: 0, totalGastos: 0, totalADistribuir: 0, totalDistribuido: 0 };
  return {
    id: resumen.id || String(crearId()),
    hub,
    fecha: resumen.fecha || fechaInicial,
    nombre: resumen.nombre || `Jornada ${hub} — ${formatoFecha(resumen.fecha || fechaInicial)}`,
    guardadoEn: resumen.guardadoEn || new Date().toISOString(),
    datos,
    gastos: (resumen.gastos || datos.gastos).map((gasto) => ({ id: gasto.id || crearId(), concepto: gasto.concepto || "", importe: gasto.importe ?? 0 })),
    distribucion: (resumen.distribucion || []).map((actor) => ({ ...normalizarActor(actor), importeDistribuido: Number(actor.importeDistribuido || 0), importeFinal: Number(actor.importeFinal || 0) })),
    totales: {
      totalFacturado: Number(totalesBase.totalFacturado || 0),
      totalGastos: Number(totalesBase.totalGastos || 0),
      totalADistribuir: Number(totalesBase.totalADistribuir || 0),
      totalDistribuido: Number(totalesBase.totalDistribuido || 0),
    },
    tiempoEfectivo: resumen.tiempoEfectivo || datos.resumen.tiempoEfectivo || "",
    estadoOperativo: resumen.estadoOperativo || datos.resumen.estadoOperativo || "",
    observacion: resumen.observacion || datos.resumen.observacionGeneral || "",
    notaInstitucional: resumen.notaInstitucional || sobreHubYaLineas,
    reporteTexto: resumen.reporteTexto || "",
  };
}

function normalizarHistorial(valor: unknown): HistorialResumenesPorHub {
  const historial = historialVacio();
  if (!valor || typeof valor !== "object") return historial;
  const parcial = valor as Partial<Record<HubDisponible, Partial<ResumenGuardadoHub>[]>>;
  HUBS_DISPONIBLES.forEach((hub) => {
    historial[hub] = (parcial[hub] || []).map((resumen) => normalizarResumenGuardado(resumen, hub));
  });
  return historial;
}

function leerHistorialResumenes() {
  if (typeof window === "undefined") return historialVacio();
  const guardado = window.localStorage.getItem(HISTORIAL_RESUMENES_STORAGE_KEY);
  if (!guardado) return historialVacio();
  try {
    return normalizarHistorial(JSON.parse(guardado));
  } catch {
    window.localStorage.removeItem(HISTORIAL_RESUMENES_STORAGE_KEY);
    return historialVacio();
  }
}


function normalizarTextoBusqueda(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function detectarRol(linea: string): RolContactoImportado {
  const texto = normalizarTextoBusqueda(linea);
  if (/\bcliente\b/.test(texto)) return "CLIENTE";
  if (/\bjardinero\b/.test(texto)) return "JARDINERO";
  if (/\bmanoverde\b/.test(texto)) return "MANOVERDE";
  if (/\busuario\b/.test(texto)) return "USUARIO";
  return "OTRO";
}

function detectarHub(linea: string): HubImportacion {
  const texto = normalizarTextoBusqueda(linea);
  if (texto.includes("tipal")) return "Hub Tipal";
  if (texto.includes("pradera") || texto.includes("praderas")) return "Hub Praderas";
  if (texto.includes("prado")) return "Hub Prado";
  if (texto.includes("punto") || texto.includes("shopping")) return "Hub Punto";
  if (texto.includes("chacras")) return "Hub Chacras de Santa María";
  if (texto.includes("aguada")) return "Hub La Aguada";
  if (texto.includes("reserva")) return "Hub La Reserva";
  if (texto.includes("valle escondido")) return "Hub Valle Escondido";
  return "Sin Hub asignado";
}

function tipoDestinoPorRol(rol: RolContactoImportado): TipoDestinoImportacion {
  if (rol === "CLIENTE") return "cliente";
  if (rol === "JARDINERO") return "actor";
  if (rol === "MANOVERDE" || rol === "USUARIO") return "auxiliar";
  return "ignorar";
}

function extraerCampo(linea: string, etiquetas: string[]) {
  for (const etiqueta of etiquetas) {
    const patron = new RegExp(`${etiqueta}\\s*:?\\s*([^,;|\\t]+)`, "i");
    const encontrado = linea.match(patron)?.[1]?.trim();
    if (encontrado) return encontrado;
  }
  return "";
}

function procesarLineaContacto(linea: string, index: number): ContactoImportado | null {
  const limpia = linea.trim();
  if (!limpia) return null;
  const partes = limpia.split(/[;,|\t]/).map((parte) => parte.trim()).filter(Boolean);
  const rol = detectarRol(limpia);
  const email = limpia.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const whatsapp = extraerCampo(limpia, ["whatsapp", "telefono", "tel", "celular"]) || limpia.match(/(?:\+?54\s?)?(?:\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
  const fechaRegistro = extraerCampo(limpia, ["fecha registro", "fecha", "registro"]) || limpia.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/)?.[0] || "";
  const pinAcceso = extraerCampo(limpia, ["pin acceso", "pin"]);
  const sinEtiquetas = partes.map((parte) => parte.replace(/^(rol|nombre|apellido|referencia|whatsapp|telefono|tel|celular|email|fecha registro|fecha|registro|pin acceso|pin)\s*:?\s*/i, ""));
  const candidatosNombre = sinEtiquetas.filter((parte) => parte && !normalizarTextoBusqueda(parte).includes(normalizarTextoBusqueda(rol)) && parte !== email && parte !== whatsapp && parte !== fechaRegistro && parte !== pinAcceso);
  const nombre = extraerCampo(limpia, ["nombre"]) || candidatosNombre[0] || "";
  const referencia = extraerCampo(limpia, ["apellido", "referencia"]) || candidatosNombre.slice(1).join(" · ");
  return {
    id: crearImportId(index, `${email}|${nombre}|${referencia}|${limpia}`),
    incluir: rol !== "OTRO",
    rol,
    nombre,
    referencia,
    whatsapp,
    email,
    fechaRegistro,
    pinAcceso,
    hub: detectarHub(limpia),
    tipoDestino: tipoDestinoPorRol(rol),
    observacion: "",
  };
}

function leerContactosTrabajo() {
  if (typeof window === "undefined") return [] as ContactoImportado[];
  const guardados = window.localStorage.getItem(LISTA_GENERAL_CONTACTOS_STORAGE_KEY) || window.localStorage.getItem(CONTACTOS_TRABAJO_STORAGE_KEY);
  if (!guardados) return [] as ContactoImportado[];
  try {
    const contactos = JSON.parse(guardados) as Partial<ContactoImportado>[];
    const idsUsados = new Set<string>();
    const normalizados = contactos.map((contacto, index) => {
      const semilla = `${contacto.email || ""}|${contacto.nombre || ""}|${contacto.referencia || ""}|${index}`;
      let id = contacto.id || crearImportId(index, semilla);
      while (idsUsados.has(id)) id = crearImportId(index, semilla);
      idsUsados.add(id);
      return {
        id,
        incluir: contacto.incluir ?? true,
        rol: contacto.rol || "OTRO",
        nombre: contacto.nombre || "",
        referencia: contacto.referencia || "",
        whatsapp: contacto.whatsapp || "",
        email: contacto.email || "",
        fechaRegistro: contacto.fechaRegistro || "",
        pinAcceso: contacto.pinAcceso || "",
        hub: HUBS_DISPONIBLES.includes(contacto.hub as HubDisponible) ? contacto.hub as HubImportacion : "Sin Hub asignado",
        tipoDestino: contacto.tipoDestino || "cliente",
        observacion: contacto.observacion || "",
      };
    });
    return Array.from(new Map(normalizados.map((contacto) => [claveContactoPersistido(contacto), contacto])).values());
  } catch {
    window.localStorage.removeItem(LISTA_GENERAL_CONTACTOS_STORAGE_KEY);
    window.localStorage.removeItem(CONTACTOS_TRABAJO_STORAGE_KEY);
    return [] as ContactoImportado[];
  }
}

function claveContactoPersistido(contacto: Pick<ContactoImportado, "email" | "nombre" | "referencia">) {
  const email = contacto.email.trim().toLowerCase();
  if (email) return `email:${email}`;
  return `nombre-ref:${normalizarTextoBusqueda(`${contacto.nombre.trim()}|${contacto.referencia.trim()}`)}`;
}

function leerAuxiliares() {
  if (typeof window === "undefined") return [] as ContactoImportado[];
  const guardados = window.localStorage.getItem(AUXILIARES_STORAGE_KEY);
  if (!guardados) return [] as ContactoImportado[];
  try {
    return JSON.parse(guardados) as ContactoImportado[];
  } catch {
    window.localStorage.removeItem(AUXILIARES_STORAGE_KEY);
    return [] as ContactoImportado[];
  }
}

function leerContactosSinHub() {
  if (typeof window === "undefined") return [] as ContactoSinHub[];
  const guardados = window.localStorage.getItem(CONTACTOS_SIN_HUB_STORAGE_KEY) || window.localStorage.getItem(CONTACTOS_SIN_HUB_LEGACY_STORAGE_KEY);
  if (!guardados) return [] as ContactoSinHub[];
  try {
    return JSON.parse(guardados) as ContactoSinHub[];
  } catch {
    window.localStorage.removeItem(CONTACTOS_SIN_HUB_STORAGE_KEY);
    return [] as ContactoSinHub[];
  }
}

function normalizarClientesPorHub(valor: unknown): Record<HubDisponible, FilaClienteIngreso[]> {
  const clientesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, []])) as unknown as Record<HubDisponible, FilaClienteIngreso[]>;
  if (!valor || typeof valor !== "object") return clientesPorHub;
  const parcial = valor as Partial<Record<HubDisponible, Partial<FilaClienteIngreso>[]>>;
  HUBS_DISPONIBLES.forEach((hub) => {
    clientesPorHub[hub] = (parcial[hub] || []).map(normalizarCliente);
  });
  return clientesPorHub;
}

function leerClientesPorHub() {
  if (typeof window === "undefined") return normalizarClientesPorHub(undefined);
  const guardado = window.localStorage.getItem(CLIENTES_POR_HUB_STORAGE_KEY);
  if (!guardado) return normalizarClientesPorHub(undefined);
  try {
    return normalizarClientesPorHub(JSON.parse(guardado));
  } catch {
    window.localStorage.removeItem(CLIENTES_POR_HUB_STORAGE_KEY);
    return normalizarClientesPorHub(undefined);
  }
}

function aplicarClientesPorHub(datosPorHub: DatosPorHub, clientesPorHub: Record<HubDisponible, FilaClienteIngreso[]>): DatosPorHub {
  return Object.fromEntries(HUBS_DISPONIBLES.map((hub) => {
    const clientesIngresos = clientesPorHub[hub] || [];
    return [hub, { ...datosPorHub[hub], clientesIngresos, clienteActivoId: clientesIngresos[0]?.id || 0 }];
  })) as DatosPorHub;
}

function crearTokenConsulta(consultaId: string, clienteId: number, hub: HubDisponible) {
  const base = `${consultaId}-${clienteId}-${hub}-${Math.random().toString(36).slice(2, 10)}`;
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(base))).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  return base.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}

function normalizarConsultaHub(consulta: Partial<ConsultaHub>): ConsultaHub | null {
  if (!consulta.id || !consulta.hub || !HUBS_DISPONIBLES.includes(consulta.hub)) return null;
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

function leerConsultasHub() {
  if (typeof window === "undefined") return [] as ConsultaHub[];
  const guardadas = window.localStorage.getItem(CONSULTAS_HUB_STORAGE_KEY);
  if (!guardadas) return [] as ConsultaHub[];
  try {
    const consultas = JSON.parse(guardadas) as Partial<ConsultaHub>[];
    return consultas.map(normalizarConsultaHub).filter((consulta): consulta is ConsultaHub => Boolean(consulta));
  } catch {
    window.localStorage.removeItem(CONSULTAS_HUB_STORAGE_KEY);
    return [] as ConsultaHub[];
  }
}

function fusionarConsultasHub(locales: ConsultaHub[], remotas: ConsultaHub[]) {
  const porId = new Map<string, ConsultaHub>();
  [...locales, ...remotas].forEach((consulta) => porId.set(consulta.id, consulta));
  return Array.from(porId.values()).sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
}

async function leerConsultasServidor() {
  const respuesta = await fetch("/api/consulta", { cache: "no-store" });
  if (!respuesta.ok) return [] as ConsultaHub[];
  const data = await respuesta.json().catch(() => ({}));
  const consultas = Array.isArray(data.consultas) ? data.consultas as Partial<ConsultaHub>[] : [];
  return consultas.map(normalizarConsultaHub).filter((consulta): consulta is ConsultaHub => Boolean(consulta));
}

async function guardarConsultaServidor(consulta: ConsultaHub) {
  return fetch("/api/consulta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consulta }) });
}

function normalizarJornada(jornada: Partial<JornadaOperativa> & { clientesPorHub?: Record<string, unknown[]>; resumenesPorHub?: Record<string, Partial<ResumenHubManual>> }): JornadaOperativa {
  const hub = HUBS_DISPONIBLES.includes(jornada.hub as HubDisponible) ? (jornada.hub as HubDisponible) : jornadaInicial.hub;
  const datosPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hubDisponible) => [hubDisponible, normalizarDatosHub(jornada.datosPorHub?.[hubDisponible], hubDisponible)])) as DatosPorHub;
  return { hub, fecha: jornada.fecha || jornadaInicial.fecha, nombreResumen: jornada.nombreResumen || "", datosPorHub };
}

function leerJornadaInicial(): JornadaOperativa {
  if (typeof window === "undefined") return jornadaInicial;
  const guardada = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  const base = guardada ? normalizarJornada(JSON.parse(guardada) as JornadaOperativa) : jornadaInicial;
  return { ...base, datosPorHub: aplicarClientesPorHub(base.datosPorHub, leerClientesPorHub()) };
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [hubSeleccionado, setHubSeleccionado] = useState(false);
  const [historialResumenes, setHistorialResumenes] = useState<HistorialResumenesPorHub>(historialVacio);
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [mensajeEnvio, setMensajeEnvio] = useState("Listo para enviar el reporte individual.");
  const [seccionActiva, setSeccionActiva] = useState<"reporte" | "informacion" | "importar" | "consultas" | "equipos">("reporte");
  const [hubInformacion, setHubInformacion] = useState<HubDisponible | "">("");
  const [asuntoInformacion, setAsuntoInformacion] = useState("");
  const [mensajeInformacion, setMensajeInformacion] = useState("");
  const [notaInformacion, setNotaInformacion] = useState("");
  const [destinatariosInformacion, setDestinatariosInformacion] = useState<DestinatarioSeleccionado[]>([]);
  const [estadoInformacion, setEstadoInformacion] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [mensajeEstadoInformacion, setMensajeEstadoInformacion] = useState("Listo para enviar información individual.");
  const [baseContactosCruda, setBaseContactosCruda] = useState("");
  const [contactosImportados, setContactosImportados] = useState<ContactoImportado[]>([]);
  const [contactosSinHub, setContactosSinHub] = useState<ContactoSinHub[]>([]);
  const [auxiliares, setAuxiliares] = useState<ContactoImportado[]>([]);
  const [mensajeImportacion, setMensajeImportacion] = useState("Pegá una base cruda, procesala, revisá la tabla y guardá los contactos seleccionados.");
  const [resumenGuardadoContactos, setResumenGuardadoContactos] = useState<ResumenGuardadoContactos | null>(null);
  const [consultasHub, setConsultasHub] = useState<ConsultaHub[]>([]);
  const [hubConsulta, setHubConsulta] = useState<HubDisponible>(jornadaInicial.hub);
  const [preguntaConsulta, setPreguntaConsulta] = useState("¿Vas a seguir formando parte del Hub Praderas el próximo año?");
  const [opcionesConsulta, setOpcionesConsulta] = useState(["Sí", "No", "Puede ser"]);
  const [clientesConsultaSeleccionados, setClientesConsultaSeleccionados] = useState<number[]>([]);
  const [consultaActivaId, setConsultaActivaId] = useState("");
  const [pasoConsulta, setPasoConsulta] = useState<"seleccionar" | "crear" | "enviar" | "resultados">("seleccionar");

  const [equiposActivos, setEquiposActivos] = useState<EquipoActivo[]>(equiposActivosIniciales);
  const [equipoActivoId, setEquipoActivoId] = useState(equiposActivosIniciales[0]?.id || "");
  const [solicitudesOferta, setSolicitudesOferta] = useState<SolicitudOferta[]>([]);
  const [mensajeEquipo, setMensajeEquipo] = useState({ asunto: "", mensaje: "" });
  const [integrantesMensajeSeleccionados, setIntegrantesMensajeSeleccionados] = useState<string[]>(equiposActivosIniciales[0]?.integrantes.map((integrante) => integrante.id) || []);
  const [preguntaEquipo, setPreguntaEquipo] = useState("¿Estás disponible para trabajar la próxima semana?");
  const reporteVisualRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setJornada(leerJornadaInicial());
    setHistorialResumenes(leerHistorialResumenes());
    setContactosSinHub(leerContactosSinHub());
    setContactosImportados(leerContactosTrabajo());
    setAuxiliares(leerAuxiliares());
    try { setEquiposActivos(JSON.parse(localStorage.getItem(EQUIPOS_ACTIVOS_STORAGE_KEY) || "null") || equiposActivosIniciales); } catch { setEquiposActivos(equiposActivosIniciales); }
    try { setSolicitudesOferta(JSON.parse(localStorage.getItem(SOLICITUDES_OFERTA_STORAGE_KEY) || "[]")); } catch { setSolicitudesOferta([]); }
    const consultasGuardadas = leerConsultasHub();
    setConsultasHub(consultasGuardadas);
    setConsultaActivaId("");
    leerConsultasServidor().then((consultasRemotas) => {
      setConsultasHub((actuales) => fusionarConsultasHub(actuales, consultasRemotas));
      setConsultaActivaId((actual) => actual);
    }).catch(() => {
      // Las respuestas externas requieren persistencia de servidor; localStorage no permite compartir estado entre el cliente que responde y el panel administrador.
    });
    const borradorInformacion = leerBorradorInformacion();
    setAsuntoInformacion(borradorInformacion.asunto);
    setMensajeInformacion(borradorInformacion.mensaje);
    setNotaInformacion(borradorInformacion.nota);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(HISTORIAL_RESUMENES_STORAGE_KEY, JSON.stringify(historialResumenes));
  }, [historialResumenes, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(CONTACTOS_SIN_HUB_STORAGE_KEY, JSON.stringify(contactosSinHub));
  }, [contactosSinHub, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LISTA_GENERAL_CONTACTOS_STORAGE_KEY, JSON.stringify(contactosImportados));
    localStorage.setItem(CONTACTOS_TRABAJO_STORAGE_KEY, JSON.stringify(contactosImportados));
  }, [contactosImportados, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(AUXILIARES_STORAGE_KEY, JSON.stringify(auxiliares));
  }, [auxiliares, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(CONSULTAS_HUB_STORAGE_KEY, JSON.stringify(consultasHub));
  }, [consultasHub, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(EQUIPOS_ACTIVOS_STORAGE_KEY, JSON.stringify(equiposActivos));
  }, [equiposActivos, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(SOLICITUDES_OFERTA_STORAGE_KEY, JSON.stringify(solicitudesOferta));
  }, [solicitudesOferta, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const sincronizarConsultas = () => {
      const locales = leerConsultasHub();
      setConsultasHub(locales);
      leerConsultasServidor().then((remotas) => setConsultasHub((actuales) => fusionarConsultasHub(actuales, remotas))).catch(() => undefined);
    };
    window.addEventListener("focus", sincronizarConsultas);
    window.addEventListener("storage", sincronizarConsultas);
    return () => {
      window.removeEventListener("focus", sincronizarConsultas);
      window.removeEventListener("storage", sincronizarConsultas);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const actoresEquipo = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, jornada.datosPorHub[hub].actores]));
    localStorage.setItem(ACTORES_EQUIPO_STORAGE_KEY, JSON.stringify(actoresEquipo));
  }, [jornada.datosPorHub, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const clientesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, jornada.datosPorHub[hub].clientesIngresos]));
    localStorage.setItem(CLIENTES_POR_HUB_STORAGE_KEY, JSON.stringify(clientesPorHub));
  }, [jornada.datosPorHub, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    setClientesConsultaSeleccionados(jornada.datosPorHub[hubConsulta].clientesIngresos.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id));
  }, [hubConsulta, isMounted, jornada.datosPorHub]);

  const equipoVinculadoAlHub = equiposActivos.find((equipo) => equipo.hubsDemandaVinculados.includes(jornada.hub));
  const equipoActivo = equiposActivos.find((equipo) => equipo.id === equipoActivoId) || equiposActivos[0];
  const integrantesDestinoMensaje = equipoActivo?.integrantes.filter((integrante) => integrantesMensajeSeleccionados.includes(integrante.id)) || [];
  const datosHub = jornada.datosPorHub[jornada.hub];
  const clienteActivo = datosHub.clientesIngresos.find((cliente) => cliente.id === datosHub.clienteActivoId) || datosHub.clientesIngresos[0];
  const fechaFormateada = formatoFecha(jornada.fecha);
  const totalFacturadoHub = datosHub.clientesIngresos.reduce((total, cliente) => total + numero(cliente.importe), 0);
  const totalGastos = datosHub.gastos.reduce((total, gasto) => total + numero(gasto.importe), 0);
  const totalADistribuir = totalFacturadoHub - totalGastos;
  const actoresActivos = datosHub.actores.filter((actor) => actor.activo);
  const cantidadActoresActivos = actoresActivos.length;
  const totalParticipacion = actoresActivos.reduce((total, actor) => total + numero(actor.participacion), 0);
  const distribucionCalculada = datosHub.actores.map((actor) => {
    const importeDistribuido = actor.activo && totalParticipacion > 0 ? totalADistribuir * numero(actor.participacion) / totalParticipacion : 0;
    const importeFinal = importeDistribuido + numero(actor.ajusteManual);
    return { ...actor, importeDistribuido, importeFinal };
  });
  const totalDistribuido = distribucionCalculada.reduce((total, actor) => total + actor.importeFinal, 0);
  const resumenesDelHub = historialResumenes[jornada.hub] || [];

  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((actual) => ({ ...actual, ...cambios }));
  }

  function actualizarDatosHub(cambios: Partial<DatosHub>) {
    setJornada((actual) => ({ ...actual, datosPorHub: { ...actual.datosPorHub, [actual.hub]: { ...actual.datosPorHub[actual.hub], ...cambios } } }));
  }

  function seleccionarHubTrabajo(hub: HubDisponible) {
    actualizarJornada({ hub, nombreResumen: "" });
    setHubSeleccionado(true);
    setMensajeGuardado(`Hub seleccionado: ${hub}`);
  }

  function cambiarHub() {
    setHubSeleccionado(false);
    setSeccionActiva("reporte");
  }

  function actualizarResumen(cambios: Partial<ResumenHubManual>) {
    actualizarDatosHub({ resumen: { ...datosHub.resumen, ...cambios } });
  }

  function actualizarCliente(id: number, cambios: Partial<FilaClienteIngreso>) {
    actualizarDatosHub({ clientesIngresos: datosHub.clientesIngresos.map((cliente) => cliente.id === id ? { ...cliente, ...cambios } : cliente) });
  }

  function actualizarGasto(id: number, cambios: Partial<FilaGasto>) {
    actualizarDatosHub({ gastos: datosHub.gastos.map((gasto) => gasto.id === id ? { ...gasto, ...cambios } : gasto) });
  }

  function actualizarActor(id: number, cambios: Partial<FilaActor>) {
    actualizarDatosHub({ actores: datosHub.actores.map((actor) => actor.id === id ? { ...actor, ...cambios } : actor) });
  }

  const nombrePrivado = useCallback((cliente: FilaClienteIngreso, index: number) => cliente.id === clienteActivo?.id ? cliente.nombre : `Cliente ${index + 1}`, [clienteActivo?.id]);
  const destinatariosSeleccionados = destinatariosInformacion.filter((destinatario) => destinatario.incluido);
  const destinatariosSinTelefonoSeleccionados = destinatariosSeleccionados.filter((destinatario) => !destinatario.telefono.trim());

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(INFORMACION_STORAGE_KEY, JSON.stringify({ asunto: asuntoInformacion, mensaje: mensajeInformacion, nota: notaInformacion }));
  }, [asuntoInformacion, mensajeInformacion, notaInformacion, isMounted]);

  function seleccionarHubInformacion(hub: HubDisponible) {
    setHubInformacion(hub);
    setAsuntoInformacion((actual) => actual || `WhatsApp HubYa — ${hub}`);
    setMensajeInformacion((actual) => actual || `Hola, te compartimos información correspondiente al ${hub}.`);
    setDestinatariosInformacion(jornada.datosPorHub[hub].clientesIngresos.map((cliente) => ({ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email, incluido: Boolean(cliente.telefono.trim()) })));
    setEstadoInformacion("idle");
    setMensajeEstadoInformacion("Seleccioná destinatarios, referencia interna y mensaje para enviar.");
  }

  function actualizarDestinatarioInformacion(id: number, incluido: boolean) {
    setDestinatariosInformacion((actuales) => actuales.map((destinatario) => destinatario.id === id ? { ...destinatario, incluido } : destinatario));
  }

  function marcarTodosDestinatarios(incluido: boolean) {
    setDestinatariosInformacion((actuales) => actuales.map((destinatario) => ({ ...destinatario, incluido: incluido && Boolean(destinatario.telefono.trim()) })));
  }

  async function enviarInformacion() {
    if (!hubInformacion) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: debe seleccionar un Hub.");
      return;
    }
    if (destinatariosSeleccionados.length === 0) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: debe seleccionar al menos un destinatario.");
      return;
    }
    if (destinatariosSinTelefonoSeleccionados.length > 0) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: no se puede enviar a clientes sin teléfono.");
      return;
    }
    if (!asuntoInformacion.trim()) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: falta la referencia interna.");
      return;
    }
    if (!mensajeInformacion.trim()) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: falta el mensaje principal.");
      return;
    }

    setEstadoInformacion("enviando");
    setMensajeEstadoInformacion("Enviando...");
    const resultados = [];
    for (const destinatario of destinatariosSeleccionados) {
      const respuesta = await fetch("/api/whatsapp/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefonoDestino: destinatario.telefono, nombreCliente: destinatario.nombre, hub: hubInformacion, mensaje: [mensajeInformacion, notaInformacion].filter(Boolean).join("\n\n") }),
      });
      const data = await respuesta.json().catch(() => ({}));
      resultados.push({ ok: respuesta.ok, nombre: destinatario.nombre, error: data?.error });
    }
    const errores = resultados.filter((resultado) => !resultado.ok);
    if (errores.length > 0) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion(`Enviados: ${resultados.length - errores.length}. Errores: ${errores.map((error) => error.nombre || "cliente").join(", ")}`);
      return;
    }
    setEstadoInformacion("enviado");
    setMensajeEstadoInformacion(`WhatsApp enviados individualmente: ${resultados.length}`);
  }


  const reporteTexto = useMemo(() => [
    "HubYa — Reporte administrativo del Hub",
    `Sistema: JardinerosYa / servicio de jardinería`,
    `Hub: ${jornada.hub}`,
    `Equipo activo vinculado: ${equipoVinculadoAlHub?.nombre || "Sin equipo vinculado"}`,
    `Fecha: ${fechaFormateada}`,
    `Cliente seleccionado: ${clienteActivo?.nombre || "Sin cliente seleccionado"}`,
    "",
    "CLIENTES / INGRESOS",
    ...datosHub.clientesIngresos.map((cliente, index) => `${nombrePrivado(cliente, index) || "Sin cliente"} · JardinerosYa · ${formatoPlano(cliente.importe) || formatoMoneda(0)}`),
    `Total facturado al Hub: ${formatoMoneda(totalFacturadoHub)}`,
    "",
    "GASTOS",
    ...datosHub.gastos.map((gasto) => `${gasto.concepto || "Sin concepto"}: ${formatoPlano(gasto.importe) || formatoMoneda(0)}`),
    `Total gastos: ${formatoMoneda(totalGastos)}`,
    `Total a distribuir: ${formatoMoneda(totalADistribuir)}`,
    "",
    "DISTRIBUCIÓN AUTOMÁTICA POR ACTOR",
    ...distribucionCalculada.map((actor) => `${actor.nombre || "Sin actor"}: ${formatoMoneda(actor.importeFinal)} (${numero(actor.participacion)} / ${actor.activo ? "activo" : "inactivo"})`),
    `Total distribuido: ${formatoMoneda(totalDistribuido)}`,
    "",
    `Tiempo efectivo: ${datosHub.resumen.tiempoEfectivo || "Sin cargar"}`,
    `Estado operativo: ${datosHub.resumen.estadoOperativo || "Sin cargar"}`,
    `Observación: ${datosHub.resumen.observacionGeneral || "Sin cargar"}`,
    "",
    "SOBRE HUBYA",
    ...sobreHubYaLineas,
  ].join("\n"), [clienteActivo?.nombre, datosHub.clientesIngresos, datosHub.gastos, datosHub.resumen.estadoOperativo, datosHub.resumen.observacionGeneral, datosHub.resumen.tiempoEfectivo, distribucionCalculada, fechaFormateada, jornada.hub, nombrePrivado, totalADistribuir, totalDistribuido, totalFacturadoHub, totalGastos, equipoVinculadoAlHub?.nombre]);

  const asuntoReporte = `Reporte diario HubYa — ${jornada.hub} — ${fechaFormateada}`;

  const emailPrivado = useMemo(() => [
    `Hola ${clienteActivo?.nombre || "cliente"}, te compartimos el reporte correspondiente a la jornada del ${jornada.hub} del día ${fechaFormateada}. Lo principal está resumido al inicio del comprobante. El detalle queda disponible como respaldo de transparencia operativa.`,
    "",
    "Saludos,",
    "HubYa",
  ].join("\n"), [clienteActivo?.nombre, fechaFormateada, jornada.hub]);

  const clientesDelHub = datosHub.clientesIngresos;
  const clienteActivoReporte = clientesDelHub.find((cliente) => cliente.id === datosHub.clienteActivoId) || clientesDelHub[0] || clienteActivo;

  const filasClientesHtml = clientesDelHub.map((cliente, index) => `
                    <tr><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(cliente.origen || "Sin origen")}</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(nombrePrivado(cliente, index) || "Sin cliente")}</td><td style="border:1px solid #d8dfd1;padding:6px;text-align:right;">${escaparHtml(formatoPlano(cliente.importe))}</td></tr>`).join("");
  const filasGastosHtml = datosHub.gastos.map((gasto) => `
                    <tr><td colspan="2" style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(gasto.concepto || "Sin concepto")}</td><td style="border:1px solid #d8dfd1;padding:6px;text-align:right;">${escaparHtml(formatoPlano(gasto.importe))}</td></tr>`).join("");
  const filasActoresHtml = distribucionCalculada.map((actor) => `
                    <tr><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(actor.nombre || "Sin actor")}</td><td style="border:1px solid #d8dfd1;padding:6px;text-align:center;">${numero(actor.participacion)} / ${actor.activo ? "activo" : "inactivo"}</td><td style="border:1px solid #d8dfd1;padding:6px;text-align:right;">${escaparHtml(formatoMoneda(actor.importeFinal))}</td></tr>`).join("");
  const sobreHubYaHtml = sobreHubYaLineas.map((linea) => `<p style="margin:8px 0 0;">${escaparHtml(linea)}</p>`).join("");

  const reporteHtml = useMemo(() => `
    <article style="width:100%;max-width:760px;border:1px solid #6f7968;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;box-shadow:none;">
      <header style="border-bottom:2px solid #1f2a1d;padding:16px;">
        <p style="margin:0;color:#66745c;font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;">HubYa</p>
        <h1 style="margin:4px 0 0;font-size:20px;line-height:1.2;font-weight:900;text-transform:uppercase;">Reporte administrativo del Hub</h1>
        <p style="margin:4px 0 0;color:#66745c;font-size:12px;font-weight:700;">Documento emitido por sistema</p>
      </header>

      <section style="border-bottom:1px solid #9aa78f;padding:16px;">
        <h2 style="margin:0 0 8px;color:#1f2a1d;font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;">Resumen rápido para el cliente</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tbody>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Cliente seleccionado</td><td style="border:1px solid #d8dfd1;padding:6px;font-weight:700;">${escaparHtml(clienteActivoReporte?.nombre || "Sin cliente seleccionado")}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Hub de demanda</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(jornada.hub)}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Equipo activo vinculado</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(equipoVinculadoAlHub?.nombre || "Sin equipo vinculado")}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Fecha</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(fechaFormateada)}</td></tr>
            <tr><td style="border:1px solid #1f2a1d;background:#eef2e8;padding:8px;font-weight:900;text-transform:uppercase;">Importe correspondiente a su espacio verde</td><td style="border:1px solid #1f2a1d;background:#eef2e8;padding:8px;color:#1f2a1d;font-size:18px;font-weight:900;">${escaparHtml(formatoPlano(clienteActivoReporte?.importe) || formatoMoneda(0))}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Estado operativo</td><td style="border:1px solid #d8dfd1;padding:6px;font-weight:700;">${escaparHtml(datosHub.resumen.estadoOperativo || "Sin cargar")}</td></tr>
          </tbody>
        </table>
      </section>

      <div style="padding:16px;">
        <table style="width:100%;border-collapse:collapse;background:#ffffff;font-size:12px;">
          <tbody>
            <tr style="background:#eef2e8;"><th colspan="3" style="border:1px solid #9aa78f;padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;">Clientes / ingresos</th></tr>
            <tr style="background:#f8faf5;color:#66745c;font-size:10px;text-transform:uppercase;"><th style="border:1px solid #d8dfd1;padding:6px;text-align:left;">Origen / sistema</th><th style="border:1px solid #d8dfd1;padding:6px;text-align:left;">Nombre cliente</th><th style="border:1px solid #d8dfd1;padding:6px;text-align:right;">Importe</th></tr>${filasClientesHtml}
            <tr style="background:#fbfcf9;font-weight:900;"><td colspan="2" style="border:1px solid #9aa78f;padding:6px;">Total facturado al Hub</td><td style="border:1px solid #9aa78f;padding:6px;text-align:right;">${escaparHtml(formatoPlano(totalFacturadoHub))}</td></tr>
            <tr style="background:#eef2e8;"><th colspan="3" style="border:1px solid #9aa78f;padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;">Gastos</th></tr>
            <tr style="background:#f8faf5;color:#66745c;font-size:10px;text-transform:uppercase;"><th colspan="2" style="border:1px solid #d8dfd1;padding:6px;text-align:left;">Concepto</th><th style="border:1px solid #d8dfd1;padding:6px;text-align:right;">Importe</th></tr>${filasGastosHtml}
            <tr style="font-weight:900;"><td colspan="2" style="border:1px solid #9aa78f;padding:6px;">Total gastos</td><td style="border:1px solid #9aa78f;padding:6px;text-align:right;">${escaparHtml(formatoPlano(totalGastos))}</td></tr>
            <tr style="background:#fbfcf9;font-weight:900;"><td colspan="2" style="border:1px solid #9aa78f;padding:6px;">Total a distribuir</td><td style="border:1px solid #9aa78f;padding:6px;text-align:right;">${escaparHtml(formatoPlano(totalADistribuir))}</td></tr>
            <tr style="background:#eef2e8;"><th colspan="3" style="border:1px solid #9aa78f;padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;">Distribución automática por actor</th></tr>
            <tr style="background:#f8faf5;color:#66745c;font-size:10px;text-transform:uppercase;"><th style="border:1px solid #d8dfd1;padding:6px;text-align:left;">Actor</th><th style="border:1px solid #d8dfd1;padding:6px;text-align:center;">Participación / activo</th><th style="border:1px solid #d8dfd1;padding:6px;text-align:right;">Importe</th></tr>${filasActoresHtml}
            <tr style="background:#fbfcf9;font-weight:900;"><td colspan="2" style="border:1px solid #9aa78f;padding:6px;">Total distribuido</td><td style="border:1px solid #9aa78f;padding:6px;text-align:right;">${escaparHtml(formatoPlano(totalDistribuido))}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f8faf5;padding:6px;font-weight:900;">Tiempo efectivo</td><td colspan="2" style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(datosHub.resumen.tiempoEfectivo || "Sin cargar")}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f8faf5;padding:6px;font-weight:900;">Estado operativo</td><td colspan="2" style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(datosHub.resumen.estadoOperativo || "Sin cargar")}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f8faf5;padding:6px;font-weight:900;">Observación</td><td colspan="2" style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(datosHub.resumen.observacionGeneral || "Sin cargar")}</td></tr>
          </tbody>
        </table>
        <p style="margin:8px 0 0;border:1px solid #d8dfd1;background:#f8faf5;padding:8px;color:#66745c;font-size:10px;font-weight:700;">Privacidad: solo el cliente seleccionado se muestra con nombre real. Los demás clientes están anonimizados como Cliente 2, Cliente 3, Cliente 4, etc. y no se incluyen emails.</p>
        <section style="margin-top:12px;border:1px solid #9aa78f;padding:12px;font-size:12px;line-height:1.5;">
          <h2 style="margin:0 0 8px;color:#1f2a1d;font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;">Sobre HubYa</h2>
          ${sobreHubYaHtml}
        </section>
      </div>
    </article>`, [clienteActivoReporte?.importe, clienteActivoReporte?.nombre, datosHub.resumen.estadoOperativo, datosHub.resumen.observacionGeneral, datosHub.resumen.tiempoEfectivo, fechaFormateada, filasActoresHtml, filasClientesHtml, filasGastosHtml, jornada.hub, sobreHubYaHtml, totalADistribuir, totalDistribuido, totalFacturadoHub, totalGastos, equipoVinculadoAlHub?.nombre]);


  async function enviarReporteClienteSeleccionado() {
    if (!clienteActivo?.email.trim()) {
      setEstadoEnvio("error");
      setMensajeEnvio("Error al enviar: el cliente seleccionado no tiene email.");
      return;
    }

    setEstadoEnvio("enviando");
    setMensajeEnvio("Enviando...");

    const respuesta = await fetch("/api/enviar-reporte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailDestino: clienteActivo.email,
        nombreCliente: clienteActivo.nombre,
        hub: jornada.hub,
        fecha: fechaFormateada,
        asunto: asuntoReporte,
        cuerpoMail: emailPrivado,
        reporteHtml,
        reporteTexto,
      }),
    });
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      setEstadoEnvio("error");
      setMensajeEnvio(`Error al enviar: ${data?.error || "no se pudo enviar el reporte."}`);
      return;
    }

    setEstadoEnvio("enviado");
    setMensajeEnvio("Enviado correctamente");
  }

  async function descargarImagenReporte() {
    const nodo = reporteVisualRef.current;
    if (!nodo) return;
    const ancho = Math.ceil(nodo.scrollWidth);
    const alto = Math.ceil(nodo.scrollHeight);
    const estilos = Array.from(document.styleSheets).map((hoja) => {
      try {
        return Array.from(hoja.cssRules).map((regla) => regla.cssText).join("\n");
      } catch {
        return "";
      }
    }).join("\n");
    const html = new XMLSerializer().serializeToString(nodo.cloneNode(true));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><style>${estilos}</style><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
    const imagen = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    await new Promise<void>((resolve, reject) => {
      imagen.onload = () => resolve();
      imagen.onerror = reject;
      imagen.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = ancho * 2;
    canvas.height = alto * 2;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    contexto.scale(2, 2);
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0);
    URL.revokeObjectURL(url);
    const enlace = document.createElement("a");
    enlace.download = `reporte-hubya-${jornada.hub.toLowerCase().replaceAll(" ", "-")}-${jornada.fecha}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
    setMensajeGuardado(`Imagen del reporte preparada: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function guardarJornada() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jornada));
    setMensajeGuardado(`Jornada guardada localmente: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function cargarJornada() {
    const guardada = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!guardada) return setMensajeGuardado("No hay una jornada guardada para cargar");
    const jornadaGuardada = normalizarJornada(JSON.parse(guardada) as JornadaOperativa);
    setJornada({ ...jornadaGuardada, datosPorHub: aplicarClientesPorHub(jornadaGuardada.datosPorHub, leerClientesPorHub()) });
    setMensajeGuardado("Jornada cargada desde este navegador");
  }

  function limpiarJornada() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(CLIENTES_POR_HUB_STORAGE_KEY);
    setJornada(jornadaInicial);
    setHubSeleccionado(false);
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  function nombreResumenActual() {
    return jornada.nombreResumen.trim() || `Jornada ${jornada.hub} — ${formatoFecha(jornada.fecha)}`;
  }

  function crearResumenGuardado(id = String(crearId()), nombre = nombreResumenActual(), fecha = jornada.fecha): ResumenGuardadoHub {
    return {
      id,
      hub: jornada.hub,
      fecha,
      nombre,
      guardadoEn: new Date().toISOString(),
      datos: JSON.parse(JSON.stringify(datosHub)) as DatosHub,
      gastos: JSON.parse(JSON.stringify(datosHub.gastos)) as FilaGasto[],
      distribucion: JSON.parse(JSON.stringify(distribucionCalculada)) as ResumenGuardadoHub["distribucion"],
      totales: { totalFacturado: totalFacturadoHub, totalGastos, totalADistribuir, totalDistribuido },
      tiempoEfectivo: datosHub.resumen.tiempoEfectivo,
      estadoOperativo: datosHub.resumen.estadoOperativo,
      observacion: datosHub.resumen.observacionGeneral,
      notaInstitucional: sobreHubYaLineas,
      reporteTexto,
    };
  }

  function guardarResumenHub() {
    const resumen = crearResumenGuardado();
    setHistorialResumenes((actual) => ({ ...actual, [jornada.hub]: [resumen, ...(actual[jornada.hub] || [])] }));
    setJornada((actual) => ({ ...actual, nombreResumen: resumen.nombre }));
    setMensajeGuardado(`Resumen guardado para ${jornada.hub}: ${resumen.nombre}`);
  }

  function abrirResumenHub(resumen: ResumenGuardadoHub) {
    setJornada((actual) => ({ ...actual, hub: resumen.hub, fecha: resumen.fecha, nombreResumen: resumen.nombre, datosPorHub: { ...actual.datosPorHub, [resumen.hub]: normalizarDatosHub(resumen.datos, resumen.hub) } }));
    setHubSeleccionado(true);
    setMensajeGuardado(`Resumen abierto: ${resumen.nombre}`);
  }

  function duplicarResumenHub(resumen: ResumenGuardadoHub) {
    const copia = normalizarResumenGuardado({ ...resumen, id: String(crearId()), nombre: `${resumen.nombre} (copia)`, guardadoEn: new Date().toISOString(), fecha: jornada.fecha }, resumen.hub);
    setHistorialResumenes((actual) => ({ ...actual, [resumen.hub]: [copia, ...(actual[resumen.hub] || [])] }));
    abrirResumenHub(copia);
  }

  function eliminarResumenHub(resumen: ResumenGuardadoHub) {
    if (!window.confirm(`¿Eliminar el resumen "${resumen.nombre}"?`)) return;
    setHistorialResumenes((actual) => ({ ...actual, [resumen.hub]: (actual[resumen.hub] || []).filter((item) => item.id !== resumen.id) }));
    setMensajeGuardado(`Resumen eliminado: ${resumen.nombre}`);
  }

  async function copiarTexto(texto: string, etiqueta: string) {
    await navigator.clipboard.writeText(texto);
    setMensajeGuardado(`${etiqueta} copiado: ${new Date().toLocaleTimeString("es-AR")}`);
  }


  function claveCliente(contacto: Pick<ContactoImportado, "email" | "nombre" | "referencia"> | Pick<FilaClienteIngreso, "email" | "nombre" | "referencia">) {
    const email = contacto.email.trim().toLowerCase();
    if (email) return `email:${email}`;
    const nombreReferencia = normalizarTextoBusqueda(`${contacto.nombre.trim()}|${(contacto.referencia || "").trim()}`);
    return nombreReferencia === "|" ? "sin-datos" : `nombre-ref:${nombreReferencia}`;
  }

  function clienteDesdeContacto(contacto: ContactoImportado): FilaClienteIngreso {
    return {
      ...clienteIngresoInicial(contacto.nombre),
      id: idNumericoEstable(`${contacto.id}|${contacto.email}|${contacto.nombre}|${contacto.referencia}`),
      origen: "JardinerosYa",
      nombre: contacto.nombre,
      referencia: contacto.referencia,
      email: contacto.email,
      telefono: contacto.whatsapp,
    };
  }

  function procesarContactosATabla() {
    const filas = baseContactosCruda.split(/\r?\n/).map(procesarLineaContacto).filter((fila): fila is ContactoImportado => Boolean(fila));
    setContactosImportados(filas);
    setResumenGuardadoContactos(null);
    setMensajeImportacion(filas.length ? `${filas.length} contactos procesados. Revisá incluir, Hub asignado y tipo destino antes de guardar.` : "No se detectaron contactos para importar.");
  }

  function actualizarContactoImportado(id: string, cambios: Partial<ContactoImportado>) {
    setContactosImportados((actuales) => actuales.map((contacto) => contacto.id === id ? { ...contacto, ...cambios } : contacto));
  }

  function eliminarContactoImportado(id: string) {
    setContactosImportados((actuales) => actuales.filter((contacto) => contacto.id !== id));
  }

  function actorDesdeContacto(contacto: ContactoImportado): FilaActor {
    return { id: idNumericoEstable(`actor|${contacto.id}|${contacto.email}|${contacto.nombre}`), nombre: contacto.nombre || contacto.referencia || "Sin nombre", activo: true, participacion: 1, ajusteManual: 0 };
  }

  function fusionarContactosPersistidos<T extends Pick<ContactoImportado, "email" | "nombre" | "referencia">>(actuales: T[], revisados: T[]) {
    const porClave = new Map<string, T>(actuales.map((contacto) => [claveCliente(contacto), contacto]));
    revisados.forEach((contacto) => porClave.set(claveCliente(contacto), { ...porClave.get(claveCliente(contacto)), ...contacto }));
    return Array.from(porClave.values());
  }

  function guardarContactosSeleccionados() {
    const revisados = contactosImportados;
    const incluidos = revisados.filter((contacto) => contacto.incluir);
    if (incluidos.length === 0) {
      setMensajeImportacion("Marcá al menos una fila como incluida antes de guardar.");
      return;
    }

    const clientes = incluidos.filter((contacto) => contacto.tipoDestino === "cliente");
    const clientesConHub = clientes.filter((contacto) => contacto.hub !== "Sin Hub asignado");
    const clientesSinHubNuevos = clientes.filter((contacto) => contacto.hub === "Sin Hub asignado");
    const actoresNuevos = incluidos.filter((contacto) => contacto.tipoDestino === "actor");
    const auxiliaresNuevos = incluidos.filter((contacto) => contacto.tipoDestino === "auxiliar");
    const ignorados = revisados.length - clientes.length - actoresNuevos.length - auxiliaresNuevos.length;
    const clavesClientes = new Set(clientes.map(claveCliente));

    setJornada((actual) => {
      const datosPorHubActualizados = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => {
        const datos = actual.datosPorHub[hub];
        const clientesSinDuplicadosNiMovidos = datos.clientesIngresos.filter((cliente) => !clavesClientes.has(claveCliente(cliente)));
        const clientesDelHub = clientesConHub.filter((contacto) => contacto.hub === hub).map(clienteDesdeContacto);
        const actoresDelHub = actoresNuevos.filter((contacto) => contacto.hub === hub || (contacto.hub === "Sin Hub asignado" && hub === actual.hub)).map(actorDesdeContacto);
        const clavesActores = new Set(actoresDelHub.map((actor) => normalizarTextoBusqueda(actor.nombre)));
        const actores = [...datos.actores.filter((actor) => !clavesActores.has(normalizarTextoBusqueda(actor.nombre))), ...actoresDelHub];
        const clientesIngresos = [...clientesSinDuplicadosNiMovidos, ...clientesDelHub];
        return [hub, { ...datos, clientesIngresos, actores, clienteActivoId: clientesIngresos[0]?.id || 0 }];
      })) as DatosPorHub;
      return { ...actual, datosPorHub: datosPorHubActualizados };
    });

    setAuxiliares((actuales) => fusionarContactosPersistidos(actuales, auxiliaresNuevos));
    setContactosSinHub((actuales) => fusionarContactosPersistidos<ContactoSinHub>(actuales, clientesSinHubNuevos.map((contacto) => ({ ...contacto, guardadoEn: new Date().toISOString() }))));
    setContactosImportados((actuales) => fusionarContactosPersistidos(actuales, revisados));
    setResumenGuardadoContactos({ clientesConHub: clientesConHub.length, clientesSinHub: clientesSinHubNuevos.length, actores: actoresNuevos.length, auxiliares: auxiliaresNuevos.length, ignorados });
    setMensajeImportacion(`Guardado: ${clientesConHub.length} clientes en Hubs, ${clientesSinHubNuevos.length} clientes sin Hub, ${actoresNuevos.length} actores/equipo y ${auxiliaresNuevos.length} auxiliares.`);
  }

  const consultasDelHubSeleccionado = consultasHub.filter((consulta) => consulta.hub === hubConsulta).sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
  const consultaActiva = consultasHub.find((consulta) => consulta.id === consultaActivaId && consulta.hub === hubConsulta);
  const clientesDisponiblesConsulta = jornada.datosPorHub[hubConsulta].clientesIngresos;
  const respuestasPorCliente = new Map((consultaActiva?.respuestas || []).map((respuesta) => [respuesta.clienteId, respuesta]));
  const opcionesVisiblesConsulta = consultaActiva?.opciones || opcionesConsulta;
  const conteosConsulta = opcionesVisiblesConsulta.map((opcion) => ({ opcion, cantidad: (consultaActiva?.respuestas || []).filter((respuesta) => respuesta.opcion === opcion).length }));
  const totalClientesHubConsulta = clientesDisponiblesConsulta.length;
  const idsClientesHubConsulta = new Set(clientesDisponiblesConsulta.map((cliente) => cliente.id));
  const respuestasClientesHubConsulta = (consultaActiva?.respuestas || []).filter((respuesta) => idsClientesHubConsulta.has(respuesta.clienteId));
  const sinResponderConsulta = consultaActiva ? Math.max(totalClientesHubConsulta - respuestasClientesHubConsulta.length, 0) : totalClientesHubConsulta;
  const mailsConsultaParaCopiar = consultaActiva?.clientesDestinatarios.map((cliente) => mailConsultaTexto(cliente, consultaActiva)).join("\n\n---\n\n") || "";

  function seleccionarHubConsulta(hub: HubDisponible) {
    setHubConsulta(hub);
    setPreguntaConsulta(`¿Vas a seguir formando parte del ${hub} el próximo año?`);
    setClientesConsultaSeleccionados(jornada.datosPorHub[hub].clientesIngresos.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id));
    setConsultaActivaId("");
    setPasoConsulta("seleccionar");
  }

  async function crearConsultaHub() {
    const opciones = opcionesConsulta.map((opcion) => opcion.trim()).filter(Boolean);
    const clientesDestinatarios = clientesDisponiblesConsulta.filter((cliente) => clientesConsultaSeleccionados.includes(cliente.id) && cliente.email.trim()).map((cliente) => ({ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email }));
    if (!preguntaConsulta.trim() || opciones.length === 0 || clientesDestinatarios.length === 0) return setMensajeGuardado("Completá pregunta, opciones y al menos un cliente con email para crear la encuesta.");
    const numeroEncuesta = consultasHub.filter((consulta) => consulta.hub === hubConsulta).length + 1;
    const id = `consulta-${Date.now()}`;
    const fechaCreacion = new Date().toISOString();
    const titulo = `Encuesta N°${numeroEncuesta} — ${hubConsulta} — ${formatoFecha(fechaCreacion.slice(0, 10))}`;
    const consulta: ConsultaHub = { id, hub: hubConsulta, titulo, pregunta: preguntaConsulta.trim(), opciones, clientesDestinatarios: clientesDestinatarios.map((cliente) => ({ ...cliente, token: crearTokenConsulta(id, cliente.id, hubConsulta) })), respuestas: [], fechaCreacion, estado: "borrador" };
    setConsultasHub((actuales) => [consulta, ...actuales]);
    setConsultaActivaId(id);
    setPasoConsulta("enviar");
    await guardarConsultaServidor(consulta).catch(() => undefined);
    setMensajeGuardado(`${titulo}: creada como borrador. Ahora podés enviarla.`);
  }

  function cerrarConsultaHub(id: string) {
    const consultaCerrada = consultasHub.find((consulta) => consulta.id === id);
    const actualizada = consultaCerrada ? { ...consultaCerrada, estado: "cerrada" as EstadoConsultaHub } : null;
    setConsultasHub((actuales) => actuales.map((consulta) => consulta.id === id ? { ...consulta, estado: "cerrada" } : consulta));
    if (actualizada) guardarConsultaServidor(actualizada).catch(() => undefined);
    setMensajeGuardado("Encuesta cerrada.");
  }

  function slugOpcionConsulta(opcion: string) {
    const normalizada = opcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (normalizada === "si") return "si";
    if (normalizada === "no") return "no";
    if (normalizada === "puede-ser") return "puede-ser";
    return normalizada;
  }

  function linkConsulta(token?: string, opcion?: string) {
    if (!token || typeof window === "undefined") return "";
    const base = `${window.location.origin}/api/consulta/responder?token=${encodeURIComponent(token)}`;
    return opcion ? `${base}&respuesta=${slugOpcionConsulta(opcion)}` : base;
  }

  function linksPorOpcionConsulta(cliente: ClienteConsultaHub, consulta = consultaActiva) {
    return Object.fromEntries((consulta?.opciones || ["Sí", "No", "Puede ser"]).map((opcion) => [opcion, linkConsulta(cliente.token, opcion)]));
  }

  function mailConsultaTexto(cliente: ClienteConsultaHub, consulta = consultaActiva) {
    const links = linksPorOpcionConsulta(cliente, consulta);
    return [
      `Asunto: Consulta HubYa — ${consulta?.hub || hubConsulta}`,
      "",
      `Hola ${cliente.nombre || "cliente"},`,
      "",
      `Desde HubYa queremos confirmar la planificación del ${consulta?.hub || hubConsulta}.`,
      "",
      consulta?.pregunta || preguntaConsulta,
      "",
      ...(consulta?.opciones || ["Sí", "No", "Puede ser"]).map((opcion) => `[ ${opcion} ] ${links[opcion]}`),
      "",
      "Tu respuesta nos ayuda a organizar mejor la demanda, el personal, los horarios y la frecuencia del Hub.",
      "",
      "Saludos,",
      "HubYa",
    ].join("\n");
  }

  async function enviarConsultaClientes(clientes: ClienteConsultaHub[]) {
    if (!consultaActiva) return;
    const destinatarios = clientes.filter((cliente) => cliente.token && cliente.email.trim()).map((cliente) => ({ nombre: cliente.nombre, email: cliente.email, links: linksPorOpcionConsulta(cliente) }));
    if (destinatarios.length === 0) return setMensajeGuardado("No hay clientes con token y email válido para enviar.");
    const respuesta = await fetch("/api/enviar-consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub: consultaActiva.hub, pregunta: consultaActiva.pregunta, destinatarios }),
    });
    const data = await respuesta.json().catch(() => ({}));
    if (respuesta.ok) {
      const actualizada = { ...consultaActiva, estado: "activa" as EstadoConsultaHub };
      setConsultasHub((actuales) => actuales.map((consulta) => consulta.id === actualizada.id ? actualizada : consulta));
      guardarConsultaServidor(actualizada).catch(() => undefined);
      setPasoConsulta("resultados");
      setMensajeGuardado(`Encuesta enviada por email a ${data.enviados} cliente(s).`);
      return;
    }
    setMensajeGuardado(`No se pudo enviar por Resend: ${data.error || "error desconocido"}`);
  }

  const conteoSinHub = contactosSinHub.length;
  function actualizarEquipoActivo(id: string, cambios: Partial<EquipoActivo>) {
    setEquiposActivos((actuales) => actuales.map((equipo) => equipo.id === id ? { ...equipo, ...cambios, slug: cambios.nombre ? slugEquipo(cambios.nombre) : equipo.slug } : equipo));
  }

  function crearEquipoDesdePanel() {
    const nuevo = createEquipoActivo({ nombre: `Equipo en formación ${equiposActivos.length + 1}` });
    setEquiposActivos((actuales) => [nuevo, ...actuales]);
    setEquipoActivoId(nuevo.id);
  }

  function agregarIntegranteEquipo() {
    if (!equipoActivo) return;
    const nuevo: IntegranteEquipoActivo = { id: `integrante-${Date.now()}`, nombre: "Nuevo integrante", rol: "operario", email: "", whatsapp: "", estado: "en evaluación", observacion: "" };
    actualizarEquipoActivo(equipoActivo.id, { integrantes: [nuevo, ...equipoActivo.integrantes] });
  }

  function actualizarIntegranteEquipo(integranteId: string, cambios: Partial<IntegranteEquipoActivo>) {
    if (!equipoActivo) return;
    actualizarEquipoActivo(equipoActivo.id, { integrantes: equipoActivo.integrantes.map((integrante) => integrante.id === integranteId ? { ...integrante, ...cambios } : integrante) });
  }

  function enviarMensajeEquipo() {
    if (!equipoActivo || !mensajeEquipo.mensaje.trim()) return setMensajeGuardado("Escribí un mensaje para el equipo activo.");
    if (integrantesDestinoMensaje.length === 0) return setMensajeGuardado("Seleccioná al menos un integrante para enviar el mensaje.");
    const mensaje: MensajeEquipoActivo = { id: `mensaje-equipo-${Date.now()}`, asunto: mensajeEquipo.asunto || `Mensaje HubYa — ${equipoActivo.nombre}`, mensaje: mensajeEquipo.mensaje, fecha: new Date().toISOString(), destinatarios: integrantesDestinoMensaje.map((integrante) => integrante.id), canal: "whatsapp preparado" };
    actualizarEquipoActivo(equipoActivo.id, { mensajesEnviados: [mensaje, ...equipoActivo.mensajesEnviados] });
    setMensajeGuardado(`Mensaje preparado individualmente para ${integrantesDestinoMensaje.length} integrantes de ${equipoActivo.nombre}.`);
  }

  function crearConsultaEquipo() {
    if (!equipoActivo || !preguntaEquipo.trim()) return;
    const consulta: ConsultaEquipoActivo = { id: `consulta-equipo-${Date.now()}`, pregunta: preguntaEquipo, opciones: ["Sí", "No", "Puede ser"], fecha: new Date().toISOString(), respuestas: [] };
    actualizarEquipoActivo(equipoActivo.id, { consultasEnviadas: [consulta, ...equipoActivo.consultasEnviadas] });
    setMensajeGuardado(`Consulta al equipo creada para ${equipoActivo.nombre}.`);
  }

  function aprobarSolicitudOferta(id: string) {
    const solicitud = solicitudesOferta.find((item) => item.id === id);
    if (!solicitud) return;
    setSolicitudesOferta((actuales) => actuales.map((item) => item.id === id ? { ...item, estado: "aprobada" } : item));
    const equipo = equiposActivos.find((item) => item.nombre === solicitud.equipoInteres) || equipoActivo;
    if (equipo) actualizarEquipoActivo(equipo.id, { integrantes: [{ id: `integrante-${Date.now()}`, nombre: solicitud.nombre, rol: "operario", email: solicitud.email, whatsapp: solicitud.whatsapp, estado: "en evaluación", observacion: `${solicitud.rubroInteres} · ${solicitud.experiencia}` }, ...equipo.integrantes] });
  }

  const inputNumero = (valor: CampoNumerico, onChange: (valor: CampoNumerico) => void) => <input type="number" step="0.25" value={valor} onChange={(e) => onChange(normalizarNumero(e.target.value))} className="h-7 w-28 bg-transparent px-1 text-right outline-none" />;
  const inputTexto = (valor: string, onChange: (valor: string) => void, ancho = "min-w-40") => <input value={valor} onChange={(e) => onChange(e.target.value)} className={`h-7 ${ancho} bg-transparent px-1 outline-none`} />;

  if (!hubSeleccionado) {
    return (
      <main className="min-h-screen bg-[#eef2e8] px-4 py-8 text-[#182018]">
        <section className="mx-auto max-w-5xl rounded-2xl border border-[#cfd8c6] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo</p>
          <h1 className="mt-2 text-2xl font-black">¿Con qué Hub vas a trabajar hoy?</h1>
          <p className="mt-2 text-sm font-semibold text-[#66745c]">Elegí el Hub antes de cargar la jornada. Los clientes y los resúmenes guardados se muestran separados por Hub.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HUBS_DISPONIBLES.map((hub) => <button key={hub} onClick={() => seleccionarHubTrabajo(hub)} className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-4 text-left shadow-sm transition hover:border-[#1f2a1d] hover:bg-[#eef2e8]">
              <span className="block text-base font-black">{hub}</span>
              <span className="mt-2 block text-xs font-bold text-[#66745c]">{isMounted ? jornada.datosPorHub[hub].clientesIngresos.length : "—"} clientes</span>
              <span className="mt-1 block text-xs font-bold text-[#66745c]">{isMounted ? (historialResumenes[hub] || []).length : "—"} resúmenes guardados</span>
            </button>)}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2e8] text-[#182018]">
      <section className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4">
        <header className="sticky top-0 z-20 mb-3 rounded-xl border border-[#cfd8c6] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-2 xl:grid-cols-[1fr_220px_180px_220px_auto] xl:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo · carga manual + reporte vivo</p><h1 className="text-xl font-black leading-tight">Reporte del Hub — {jornada.hub} — {fechaFormateada}</h1></div>
            <div className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]"><span>Hub seleccionado</span><div className="flex h-8 items-center rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 text-sm font-black normal-case text-[#1f2a1d]">{jornada.hub} · {datosHub.clientesIngresos.length} clientes</div></div>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nombre del resumen<input value={jornada.nombreResumen} onChange={(e) => actualizarJornada({ nombreResumen: e.target.value })} placeholder={nombreResumenActual()} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case outline-none" /></label>
            <div className="flex flex-wrap gap-1.5 xl:justify-end"><button onClick={cambiarHub} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cambiar Hub</button><button onClick={guardarJornada} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar</button><button onClick={cargarJornada} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cargar</button><button onClick={limpiarJornada} className="h-8 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-3 text-xs font-black text-[#743c3c]">Limpiar</button></div>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado} · Carga principal editable con sumas y distribución automáticas. · Equipo activo vinculado: <span className="font-black text-[#1f2a1d]">{equipoVinculadoAlHub?.nombre || "Sin equipo vinculado"}</span></p>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#d8dfd1] pt-3">
            <button onClick={() => setSeccionActiva("reporte")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "reporte" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Reporte diario</button>
            <button onClick={() => setSeccionActiva("informacion")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "informacion" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Envío por WhatsApp</button>
            <button onClick={() => setSeccionActiva("importar")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "importar" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Importar contactos</button>
            <a href="/operativo/solicitudes" className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">Solicitudes de ingreso</a><button onClick={() => setSeccionActiva("consultas")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "consultas" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Consultas del Hub</button><a href="/web-publica" className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">Web pública</a><button onClick={() => setSeccionActiva("equipos")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "equipos" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Equipos activos</button>
          </div>
        </header>

        {seccionActiva === "equipos" && equipoActivo && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">OFERTA · Equipo activo</p><h2 className="text-lg font-black">Equipos activos</h2><p className="text-xs font-semibold text-[#66745c]">Hubs de oferta separados de la demanda: integrantes, consultas al equipo, mensajes al equipo y vínculo con Hubs de demanda.</p></div>
            <button onClick={crearEquipoDesdePanel} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Crear equipo activo</button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-2 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3">
              {equiposActivos.map((equipo) => <button key={equipo.id} onClick={() => { setEquipoActivoId(equipo.id); setIntegrantesMensajeSeleccionados(equipo.integrantes.map((integrante) => integrante.id)); }} className={`w-full rounded-lg border p-3 text-left text-xs ${equipoActivo.id === equipo.id ? "border-[#1f2a1d] bg-white" : "border-[#cfd8c6] bg-[#fbfcf9]"}`}><span className="block font-black">{equipo.nombre}</span><span className="block font-bold text-[#66745c]">{equipo.estado} · {equipo.tipo}</span><span className="block font-bold text-[#66745c]">{equipo.integrantes.length} integrantes · {equipo.hubsDemandaVinculados.length} Hubs vinculados</span></button>)}
            </aside>
            <div className="space-y-3">
              <div className="grid gap-2 rounded-xl border border-[#d8dfd1] bg-white p-3 md:grid-cols-4">
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nombre<input value={equipoActivo.nombre} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { nombre: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Estado<select value={equipoActivo.estado} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { estado: e.target.value as EquipoActivo["estado"] })} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm normal-case">{ESTADOS_EQUIPO_ACTIVO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Tipo<select value={equipoActivo.tipo} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { tipo: e.target.value as EquipoActivo["tipo"] })} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm normal-case">{TIPOS_EQUIPO_ACTIVO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</select></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Responsable<input value={equipoActivo.responsable} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { responsable: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c] md:col-span-2">Zona base<input value={equipoActivo.zonaBase} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { zonaBase: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c] md:col-span-2">Observaciones<input value={equipoActivo.observaciones} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { observaciones: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
                <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c] md:col-span-4">Descripción<textarea value={equipoActivo.descripcion} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { descripcion: e.target.value })} className="min-h-16 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Integrantes</p><p className="text-2xl font-black">{equipoActivo.integrantes.length}</p></div><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Mensajes enviados</p><p className="text-2xl font-black">{equipoActivo.mensajesEnviados.length}</p></div><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Consultas al equipo</p><p className="text-2xl font-black">{equipoActivo.consultasEnviadas.length}</p></div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Hubs de demanda vinculados</h3><div className="mt-2 flex flex-wrap gap-2">{HUBS_DISPONIBLES.map((hub) => <label key={`vinculo-${hub}`} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 py-1 text-xs font-bold"><input type="checkbox" checked={equipoActivo.hubsDemandaVinculados.includes(hub)} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { hubsDemandaVinculados: e.target.checked ? [...equipoActivo.hubsDemandaVinculados, hub] : equipoActivo.hubsDemandaVinculados.filter((item) => item !== hub) })} className="mr-1" />{hub}</label>)}</div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black">Integrantes</h3><button onClick={agregarIntegranteEquipo} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-xs font-black text-white">Agregar integrante</button></div><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Nombre</th><th className="border p-2">Rol</th><th className="border p-2">Email</th><th className="border p-2">WhatsApp</th><th className="border p-2">Estado</th><th className="border p-2">Observación</th><th className="border p-2"></th></tr></thead><tbody>{equipoActivo.integrantes.map((integrante) => <tr key={integrante.id}><td className="border p-1"><input value={integrante.nombre} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { nombre: e.target.value })} className="h-7 min-w-40 bg-transparent px-1" /></td><td className="border p-1"><select value={integrante.rol} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { rol: e.target.value as IntegranteEquipoActivo["rol"] })} className="h-7 bg-transparent">{ROLES_INTEGRANTE.map((rol) => <option key={rol} value={rol}>{rol}</option>)}</select></td><td className="border p-1"><input value={integrante.email} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { email: e.target.value })} className="h-7 min-w-44 bg-transparent px-1" /></td><td className="border p-1"><input value={integrante.whatsapp} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { whatsapp: e.target.value })} className="h-7 min-w-32 bg-transparent px-1" /></td><td className="border p-1"><select value={integrante.estado} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { estado: e.target.value as IntegranteEquipoActivo["estado"] })} className="h-7 bg-transparent">{ESTADOS_INTEGRANTE.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></td><td className="border p-1"><input value={integrante.observacion} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { observacion: e.target.value })} className="h-7 min-w-44 bg-transparent px-1" /></td><td className="border p-1"><button onClick={() => actualizarEquipoActivo(equipoActivo.id, { integrantes: equipoActivo.integrantes.filter((item) => item.id !== integrante.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div></div>
              <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Enviar mensaje al equipo</h3><p className="text-xs font-semibold text-[#66745c]">Seleccioná integrantes; el envío se prepara individualmente para no exponer datos de otros integrantes.</p><div className="mt-2 flex flex-wrap gap-2">{equipoActivo.integrantes.map((integrante) => <label key={`mensaje-${integrante.id}`} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 py-1 text-xs font-bold"><input type="checkbox" checked={integrantesMensajeSeleccionados.includes(integrante.id)} onChange={(e) => setIntegrantesMensajeSeleccionados((actuales) => e.target.checked ? [...actuales, integrante.id] : actuales.filter((id) => id !== integrante.id))} className="mr-1" />{integrante.nombre}</label>)}</div><button onClick={() => setIntegrantesMensajeSeleccionados(equipoActivo.integrantes.map((integrante) => integrante.id))} className="mt-2 h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Seleccionar todos</button><input value={mensajeEquipo.asunto} onChange={(e) => setMensajeEquipo((actual) => ({ ...actual, asunto: e.target.value }))} placeholder="Asunto" className="mt-2 h-8 w-full rounded-lg border border-[#cfd8c6] px-2 text-sm"/><textarea value={mensajeEquipo.mensaje} onChange={(e) => setMensajeEquipo((actual) => ({ ...actual, mensaje: e.target.value }))} placeholder="Mensaje" className="mt-2 min-h-20 w-full rounded-lg border border-[#cfd8c6] p-2 text-sm"/><button onClick={enviarMensajeEquipo} className="mt-2 h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Preparar envío ({integrantesDestinoMensaje.length})</button></div><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Crear consulta al equipo</h3><input value={preguntaEquipo} onChange={(e) => setPreguntaEquipo(e.target.value)} className="mt-2 h-8 w-full rounded-lg border border-[#cfd8c6] px-2 text-sm"/><button onClick={crearConsultaEquipo} className="mt-2 h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Crear consulta</button><div className="mt-3 space-y-2">{equipoActivo.consultasEnviadas.map((consulta) => <div key={consulta.id} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2 text-xs"><p className="font-black">{consulta.pregunta}</p><p>Sí: {consulta.respuestas.filter((r) => r.opcion === "Sí").length} · No: {consulta.respuestas.filter((r) => r.opcion === "No").length} · Puede ser: {consulta.respuestas.filter((r) => r.opcion === "Puede ser").length} · Sin responder: {Math.max(equipoActivo.integrantes.length - consulta.respuestas.length, 0)} · Total integrantes: {equipoActivo.integrantes.length}</p></div>)}</div></div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Solicitudes de oferta</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Nombre</th><th className="border p-2">WhatsApp</th><th className="border p-2">Email</th><th className="border p-2">Rubro</th><th className="border p-2">Equipo solicitado</th><th className="border p-2">Estado</th><th className="border p-2">Fecha</th><th className="border p-2">Acciones</th></tr></thead><tbody>{solicitudesOferta.length === 0 ? <tr><td colSpan={8} className="border p-4 text-center font-bold text-[#66745c]">Sin solicitudes de ingreso al equipo.</td></tr> : solicitudesOferta.map((solicitud) => <tr key={solicitud.id}><td className="border p-2 font-semibold">{solicitud.nombre}</td><td className="border p-2">{solicitud.whatsapp}</td><td className="border p-2">{solicitud.email}</td><td className="border p-2">{solicitud.rubroInteres}</td><td className="border p-2">{solicitud.equipoInteres}</td><td className="border p-2 font-black">{solicitud.estado}</td><td className="border p-2">{formatoFecha(solicitud.fecha.slice(0, 10))}</td><td className="border p-2"><button onClick={() => aprobarSolicitudOferta(solicitud.id)} className="mr-2 font-black text-[#2f6d32]">Aprobar/convertir</button><button onClick={() => setSolicitudesOferta((actuales) => actuales.map((item) => item.id === solicitud.id ? { ...item, estado: "rechazada" } : item))} className="font-black text-[#743c3c]">Rechazar</button></td></tr>)}</tbody></table></div></div>
            </div>
          </div>
        </section>}

        {seccionActiva === "informacion" && <section className="mb-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Módulo independiente</p><h2 className="text-lg font-black">Envío por WhatsApp</h2><p className="text-xs font-semibold text-[#66745c]">No modifica el reporte económico ni la jornada actual. Cada cliente recibe su propio WhatsApp individual. Nunca se usan grupos ni se muestran datos de otros clientes.</p></div>
            <p className={`rounded-lg border px-3 py-2 text-xs font-black ${estadoInformacion === "error" ? "border-[#d6b7b7] bg-[#fff7f7] text-[#743c3c]" : estadoInformacion === "enviado" ? "border-[#b7d6ba] bg-[#f2fff4] text-[#2f6d32]" : "border-[#cfd8c6] bg-[#f8faf5] text-[#66745c]"}`}>{mensajeEstadoInformacion}</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={hubInformacion} onChange={(e) => e.target.value ? seleccionarHubInformacion(e.target.value as HubDisponible) : setHubInformacion("")} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none"><option value="">Seleccionar Hub</option>{HUBS_DISPONIBLES.map((hub) => <option key={hub} value={hub}>{hub}</option>)}</select></label>
              <div className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2 text-xs font-bold text-[#66745c]">Destinatarios WhatsApp seleccionados: <span className="text-[#1f2a1d]">{destinatariosSeleccionados.length}</span></div>
              <div className="flex flex-wrap gap-2"><button onClick={() => marcarTodosDestinatarios(true)} className="h-7 rounded-md bg-[#1f2a1d] px-3 text-xs font-black text-white">Seleccionar todos</button><button onClick={() => marcarTodosDestinatarios(false)} className="h-7 rounded-md border border-[#cfd8c6] px-3 text-xs font-black">Desmarcar todos</button></div>
            </div>
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Incluido</th><th className="border p-1">Nombre</th><th className="border p-1">Teléfono WhatsApp</th></tr></thead><tbody>{destinatariosInformacion.length === 0 ? <tr><td colSpan={3} className="border p-3 text-center font-bold text-[#66745c]">Seleccioná un Hub para ver sus clientes.</td></tr> : destinatariosInformacion.map((destinatario, index) => <tr key={`destinatario-${destinatario.id}-${index}`} className={destinatario.incluido ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1 text-center"><input type="checkbox" checked={destinatario.incluido} disabled={!destinatario.telefono.trim()} onChange={(e) => actualizarDestinatarioInformacion(destinatario.id, e.target.checked)} /></td><td className="border border-[#e1e6dc] p-1 font-semibold">{destinatario.nombre || "Sin nombre"}</td><td className={`border border-[#e1e6dc] p-1 ${destinatario.telefono.trim() ? "" : "font-black text-[#743c3c]"}`}>{destinatario.telefono.trim() || "Sin teléfono: no disponible para envío"}</td></tr>)}</tbody></table></div>
              <div className="grid gap-2"><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Referencia interna<input value={asuntoInformacion} onChange={(e) => setAsuntoInformacion(e.target.value)} placeholder={hubInformacion ? `WhatsApp HubYa — ${hubInformacion}` : "WhatsApp HubYa — [Hub seleccionado]"} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Mensaje principal<textarea value={mensajeInformacion} onChange={(e) => setMensajeInformacion(e.target.value)} placeholder={hubInformacion ? `Hola, te compartimos información correspondiente al ${hubInformacion}.` : "Hola, te compartimos información correspondiente al [Hub seleccionado]."} className="min-h-24 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nota opcional<textarea value={notaInformacion} onChange={(e) => setNotaInformacion(e.target.value)} className="min-h-16 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case outline-none" /></label></div>
              <button onClick={enviarInformacion} disabled={estadoInformacion === "enviando"} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60">Enviar WhatsApp individuales</button>
            </div>
          </div>
        </section>}


        {seccionActiva === "consultas" && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Consultas del Hub</p>
            <h2 className="text-lg font-black">Encuestas simples por pasos</h2>
            <p className="text-xs font-semibold text-[#66745c]">Flujo ordenado: elegí Hub, creá la encuesta, enviala y revisá resultados individuales.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {[["seleccionar", "1. Seleccionar Hub"], ["crear", "2. Crear encuesta"], ["enviar", "3. Enviar encuesta"], ["resultados", "4. Ver resultados"]].map(([paso, etiqueta]) => <div key={paso} className={`rounded-lg border p-2 text-xs font-black ${pasoConsulta === paso ? "border-[#1f2a1d] bg-[#1f2a1d] text-white" : "border-[#d8dfd1] bg-[#f8faf5] text-[#66745c]"}`}>{etiqueta}</div>)}
          </div>

          {pasoConsulta === "seleccionar" && <section className="space-y-3 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="grid min-w-64 gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={hubConsulta} onChange={(e) => seleccionarHubConsulta(e.target.value as HubDisponible)} className="h-9 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none">{HUBS_DISPONIBLES.map((hub) => <option key={`consulta-hub-${hub}`} value={hub}>{hub}</option>)}</select></label>
              <button onClick={() => { setConsultaActivaId(""); setPreguntaConsulta(`¿Vas a seguir formando parte del ${hubConsulta} el próximo año?`); setClientesConsultaSeleccionados(clientesDisponiblesConsulta.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id)); setPasoConsulta("crear"); }} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white">Nueva encuesta</button>
            </div>
            <div className="rounded-lg border border-[#cfd8c6] bg-white p-2 text-xs font-bold text-[#66745c]">Total clientes del Hub: <span className="text-[#1f2a1d]">{totalClientesHubConsulta}</span></div>
            <section>
              <p className="mb-2 text-[11px] font-black uppercase text-[#66745c]">Historial de encuestas del Hub</p>
              <div className="space-y-2">{consultasDelHubSeleccionado.length === 0 ? <p className="rounded-lg border border-[#cfd8c6] bg-white p-3 text-xs font-bold text-[#66745c]">Todavía no hay encuestas para {hubConsulta}.</p> : consultasDelHubSeleccionado.map((consulta, index) => { const conteos = consulta.opciones.map((opcion) => `${opcion}: ${consulta.respuestas.filter((respuesta) => respuesta.opcion === opcion).length}`).join(" · "); const sinResponderHistorial = Math.max(totalClientesHubConsulta - consulta.respuestas.filter((respuesta) => idsClientesHubConsulta.has(respuesta.clienteId)).length, 0); return <article key={consulta.id} className="rounded-lg border border-[#cfd8c6] bg-white p-3 text-xs"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">Encuesta N°{index + 1}</h3><p className="font-semibold text-[#66745c]">{consulta.pregunta}</p><p className="mt-1 font-bold">{formatoFecha(consulta.fechaCreacion.slice(0, 10))} · {consulta.estado} · {conteos} · Sin responder: {sinResponderHistorial}</p></div><button onClick={() => { setConsultaActivaId(consulta.id); setPasoConsulta("resultados"); }} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Ver encuesta</button></div></article>; })}</div>
            </section>
          </section>}

          {pasoConsulta === "crear" && <section className="space-y-3 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3">
            <p className="text-[11px] font-black uppercase text-[#66745c]">Paso 2 — Crear encuesta para {hubConsulta}</p>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Pregunta<textarea value={preguntaConsulta} onChange={(e) => setPreguntaConsulta(e.target.value)} className="min-h-20 rounded-lg border border-[#cfd8c6] bg-white p-2 text-sm normal-case outline-none" /></label>
            <div className="grid gap-2 md:grid-cols-3">{opcionesConsulta.slice(0, 3).map((opcion, index) => <label key={`opcion-${index}`} className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Opción {index + 1}<input value={opcion} onChange={(e) => setOpcionesConsulta((actuales) => actuales.map((item, itemIndex) => itemIndex === index ? e.target.value : item))} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm normal-case outline-none" /></label>)}</div>
            <div className="overflow-x-auto rounded-lg border border-[#d8dfd1] bg-white"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Cliente</th><th className="border p-2">Email</th><th className="border p-2">Enviar</th></tr></thead><tbody>{clientesDisponiblesConsulta.length === 0 ? <tr><td colSpan={3} className="border p-4 text-center font-bold text-[#66745c]">No hay clientes cargados para este Hub.</td></tr> : clientesDisponiblesConsulta.map((cliente) => { const tieneEmail = Boolean(cliente.email.trim()); const seleccionado = clientesConsultaSeleccionados.includes(cliente.id); return <tr key={`cliente-consulta-${cliente.id}`} className={seleccionado ? "bg-[#eef4ea]" : "bg-white"}><td className="border p-2 font-semibold">{cliente.nombre || "Sin nombre"}</td><td className="border p-2">{cliente.email || "—"}</td><td className="border p-2"><label className="flex items-center gap-2 font-black"><input type="checkbox" checked={seleccionado} disabled={!tieneEmail} onChange={(e) => setClientesConsultaSeleccionados((actuales) => e.target.checked ? [...actuales, cliente.id] : actuales.filter((id) => id !== cliente.id))} />{seleccionado && tieneEmail ? "Sí" : "No"}</label></td></tr>; })}</tbody></table></div>
            <button onClick={crearConsultaHub} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white">Crear encuesta</button>
          </section>}

          {pasoConsulta === "enviar" && consultaActiva && <section className="space-y-3 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3">
            <p className="text-[11px] font-black uppercase text-[#66745c]">Paso 3 — Enviar encuesta</p>
            <article className="rounded-lg border border-[#cfd8c6] bg-white p-3"><h3 className="font-black">{consultaActiva.titulo}</h3><p className="mt-1 text-sm font-semibold text-[#66745c]">{consultaActiva.pregunta}</p><p className="mt-2 text-xs font-bold">Destinatarios: {consultaActiva.clientesDestinatarios.length} · Estado: {consultaActiva.estado}</p></article>
            <button onClick={() => enviarConsultaClientes(consultaActiva.clientesDestinatarios)} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white">Enviar encuesta</button>
          </section>}

          {pasoConsulta === "resultados" && <section className="rounded-xl border border-[#d8dfd1] bg-white p-3">
            <p className="mb-2 text-[11px] font-black uppercase text-[#66745c]">Paso 4 — Ver resultados</p>
            {!consultaActiva ? <p className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-3 text-xs font-bold text-[#66745c]">Seleccioná una encuesta desde el historial.</p> : <div className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{consultaActiva.titulo}</h3><p className="text-xs font-semibold text-[#66745c]">{consultaActiva.pregunta}</p></div><div className="flex gap-2">{consultaActiva.estado === "borrador" && <button onClick={() => setPasoConsulta("enviar")} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Enviar encuesta</button>}<button onClick={() => enviarConsultaClientes(consultaActiva.clientesDestinatarios)} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Reenviar</button><button onClick={() => cerrarConsultaHub(consultaActiva.id)} disabled={consultaActiva.estado === "cerrada"} className="h-7 rounded-md border border-[#d6b7b7] bg-[#fff7f7] px-2 text-[11px] font-black text-[#743c3c] disabled:opacity-50">Cerrar encuesta</button></div></div><div className="grid gap-2 md:grid-cols-5">{conteosConsulta.map((item) => <div key={`conteo-${item.opcion}`} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">{item.opcion}</p><p className="text-lg font-black">{item.cantidad}</p></div>)}<div className="rounded-lg border border-[#cfd8c6] bg-[#fffdf2] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Sin responder</p><p className="text-lg font-black">{sinResponderConsulta}</p></div><div className="rounded-lg border border-[#cfd8c6] bg-white p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total clientes del Hub</p><p className="text-lg font-black">{totalClientesHubConsulta}</p></div></div><div className="overflow-x-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Cliente</th><th className="border p-2">Email</th><th className="border p-2">Estado</th><th className="border p-2">Respuesta</th><th className="border p-2">Fecha respuesta</th></tr></thead><tbody>{clientesDisponiblesConsulta.map((cliente) => { const respuesta = respuestasPorCliente.get(cliente.id); return <tr key={`resultado-${cliente.id}`}><td className="border p-2 font-semibold">{cliente.nombre || "Sin nombre"}</td><td className="border p-2">{cliente.email || "—"}</td><td className={`border p-2 font-black ${respuesta ? "text-[#2f6d32]" : "text-[#66745c]"}`}>{respuesta ? "Respondió" : "Sin responder"}</td><td className="border p-2 font-black">{respuesta?.opcion || "—"}</td><td className="border p-2">{respuesta ? new Date(respuesta.respondidoEn).toLocaleString("es-AR") : "—"}</td></tr>; })}</tbody></table></div>{mailsConsultaParaCopiar && <details className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2"><summary className="cursor-pointer text-xs font-black">Links/mails guardados para copiar si Resend no está configurado</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px]">{mailsConsultaParaCopiar}</pre></details>}</div>}
          </section>}
        </section>}

        {seccionActiva === "importar" && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Importar contactos</p><h2 className="text-lg font-black">Importar contactos</h2><p className="text-xs font-semibold text-[#66745c]">Procesar convierte el texto crudo en tabla de revisión. Guardar persiste solo las filas incluidas según Hub y tipo destino.</p></div>
            <p className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-3 py-2 text-xs font-black text-[#66745c]">{mensajeImportacion}</p>
          </div>
          <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Base cruda<textarea value={baseContactosCruda} onChange={(e) => setBaseContactosCruda(e.target.value)} placeholder="CLIENTE Florencia Siufi florsiufi@gmail.com&#10;CLIENTE Tipal Gabriela Aguiar gabuaguiar@hotmail.com" className="min-h-48 rounded-xl border border-[#cfd8c6] p-3 text-sm normal-case outline-none" /></label>
          <div className="flex flex-wrap gap-2"><button onClick={procesarContactosATabla} className="h-9 rounded-lg bg-[#5d7032] px-4 text-xs font-black text-white">Procesar contactos</button><button onClick={guardarContactosSeleccionados} disabled={contactosImportados.length === 0} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white disabled:opacity-50">Guardar contactos seleccionados</button></div>
          {resumenGuardadoContactos && <div className="rounded-lg border border-[#b7d6ba] bg-[#f2fff4] px-3 py-2 text-xs font-black text-[#1f2a1d]">Último guardado: {resumenGuardadoContactos.clientesConHub} clientes en Hubs, {resumenGuardadoContactos.clientesSinHub} clientes sin Hub, {resumenGuardadoContactos.actores} actores/equipo, {resumenGuardadoContactos.auxiliares} auxiliares, {resumenGuardadoContactos.ignorados} ignorados.</div>}
          <div className="max-h-[62vh] overflow-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="sticky top-0 bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Incluir sí/no</th><th className="border p-2">Rol</th><th className="border p-2">Nombre</th><th className="border p-2">Referencia</th><th className="border p-2">WhatsApp</th><th className="border p-2">Email</th><th className="border p-2">Hub sugerido / Hub asignado</th><th className="border p-2">Tipo destino</th><th className="border p-2">Acción eliminar</th></tr></thead><tbody>{contactosImportados.length === 0 ? <tr><td colSpan={9} className="border p-6 text-center font-bold text-[#66745c]">Pegá una base cruda y tocá Procesar contactos para generar esta tabla de revisión.</td></tr> : contactosImportados.map((contacto) => <tr key={contacto.id} className={contacto.incluir ? "bg-[#eef4ea]" : "bg-white"}><td className="border p-2 text-center"><input type="checkbox" checked={contacto.incluir} onChange={(e) => actualizarContactoImportado(contacto.id, { incluir: e.target.checked })} /></td><td className="border p-1">{inputTexto(contacto.rol, (valor) => actualizarContactoImportado(contacto.id, { rol: valor.toUpperCase() as RolContactoImportado }), "min-w-24")}</td><td className="border p-1">{inputTexto(contacto.nombre, (valor) => actualizarContactoImportado(contacto.id, { nombre: valor }), "min-w-40")}</td><td className="border p-1">{inputTexto(contacto.referencia, (valor) => actualizarContactoImportado(contacto.id, { referencia: valor }), "min-w-48")}</td><td className="border p-1">{inputTexto(contacto.whatsapp, (valor) => actualizarContactoImportado(contacto.id, { whatsapp: valor }), "min-w-32")}</td><td className="border p-1">{inputTexto(contacto.email, (valor) => actualizarContactoImportado(contacto.id, { email: valor }), "min-w-48")}</td><td className="border p-1"><select value={contacto.hub} onChange={(e) => actualizarContactoImportado(contacto.id, { hub: e.target.value as HubImportacion })} className="h-8 min-w-52 rounded border border-[#cfd8c6] bg-white px-2 outline-none"><option value="Sin Hub asignado">Sin Hub asignado</option>{HUBS_DISPONIBLES.map((hub) => <option key={`hub-fila-${contacto.id}-${hub}`} value={hub}>{hub}</option>)}</select></td><td className="border p-1"><select value={contacto.tipoDestino} onChange={(e) => actualizarContactoImportado(contacto.id, { tipoDestino: e.target.value as TipoDestinoImportacion })} className="h-8 min-w-36 rounded border border-[#cfd8c6] bg-white px-2 outline-none"><option value="cliente">Cliente</option><option value="actor">Actor / Equipo</option><option value="auxiliar">Auxiliar</option><option value="ignorar">Ignorar</option></select></td><td className="border p-2 text-center"><button onClick={() => eliminarContactoImportado(contacto.id)} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div>
          <section className="rounded-lg border border-[#d8dfd1] bg-[#fffdf2] px-3 py-2 text-xs font-black"><span className="mr-2 text-[#66745c]">Sin Hub asignado:</span>{isMounted ? conteoSinHub : "—"} contactos</section>
          <section className="rounded-lg border border-[#d8dfd1] bg-[#f8faf5] px-3 py-2 text-xs font-black"><span className="mr-2 text-[#66745c]">Organización actual:</span>{HUBS_DISPONIBLES.map((hub, index) => <span key={`organizacion-${hub}`}>{index > 0 ? " | " : ""}{hub}: {isMounted ? jornada.datosPorHub[hub].clientesIngresos.length : "—"} clientes</span>)}<span> | Sin Hub asignado: {isMounted ? conteoSinHub : "—"} contactos</span></section>
        </section>}

        {seccionActiva === "reporte" && <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Zona A · Carga operativa</h2><span className="text-xs font-bold text-[#66745c]">Planilla compacta</span></div>
              <h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Clientes / ingresos</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Origen / sistema</th><th className="border p-1">Cliente</th><th className="border p-1">Email privado</th><th className="border p-1">Teléfono WhatsApp</th><th className="border p-1">Importe manual</th><th className="border p-1">Email</th><th className="border p-1"></th></tr></thead><tbody>{datosHub.clientesIngresos.map((cliente, index) => <tr key={`cliente-edit-${cliente.id}-${index}`} className={cliente.id === datosHub.clienteActivoId ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1"><span className="block min-w-32 px-1 font-semibold">JardinerosYa</span></td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.nombre, (valor) => actualizarCliente(cliente.id, { nombre: valor }))}</td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.email, (valor) => actualizarCliente(cliente.id, { email: valor }), "min-w-48")}</td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.telefono, (valor) => actualizarCliente(cliente.id, { telefono: valor }), "min-w-36")}</td><td className="border border-[#e1e6dc] p-1">{inputNumero(cliente.importe, (valor) => actualizarCliente(cliente.id, { importe: valor }))}</td><td className="border border-[#e1e6dc] p-1 text-center"><input type="radio" name="clienteActivo" checked={cliente.id === datosHub.clienteActivoId} onChange={() => actualizarDatosHub({ clienteActivoId: cliente.id })} /></td><td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => actualizarDatosHub({ clientesIngresos: datosHub.clientesIngresos.filter((fila) => fila.id !== cliente.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div><button onClick={() => actualizarDatosHub({ clientesIngresos: [...datosHub.clientesIngresos, { ...clienteIngresoInicial(""), id: crearId() }] })} className="mt-2 h-7 rounded-md bg-[#1f2a1d] px-3 text-xs font-black text-white">Agregar cliente</button>
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Resumen automático del Hub</h3>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total facturado al Hub</p><p className="text-sm font-black">{formatoMoneda(totalFacturadoHub)}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total gastos</p><p className="text-sm font-black">{formatoMoneda(totalGastos)}</p></div>
                <div className={`rounded-lg border p-2 ${totalADistribuir < 0 ? "border-[#d6b7b7] bg-[#fff7f7]" : "border-[#cfd8c6]"}`}><p className="text-[10px] font-black uppercase text-[#66745c]">Total a distribuir</p><p className="text-sm font-black">{formatoMoneda(totalADistribuir)}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Actores activos</p><p className="text-sm font-black">{cantidadActoresActivos}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total participación</p><p className="text-sm font-black">{totalParticipacion}</p></div>
              </div>
              {totalADistribuir < 0 && <p className="mt-2 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-2 py-1 text-xs font-black text-[#743c3c]">Advertencia: el total a distribuir es negativo.</p>}
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Gastos</h3><table className="w-full border-collapse text-xs"><tbody>{datosHub.gastos.map((gasto, index) => <tr key={`gasto-${gasto.id}-${index}`}><td className="border p-1">{inputTexto(gasto.concepto, (valor) => actualizarGasto(gasto.id, { concepto: valor }), "min-w-28")}</td><td className="border p-1">{inputNumero(gasto.importe, (valor) => actualizarGasto(gasto.id, { importe: valor }))}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ gastos: datosHub.gastos.filter((fila) => fila.id !== gasto.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table><button onClick={() => actualizarDatosHub({ gastos: [...datosHub.gastos, { id: crearId(), concepto: "", importe: 0 }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar gasto</button></div>
              </div>
              <div className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Actores del equipo</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Actor</th><th className="border p-1">Activo</th><th className="border p-1">Participación</th><th className="border p-1">Ajuste manual</th><th className="border p-1">Importe calculado</th><th className="border p-1"></th></tr></thead><tbody>{distribucionCalculada.map((actor, index) => <tr key={`actor-${actor.id}-${index}`}><td className="border p-1">{inputTexto(actor.nombre, (valor) => actualizarActor(actor.id, { nombre: valor }), "min-w-32")}</td><td className="border p-1 text-center"><input type="checkbox" checked={actor.activo} onChange={(e) => actualizarActor(actor.id, { activo: e.target.checked })} /></td><td className="border p-1">{inputNumero(actor.participacion, (valor) => actualizarActor(actor.id, { participacion: valor }))}</td><td className="border p-1">{inputNumero(actor.ajusteManual, (valor) => actualizarActor(actor.id, { ajusteManual: valor }))}</td><td className="border p-1 text-right font-black">{formatoMoneda(actor.importeFinal)}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ actores: datosHub.actores.filter((item) => item.id !== actor.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div><button onClick={() => actualizarDatosHub({ actores: [...datosHub.actores, { id: crearId(), nombre: "", activo: true, participacion: 1, ajusteManual: 0 }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar actor</button></div>
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Datos operativos</h3><div className="grid gap-2 lg:grid-cols-3"><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Tiempo efectivo por operario<input value={datosHub.resumen.tiempoEfectivo} onChange={(e) => actualizarResumen({ tiempoEfectivo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Estado operativo<input value={datosHub.resumen.estadoOperativo} onChange={(e) => actualizarResumen({ estadoOperativo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Observación general<input value={datosHub.resumen.observacionGeneral} onChange={(e) => actualizarResumen({ observacionGeneral: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label></div></section>
          </div>

          <aside className="space-y-3">
          <section className="border border-[#b9c5ae] bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#d8dfd1] pb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Vista previa exacta para mail</p>
                <h2 className="text-lg font-black">Documento administrativo emitido por sistema</h2>
                <p className="text-xs font-bold text-[#66745c]">La imagen generada usa exactamente este formato de factura / presupuesto / reporte.</p>
                <p className={`mt-1 text-xs font-black ${estadoEnvio === "error" ? "text-[#743c3c]" : estadoEnvio === "enviado" ? "text-[#2f6d32]" : "text-[#66745c]"}`}>{mensajeEnvio}</p>
              </div>
              <div className="flex flex-wrap gap-2"><button onClick={() => copiarTexto(reporteTexto, "Reporte")} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar reporte</button><button onClick={descargarImagenReporte} className="h-8 rounded-lg bg-[#5d7032] px-3 text-xs font-black text-white">Generar imagen del reporte</button><button onClick={enviarReporteClienteSeleccionado} disabled={estadoEnvio === "enviando"} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60">Enviar reporte al cliente seleccionado</button></div>
            </div>

            <article ref={reporteVisualRef} className="w-full max-w-[760px] border border-[#6f7968] bg-white p-0 font-sans text-[#182018] shadow-none">
              <header className="border-b-2 border-[#1f2a1d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#66745c]">HubYa</p>
                <h3 className="mt-1 text-xl font-black uppercase leading-tight">Reporte administrativo del Hub</h3>
                <p className="mt-1 text-xs font-semibold text-[#66745c]">Documento emitido por sistema</p>
              </header>

              <section className="border-b border-[#9aa78f] p-4">
                <h4 className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#1f2a1d]">Resumen rápido para el cliente</h4>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Cliente seleccionado</td><td className="border border-[#d8dfd1] p-1.5 font-bold">{clienteActivo?.nombre || "Sin cliente seleccionado"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Hub</td><td className="border border-[#d8dfd1] p-1.5">{jornada.hub}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Fecha</td><td className="border border-[#d8dfd1] p-1.5">{fechaFormateada}</td></tr>
                    <tr><td className="border border-[#1f2a1d] bg-[#eef2e8] p-2 font-black uppercase">Importe correspondiente a su espacio verde</td><td className="border border-[#1f2a1d] bg-[#eef2e8] p-2 text-lg font-black text-[#1f2a1d]">{formatoPlano(clienteActivo?.importe) || formatoMoneda(0)}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Estado operativo</td><td className="border border-[#d8dfd1] p-1.5 font-bold">{datosHub.resumen.estadoOperativo || "Sin cargar"}</td></tr>
                  </tbody>
                </table>
              </section>

              <div className="p-4">
                <table className="w-full border-collapse bg-white text-xs">
                  <tbody>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Clientes / ingresos</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th className="border border-[#d8dfd1] p-1.5 text-left">Origen / sistema</th><th className="border border-[#d8dfd1] p-1.5 text-left">Nombre cliente</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {datosHub.clientesIngresos.map((cliente, index) => <tr key={`cliente-reporte-${cliente.id}-${index}`}><td className="border border-[#d8dfd1] p-1.5">{cliente.origen || "Sin origen"}</td><td className="border border-[#d8dfd1] p-1.5">{nombrePrivado(cliente, index) || "Sin cliente"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoPlano(cliente.importe)}</td></tr>)}
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total facturado al Hub</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalFacturadoHub)}</td></tr>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Gastos</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th colSpan={2} className="border border-[#d8dfd1] p-1.5 text-left">Concepto</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {datosHub.gastos.map((gasto, index) => <tr key={`gasto-${gasto.id}-${index}`}><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{gasto.concepto || "Sin concepto"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoPlano(gasto.importe)}</td></tr>)}
                    <tr className="font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total gastos</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalGastos)}</td></tr>
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total a distribuir</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalADistribuir)}</td></tr>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Distribución automática por actor</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th className="border border-[#d8dfd1] p-1.5 text-left">Actor</th><th className="border border-[#d8dfd1] p-1.5 text-center">Participación / activo</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {distribucionCalculada.map((actor, index) => <tr key={`actor-${actor.id}-${index}`}><td className="border border-[#d8dfd1] p-1.5">{actor.nombre || "Sin actor"}</td><td className="border border-[#d8dfd1] p-1.5 text-center">{numero(actor.participacion)} / {actor.activo ? "activo" : "inactivo"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoMoneda(actor.importeFinal)}</td></tr>)}
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total distribuido</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalDistribuido)}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Tiempo efectivo</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.tiempoEfectivo || "Sin cargar"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Estado operativo</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.estadoOperativo || "Sin cargar"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Observación</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.observacionGeneral || "Sin cargar"}</td></tr>
                  </tbody>
                </table>
                <p className="mt-2 border border-[#d8dfd1] bg-[#f8faf5] p-2 text-[10px] font-semibold text-[#66745c]">Privacidad: solo el cliente seleccionado se muestra con nombre real. Los demás clientes están anonimizados como Cliente 2, Cliente 3, Cliente 4, etc. y no se incluyen emails.</p>

                <section className="mt-3 border border-[#9aa78f] p-3 text-xs leading-5">
                  <h4 className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#1f2a1d]">Sobre HubYa</h4>
                  {sobreHubYaLineas.map((linea) => <p key={linea} className="mt-2 first:mt-0">{linea}</p>)}
                </section>
              </div>
            </article>
          </section>

          <details className="rounded-xl border border-[#1f2a1d] bg-[#1f2a1d] p-3 text-white shadow-sm"><summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Mail corto para enviar con el documento</summary><div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><select value={datosHub.clienteActivoId} onChange={(e) => actualizarDatosHub({ clienteActivoId: Number(e.target.value) })} className="h-8 rounded-lg bg-white px-2 text-sm font-semibold text-[#182018]">{datosHub.clientesIngresos.map((cliente, index) => <option key={`cliente-activo-${cliente.id}-${index}`} value={cliente.id}>{cliente.nombre || "Sin cliente"}</option>)}</select><button onClick={() => copiarTexto(emailPrivado, "Email privado")} className="h-8 rounded-lg bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar texto del mail</button></div><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white/10 p-3 text-xs leading-5">{emailPrivado}</pre></details>
          <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Historial independiente</p><h2 className="text-lg font-black">Resúmenes guardados del Hub</h2><p className="text-xs font-bold text-[#66745c]">Solo se listan resúmenes de {jornada.hub}.</p></div>
              <button onClick={guardarResumenHub} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar resumen del Hub</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[#d8dfd1]">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1.5">Fecha</th><th className="border p-1.5">Nombre del resumen</th><th className="border p-1.5">Estado operativo</th><th className="border p-1.5 text-right">Total facturado</th><th className="border p-1.5">Guardado</th><th className="border p-1.5">Acciones</th></tr></thead>
                <tbody>{resumenesDelHub.length === 0 ? <tr><td colSpan={6} className="border p-3 text-center font-bold text-[#66745c]">Todavía no hay resúmenes guardados para {jornada.hub}.</td></tr> : resumenesDelHub.map((resumen, index) => <tr key={`resumen-${resumen.id}-${index}`}><td className="border border-[#e1e6dc] p-1.5 font-semibold">{formatoFecha(resumen.fecha)}</td><td className="border border-[#e1e6dc] p-1.5 font-bold">{resumen.nombre}</td><td className="border border-[#e1e6dc] p-1.5">{resumen.estadoOperativo || "Sin cargar"}</td><td className="border border-[#e1e6dc] p-1.5 text-right font-black">{formatoMoneda(resumen.totales.totalFacturado)}</td><td className="border border-[#e1e6dc] p-1.5">{new Date(resumen.guardadoEn).toLocaleString("es-AR")}</td><td className="border border-[#e1e6dc] p-1.5"><div className="flex flex-wrap gap-1"><button onClick={() => abrirResumenHub(resumen)} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Abrir</button><button onClick={() => duplicarResumenHub(resumen)} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Duplicar</button><button onClick={() => eliminarResumenHub(resumen)} className="h-7 rounded-md border border-[#d6b7b7] bg-[#fff7f7] px-2 text-[11px] font-black text-[#743c3c]">Eliminar</button></div></td></tr>)}</tbody>
              </table>
            </div>
          </section>

        </aside>
        </section>}
      </section>
    </main>
  );
}
