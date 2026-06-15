"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";
const HISTORIAL_RESUMENES_STORAGE_KEY = "hubya-historial-resumenes";
const INFORMACION_STORAGE_KEY = "hubya-envio-informacion-borrador";
const CONTACTOS_SIN_HUB_STORAGE_KEY = "clientesSinHub";
const CONTACTOS_SIN_HUB_LEGACY_STORAGE_KEY = "hubya-contactos-sin-hub";
const CLIENTES_POR_HUB_STORAGE_KEY = "clientesPorHub";
const CONTACTOS_TRABAJO_STORAGE_KEY = "hubya-contactos-trabajo";
const ACTORES_EQUIPO_STORAGE_KEY = "actoresEquipo";
const AUXILIARES_STORAGE_KEY = "auxiliares";

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
  const guardados = window.localStorage.getItem(CONTACTOS_TRABAJO_STORAGE_KEY);
  if (!guardados) return [] as ContactoImportado[];
  try {
    const contactos = JSON.parse(guardados) as Partial<ContactoImportado>[];
    return contactos.map((contacto, index) => ({
      id: contacto.id || crearImportId(index, `${contacto.email || ""}|${contacto.nombre || ""}|${contacto.referencia || ""}`),
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
    }));
  } catch {
    window.localStorage.removeItem(CONTACTOS_TRABAJO_STORAGE_KEY);
    return [] as ContactoImportado[];
  }
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
  const [seccionActiva, setSeccionActiva] = useState<"reporte" | "informacion" | "importar">("reporte");
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
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState("Importá datos o editá la tabla de trabajo.");
  const [resumenGuardadoContactos, setResumenGuardadoContactos] = useState<ResumenGuardadoContactos | null>(null);
  const reporteVisualRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setJornada(leerJornadaInicial());
    setHistorialResumenes(leerHistorialResumenes());
    setContactosSinHub(leerContactosSinHub());
    setContactosImportados(leerContactosTrabajo());
    setAuxiliares(leerAuxiliares());
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
    localStorage.setItem(CONTACTOS_TRABAJO_STORAGE_KEY, JSON.stringify(contactosImportados));
  }, [contactosImportados, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(AUXILIARES_STORAGE_KEY, JSON.stringify(auxiliares));
  }, [auxiliares, isMounted]);

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
    setDestinatariosInformacion(jornada.datosPorHub[hub].clientesIngresos.map((cliente) => ({ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, incluido: Boolean(cliente.telefono.trim()) })));
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
  ].join("\n"), [clienteActivo?.nombre, datosHub.clientesIngresos, datosHub.gastos, datosHub.resumen.estadoOperativo, datosHub.resumen.observacionGeneral, datosHub.resumen.tiempoEfectivo, distribucionCalculada, fechaFormateada, jornada.hub, nombrePrivado, totalADistribuir, totalDistribuido, totalFacturadoHub, totalGastos]);

  const asuntoReporte = `Reporte diario HubYa — ${jornada.hub} — ${fechaFormateada}`;

  const emailPrivado = useMemo(() => [
    `Hola ${clienteActivo?.nombre || "cliente"}, te compartimos el reporte correspondiente a la jornada del ${jornada.hub} del día ${fechaFormateada}. Lo principal está resumido al inicio del comprobante. El detalle queda disponible como respaldo de transparencia operativa.`,
    "",
    "Saludos,",
    "HubYa",
  ].join("\n"), [clienteActivo?.nombre, fechaFormateada, jornada.hub]);

  const filasClientesHtml = datosHub.clientesIngresos.map((cliente, index) => `
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
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Cliente seleccionado</td><td style="border:1px solid #d8dfd1;padding:6px;font-weight:700;">${escaparHtml(clienteActivo?.nombre || "Sin cliente seleccionado")}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Hub</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(jornada.hub)}</td></tr>
            <tr><td style="border:1px solid #d8dfd1;background:#f6f8f3;padding:6px;font-weight:900;text-transform:uppercase;">Fecha</td><td style="border:1px solid #d8dfd1;padding:6px;">${escaparHtml(fechaFormateada)}</td></tr>
            <tr><td style="border:1px solid #1f2a1d;background:#eef2e8;padding:8px;font-weight:900;text-transform:uppercase;">Importe correspondiente a su espacio verde</td><td style="border:1px solid #1f2a1d;background:#eef2e8;padding:8px;color:#1f2a1d;font-size:18px;font-weight:900;">${escaparHtml(formatoPlano(clienteActivo?.importe) || formatoMoneda(0))}</td></tr>
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
    </article>`, [clienteActivo?.importe, clienteActivo?.nombre, datosHub.resumen.estadoOperativo, datosHub.resumen.observacionGeneral, datosHub.resumen.tiempoEfectivo, fechaFormateada, filasActoresHtml, filasClientesHtml, filasGastosHtml, jornada.hub, sobreHubYaHtml, totalADistribuir, totalDistribuido, totalFacturadoHub, totalGastos]);


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


  function volcarContactosATabla() {
    const filas = baseContactosCruda.split(/\r?\n/).map(procesarLineaContacto).filter((fila): fila is ContactoImportado => Boolean(fila));
    setContactosImportados((actuales) => [...actuales, ...filas]);
    setBaseContactosCruda("");
    setMostrarImportador(false);
    setMensajeImportacion(filas.length ? `${filas.length} contactos volcados a la tabla de trabajo.` : "No se detectaron contactos para volcar.");
  }

  function actualizarContactoImportado(id: string, cambios: Partial<ContactoImportado>) {
    setContactosImportados((actuales) => actuales.map((contacto) => contacto.id === id ? { ...contacto, ...cambios } : contacto));
  }

  function eliminarContactoImportado(id: string) {
    setContactosImportados((actuales) => actuales.filter((contacto) => contacto.id !== id));
  }

  function claveCliente(contacto: Pick<ContactoImportado, "email" | "nombre" | "referencia"> | Pick<FilaClienteIngreso, "email" | "nombre" | "referencia">) {
    const email = contacto.email.trim().toLowerCase();
    if (email) return `email:${email}`;
    const nombreReferencia = normalizarTextoBusqueda(`${contacto.nombre.trim()}|${(contacto.referencia || "").trim()}`);
    return nombreReferencia === "|" ? "sin-datos" : `nombre-ref:${nombreReferencia}`;
  }

  function guardarContactos() {
    const incluidos = contactosImportados.filter((contacto) => contacto.incluir);
    const resumen: ResumenGuardadoContactos = { clientesConHub: 0, clientesSinHub: 0, actores: 0, auxiliares: 0, ignorados: contactosImportados.filter((contacto) => !contacto.incluir || contacto.tipoDestino === "ignorar").length };
    const guardadoEn = new Date().toISOString();
    const nuevosSinHub: ContactoSinHub[] = [];
    const nuevosAuxiliares: ContactoImportado[] = [];

    setJornada((actual) => {
      const datosPorHubActualizados = { ...actual.datosPorHub };
      for (const contacto of incluidos) {
        if (contacto.tipoDestino === "ignorar") continue;
        if (contacto.tipoDestino === "auxiliar") {
          nuevosAuxiliares.push(contacto);
          resumen.auxiliares += 1;
          continue;
        }
        const hubDestino = contacto.hub === "Sin Hub asignado" ? actual.hub : contacto.hub;
        if (contacto.tipoDestino === "actor") {
          const datos = datosPorHubActualizados[hubDestino];
          const existente = datos.actores.find((actor) => normalizarTextoBusqueda(actor.nombre.trim()) === normalizarTextoBusqueda(contacto.nombre.trim()));
          datosPorHubActualizados[hubDestino] = { ...datos, actores: existente ? datos.actores.map((actor) => actor.id === existente.id ? { ...actor, nombre: contacto.nombre || actor.nombre } : actor) : [...datos.actores, { id: crearId(), nombre: contacto.nombre, activo: true, participacion: 1, ajusteManual: 0 }] };
          resumen.actores += 1;
          continue;
        }
        if (contacto.hub === "Sin Hub asignado") {
          const clave = claveCliente(contacto);
          const yaExiste = contactosSinHub.some((cliente) => claveCliente(cliente) === clave);
          if (!yaExiste) nuevosSinHub.push({ ...contacto, guardadoEn });
          resumen.clientesSinHub += 1;
          continue;
        }
        const datos = datosPorHubActualizados[contacto.hub];
        const clave = claveCliente(contacto);
        const existente = datos.clientesIngresos.find((cliente) => claveCliente(cliente) === clave);
        const datosCliente = { nombre: contacto.nombre, referencia: contacto.referencia, email: contacto.email, telefono: contacto.whatsapp, origen: "JardinerosYa" };
        const nuevoCliente = { ...clienteIngresoInicial(contacto.nombre), id: crearId(), ...datosCliente };
        const clientesIngresos = existente ? datos.clientesIngresos.map((cliente) => cliente.id === existente.id ? { ...cliente, ...datosCliente } : cliente) : [...datos.clientesIngresos, nuevoCliente];
        datosPorHubActualizados[contacto.hub] = { ...datos, clientesIngresos, clienteActivoId: datos.clienteActivoId || existente?.id || nuevoCliente.id };
        resumen.clientesConHub += 1;
      }
      return { ...actual, datosPorHub: datosPorHubActualizados };
    });

    if (nuevosSinHub.length > 0) setContactosSinHub((actuales) => [...nuevosSinHub, ...actuales]);
    if (nuevosAuxiliares.length > 0) setAuxiliares((actuales) => [...nuevosAuxiliares, ...actuales]);
    setResumenGuardadoContactos(resumen);
    setMensajeImportacion("Guardado correctamente");
  }

  function asignarContactoSinHub(contactoGuardado: ContactoSinHub, hub: HubDisponible) {
    const contacto: ContactoImportado = { ...contactoGuardado, incluir: true, hub, tipoDestino: contactoGuardado.tipoDestino === "ignorar" ? "cliente" : contactoGuardado.tipoDestino };
    if (contacto.tipoDestino === "cliente") {
      setJornada((actual) => {
        const datos = actual.datosPorHub[hub];
        const clave = claveCliente(contacto);
        const existente = datos.clientesIngresos.find((cliente) => claveCliente({ email: cliente.email, nombre: cliente.nombre, referencia: cliente.referencia || "" }) === clave);
        const datosCliente = { nombre: contacto.nombre, referencia: contacto.referencia, email: contacto.email, telefono: contacto.whatsapp, origen: "JardinerosYa" };
        const nuevoCliente = { ...clienteIngresoInicial(contacto.nombre), id: crearId(), ...datosCliente };
        const clientesIngresos = existente
          ? datos.clientesIngresos.map((cliente) => cliente.id === existente.id ? { ...cliente, ...datosCliente } : cliente)
          : [...datos.clientesIngresos, nuevoCliente];
        return { ...actual, datosPorHub: { ...actual.datosPorHub, [hub]: { ...datos, clientesIngresos, clienteActivoId: datos.clienteActivoId || existente?.id || nuevoCliente.id } } };
      });
    }
    setContactosSinHub((actuales) => actuales.filter((item) => !(item.id === contactoGuardado.id && item.guardadoEn === contactoGuardado.guardadoEn)));
    setMensajeImportacion(`${contacto.nombre || "Contacto"} asignado a ${hub}.`);
  }


  function asignarContactoSinHubDesdeFormulario(contacto: ContactoSinHub, formulario: HTMLFormElement) {
    const datos = new FormData(formulario);
    const hub = datos.get("hubDestino");
    if (!hub || !HUBS_DISPONIBLES.includes(hub as HubDisponible)) {
      setMensajeImportacion("Elegí un Hub antes de asignar el cliente.");
      return;
    }
    asignarContactoSinHub(contacto, hub as HubDisponible);
    formulario.reset();
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
              <span className="mt-2 block text-xs font-bold text-[#66745c]">{jornada.datosPorHub[hub].clientesIngresos.length} clientes</span>
              <span className="mt-1 block text-xs font-bold text-[#66745c]">{(historialResumenes[hub] || []).length} resúmenes guardados</span>
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
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado} · Carga principal editable con sumas y distribución automáticas.</p>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#d8dfd1] pt-3">
            <button onClick={() => setSeccionActiva("reporte")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "reporte" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Reporte diario</button>
            <button onClick={() => setSeccionActiva("informacion")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "informacion" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Envío por WhatsApp</button>
            <button onClick={() => setSeccionActiva("importar")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "importar" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Importar contactos</button>
          </div>
        </header>

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


        {seccionActiva === "importar" && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Planilla única</p><h2 className="text-lg font-black">Contactos / Clientes</h2><p className="text-xs font-semibold text-[#66745c]">Una sola tabla editable para importar, asignar Hub, clasificar destino y guardar en localStorage.</p></div>
            <p className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-3 py-2 text-xs font-black text-[#66745c]">{mensajeImportacion}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-2">
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub de trabajo<select value={jornada.hub} onChange={(e) => seleccionarHubTrabajo(e.target.value as HubDisponible)} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold normal-case outline-none">{HUBS_DISPONIBLES.map((hub) => <option key={`selector-contactos-${hub}`} value={hub}>{hub}</option>)}</select></label>
            <button onClick={() => setMostrarImportador((actual) => !actual)} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black text-[#1f2a1d]">Importar datos</button>
            <button onClick={guardarContactos} disabled={!contactosImportados.some((contacto) => contacto.incluir && contacto.tipoDestino !== "ignorar")} className="h-8 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white disabled:opacity-50">Guardar</button>
          </div>
          {mostrarImportador && <div className="rounded-xl border border-[#cfd8c6] bg-white p-3 shadow-sm">
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Base cruda<textarea value={baseContactosCruda} onChange={(e) => setBaseContactosCruda(e.target.value)} placeholder="CLIENTE, Ana, Tipal lote 12, 387..., ana@email.com, 12/06/2026, 1234" className="min-h-40 rounded-xl border border-[#cfd8c6] p-3 text-sm normal-case outline-none" /></label>
            <button onClick={volcarContactosATabla} className="mt-2 h-8 rounded-lg bg-[#5d7032] px-3 text-xs font-black text-white">Volcar a tabla</button>
          </div>}
          {resumenGuardadoContactos && <div className="rounded-xl border border-[#b7d6ba] bg-[#f2fff4] p-3 text-xs font-black text-[#1f2a1d]"><p className="mb-1 text-sm">Guardado correctamente</p><p>{resumenGuardadoContactos.clientesConHub} clientes asignados a Hubs</p><p>{resumenGuardadoContactos.clientesSinHub} clientes sin Hub</p><p>{resumenGuardadoContactos.actores} actores/equipo</p><p>{resumenGuardadoContactos.ignorados} ignorados</p></div>}
          <div className="overflow-x-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Incluir sí/no</th><th className="border p-1">Rol</th><th className="border p-1">Nombre</th><th className="border p-1">Referencia</th><th className="border p-1">WhatsApp</th><th className="border p-1">Email</th><th className="border p-1">Hub asignado</th><th className="border p-1">Tipo destino</th><th className="border p-1">Observación</th><th className="border p-1">Eliminar</th></tr></thead><tbody>{contactosImportados.length === 0 ? <tr><td colSpan={10} className="border p-3 text-center font-bold text-[#66745c]">Tocá Importar datos para pegar una base o trabajá sobre contactos ya persistidos.</td></tr> : contactosImportados.map((contacto) => <tr key={contacto.id} className={contacto.incluir ? "bg-[#eef4ea]" : "bg-white opacity-70"}><td className="border p-1 text-center"><input type="checkbox" checked={contacto.incluir} onChange={(e) => actualizarContactoImportado(contacto.id, { incluir: e.target.checked })} /></td><td className="border p-1">{inputTexto(contacto.rol, (valor) => actualizarContactoImportado(contacto.id, { rol: valor.toUpperCase() as RolContactoImportado }), "min-w-24")}</td><td className="border p-1">{inputTexto(contacto.nombre, (valor) => actualizarContactoImportado(contacto.id, { nombre: valor }), "min-w-36")}</td><td className="border p-1">{inputTexto(contacto.referencia, (valor) => actualizarContactoImportado(contacto.id, { referencia: valor }), "min-w-48")}</td><td className="border p-1">{inputTexto(contacto.whatsapp, (valor) => actualizarContactoImportado(contacto.id, { whatsapp: valor }), "min-w-32")}</td><td className="border p-1">{inputTexto(contacto.email, (valor) => actualizarContactoImportado(contacto.id, { email: valor }), "min-w-48")}</td><td className="border p-1"><select value={contacto.hub} onChange={(e) => actualizarContactoImportado(contacto.id, { hub: e.target.value as HubImportacion })} className="h-7 min-w-48 bg-transparent outline-none"><option>Sin Hub asignado</option>{HUBS_DISPONIBLES.map((hub) => <option key={`${contacto.id}-${hub}`} value={hub}>{hub}</option>)}</select></td><td className="border p-1"><select value={contacto.tipoDestino} onChange={(e) => actualizarContactoImportado(contacto.id, { tipoDestino: e.target.value as TipoDestinoImportacion })} className="h-7 min-w-32 bg-transparent outline-none"><option value="cliente">Cliente</option><option value="actor">Actor / Equipo</option><option value="auxiliar">Auxiliar</option><option value="ignorar">Ignorar</option></select></td><td className="border p-1">{inputTexto(contacto.observacion, (valor) => actualizarContactoImportado(contacto.id, { observacion: valor }), "min-w-48")}</td><td className="border p-1 text-center"><button onClick={() => eliminarContactoImportado(contacto.id)} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div>
          <section className="rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-black">Organización actual</h3><p className="text-xs font-bold text-[#66745c]">Cantidades por Hub y clientes visibles en listas compactas. Los clientes sin Hub pueden moverse desde acá.</p></div><span className="rounded-lg border border-[#cfd8c6] bg-white px-2 py-1 text-xs font-black text-[#66745c]">{contactosSinHub.length} sin Hub</span></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{HUBS_DISPONIBLES.map((hub) => { const clientes = jornada.datosPorHub[hub].clientesIngresos; return <details key={`organizacion-${hub}`} className="rounded-lg border border-[#cfd8c6] bg-white p-2" open={hub === jornada.hub}><summary className="cursor-pointer text-xs font-black uppercase text-[#1f2a1d]">{hub}: {clientes.length} clientes</summary><ul className="mt-2 space-y-1 text-xs font-semibold text-[#66745c]">{clientes.map((cliente) => <li key={`organizacion-cliente-${hub}-${cliente.id}`} className="truncate">{cliente.nombre || "Sin nombre"}{cliente.referencia ? ` · ${cliente.referencia}` : ""}</li>)}{clientes.length === 0 && <li className="italic">Sin clientes asignados.</li>}</ul></details>; })}<details className="rounded-lg border border-[#cfd8c6] bg-white p-2" open><summary className="cursor-pointer text-xs font-black uppercase text-[#1f2a1d]">Sin Hub asignado: {contactosSinHub.length} clientes</summary><div className="mt-2 space-y-2">{contactosSinHub.length === 0 ? <p className="text-xs font-semibold italic text-[#66745c]">Sin clientes pendientes.</p> : contactosSinHub.map((contacto) => <div key={`organizacion-sin-hub-${contacto.id}-${contacto.guardadoEn}`} className="grid gap-1 rounded-md border border-[#e1e6dc] p-2 text-xs"><span className="font-black">{contacto.nombre || "Sin nombre"}</span><span className="text-[#66745c]">{contacto.referencia || "Sin referencia"}</span><select defaultValue="" onChange={(e) => { if (e.target.value) asignarContactoSinHub(contacto, e.target.value as HubDisponible); }} className="h-7 rounded-md border border-[#cfd8c6] bg-white px-2 outline-none"><option value="">Mover a Hub...</option>{HUBS_DISPONIBLES.map((hub) => <option key={`mover-${contacto.id}-${hub}`} value={hub}>{hub}</option>)}</select></div>)}</div></details></div></section>
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
