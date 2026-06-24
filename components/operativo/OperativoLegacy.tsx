"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EQUIPOS_ACTIVOS_STORAGE_KEY, ESTADOS_EQUIPO_ACTIVO, ESTADOS_INTEGRANTE, ROLES_INTEGRANTE, SOLICITUDES_OFERTA_STORAGE_KEY, TIPOS_EQUIPO_ACTIVO, createEquipoActivo, equiposActivosIniciales, slugEquipo, type ConsultaEquipoActivo, type EquipoActivo, type IntegranteEquipoActivo, type MensajeEquipoActivo, type SolicitudOferta } from "@/lib/data/equiposActivos";
import { SOLICITUDES_NUEVO_HUB_STORAGE_KEY, type SolicitudNuevoHub } from "@/components/public/RequestHubForm";
import { ESTADOS_HUB_VINCULO, HUB_VINCULOS_STORAGE_KEY, type EstadoHubVinculo, type HubVinculo } from "@/lib/data/hubVinculosTypes";
import type { Cliente, HubPublico, ReporteHub as ReporteHubPersistido } from "@/lib/data/hubs";

type CampoNumerico = number | "";

type FilaClienteIngreso = {
  id: number;
  contactoId?: string;
  origen: string;
  nombre: string;
  referencia?: string;
  email: string;
  telefono: string;
  importe: CampoNumerico;
  trabajoRealizado: string;
  trabajoPendiente: string;
  tarifaCliente: TarifaCliente;
};

type TarifaCliente = "tarifa_1" | "tarifa_2" | "tarifa_3" | "sin_tarifa";
const TARIFAS_CLIENTE: Array<{ value: TarifaCliente; label: string }> = [
  { value: "tarifa_1", label: "Tarifa 1" },
  { value: "tarifa_2", label: "Tarifa 2" },
  { value: "tarifa_3", label: "Tarifa 3" },
  { value: "sin_tarifa", label: "Sin tarifa asignada" },
];

type FilaGasto = { id: number; concepto: string; importe: CampoNumerico };
type FilaActor = { id: number; nombre: string; activo: boolean; participacion: CampoNumerico; ajusteManual: CampoNumerico; email?: string; whatsapp?: string; rol?: string; recibeReportes?: boolean; participaDistribucion?: boolean; observacion?: string };

type ResumenHubManual = {
  tiempoEfectivo: string;
  estadoOperativo: string;
  observacionGeneral: string;
};

type HubDisponible = string;
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

type EstadoReporteHub = "BORRADOR" | "GUARDADO" | "ENVIADO";

type ResumenGuardadoHub = {
  id: string;
  hub: HubDisponible;
  fecha: string;
  nombre: string;
  guardadoEn: string;
  ultimaEdicion?: string;
  estado?: EstadoReporteHub;
  fechaEnvio?: string;
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

type EstadoDestinatarioReporte = "listo para enviar" | "enviado a proveedor" | "error" | "sin email" | "email inválido" | "no seleccionado";

type ResultadoDestinatarioReporte = {
  id: number | string;
  nombre: string;
  email: string;
  estado: EstadoDestinatarioReporte;
  error?: string;
  fechaHora?: string;
  providerMessageId?: string;
  resendId?: string;
};

type ResumenEnvioReporte = {
  id: string;
  fechaHora: string;
  hub: HubDisponible;
  reporte: string;
  tipo: "definitivo" | "prueba";
  destinatariosSeleccionados: number;
  enviadosAProveedor: number;
  errores: number;
  sinEmail: number;
  pendientesRespuesta: number;
  fromUsado?: string;
  replyToUsado?: string;
  destinatarios: ResultadoDestinatarioReporte[];
};

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

type DestinatarioReporte = FilaClienteIngreso & { grupo: "cliente" | "operativo"; rol?: string };

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function idsOrdenadosIguales(actuales: number[], esperados: number[]) {
  if (actuales.length !== esperados.length) return false;
  const actualesOrdenados = [...actuales].sort((a, b) => a - b);
  return actualesOrdenados.every((id, index) => id === esperados[index]);
}


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
const BORRADORES_REPORTES_STORAGE_KEY = "hubya-borradores-reportes";
const INFORMACION_STORAGE_KEY = "hubya-envio-informacion-borrador";
const CONTACTOS_SIN_HUB_STORAGE_KEY = "clientesSinHub";
const CONTACTOS_SIN_HUB_LEGACY_STORAGE_KEY = "hubya-contactos-sin-hub";
const CLIENTES_POR_HUB_STORAGE_KEY = "clientesPorHub";
const CONTACTOS_TRABAJO_STORAGE_KEY = "hubya-contactos-trabajo";
const LISTA_GENERAL_CONTACTOS_STORAGE_KEY = "listaGeneralContactos";
const ACTORES_EQUIPO_STORAGE_KEY = "actoresEquipo";
const AUXILIARES_STORAGE_KEY = "auxiliares";
const CONSULTAS_HUB_STORAGE_KEY = "hubya-consultas-hub";
const ENVIOS_REPORTES_STORAGE_KEY = "hubya-envios-reportes";
const NUEVO_HUB_FORM_INICIAL = { tipoHub: "demanda", nombre: "", zona: "", rama: "", equipoOperativo: "", descripcion: "", responsable: "" };
const NUEVO_VINCULO_FORM_INICIAL = { hub_id: "Hub Tipal" as HubDisponible, oferta_id: "", estado: "POSTULANTE" as EstadoHubVinculo, rol: "Resolutor", fecha_inicio: "", fecha_fin: "", capacidad: "", observaciones: "" };

const HUBS_DISPONIBLES = [
  "Hub Tipal",
  "Hub Punto",
  "Hub Praderas",
  "Hub Valle Escondido",
  "Hub Chacras de Santa María",
  "Hub La Aguada",
  "Hub Prado",
  "Hub La Reserva",
];

const trabajoRealizadoInicial = "Mantenimiento integral de espacios verdes, corte, bordes y limpieza general.";
const trabajoPendienteInicial = "Validación final con cada cliente y próximos repasos programados.";
const observacionGeneralInicial = "Resumen cargado manualmente. Sin cálculos automáticos obligatorios.";
const contactoDudasReporte = "Por cualquier duda, comunicarse al 3874142770.";
const sobreHubYaLineas: string[] = [];
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

const MENSAJE_SIN_GASTOS_REALES = "No se registraron gastos adicionales en este reporte.";
const conceptosReferenciaHub = ["referencia", "parametro", "parámetro", "jornal", "comision", "comisión", "valor hora", "hora cortadora", "hora bordeadora", "maquina de empuje", "máquina de empuje", "jardinerosya"];

function esGastoRealDelDia(gasto: FilaGasto) {
  const concepto = normalizarTextoBusqueda(gasto.concepto || "");
  if (!concepto || numero(gasto.importe) <= 0) return false;
  return !conceptosReferenciaHub.some((referencia) => concepto.includes(normalizarTextoBusqueda(referencia)));
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
    tarifaCliente: "sin_tarifa",
  };
}


function clientePublicoAIngreso(cliente: Cliente, index = 0): FilaClienteIngreso {
  return {
    id: idNumericoEstable(cliente.id || `${cliente.nombre}-${index}`),
    contactoId: cliente.id,
    origen: "HUBYA",
    nombre: cliente.nombre || `Cliente ${index + 1}`,
    referencia: cliente.referencia || "Cliente real del Hub",
    email: cliente.email || "",
    telefono: cliente.whatsapp || "",
    importe: 0,
    trabajoRealizado: trabajoRealizadoInicial,
    trabajoPendiente: trabajoPendienteInicial,
    tarifaCliente: cliente.tarifaCliente || "sin_tarifa",
  };
}

function aplicarClientesIniciales(datos: DatosHub, clientesIniciales: Cliente[] | undefined): DatosHub {
  if (!clientesIniciales?.length || datos.clientesIngresos.length > 0) return datos;
  const clientesIngresos = clientesIniciales.map(clientePublicoAIngreso);
  return { ...datos, clientesIngresos, clienteActivoId: clientesIngresos[0]?.id || 0 };
}

function aplicarParametrosOperativos(datos: DatosHub, hub?: HubPublico): DatosHub {
  const parametros = hub?.moduloOperativo === "jardinerosya" ? hub.parametrosOperativos?.jardinerosYa : undefined;
  if (!parametros) return datos;
  const actores = datos.actores.map((actor, index) => index === 0 ? { ...actor, nombre: actor.nombre || "Responsable de cuadrilla", ajusteManual: parametros.valorHoraTrabajo * parametros.comisionResponsableCuadrillaPorcentaje / 100 } : actor);
  return { ...datos, actores, resumen: { ...datos.resumen, observacionGeneral: datos.resumen.observacionGeneral || "Los gastos cuentan lo que pasó en el día. Los parámetros definen las reglas de referencia del Hub." } };
}

function datosHubInicial(hub: HubDisponible): DatosHub {
  const hubIndex = HUBS_DISPONIBLES.indexOf(hub) + 1 || idNumericoEstable(hub);
  const clientesDelHub = clientesBasePorHub[hub] ?? [];
  const clientesIngresos = clientesDelHub.map((nombre, index) => clienteIngresoInicial(nombre, index, hubIndex * 1000));
  return {
    clientesIngresos,
    gastos: ["Nafta", "Maquinaria", "Servicios de administración del Hub", "Tanza"].map((concepto, index) => ({ id: hubIndex * 10000 + index, concepto, importe: 0 })),
    actores: [
      { nombre: "", rol: "Capataz", participacion: 1.5 },
      { nombre: "", rol: "Segundo jardinero", participacion: 1.2 },
      { nombre: "", rol: "Ayudante", participacion: 1 },
    ].map((actor, index) => ({ id: hubIndex * 100000 + index, nombre: actor.nombre, rol: actor.rol, activo: true, participacion: actor.participacion, ajusteManual: 0 })),
    resumen: resumenInicial(),
    clienteActivoId: clientesIngresos[0]?.id || 0,
  };
}

const datosInicialesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, datosHubInicial(hub)])) as DatosPorHub;
function crearDatosParaHubs(datosPorHub: Partial<DatosPorHub> | undefined, hubs: HubDisponible[]): DatosPorHub {
  return Object.fromEntries(hubs.map((hub) => [hub, normalizarDatosHub(datosPorHub?.[hub], hub)])) as DatosPorHub;
}

function nombresHubsCanonicos(hubs: HubPublico[]) {
  return hubs.map((hub) => hub.nombre);
}

function fusionarNombresHubs(hubsCanonicos: HubPublico[]) {
  return Array.from(new Set([...nombresHubsCanonicos(hubsCanonicos), ...HUBS_DISPONIBLES]));
}


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
    contactoId: cliente.contactoId,
    origen: "JardinerosYa",
    nombre: cliente.nombre || "",
    referencia: cliente.referencia || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    importe: cliente.importe ?? 0,
    trabajoRealizado: cliente.trabajoRealizado || trabajoRealizadoInicial,
    trabajoPendiente: cliente.trabajoPendiente || trabajoPendienteInicial,
    tarifaCliente: cliente.tarifaCliente || "sin_tarifa",
  };
}

function normalizarActor(actor: Partial<FilaActor> & { actor?: string; importe?: CampoNumerico }, index = 0): FilaActor {
  const participacionesSugeridas = [1.5, 1.2, 1];
  const rolesSugeridos = ["Capataz", "Segundo jardinero", "Ayudante"];
  return {
    id: actor.id || crearId(),
    nombre: actor.nombre || actor.actor || "",
    activo: actor.activo ?? true,
    participacion: actor.participacion ?? participacionesSugeridas[index] ?? 1,
    ajusteManual: actor.ajusteManual ?? actor.importe ?? 0,
    email: actor.email || "",
    whatsapp: actor.whatsapp || "",
    rol: actor.rol || rolesSugeridos[index] || "Integrante",
    recibeReportes: actor.recibeReportes ?? true,
    participaDistribucion: actor.participaDistribucion ?? true,
    observacion: actor.observacion || "",
  };
}

function numero(valor: CampoNumerico | undefined) {
  return Number(valor || 0);
}

function etiquetaTarifa(tarifa: TarifaCliente | undefined) {
  return TARIFAS_CLIENTE.find((item) => item.value === tarifa)?.label || "Sin tarifa asignada";
}

function importeCliente(cliente: Pick<FilaClienteIngreso, "importe"> | undefined) {
  return numero(cliente?.importe);
}

function estadoVisitaCliente(cliente: Pick<FilaClienteIngreso, "importe"> | undefined) {
  return importeCliente(cliente) > 0 ? "Participa" : "Saltea la visita";
}

function observacionCliente(cliente: Pick<FilaClienteIngreso, "importe" | "trabajoRealizado"> | undefined) {
  if (!cliente || importeCliente(cliente) <= 0) return "No se realizó visita en este reporte.";
  return cliente.trabajoRealizado || "Mantenimiento correspondiente al reporte del día.";
}

function conceptoTarifaCliente(cliente: Pick<FilaClienteIngreso, "importe" | "tarifaCliente"> | undefined) {
  const etiqueta = etiquetaTarifa(cliente?.tarifaCliente);
  return importeCliente(cliente) > 0 ? `Tarifa aplicada: ${etiqueta}` : `Tarifa de referencia: ${etiqueta}`;
}

function normalizarDatosHub(datos: (Partial<DatosHub> & { distribucion?: (Partial<FilaActor> & { actor?: string; importe?: CampoNumerico })[] }) | undefined, hub: HubDisponible): DatosHub {
  const base = datosHubInicial(hub);
  const clientesFuente = Array.isArray(datos?.clientesIngresos) ? datos.clientesIngresos : base.clientesIngresos;
  const gastosFuente = Array.isArray(datos?.gastos) ? datos.gastos : base.gastos;
  const actoresFuente = Array.isArray(datos?.actores) ? datos.actores : Array.isArray(datos?.distribucion) ? datos.distribucion : base.actores;
  const clientesIngresos = clientesFuente.map(normalizarCliente);
  return {
    clientesIngresos,
    gastos: gastosFuente.map((gasto) => ({ id: gasto.id || crearId(), concepto: gasto.concepto || "", importe: gasto.importe ?? 0 })),
    actores: actoresFuente.map((actor, index) => normalizarActor(actor, index)),
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
    ultimaEdicion: resumen.ultimaEdicion || resumen.guardadoEn || new Date().toISOString(),
    estado: resumen.estado || "GUARDADO",
    fechaEnvio: resumen.fechaEnvio || "",
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
  Array.from(new Set([...HUBS_DISPONIBLES, ...Object.keys(parcial)])).forEach((hub) => {
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

function normalizarContactoBusqueda(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
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
  const parcial = valor as Partial<Record<HubDisponible, unknown>>;
  Array.from(new Set([...HUBS_DISPONIBLES, ...Object.keys(parcial)])).forEach((hub) => {
    const clientes = parcial[hub];
    clientesPorHub[hub] = Array.isArray(clientes) ? clientes.map((cliente) => normalizarCliente(cliente as Partial<FilaClienteIngreso>)) : [];
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
  const hubs = Array.from(new Set([...HUBS_DISPONIBLES, ...Object.keys(datosPorHub), ...Object.keys(clientesPorHub)]));
  return Object.fromEntries(hubs.map((hub) => {
    const datos = normalizarDatosHub(datosPorHub[hub], hub);
    const clientesIngresos = clientesPorHub[hub] ?? datos.clientesIngresos ?? [];
    return [hub, { ...datos, clientesIngresos, clienteActivoId: clientesIngresos[0]?.id || 0 }];
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
  const hub = jornada.hub || jornadaInicial.hub;
  const hubs = Array.from(new Set([...HUBS_DISPONIBLES, hub, ...Object.keys(jornada.datosPorHub || {})]));
  const datosPorHub = Object.fromEntries(hubs.map((hubDisponible) => [hubDisponible, normalizarDatosHub(jornada.datosPorHub?.[hubDisponible], hubDisponible)])) as DatosPorHub;
  return { hub, fecha: jornada.fecha || jornadaInicial.fecha, nombreResumen: jornada.nombreResumen || "", datosPorHub };
}

function vinculosIniciales(): HubVinculo[] {
  const timestamp = new Date().toISOString();
  return [
    { id: "vinculo-local-tipal-jardinerosya01", hub_id: "Hub Tipal", oferta_id: "equipo-jardinerosya01", estado: "ACTIVO", rol: "Resolutor principal", fecha_inicio: fechaInicial, fecha_fin: "", capacidad: "Mantenimiento recurrente", observaciones: "Resuelve demanda agrupada del Hub Tipal.", created_at: timestamp, updated_at: timestamp },
    { id: "vinculo-local-tipal-fumigadoresya01", hub_id: "Hub Tipal", oferta_id: "equipo-fumigadoresya01", estado: "ACTIVO", rol: "Resolutor especializado", fecha_inicio: fechaInicial, fecha_fin: "", capacidad: "Fumigación y control", observaciones: "Oferta especializada vinculada al Hub Tipal.", created_at: timestamp, updated_at: timestamp },
    { id: "vinculo-local-prado-jardinerosya02", hub_id: "Hub Prado", oferta_id: "equipo-jardinerosya02", estado: "POSTULANTE", rol: "Postulante", fecha_inicio: "", fecha_fin: "", capacidad: "Equipo en formación", observaciones: "Postulación para resolver demanda agrupada.", created_at: timestamp, updated_at: timestamp },
  ];
}

function filtrarHistorialPorEstado(historial: HistorialResumenesPorHub, ...estados: EstadoReporteHub[]) {
  const filtrado = historialVacio();
  Object.entries(historial).forEach(([hub, reportes]) => {
    const items = reportes.filter((reporte) => estados.includes(reporte.estado || "GUARDADO"));
    if (items.length) filtrado[hub] = items;
  });
  return filtrado;
}

function fusionarHistoriales(base: HistorialResumenesPorHub, remoto: HistorialResumenesPorHub) {
  const fusionado = { ...base };
  Object.entries(remoto).forEach(([hub, reportes]) => {
    const ids = new Set((fusionado[hub] || []).map((reporte) => reporte.id));
    fusionado[hub] = [...reportes.filter((reporte) => !ids.has(reporte.id)), ...(fusionado[hub] || [])];
  });
  return fusionado;
}

function leerJornadaInicial(): JornadaOperativa {
  if (typeof window === "undefined") return jornadaInicial;
  const guardada = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  const base = guardada ? normalizarJornada(JSON.parse(guardada) as JornadaOperativa) : jornadaInicial;
  return { ...base, datosPorHub: aplicarClientesPorHub(base.datosPorHub, leerClientesPorHub()) };
}

export default function OperativoLegacy({ initialSection = "reporte", initialHubName, initialClientes = [], initialHub, initialReportes = [], simpleMode = false }: { initialSection?: "reporte" | "informacion" | "importar" | "consultas" | "equipos" | "nuevoHub" | "vinculos"; initialHubName?: string; initialClientes?: Cliente[]; initialHub?: HubPublico; initialReportes?: ReporteHubPersistido[]; simpleMode?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  const [jornada, setJornada] = useState<JornadaOperativa>(() => initialHubName ? { ...jornadaInicial, hub: initialHubName, datosPorHub: { ...jornadaInicial.datosPorHub, [initialHubName]: aplicarClientesIniciales(aplicarParametrosOperativos(datosHubInicial(initialHubName), initialHub), initialClientes) } } : jornadaInicial);
  const [hubsCanonicos, setHubsCanonicos] = useState<HubPublico[]>([]);
  const [hubSeleccionado, setHubSeleccionado] = useState(Boolean(initialHubName));
  const [historialResumenes, setHistorialResumenes] = useState<HistorialResumenesPorHub>(historialVacio);
  const [borradoresReportes, setBorradoresReportes] = useState<HistorialResumenesPorHub>(historialVacio);
  const [bandejaReportes, setBandejaReportes] = useState<"borradores" | "guardados">("borradores");
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [mensajeEnvio, setMensajeEnvio] = useState("Listo para enviar el reporte individual.");
  const [clientesReporteSeleccionados, setClientesReporteSeleccionados] = useState<number[]>([]);
  const [actoresReporteSeleccionados, setActoresReporteSeleccionados] = useState<number[]>([]);
  const [confirmacionEnvioReporte, setConfirmacionEnvioReporte] = useState(false);
  const [enviosReporte, setEnviosReporte] = useState<ResumenEnvioReporte[]>([]);
  const [emailPruebaReporte, setEmailPruebaReporte] = useState("lamboisgaston@gmail.com");
  const [seccionActiva, setSeccionActiva] = useState<"reporte" | "informacion" | "importar" | "consultas" | "equipos" | "nuevoHub" | "vinculos">(initialSection);
  const [hubInformacion, setHubInformacion] = useState<HubDisponible | "">("");
  const [asuntoInformacion, setAsuntoInformacion] = useState("");
  const [mensajeInformacion, setMensajeInformacion] = useState("");
  const [notaInformacion, setNotaInformacion] = useState("");
  const [destinatariosInformacion, setDestinatariosInformacion] = useState<DestinatarioSeleccionado[]>([]);
  const [estadoInformacion, setEstadoInformacion] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [mensajeEstadoInformacion, setMensajeEstadoInformacion] = useState("Listo para enviar información individual.");
  const [baseContactosCruda, setBaseContactosCruda] = useState("");
  const [contactosImportados, setContactosImportados] = useState<ContactoImportado[]>([]);
  const [busquedaContactos, setBusquedaContactos] = useState("");
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
  const [nuevoHubForm, setNuevoHubForm] = useState(NUEVO_HUB_FORM_INICIAL);
  const [solicitudesNuevoHub, setSolicitudesNuevoHub] = useState<SolicitudNuevoHub[]>([]);
  const [estadoNuevoHub, setEstadoNuevoHub] = useState("Elegí demanda u oferta para crear un Hub desde el panel interno.");
  const [hubVinculos, setHubVinculos] = useState<HubVinculo[]>([]);
  const [nuevoVinculoForm, setNuevoVinculoForm] = useState(NUEVO_VINCULO_FORM_INICIAL);
  const [estadoVinculos, setEstadoVinculos] = useState("HUBYA agrupa demanda; la oferta se vincula para resolverla.");
  const [asuntoFichaHub, setAsuntoFichaHub] = useState("Actualización de la ficha del Hub");
  const [mensajeFichaHub, setMensajeFichaHub] = useState("Hola, compartimos una actualización de la ficha operativa del Hub.");
  const [incluirPostulantesFicha, setIncluirPostulantesFicha] = useState(true);
  const reporteVisualRef = useRef<HTMLDivElement>(null);
  const firmaSeleccionReporteRef = useRef("");
  const seleccionReporteEditadaManualmenteRef = useRef(false);
  const hubsOperativos = useMemo(() => fusionarNombresHubs(hubsCanonicos), [hubsCanonicos]);
  const contactosImportadosFiltrados = useMemo(() => {
    const busquedaNormalizada = normalizarContactoBusqueda(busquedaContactos);
    const busquedaSinEspacios = busquedaNormalizada.replace(/\s+/g, "");
    if (!busquedaNormalizada) return contactosImportados;

    return contactosImportados.filter((contacto) => {
      const textoNormalizado = [
        contacto.nombre,
        contacto.email,
        contacto.whatsapp,
        contacto.referencia,
        contacto.hub,
        contacto.tipoDestino,
      ].map(normalizarContactoBusqueda).join(" ");

      return textoNormalizado.includes(busquedaNormalizada) || textoNormalizado.replace(/\s+/g, "").includes(busquedaSinEspacios);
    });
  }, [busquedaContactos, contactosImportados]);

  useEffect(() => {
    setJornada((actual) => {
      if (!initialHubName) return leerJornadaInicial();
      const inicial = leerJornadaInicial();
      const datosActuales = actual.datosPorHub[initialHubName] || inicial.datosPorHub[initialHubName] || aplicarParametrosOperativos(datosHubInicial(initialHubName), initialHub);
      const conClientes = aplicarClientesIniciales(datosActuales, initialClientes);
      const actoresFicha = (initialHub?.hubOperativo || []).map((integrante, index) => ({ id: Date.now() + index, nombre: integrante.nombre, email: integrante.email, whatsapp: integrante.whatsapp, rol: integrante.rol, activo: integrante.activo, participacion: 1, ajusteManual: 0, recibeReportes: integrante.recibeReportes, participaDistribucion: integrante.participaDistribucion, observacion: integrante.notaInterna }));
      const nombresActores = new Set(actoresFicha.map((actor) => actor.nombre.toLowerCase()));
      return { ...inicial, hub: initialHubName, datosPorHub: { ...inicial.datosPorHub, [initialHubName]: { ...conClientes, actores: [...conClientes.actores.filter((actor) => !nombresActores.has(actor.nombre.toLowerCase())), ...actoresFicha] } } };
    });
    const reportesIniciales = normalizarHistorial({ [initialHubName || jornadaInicial.hub]: initialReportes });
    const guardadosLocales = leerHistorialResumenes();
    let borradoresLocales = historialVacio();
    try { borradoresLocales = normalizarHistorial(JSON.parse(localStorage.getItem(BORRADORES_REPORTES_STORAGE_KEY) || "{}")); } catch { borradoresLocales = historialVacio(); }
    setHistorialResumenes(fusionarHistoriales(guardadosLocales, filtrarHistorialPorEstado(reportesIniciales, "GUARDADO", "ENVIADO")));
    setBorradoresReportes(fusionarHistoriales(borradoresLocales, filtrarHistorialPorEstado(reportesIniciales, "BORRADOR")));
    setContactosSinHub(leerContactosSinHub());
    setContactosImportados(leerContactosTrabajo());
    setAuxiliares(leerAuxiliares());
    try { const guardados = JSON.parse(localStorage.getItem(EQUIPOS_ACTIVOS_STORAGE_KEY) || "null"); setEquiposActivos(Array.isArray(guardados) ? guardados : equiposActivosIniciales); } catch { setEquiposActivos(equiposActivosIniciales); }
    try { const guardadas = JSON.parse(localStorage.getItem(SOLICITUDES_OFERTA_STORAGE_KEY) || "[]"); setSolicitudesOferta(Array.isArray(guardadas) ? guardadas : []); } catch { setSolicitudesOferta([]); }
    try { const guardadas = JSON.parse(localStorage.getItem(SOLICITUDES_NUEVO_HUB_STORAGE_KEY) || "[]"); setSolicitudesNuevoHub(Array.isArray(guardadas) ? guardadas : []); } catch { setSolicitudesNuevoHub([]); }
    try { const guardados = JSON.parse(localStorage.getItem(HUB_VINCULOS_STORAGE_KEY) || "null"); setHubVinculos(Array.isArray(guardados) ? guardados : vinculosIniciales()); } catch { setHubVinculos(vinculosIniciales()); }
    const consultasGuardadas = leerConsultasHub();
    setConsultasHub(consultasGuardadas);
    try { const enviosGuardados = JSON.parse(localStorage.getItem(ENVIOS_REPORTES_STORAGE_KEY) || "[]"); setEnviosReporte(Array.isArray(enviosGuardados) ? enviosGuardados : []); } catch { setEnviosReporte([]); }
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
    fetch("/api/hubs", { cache: "no-store" }).then((respuesta) => respuesta.ok ? respuesta.json() : []).then((hubs: HubPublico[]) => {
      if (!Array.isArray(hubs)) return;
      setHubsCanonicos(hubs);
      const nombres = fusionarNombresHubs(hubs);
      setJornada((actual) => {
        const datosPorHub = crearDatosParaHubs(actual.datosPorHub, initialHubName ? Array.from(new Set([...nombres, initialHubName])) : nombres);
        if (initialHubName) datosPorHub[initialHubName] = aplicarClientesIniciales(aplicarParametrosOperativos(datosPorHub[initialHubName], initialHub), initialClientes);
        return { ...actual, hub: initialHubName || actual.hub, datosPorHub };
      });
    }).catch(() => undefined);
    setIsMounted(true);
  }, [initialHubName, initialClientes, initialReportes, initialHub]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(HISTORIAL_RESUMENES_STORAGE_KEY, JSON.stringify(historialResumenes));
  }, [historialResumenes, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(BORRADORES_REPORTES_STORAGE_KEY, JSON.stringify(borradoresReportes));
  }, [borradoresReportes, isMounted]);

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
    localStorage.setItem(ENVIOS_REPORTES_STORAGE_KEY, JSON.stringify(enviosReporte));
  }, [enviosReporte, isMounted]);

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
    localStorage.setItem(SOLICITUDES_NUEVO_HUB_STORAGE_KEY, JSON.stringify(solicitudesNuevoHub));
  }, [solicitudesNuevoHub, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(HUB_VINCULOS_STORAGE_KEY, JSON.stringify(hubVinculos));
  }, [hubVinculos, isMounted]);

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
    const actoresEquipo = Object.fromEntries(hubsOperativos.map((hub) => [hub, normalizarDatosHub(jornada.datosPorHub[hub], hub).actores]));
    localStorage.setItem(ACTORES_EQUIPO_STORAGE_KEY, JSON.stringify(actoresEquipo));
  }, [jornada.datosPorHub, isMounted, hubsOperativos]);

  useEffect(() => {
    if (!isMounted) return;
    const clientesPorHub = Object.fromEntries(hubsOperativos.map((hub) => [hub, normalizarDatosHub(jornada.datosPorHub[hub], hub).clientesIngresos]));
    localStorage.setItem(CLIENTES_POR_HUB_STORAGE_KEY, JSON.stringify(clientesPorHub));
  }, [jornada.datosPorHub, isMounted, hubsOperativos]);

  useEffect(() => {
    if (!isMounted) return;
    setClientesConsultaSeleccionados(normalizarDatosHub(jornada.datosPorHub[hubConsulta], hubConsulta).clientesIngresos.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id));
  }, [hubConsulta, isMounted, jornada.datosPorHub]);


  const equipos = Array.isArray(equiposActivos) ? equiposActivos : [];
  const vinculos = Array.isArray(hubVinculos) ? hubVinculos : [];
  const fichaHubActual = hubsCanonicos.find((hub) => hub.nombre === jornada.hub);
  const equipoVinculadoAlHub = equipos.find((equipo) => (equipo.hubsDemandaVinculados ?? []).includes(jornada.hub));
  const equipoActivo = equipos.find((equipo) => equipo.id === equipoActivoId) || equipos[0];
  const integrantesEquipoActivo = equipoActivo?.integrantes ?? [];
  const integrantesDestinoMensaje = integrantesEquipoActivo.filter((integrante) => integrantesMensajeSeleccionados.includes(integrante.id));
  const datosHub = useMemo(() => normalizarDatosHub(jornada.datosPorHub[jornada.hub], jornada.hub), [jornada.datosPorHub, jornada.hub]);
  const hubActual = useMemo(() => initialHub || hubsCanonicos.find((hub) => hub.nombre === jornada.hub), [hubsCanonicos, initialHub, jornada.hub]);
  const tituloReporteHub = jornada.hub;
  const servicioRealizadoReporte = datosHub.resumen.estadoOperativo || hubActual?.rama || "Servicio del Hub";
  const clienteActivo = datosHub.clientesIngresos.find((cliente) => cliente.id === datosHub.clienteActivoId) || datosHub.clientesIngresos[0];
  const idsClientesValidosReporte = useMemo(() => datosHub.clientesIngresos
    .filter((cliente) => emailValido(cliente.email))
    .map((cliente) => cliente.id)
    .sort((a, b) => a - b), [datosHub.clientesIngresos]);
  const idsActoresDefaultReporte = useMemo(() => datosHub.actores.filter((actor) => actor.activo && actor.recibeReportes && emailValido(actor.email || "")).map((actor) => actor.id).sort((a, b) => a - b), [datosHub.actores]);
  const firmaSeleccionReporte = useMemo(() => `${jornada.hub}|${idsClientesValidosReporte.join(",")}|${idsActoresDefaultReporte.join(",")}`, [jornada.hub, idsClientesValidosReporte, idsActoresDefaultReporte]);
  const clientesConEmailValidoReporte = datosHub.clientesIngresos.filter((cliente) => emailValido(cliente.email));
  const clientesSeleccionadosReporte = datosHub.clientesIngresos.filter((cliente) => clientesReporteSeleccionados.includes(cliente.id) && emailValido(cliente.email));
  const actoresConEmailValidoReporte = datosHub.actores.filter((actor) => emailValido(actor.email || ""));
  const actoresSeleccionadosReporte = datosHub.actores.filter((actor) => actoresReporteSeleccionados.includes(actor.id) && emailValido(actor.email || ""));
  const destinatariosSeleccionadosReporte: DestinatarioReporte[] = [...clientesSeleccionadosReporte.map((cliente) => ({ ...cliente, grupo: "cliente" as const })), ...actoresSeleccionadosReporte.map((actor) => ({ id: actor.id, origen: "Hub Operativo", grupo: "operativo" as const, rol: actor.rol || "Integrante operativo", nombre: actor.nombre, email: actor.email || "", telefono: actor.whatsapp || "", importe: "" as CampoNumerico, trabajoRealizado: actor.rol || "Hub Operativo", trabajoPendiente: "", tarifaCliente: "sin_tarifa" as TarifaCliente }))];

  useEffect(() => {
    const firmaAnterior = firmaSeleccionReporteRef.current;
    const hubAnterior = firmaAnterior.split("|")[0] || "";
    const cambioHub = Boolean(firmaAnterior) && hubAnterior !== jornada.hub;
    firmaSeleccionReporteRef.current = firmaSeleccionReporte;
    if (cambioHub) seleccionReporteEditadaManualmenteRef.current = false;
    if (firmaAnterior === firmaSeleccionReporte) return;
    if (seleccionReporteEditadaManualmenteRef.current) return;

    setClientesReporteSeleccionados((actuales) => {
      return idsOrdenadosIguales(actuales, idsClientesValidosReporte) ? actuales : idsClientesValidosReporte;
    });
    setActoresReporteSeleccionados((actuales) => {
      return idsOrdenadosIguales(actuales, idsActoresDefaultReporte) ? actuales : idsActoresDefaultReporte;
    });
  }, [firmaSeleccionReporte, idsClientesValidosReporte, idsActoresDefaultReporte, jornada.hub]);
  const fechaFormateada = formatoFecha(jornada.fecha);
  const totalFacturadoHub = datosHub.clientesIngresos.reduce((total, cliente) => total + numero(cliente.importe), 0);
  const gastosRealesDelDia = useMemo(() => datosHub.gastos.filter(esGastoRealDelDia), [datosHub.gastos]);
  const totalGastos = gastosRealesDelDia.reduce((total, gasto) => total + numero(gasto.importe), 0);
  const totalADistribuir = totalFacturadoHub - totalGastos;
  const actoresActivos = datosHub.actores.filter((actor) => actor.activo && actor.participaDistribucion !== false);
  const cantidadActoresActivos = actoresActivos.length;
  const totalParticipacion = actoresActivos.reduce((total, actor) => total + numero(actor.participacion), 0);
  const distribucionCalculada = datosHub.actores.map((actor) => {
    const participa = actor.activo && actor.participaDistribucion !== false;
    const importeDistribuido = participa && totalParticipacion > 0 ? totalADistribuir * numero(actor.participacion) / totalParticipacion : 0;
    const importeFinal = importeDistribuido + numero(actor.ajusteManual);
    return { ...actor, importeDistribuido, importeFinal };
  });
  const totalDistribuido = distribucionCalculada.reduce((total, actor) => total + actor.importeDistribuido, 0);
  const resumenesDelHub = historialResumenes[jornada.hub] || [];
  const borradoresDelHub = borradoresReportes[jornada.hub] || [];
  const clientesSinEmailReporte = datosHub.clientesIngresos.filter((cliente) => !cliente.email.trim());
  const clientesEmailInvalidoReporte = datosHub.clientesIngresos.filter((cliente) => cliente.email.trim() && !emailValido(cliente.email));
  const ultimoEnvioReporte = enviosReporte.find((envio) => envio.hub === jornada.hub);


  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((actual) => ({ ...actual, ...cambios }));
  }

  function actualizarDatosHub(cambios: Partial<DatosHub>) {
    setJornada((actual) => ({ ...actual, datosPorHub: { ...actual.datosPorHub, [actual.hub]: { ...normalizarDatosHub(actual.datosPorHub[actual.hub], actual.hub), ...cambios } } }));
  }

  function seleccionarHubTrabajo(hub: HubDisponible) {
    setJornada((actual) => ({ ...actual, hub, nombreResumen: "", datosPorHub: { ...actual.datosPorHub, [hub]: actual.datosPorHub[hub] || datosHubInicial(hub) } }));
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
    const clienteActual = datosHub.clientesIngresos.find((cliente) => cliente.id === id);
    actualizarDatosHub({ clientesIngresos: datosHub.clientesIngresos.map((cliente) => cliente.id === id ? { ...cliente, ...cambios } : cliente) });
    if (clienteActual?.contactoId && cambios.tarifaCliente) {
      void fetch(`/api/contactos/${encodeURIComponent(clienteActual.contactoId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarifaCliente: cambios.tarifaCliente }),
      });
    }
  }

  function actualizarSeleccionReporte(id: number, seleccionado: boolean) {
    seleccionReporteEditadaManualmenteRef.current = true;
    setClientesReporteSeleccionados((actuales) => seleccionado ? Array.from(new Set([...actuales, id])) : actuales.filter((clienteId) => clienteId !== id));
  }

  function actualizarSeleccionActorReporte(id: number, seleccionado: boolean) {
    seleccionReporteEditadaManualmenteRef.current = true;
    setActoresReporteSeleccionados((actuales) => seleccionado ? Array.from(new Set([...actuales, id])) : actuales.filter((actorId) => actorId !== id));
  }

  function seleccionarTodosClientesConEmailValidoReporte() {
    seleccionReporteEditadaManualmenteRef.current = true;
    setClientesReporteSeleccionados(clientesConEmailValidoReporte.map((cliente) => cliente.id));
  }

  function seleccionarTodosActoresConEmailValidoReporte() {
    seleccionReporteEditadaManualmenteRef.current = true;
    setActoresReporteSeleccionados(actoresConEmailValidoReporte.map((actor) => actor.id));
  }

  function seleccionarTodosDestinatariosConEmailValidoReporte() {
    seleccionarTodosClientesConEmailValidoReporte();
    seleccionReporteEditadaManualmenteRef.current = true;
    setActoresReporteSeleccionados(actoresConEmailValidoReporte.map((actor) => actor.id));
  }

  function desmarcarTodosClientesReporte() {
    seleccionReporteEditadaManualmenteRef.current = true;
    setClientesReporteSeleccionados([]);
    setActoresReporteSeleccionados([]);
  }

  function estadoEmailClienteReporte(cliente: FilaClienteIngreso, seleccionado: boolean) {
    if (!cliente.email.trim()) return "Sin email cargado";
    if (!emailValido(cliente.email)) return "Email inválido";
    return seleccionado ? "Listo para enviar" : "No se enviará";
  }

  function actualizarGasto(id: number, cambios: Partial<FilaGasto>) {
    actualizarDatosHub({ gastos: datosHub.gastos.map((gasto) => gasto.id === id ? { ...gasto, ...cambios } : gasto) });
  }

  function actualizarActor(id: number, cambios: Partial<FilaActor>) {
    actualizarDatosHub({ actores: datosHub.actores.map((actor) => actor.id === id ? { ...actor, ...cambios } : actor) });
  }

  function aliasVecino(index: number) {
    let numero = index;
    let alias = "";
    do {
      alias = String.fromCharCode(65 + (numero % 26)) + alias;
      numero = Math.floor(numero / 26) - 1;
    } while (numero >= 0);
    return `Vecino ${alias}`;
  }

  const nombrePrivado = useCallback((cliente: FilaClienteIngreso, index: number) => cliente.id === clienteActivo?.id ? cliente.nombre : aliasVecino(index), [clienteActivo?.id]);
  const destinatariosSeleccionados = destinatariosInformacion.filter((destinatario) => destinatario.incluido);
  const destinatariosConEmailInformacion = destinatariosInformacion.filter((destinatario) => emailValido(destinatario.email || ""));

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(INFORMACION_STORAGE_KEY, JSON.stringify({ asunto: asuntoInformacion, mensaje: mensajeInformacion, nota: notaInformacion }));
  }, [asuntoInformacion, mensajeInformacion, notaInformacion, isMounted]);

  function seleccionarHubInformacion(hub: HubDisponible) {
    setHubInformacion(hub);
    setAsuntoInformacion((actual) => actual || `Email HUBYA — ${hub}`);
    setMensajeInformacion((actual) => actual || `Hola, te compartimos información correspondiente al ${hub}.`);
    setDestinatariosInformacion(normalizarDatosHub(jornada.datosPorHub[hub], hub).clientesIngresos.map((cliente) => ({ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email, incluido: emailValido(cliente.email) })));
    setEstadoInformacion("idle");
    setMensajeEstadoInformacion("Seleccioná destinatarios con email válido, referencia interna y mensaje para enviar.");
  }

  function actualizarDestinatarioInformacion(id: number, incluido: boolean) {
    setDestinatariosInformacion((actuales) => actuales.map((destinatario) => destinatario.id === id ? { ...destinatario, incluido } : destinatario));
  }

  function marcarTodosDestinatarios(incluido: boolean) {
    setDestinatariosInformacion((actuales) => actuales.map((destinatario) => ({ ...destinatario, incluido: incluido && emailValido(destinatario.email || "") })));
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
    if (destinatariosSeleccionados.some((destinatario) => !emailValido(destinatario.email || ""))) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion("Error: no se puede enviar a clientes sin email válido.");
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

    const confirmar = window.confirm(`Vas a enviar este mensaje a ${destinatariosSeleccionados.length} clientes. ¿Confirmar envío?`);
    if (!confirmar) return;

    setEstadoInformacion("enviando");
    setMensajeEstadoInformacion(`Enviando email a ${destinatariosSeleccionados.length} clientes...`);
    const respuesta = await fetch("/api/enviar-informacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub: hubInformacion, asunto: asuntoInformacion, mensaje: mensajeInformacion, nota: notaInformacion, destinatarios: destinatariosSeleccionados.map(({ nombre, email }) => ({ nombre, email })) }),
    });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok && !Array.isArray(data?.errores)) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion(`Error al enviar: ${data?.error || "no se pudo completar el envío."}`);
      return;
    }
    const resultados = Array.from({ length: data?.enviados || 0 }, () => ({ ok: true, nombre: "", error: null }));
    const erroresApi = Array.isArray(data?.errores) ? data.errores : [];
    for (const error of erroresApi) resultados.push({ ok: false, nombre: error.email || "cliente", error: error.error });
    const errores = resultados.filter((resultado) => !resultado.ok);
    if (errores.length > 0) {
      setEstadoInformacion("error");
      setMensajeEstadoInformacion(`Enviados: ${resultados.length - errores.length}. Errores: ${errores.map((error) => error.nombre || "cliente").join(", ")}`);
      return;
    }
    setEstadoInformacion("enviado");
    setMensajeEstadoInformacion(`Resultado: email enviado a ${resultados.length} clientes seleccionados.`);
  }


  const clientesDelHub = datosHub.clientesIngresos;
  const clienteActivoReporte = clientesDelHub.find((cliente) => cliente.id === datosHub.clienteActivoId) || clientesDelHub[0] || clienteActivo;

  function esGastoMaquinariaTransporte(gasto: FilaGasto) {
    return /maquin|transp|nafta|aceite|tanza|combustible|flete|movilidad/i.test(gasto.concepto);
  }

  function esGastoAdministracionHub(gasto: FilaGasto) {
    return /admin|administraci[oó]n|gestion|gesti[oó]n|coordinaci[oó]n|coordinador|hub/i.test(gasto.concepto) && !/jardinerosya/i.test(gasto.concepto);
  }

  function gastosPorCategoria(categoria: "maquinaria" | "administracion" | "otros") {
    return gastosRealesDelDia.filter((gasto) => {
      if (/jardinerosya/i.test(gasto.concepto)) return false;
      if (categoria === "maquinaria") return esGastoMaquinariaTransporte(gasto);
      if (categoria === "administracion") return esGastoAdministracionHub(gasto);
      return !esGastoMaquinariaTransporte(gasto) && !esGastoAdministracionHub(gasto);
    });
  }

  function totalGastosCategoria(categoria: "maquinaria" | "administracion" | "otros") {
    return gastosPorCategoria(categoria).reduce((total, gasto) => total + numero(gasto.importe), 0);
  }

  const totalGastosMaquinaria = totalGastosCategoria("maquinaria");
  const totalGastosAdministracion = totalGastosCategoria("administracion");
  const totalGastosOtrosInsumos = totalGastosCategoria("otros");
  const totalPagarEquipoOperativo = totalFacturadoHub - totalGastos;
  const integrantesParticipantesReporte = clientesDelHub.filter((cliente) => numero(cliente.importe) > 0).length;
  const integrantesSalteanVisitaReporte = clientesDelHub.filter((cliente) => numero(cliente.importe) === 0).length;
  const precioHoraMaquinariaReferencia = initialHub?.moduloOperativo === "jardinerosya" ? Math.max(
    numero(initialHub.parametrosOperativos?.jardinerosYa?.valorHoraCortadoraCesped),
    numero(initialHub.parametrosOperativos?.jardinerosYa?.valorHoraBordeadora),
    numero(initialHub.parametrosOperativos?.jardinerosYa?.valorHoraMaquinaEmpuje),
  ) : 0;
  const horasMaquinariaReporte = precioHoraMaquinariaReferencia > 0 && totalGastosMaquinaria > 0 ? totalGastosMaquinaria / precioHoraMaquinariaReferencia : 0;
  const formatoHorasMaquinaria = horasMaquinariaReporte > 0 ? horasMaquinariaReporte.toLocaleString("es-AR", { maximumFractionDigits: 2 }) : "—";
  const formatoPrecioHoraMaquinaria = precioHoraMaquinariaReferencia > 0 ? formatoMoneda(precioHoraMaquinariaReferencia) : "—";


  function textoReportePrevioParaCliente(clienteObjetivo: FilaClienteIngreso | undefined) {
    const clienteReporte = clienteObjetivo || clienteActivoReporte;
    return [
      jornada.hub,
      "",
      `Fecha: ${fechaFormateada}`,
      `Servicio: ${servicioRealizadoReporte}`,
      "",
      "Tu importe:",
      formatoPlano(clienteReporte?.importe) || formatoMoneda(0),
      "",
      "Resumen del Hub:",
      `Total del Hub: ${formatoPlano(totalFacturadoHub) || formatoMoneda(0)}`,
      "",
      `Integrantes participantes: ${integrantesParticipantesReporte}`,
      `Integrantes que saltean visita: ${integrantesSalteanVisitaReporte}`,
      "",
      "Gastos del Hub:",
      "",
      "1. Servicios de maquinaria al Hub",
      `Horas de maquinaria: ${formatoHorasMaquinaria} h`,
      `Precio por hora: ${formatoPrecioHoraMaquinaria}`,
      `Subtotal maquinaria: ${formatoMoneda(totalGastosMaquinaria)}`,
      "",
      "2. Servicios de administración del Hub",
      `Subtotal administración: ${formatoMoneda(totalGastosAdministracion)}`,
      "",
      "3. Otros insumos",
      `Subtotal otros insumos: ${formatoMoneda(totalGastosOtrosInsumos)}`,
      "",
      `Total de gastos: ${formatoPlano(totalGastos) || formatoMoneda(0)}`,
      "",
      `Total a pagar / saldo distribuible: ${formatoMoneda(totalPagarEquipoOperativo)}`,
      "",
      "Estimado de distribución:",
      "Esta sección es un estimado interno de cómo se puede distribuir el saldo entre los jardineros/equipo. No es una liquidación definitiva.",
      `Saldo distribuible: ${formatoMoneda(totalADistribuir)}`,
      `Total de puntos: ${totalParticipacion.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
      ...distribucionCalculada.filter((actor) => actor.activo && actor.participaDistribucion !== false).map((actor) => `${actor.rol || "Integrante"}${actor.nombre ? ` (${actor.nombre})` : ""}: participación ${numero(actor.participacion).toLocaleString("es-AR", { maximumFractionDigits: 2 })} → ${formatoMoneda(actor.importeDistribuido)}`),
      `Total estimado distribuido: ${formatoMoneda(totalDistribuido)}`,
      datosHub.resumen.observacionGeneral ? `Observaciones del día: ${datosHub.resumen.observacionGeneral}` : "",
    ].filter(Boolean).join("\n");
  }

  const reporteTexto = useMemo(() => textoReportePrevioParaCliente(clienteActivoReporte), [clienteActivoReporte, datosHub.resumen.observacionGeneral, distribucionCalculada, fechaFormateada, formatoHorasMaquinaria, formatoPrecioHoraMaquinaria, integrantesParticipantesReporte, integrantesSalteanVisitaReporte, jornada.hub, servicioRealizadoReporte, totalADistribuir, totalDistribuido, totalFacturadoHub, totalGastos, totalGastosAdministracion, totalGastosMaquinaria, totalGastosOtrosInsumos, totalPagarEquipoOperativo, totalParticipacion]);

  function reporteTextoParaCliente(clienteObjetivo: FilaClienteIngreso) {
    return textoReportePrevioParaCliente(clienteObjetivo);
  }

  const asuntoReporte = `${jornada.hub} — ${fechaFormateada}`;
  const firmaDatosHub = JSON.stringify(datosHub);

  const emailPrivado = useMemo(() => [
    `Hola ${clienteActivo?.nombre || "cliente"}, te compartimos el reporte correspondiente a la jornada del ${jornada.hub} del día ${fechaFormateada}. Lo principal está resumido al inicio del comprobante. El detalle queda disponible como respaldo de transparencia operativa.`,
    "",
    contactoDudasReporte,
    "",
    "Saludos,",
    "HUBYA",
  ].join("\n"), [clienteActivo?.nombre, fechaFormateada, jornada.hub]);

  useEffect(() => {
    if (!isMounted || !hubSeleccionado || seccionActiva !== "reporte") return;
    const borrador = { ...crearResumenGuardado(`borrador-${jornada.hub}`, nombreResumenActual(), jornada.fecha), estado: "BORRADOR" as EstadoReporteHub, ultimaEdicion: new Date().toISOString() };
    setBorradoresReportes((actual) => ({ ...actual, [jornada.hub]: [borrador, ...(actual[jornada.hub] || []).filter((item) => item.id !== borrador.id)] }));
  }, [firmaDatosHub, isMounted, hubSeleccionado, jornada.fecha, jornada.hub, jornada.nombreResumen, reporteTexto, seccionActiva]);



  function armarReporteHtmlParaCliente(clienteObjetivo: FilaClienteIngreso | undefined) {
    const clienteReporte = clienteObjetivo || clienteActivoReporte;
    const tuImporte = formatoPlano(clienteReporte?.importe) || formatoMoneda(0);
    return `
    <article style="width:100%;max-width:760px;border:1px solid #d8dfd1;background:#ffffff;color:#182018;font-family:Arial,Helvetica,sans-serif;box-shadow:none;border-radius:22px;overflow:hidden;">
      <section style="padding:18px;">
        <header style="border:1px solid #d8dfd1;background:#fbfcf9;padding:16px;border-radius:18px;">
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;letter-spacing:.01em;">${escaparHtml(jornada.hub)}</h1>
          <p style="margin:0 0 5px;font-size:14px;"><strong>Fecha:</strong> ${escaparHtml(fechaFormateada)}</p>
          <p style="margin:0;font-size:14px;"><strong>Servicio:</strong> ${escaparHtml(servicioRealizadoReporte)}</p>
        </header>
        <section style="margin-top:14px;border:1px solid #d8dfd1;background:#f8faf5;padding:14px;border-radius:18px;font-size:12px;line-height:1.45;">
          <div style="background:#1f2a1d;color:#ffffff;border-radius:20px;padding:18px 16px;text-align:left;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#dce8d3;">Tu importe</p>
            <p style="margin:0;font-size:34px;line-height:1.05;font-weight:900;letter-spacing:-.03em;">${escaparHtml(tuImporte)}</p>
          </div>
          <div style="margin-top:10px;background:#fff;border:1px solid #e1e6dc;border-radius:16px;padding:12px;">
            <h2 style="margin:0 0 8px;font-size:15px;font-weight:900;">Resumen del Hub</h2>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Total del Hub</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoPlano(totalFacturadoHub) || formatoMoneda(0))}</strong></p>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Integrantes participantes</span><strong style="font-size:13px;font-weight:800;">${integrantesParticipantesReporte}</strong></p>
            <p style="margin:0;display:flex;justify-content:space-between;gap:12px;"><span>Integrantes que saltean visita</span><strong style="font-size:13px;font-weight:800;">${integrantesSalteanVisitaReporte}</strong></p>
          </div>
          <div style="margin-top:10px;background:#fff;border:1px solid #e1e6dc;border-radius:16px;padding:12px;">
            <h2 style="margin:0 0 8px;font-size:15px;font-weight:900;">Gastos del Hub</h2>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Servicios de maquinaria al Hub</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoHorasMaquinaria)} h x ${escaparHtml(formatoPrecioHoraMaquinaria)} = ${escaparHtml(formatoMoneda(totalGastosMaquinaria))}</strong></p>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Servicios de administración del Hub</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoMoneda(totalGastosAdministracion))}</strong></p>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Otros insumos</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoMoneda(totalGastosOtrosInsumos))}</strong></p>
            <p style="margin:8px 0 0;border-top:1px solid #e1e6dc;padding-top:8px;display:flex;justify-content:space-between;gap:12px;"><span>Total de gastos</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoPlano(totalGastos) || formatoMoneda(0))}</strong></p>
          </div>
          <div style="margin-top:10px;background:#fff;border:1px solid #e1e6dc;border-radius:16px;padding:12px;">
            <h2 style="margin:0 0 8px;font-size:15px;font-weight:900;">Estimado de distribución</h2>
            <p style="margin:0 0 8px;color:#66745c;font-weight:700;">Esta sección es un estimado interno de cómo se puede distribuir el saldo entre los jardineros/equipo. No es una liquidación definitiva.</p>
            <p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>Saldo distribuible</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoMoneda(totalPagarEquipoOperativo))}</strong></p>
            <p style="margin:0 0 8px;display:flex;justify-content:space-between;gap:12px;"><span>Total de puntos</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(totalParticipacion.toLocaleString("es-AR", { maximumFractionDigits: 2 }))}</strong></p>
            ${distribucionCalculada.filter((actor) => actor.activo && actor.participaDistribucion !== false).map((actor) => `<p style="margin:0 0 5px;display:flex;justify-content:space-between;gap:12px;"><span>${escaparHtml(actor.rol || "Integrante")}${actor.nombre ? ` · ${escaparHtml(actor.nombre)}` : ""}: participación ${escaparHtml(numero(actor.participacion).toLocaleString("es-AR", { maximumFractionDigits: 2 }))}</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoMoneda(actor.importeDistribuido))}</strong></p>`).join("")}
            <p style="margin:8px 0 0;border-top:1px solid #e1e6dc;padding-top:8px;display:flex;justify-content:space-between;gap:12px;"><span>Total estimado distribuido</span><strong style="font-size:13px;font-weight:800;">${escaparHtml(formatoMoneda(totalDistribuido))}</strong></p>
          </div>
          ${datosHub.resumen.observacionGeneral ? `<div style="margin-top:10px;background:#fff;border:1px solid #e1e6dc;border-radius:14px;padding:12px;"><h2 style="margin:0 0 6px;font-size:15px;font-weight:900;">Observaciones del día</h2><p style="margin:0;color:#4f5f47;font-weight:700;">${escaparHtml(datosHub.resumen.observacionGeneral)}</p></div>` : ""}
        </section>
      </section>
    </article>`;
  }

  const reporteHtml = useMemo(() => armarReporteHtmlParaCliente(clienteActivoReporte), [clienteActivoReporte, datosHub.resumen.observacionGeneral, distribucionCalculada, fechaFormateada, formatoHorasMaquinaria, formatoPrecioHoraMaquinaria, integrantesParticipantesReporte, integrantesSalteanVisitaReporte, jornada.hub, servicioRealizadoReporte, totalDistribuido, totalFacturadoHub, totalGastos, totalGastosAdministracion, totalGastosMaquinaria, totalGastosOtrosInsumos, totalPagarEquipoOperativo, totalParticipacion]);



  async function ejecutarEnvioReporte(destinatarios: DestinatarioReporte[], tipo: "definitivo" | "prueba" = "definitivo") {
    if (destinatarios.length === 0) {
      setEstadoEnvio("error");
      setMensajeEnvio("Error al enviar: seleccioná al menos un destinatario con email válido.");
      return;
    }

    setEstadoEnvio("enviando");
    setMensajeEnvio(tipo === "prueba" ? `Enviando prueba a ${destinatarios[0]?.email}...` : `Enviando reporte a ${destinatarios.length} personas...`);
    setConfirmacionEnvioReporte(false);

    const fechaHoraEnvio = new Date().toISOString();
    const resultados: ResultadoDestinatarioReporte[] = [];
    let fromUsado = "";
    let replyToUsado = "";

    for (const cliente of destinatarios) {
      const cuerpoMail = [
        tipo === "prueba" ? `Hola, este es un envío de prueba del reporte de ${jornada.hub} del día ${fechaFormateada}.` : `Hola ${cliente.nombre || "cliente"}, te compartimos el reporte correspondiente a la jornada del ${jornada.hub} del día ${fechaFormateada}. Lo principal está resumido al inicio del comprobante. El detalle queda disponible como respaldo de transparencia operativa.`,
        "",
        contactoDudasReporte,
        "",
        "Saludos,",
        "HUBYA",
      ].join("\n");
      try {
        const respuesta = await fetch("/api/enviar-reporte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailDestino: cliente.email,
            nombreCliente: cliente.nombre || "Envío de prueba",
            hub: jornada.hub,
            fecha: fechaFormateada,
            asunto: tipo === "prueba" ? `[Envío de prueba] ${asuntoReporte}` : asuntoReporte,
            cuerpoMail,
            reporteHtml: cliente.grupo === "operativo" ? armarReporteHtmlParaCliente(undefined) : armarReporteHtmlParaCliente(cliente),
            reporteTexto: cliente.grupo === "operativo" ? reporteTexto : reporteTextoParaCliente(cliente),
            hubId: initialHub?.id,
            reportId: `reporte-${jornada.hub}-${jornada.fecha}`,
            contactId: cliente.contactoId || String(cliente.id),
            incluirConsultaParametros: false,
            baseUrl: window.location.origin,
          }),
        });
        const data = await respuesta.json().catch(() => ({}));
        fromUsado = data?.from || fromUsado;
        replyToUsado = data?.reply_to || data?.replyTo || replyToUsado;
        resultados.push({
          id: cliente.id,
          nombre: cliente.nombre || "Sin nombre",
          email: cliente.email,
          estado: respuesta.ok ? "enviado a proveedor" : "error",
          error: respuesta.ok ? undefined : (data?.error || `HTTP ${respuesta.status}`),
          fechaHora: new Date().toISOString(),
          providerMessageId: data?.providerMessageId || data?.id || undefined,
          resendId: data?.resendId || data?.id || undefined,
        });
      } catch (error) {
        resultados.push({ id: cliente.id, nombre: cliente.nombre || "Sin nombre", email: cliente.email, estado: "error", error: error instanceof Error ? error.message : "Error desconocido al conectar con Resend.", fechaHora: new Date().toISOString() });
      }
    }

    const destinatariosNoSeleccionados: ResultadoDestinatarioReporte[] = tipo === "definitivo" ? datosHub.clientesIngresos.filter((cliente) => !destinatarios.some((destinatario) => destinatario.id === cliente.id)).map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre || "Sin nombre",
      email: cliente.email,
      estado: !cliente.email.trim() ? "sin email" : !emailValido(cliente.email) ? "email inválido" : "no seleccionado",
      fechaHora: fechaHoraEnvio,
    })) : [];

    const resumen: ResumenEnvioReporte = {
      id: `${tipo}-reporte-${Date.now()}`,
      fechaHora: fechaHoraEnvio,
      hub: jornada.hub,
      reporte: asuntoReporte,
      tipo,
      destinatariosSeleccionados: destinatarios.length,
      enviadosAProveedor: resultados.filter((resultado) => resultado.estado === "enviado a proveedor").length,
      errores: resultados.filter((resultado) => resultado.estado === "error").length,
      sinEmail: tipo === "definitivo" ? clientesSinEmailReporte.length : 0,
      pendientesRespuesta: resultados.filter((resultado) => resultado.estado === "enviado a proveedor").length,
      fromUsado,
      replyToUsado,
      destinatarios: [...resultados, ...destinatariosNoSeleccionados],
    };

    setEnviosReporte((actuales) => [resumen, ...actuales]);
    const errores = resultados.filter((resultado) => resultado.estado === "error");
    setEstadoEnvio(errores.length > 0 ? "error" : "enviado");
    setMensajeEnvio(errores.length > 0 ? `Envío generado con errores: Resend aceptó ${resumen.enviadosAProveedor} de ${destinatarios.length}. Revisá el error exacto abajo.` : `${tipo === "prueba" ? "Envío de prueba" : "Envío generado"}: Resend aceptó ${resumen.enviadosAProveedor} destinatarios.`);
  }

  function enviarReporteASeleccionados() {
    if (destinatariosSeleccionadosReporte.length === 0) {
      setEstadoEnvio("error");
      setMensajeEnvio("Error al enviar: seleccioná al menos un cliente con email válido.");
      return;
    }
    setConfirmacionEnvioReporte(true);
  }

  function enviarPruebaReporte() {
    const email = emailPruebaReporte.trim();
    if (!emailValido(email)) {
      setEstadoEnvio("error");
      setMensajeEnvio("El email de prueba no es válido.");
      return;
    }
    const clienteBase = clienteActivo || datosHub.clientesIngresos[0] || clienteIngresoInicial(jornada.hub);
    ejecutarEnvioReporte([{ ...clienteBase, id: -1, grupo: "cliente", nombre: "Envío de prueba", email }], "prueba");
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


  function persistirReporteServidor(resumen: ResumenGuardadoHub) {
    const hubId = initialHub?.id || initialHub?.slug;
    if (!hubId) return;
    fetch(`/api/operativo/hubs/${encodeURIComponent(hubId)}/reportes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resumen),
    }).catch(() => setMensajeGuardado("El reporte quedó guardado en este navegador, pero no se pudo sincronizar con el servidor."));
  }

  function eliminarReporteServidor(resumen: ResumenGuardadoHub) {
    const hubId = initialHub?.id || initialHub?.slug;
    if (!hubId) return;
    fetch(`/api/operativo/hubs/${encodeURIComponent(hubId)}/reportes?id=${encodeURIComponent(resumen.id)}`, { method: "DELETE" }).catch(() => undefined);
  }

  function crearResumenGuardado(id = String(crearId()), nombre = nombreResumenActual(), fecha = jornada.fecha): ResumenGuardadoHub {
    return {
      id,
      hub: jornada.hub,
      fecha,
      nombre,
      guardadoEn: new Date().toISOString(),
      ultimaEdicion: new Date().toISOString(),
      estado: "GUARDADO",
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

  function guardarBorradorHub(mensaje = true) {
    const borrador = { ...crearResumenGuardado(`borrador-${jornada.hub}`, nombreResumenActual(), jornada.fecha), estado: "BORRADOR" as EstadoReporteHub, ultimaEdicion: new Date().toISOString() };
    setBorradoresReportes((actual) => ({ ...actual, [jornada.hub]: [borrador, ...(actual[jornada.hub] || []).filter((item) => item.id !== borrador.id)] }));
    persistirReporteServidor(borrador);
    if (mensaje) setMensajeGuardado(`Borrador guardado para ${jornada.hub}: ${borrador.nombre}`);
  }

  function guardarResumenHub(estado: EstadoReporteHub = "GUARDADO") {
    const resumen = { ...crearResumenGuardado(String(crearId()), nombreResumenActual(), jornada.fecha), estado, fechaEnvio: estado === "ENVIADO" ? new Date().toISOString() : "" };
    setHistorialResumenes((actual) => ({ ...actual, [jornada.hub]: [resumen, ...(actual[jornada.hub] || [])] }));
    persistirReporteServidor(resumen);
    setBorradoresReportes((actual) => ({ ...actual, [jornada.hub]: (actual[jornada.hub] || []).filter((item) => item.id !== `borrador-${jornada.hub}`) }));
    setJornada((actual) => ({ ...actual, nombreResumen: resumen.nombre }));
    setBandejaReportes("guardados");
    setMensajeGuardado(`Reporte ${estado === "ENVIADO" ? "enviado" : "guardado como definitivo"} para ${jornada.hub}: ${resumen.nombre}`);
  }


  function crearNuevoReporteHub() {
    const hubActual = jornada.hub;
    setJornada((actual) => ({ ...actual, hub: hubActual, fecha: fechaInicial, nombreResumen: "", datosPorHub: { ...actual.datosPorHub, [hubActual]: aplicarParametrosOperativos(datosHubInicial(hubActual), initialHub) } }));
    setHubSeleccionado(true);
    setBandejaReportes("borradores");
    setMensajeGuardado(`Nuevo reporte iniciado para ${hubActual}. Se guardará automáticamente como borrador.`);
  }

  function cerrarBorradorHub(resumen: ResumenGuardadoHub, estado: Exclude<EstadoReporteHub, "BORRADOR">) {
    const cerrado = normalizarResumenGuardado({ ...resumen, id: String(crearId()), estado, guardadoEn: new Date().toISOString(), ultimaEdicion: new Date().toISOString(), fechaEnvio: estado === "ENVIADO" ? new Date().toISOString() : "" }, resumen.hub);
    setHistorialResumenes((actual) => ({ ...actual, [resumen.hub]: [cerrado, ...(actual[resumen.hub] || [])] }));
    persistirReporteServidor(cerrado);
    setBorradoresReportes((actual) => ({ ...actual, [resumen.hub]: (actual[resumen.hub] || []).filter((item) => item.id !== resumen.id) }));
    setBandejaReportes("guardados");
    setMensajeGuardado(`Reporte ${estado === "ENVIADO" ? "enviado" : "guardado como definitivo"}: ${resumen.nombre}`);
  }

  function abrirResumenHub(resumen: ResumenGuardadoHub) {
    setJornada((actual) => ({ ...actual, hub: resumen.hub, fecha: resumen.fecha, nombreResumen: resumen.nombre, datosPorHub: { ...actual.datosPorHub, [resumen.hub]: normalizarDatosHub(resumen.datos, resumen.hub) } }));
    setHubSeleccionado(true);
    setMensajeGuardado(`Resumen abierto: ${resumen.nombre}`);
  }

  function duplicarResumenHub(resumen: ResumenGuardadoHub) {
    const copia = normalizarResumenGuardado({ ...resumen, id: `borrador-${resumen.hub}-${crearId()}`, nombre: `${resumen.nombre} (nuevo borrador)`, guardadoEn: new Date().toISOString(), ultimaEdicion: new Date().toISOString(), estado: "BORRADOR", fecha: jornada.fecha }, resumen.hub);
    setBorradoresReportes((actual) => ({ ...actual, [resumen.hub]: [copia, ...(actual[resumen.hub] || [])] }));
    setBandejaReportes("borradores");
    abrirResumenHub(copia);
  }

  function eliminarResumenHub(resumen: ResumenGuardadoHub) {
    if (!window.confirm(`¿Eliminar el reporte "${resumen.nombre}"?`)) return;
    if (resumen.estado === "BORRADOR") setBorradoresReportes((actual) => ({ ...actual, [resumen.hub]: (actual[resumen.hub] || []).filter((item) => item.id !== resumen.id) }));
    else setHistorialResumenes((actual) => ({ ...actual, [resumen.hub]: (actual[resumen.hub] || []).filter((item) => item.id !== resumen.id) }));
    eliminarReporteServidor(resumen);
    setMensajeGuardado(`Reporte eliminado: ${resumen.nombre}`);
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
      const hubsContactos = Array.from(new Set([...hubsOperativos, ...Object.keys(actual.datosPorHub), ...clientesConHub.map((contacto) => contacto.hub).filter((hub): hub is HubDisponible => hub !== "Sin Hub asignado")]));
      const datosPorHubActualizados = Object.fromEntries(hubsContactos.map((hub) => {
        const datos = normalizarDatosHub(actual.datosPorHub[hub], hub);
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
  const clientesDisponiblesConsulta = normalizarDatosHub(jornada.datosPorHub[hubConsulta], hubConsulta).clientesIngresos;
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
    setClientesConsultaSeleccionados(normalizarDatosHub(jornada.datosPorHub[hub], hub).clientesIngresos.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id));
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
      `Asunto: Consulta HUBYA — ${consulta?.hub || hubConsulta}`,
      "",
      `Hola ${cliente.nombre || "cliente"},`,
      "",
      `Desde HUBYA queremos confirmar la planificación del ${consulta?.hub || hubConsulta}.`,
      "",
      consulta?.pregunta || preguntaConsulta,
      "",
      ...(consulta?.opciones || ["Sí", "No", "Puede ser"]).map((opcion) => `[ ${opcion} ] ${links[opcion]}`),
      "",
      "Tu respuesta nos ayuda a organizar mejor la demanda, el personal, los horarios y la frecuencia del Hub.",
      "",
      "Saludos,",
      "HUBYA",
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

  async function crearHubDesdePanel() {
    if (!nuevoHubForm.nombre.trim() || !nuevoHubForm.zona.trim()) {
      setEstadoNuevoHub("Error: nombre y zona son obligatorios para crear un Hub.");
      return;
    }
    if (nuevoHubForm.tipoHub === "oferta") {
      const nuevo = createEquipoActivo({ nombre: nuevoHubForm.nombre, zonaBase: nuevoHubForm.zona, tipo: "Otro", responsable: nuevoHubForm.responsable, descripcion: nuevoHubForm.descripcion, observaciones: nuevoHubForm.rama });
      setEquiposActivos((actuales) => [nuevo, ...actuales]);
      setEquipoActivoId(nuevo.id);
      setSeccionActiva("equipos");
      setNuevoHubForm(NUEVO_HUB_FORM_INICIAL);
      setEstadoNuevoHub(`Hub de oferta / equipo activo creado: ${nuevo.nombre}.`);
      return;
    }
    const respuesta = await fetch("/api/hubs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nuevoHubForm.nombre, zona: nuevoHubForm.zona, rama: nuevoHubForm.rama, equipoOperativo: nuevoHubForm.equipoOperativo, descripcionPublica: nuevoHubForm.descripcion }) });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      setEstadoNuevoHub(`Error al crear Hub de demanda: ${data.error || "respuesta inválida"}`);
      return;
    }
    setHubsCanonicos((actuales) => [data as HubPublico, ...actuales.filter((hub) => hub.id !== data.id)]);
    setJornada((actual) => ({ ...actual, hub: data.nombre, datosPorHub: { ...actual.datosPorHub, [data.nombre]: actual.datosPorHub[data.nombre] || datosHubInicial(data.nombre) } }));
    setHubSeleccionado(true);
    setNuevoHubForm(NUEVO_HUB_FORM_INICIAL);
    setEstadoNuevoHub(`Hub de demanda creado y publicado: ${data.nombre}. Se agregó automáticamente al operativo y a la web pública desde la misma ficha.`);
  }

  function actualizarSolicitudNuevoHub(id: string, estado: SolicitudNuevoHub["estado"]) {
    setSolicitudesNuevoHub((actuales) => actuales.map((solicitud) => solicitud.id === id ? { ...solicitud, estado } : solicitud));
  }

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
    actualizarEquipoActivo(equipoActivo.id, { integrantes: [nuevo, ...integrantesEquipoActivo] });
  }

  function actualizarIntegranteEquipo(integranteId: string, cambios: Partial<IntegranteEquipoActivo>) {
    if (!equipoActivo) return;
    actualizarEquipoActivo(equipoActivo.id, { integrantes: integrantesEquipoActivo.map((integrante) => integrante.id === integranteId ? { ...integrante, ...cambios } : integrante) });
  }

  function enviarMensajeEquipo() {
    if (!equipoActivo || !mensajeEquipo.mensaje.trim()) return setMensajeGuardado("Escribí un mensaje para el equipo activo.");
    if (integrantesDestinoMensaje.length === 0) return setMensajeGuardado("Seleccioná al menos un integrante para enviar el mensaje.");
    const mensaje: MensajeEquipoActivo = { id: `mensaje-equipo-${Date.now()}`, asunto: mensajeEquipo.asunto || `Mensaje HUBYA — ${equipoActivo.nombre}`, mensaje: mensajeEquipo.mensaje, fecha: new Date().toISOString(), destinatarios: integrantesDestinoMensaje.map((integrante) => integrante.id), canal: "whatsapp preparado" };
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
    const equipo = equipos.find((item) => item.nombre === solicitud.equipoInteres) || equipoActivo;
    if (equipo) actualizarEquipoActivo(equipo.id, { integrantes: [{ id: `integrante-${Date.now()}`, nombre: solicitud.nombre, rol: "operario", email: solicitud.email, whatsapp: solicitud.whatsapp, estado: "en evaluación", observacion: `${solicitud.rubroInteres} · ${solicitud.experiencia}` }, ...(equipo.integrantes ?? [])] });
  }

  function nombreOferta(ofertaId: string) {
    return equipos.find((equipo) => equipo.id === ofertaId)?.nombre || ofertaId || "Oferta sin seleccionar";
  }

  function crearVinculoDesdePanel() {
    if (!nuevoVinculoForm.hub_id || !nuevoVinculoForm.oferta_id) return setEstadoVinculos("Seleccioná un Hub y una oferta/equipo para crear el vínculo.");
    const timestamp = new Date().toISOString();
    const vinculo: HubVinculo = { id: `vinculo-${Date.now()}`, ...nuevoVinculoForm, created_at: timestamp, updated_at: timestamp };
    setHubVinculos((actuales) => [vinculo, ...actuales]);
    setNuevoVinculoForm({ ...NUEVO_VINCULO_FORM_INICIAL, hub_id: nuevoVinculoForm.hub_id });
    setEstadoVinculos(`Vínculo creado: ${vinculo.hub_id} ←→ ${nombreOferta(vinculo.oferta_id)}.`);
  }

  function actualizarVinculo(id: string, cambios: Partial<HubVinculo>) {
    setHubVinculos((actuales) => actuales.map((vinculo) => vinculo.id === id ? { ...vinculo, ...cambios, updated_at: new Date().toISOString() } : vinculo));
  }

  function eliminarVinculo(id: string) {
    actualizarVinculo(id, { estado: "SUSPENDIDO", fecha_fin: new Date().toISOString().slice(0, 10) });
    setEstadoVinculos("Integrante removido de la ficha. Queda disponible para volver a agregarlo cambiando el estado.");
  }

  function moverVinculo(id: string, direccion: -1 | 1) {
    setHubVinculos((actuales) => {
      const index = actuales.findIndex((vinculo) => vinculo.id === id);
      const destino = index + direccion;
      if (index < 0 || destino < 0 || destino >= actuales.length) return actuales;
      const copia = [...actuales];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  }

  function equipoPorId(ofertaId: string) {
    return equipos.find((equipo) => equipo.id === ofertaId) || null;
  }

  function emailsVinculo(vinculo: HubVinculo) {
    const equipo = equipoPorId(vinculo.oferta_id);
    return (equipo?.integrantes ?? []).filter((integrante) => integrante.email.trim()).map((integrante) => ({ nombre: integrante.nombre, email: integrante.email.trim() }));
  }

  function emailPrincipalVinculo(vinculo: HubVinculo) {
    return emailsVinculo(vinculo)[0]?.email || "Sin email cargado";
  }

  function abrirPerfilVinculo(vinculo: HubVinculo) {
    const equipo = equipoPorId(vinculo.oferta_id);
    if (!equipo) return setEstadoVinculos("No se encontró el perfil del equipo/oferta.");
    setEquipoActivoId(equipo.id);
    setSeccionActiva("equipos");
  }

  async function notificarDestinatariosFicha(destinatarios: { nombre: string; email: string }[], alcance: string) {
    const unicos = Array.from(new Map(destinatarios.map((destinatario) => [destinatario.email.toLowerCase(), destinatario])).values());
    if (unicos.length === 0) return setEstadoVinculos(`No hay emails cargados para notificar ${alcance}. Todos los integrantes deben tener email.`);
    if (!asuntoFichaHub.trim() || !mensajeFichaHub.trim()) return setEstadoVinculos("Completá asunto y mensaje antes de notificar.");
    setEstadoVinculos(`Enviando email a ${unicos.length} destinatarios de ${alcance}...`);
    const respuesta = await fetch("/api/enviar-informacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hub: jornada.hub, asunto: asuntoFichaHub, mensaje: mensajeFichaHub, nota: `Ficha editable del Hub · ${alcance}`, destinatarios: unicos }) });
    const data = await respuesta.json().catch(() => ({}));
    setEstadoVinculos(respuesta.ok ? `Notificación enviada a ${unicos.length} emails de ${alcance}.` : `No se pudo enviar: ${data?.error || "revisá configuración de email"}.`);
  }

  function notificarVinculo(vinculo: HubVinculo) {
    void notificarDestinatariosFicha(emailsVinculo(vinculo), nombreOferta(vinculo.oferta_id));
  }

  function notificarFichaHub() {
    const destinatarios = vinculosHubActual.filter((vinculo) => vinculo.estado === "ACTIVO" || (incluirPostulantesFicha && (vinculo.estado === "POSTULANTE" || vinculo.estado === "EVALUACION"))).flatMap(emailsVinculo);
    void notificarDestinatariosFicha(destinatarios, `${jornada.hub}${incluirPostulantesFicha ? " con postulantes" : " sin postulantes"}`);
  }

  const vinculosHubActual = vinculos.filter((vinculo) => vinculo.hub_id === jornada.hub && vinculo.estado !== "FINALIZADO");
  const resolutoresActivosHub = vinculosHubActual.filter((vinculo) => vinculo.estado === "ACTIVO" && !/paisaj|viver/i.test(`${nombreOferta(vinculo.oferta_id)} ${vinculo.rol} ${vinculo.capacidad}`));
  const paisajistasHub = vinculosHubActual.filter((vinculo) => vinculo.estado === "ACTIVO" && /paisaj/i.test(`${nombreOferta(vinculo.oferta_id)} ${vinculo.rol} ${vinculo.capacidad}`));
  const viverosHub = vinculosHubActual.filter((vinculo) => vinculo.estado === "ACTIVO" && /viver/i.test(`${nombreOferta(vinculo.oferta_id)} ${vinculo.rol} ${vinculo.capacidad}`));
  const postulantesHub = vinculosHubActual.filter((vinculo) => vinculo.estado === "POSTULANTE" || vinculo.estado === "EVALUACION");
  const integrantesFichaHub = vinculosHubActual.filter((vinculo) => vinculo.estado === "ACTIVO" || vinculo.estado === "POSTULANTE" || vinculo.estado === "EVALUACION");
  const emailsFichaCargados = new Set(integrantesFichaHub.flatMap((vinculo) => emailsVinculo(vinculo).map((destinatario) => destinatario.email.toLowerCase()))).size;

  const inputNumero = (valor: CampoNumerico, onChange: (valor: CampoNumerico) => void) => <input type="number" step="0.25" value={valor} onChange={(e) => onChange(normalizarNumero(e.target.value))} className="h-7 w-28 bg-transparent px-1 text-right outline-none" />;
  const inputTexto = (valor: string, onChange: (valor: string) => void, ancho = "min-w-40") => <input value={valor} onChange={(e) => onChange(e.target.value)} className={`h-7 ${ancho} bg-transparent px-1 outline-none`} />;

  if (!hubSeleccionado) {
    return (
      <main className="min-h-screen bg-[#eef2e8] px-4 py-8 text-[#182018]">
        <section className="mx-auto max-w-5xl rounded-2xl border border-[#cfd8c6] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HUBYA Operativo</p>
          <h1 className="mt-2 text-2xl font-black">¿Con qué Hub vas a trabajar hoy?</h1>
          <p className="mt-2 text-sm font-semibold text-[#66745c]">Elegí el Hub antes de cargar la jornada. Los clientes y los resúmenes guardados se muestran separados por Hub.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hubsOperativos.map((hub) => <button key={hub} onClick={() => seleccionarHubTrabajo(hub)} className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-4 text-left shadow-sm transition hover:border-[#1f2a1d] hover:bg-[#eef2e8]">
              <span className="block text-base font-black">{hub}</span>
              <span className="mt-2 block text-xs font-bold text-[#66745c]">{isMounted ? normalizarDatosHub(jornada.datosPorHub[hub], hub).clientesIngresos.length : "—"} clientes</span>
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
        {!simpleMode && <header className="sticky top-0 z-20 mb-3 rounded-xl border border-[#cfd8c6] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-2 xl:grid-cols-[1fr_220px_180px_220px_auto] xl:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HUBYA Operativo · carga manual + reporte vivo</p><h1 className="text-xl font-black leading-tight">Reporte del Hub — {jornada.hub} — {fechaFormateada}</h1></div>
            <div className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]"><span>Hub seleccionado</span><div className="flex h-8 items-center rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 text-sm font-black normal-case text-[#1f2a1d]">{jornada.hub} · {datosHub.clientesIngresos.length} clientes</div></div>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nombre del resumen<input value={jornada.nombreResumen} onChange={(e) => actualizarJornada({ nombreResumen: e.target.value })} placeholder={nombreResumenActual()} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case outline-none" /></label>
            <div className="flex flex-wrap gap-1.5 xl:justify-end"><button onClick={cambiarHub} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cambiar Hub</button><button onClick={guardarJornada} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar</button><button onClick={cargarJornada} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cargar</button><button onClick={limpiarJornada} className="h-8 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-3 text-xs font-black text-[#743c3c]">Limpiar</button></div>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado} · Carga principal editable con sumas y distribución automáticas. · Equipo activo vinculado: <span className="font-black text-[#1f2a1d]">{equipoVinculadoAlHub?.nombre || "Sin equipo vinculado"}</span></p>
          {fichaHubActual && <dl className="mt-2 grid gap-2 rounded-lg border border-[#d8dfd1] bg-[#f8faf5] p-2 text-xs sm:grid-cols-2 xl:grid-cols-6"><div><dt className="font-black uppercase text-[#66745c]">Ficha única</dt><dd className="font-bold">Web pública + operativo</dd></div><div><dt className="font-black uppercase text-[#66745c]">Ciudad / zona</dt><dd className="font-bold">{fichaHubActual.zona}</dd></div><div><dt className="font-black uppercase text-[#66745c]">Vecinos</dt><dd className="font-bold">{fichaHubActual.clientesActivos}</dd></div><div><dt className="font-black uppercase text-[#66745c]">Rama</dt><dd className="font-bold">{fichaHubActual.rama}</dd></div><div><dt className="font-black uppercase text-[#66745c]">Equipo operativo</dt><dd className="font-bold">{fichaHubActual.equipoOperativo}</dd></div><div><dt className="font-black uppercase text-[#66745c]">Servicios / vínculos</dt><dd className="font-bold">{fichaHubActual.servicios.length}</dd></div></dl>}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#d8dfd1] pt-3">
            <button onClick={() => setSeccionActiva("reporte")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "reporte" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Reporte del día</button>
            <button onClick={() => setSeccionActiva("informacion")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "informacion" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Envío por WhatsApp</button>
            <button onClick={() => setSeccionActiva("importar")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "importar" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Importar contactos</button>
            <a href="/operativo/solicitudes" className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">Solicitudes de ingreso</a><button onClick={() => setSeccionActiva("nuevoHub")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "nuevoHub" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Nuevo Hub</button><button onClick={() => setSeccionActiva("consultas")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "consultas" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Consultas del Hub</button><a href="/web-publica" className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">Web pública</a><button onClick={() => setSeccionActiva("vinculos")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "vinculos" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Vínculos</button><button onClick={() => setSeccionActiva("equipos")} className={`h-8 rounded-lg px-3 text-xs font-black ${seccionActiva === "equipos" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-white text-[#1f2a1d]"}`}>Equipos activos</button>
          </div>
        </header>}



        {seccionActiva === "nuevoHub" && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Crear Hub</p><h2 className="text-lg font-black">Nuevo Hub de demanda u oferta</h2><p className="text-xs font-semibold text-[#66745c]">Demanda agrupa clientes; oferta crea un Equipo activo para ejecutar una oferta operativa.</p></div>
          <div className="grid gap-2 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3 md:grid-cols-3">
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Tipo de Hub<select value={nuevoHubForm.tipoHub} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, tipoHub: e.target.value }))} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm normal-case"><option value="demanda">Hub de demanda</option><option value="oferta">Hub de oferta / Equipo activo</option></select></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nombre<input value={nuevoHubForm.nombre} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, nombre: e.target.value }))} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Zona<input value={nuevoHubForm.zona} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, zona: e.target.value }))} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Rama / rubro<input value={nuevoHubForm.rama} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, rama: e.target.value }))} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Equipo operativo / responsable<input value={nuevoHubForm.tipoHub === "demanda" ? nuevoHubForm.equipoOperativo : nuevoHubForm.responsable} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, [actual.tipoHub === "demanda" ? "equipoOperativo" : "responsable"]: e.target.value }))} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case" /></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c] md:col-span-3">Descripción<textarea value={nuevoHubForm.descripcion} onChange={(e) => setNuevoHubForm((actual) => ({ ...actual, descripcion: e.target.value }))} className="min-h-20 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case" /></label>
            <button onClick={crearHubDesdePanel} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white md:col-span-3">Crear Hub</button>
          </div>
          <p className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-3 text-xs font-black text-[#66745c]">{estadoNuevoHub}</p>
          <div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Solicitudes públicas de nuevos Hubs</h3><div className="mt-2 overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Tipo</th><th className="border p-2">Hub</th><th className="border p-2">Zona</th><th className="border p-2">Contacto</th><th className="border p-2">Descripción</th><th className="border p-2">Estado</th><th className="border p-2">Acciones</th></tr></thead><tbody>{solicitudesNuevoHub.length === 0 ? <tr><td colSpan={7} className="border p-4 text-center font-bold text-[#66745c]">Sin solicitudes públicas de nuevos Hubs.</td></tr> : solicitudesNuevoHub.map((solicitud) => <tr key={solicitud.id}><td className="border p-2 font-black">{solicitud.tipoHub === "demanda" ? "Demanda" : "Oferta"}</td><td className="border p-2">{solicitud.nombreHub}</td><td className="border p-2">{solicitud.zona}</td><td className="border p-2">{solicitud.responsable}<br />{solicitud.whatsapp}<br />{solicitud.email}</td><td className="border p-2">{solicitud.rubro} · {solicitud.descripcion}</td><td className="border p-2 font-black">{solicitud.estado}</td><td className="border p-2"><button onClick={() => actualizarSolicitudNuevoHub(solicitud.id, "aprobada")} className="mr-2 font-black text-[#2f6d32]">Aprobar</button><button onClick={() => actualizarSolicitudNuevoHub(solicitud.id, "rechazada")} className="font-black text-[#743c3c]">Rechazar</button></td></tr>)}</tbody></table></div></div>
        </section>}

        {seccionActiva === "vinculos" && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Gestión de Vínculos</p><h2 className="text-lg font-black">Demanda agrupada ←→ oferta / resolutor</h2><p className="text-xs font-semibold text-[#66745c]">{estadoVinculos}</p></div><p className="max-w-xl rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2 text-xs font-bold text-[#66745c]">El vínculo no une Hub con Hub. Une la demanda agrupada de un Hub con ofertas, equipos resolutores o postulantes.</p></div>
          <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]"><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Nuevo vínculo</h3><div className="mt-3 grid gap-2"><select value={nuevoVinculoForm.hub_id} onChange={(e) => setNuevoVinculoForm((actual) => ({ ...actual, hub_id: e.target.value as HubDisponible }))} className="h-9 rounded-lg border border-[#cfd8c6] px-2 text-xs font-bold">{hubsOperativos.map((hub) => <option key={`nuevo-vinculo-${hub}`} value={hub}>{hub}</option>)}</select><select value={nuevoVinculoForm.oferta_id} onChange={(e) => setNuevoVinculoForm((actual) => ({ ...actual, oferta_id: e.target.value }))} className="h-9 rounded-lg border border-[#cfd8c6] px-2 text-xs font-bold"><option value="">Seleccionar oferta/equipo</option>{equipos.map((equipo) => <option key={`oferta-${equipo.id}`} value={equipo.id}>{equipo.nombre}</option>)}</select><select value={nuevoVinculoForm.estado} onChange={(e) => setNuevoVinculoForm((actual) => ({ ...actual, estado: e.target.value as EstadoHubVinculo }))} className="h-9 rounded-lg border border-[#cfd8c6] px-2 text-xs font-bold">{ESTADOS_HUB_VINCULO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select>{inputTexto(nuevoVinculoForm.rol, (valor) => setNuevoVinculoForm((actual) => ({ ...actual, rol: valor })), "min-w-full rounded-lg border border-[#cfd8c6]")}{inputTexto(nuevoVinculoForm.capacidad, (valor) => setNuevoVinculoForm((actual) => ({ ...actual, capacidad: valor })), "min-w-full rounded-lg border border-[#cfd8c6]")}<textarea value={nuevoVinculoForm.observaciones} onChange={(e) => setNuevoVinculoForm((actual) => ({ ...actual, observaciones: e.target.value }))} placeholder="Observaciones" className="min-h-20 rounded-lg border border-[#cfd8c6] p-2 text-xs font-semibold outline-none" /><button onClick={crearVinculoDesdePanel} className="h-9 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Crear vínculo</button></div></div><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Listado de vínculos</h3><div className="mt-2 overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Hub</th><th className="border p-2">Oferta / resolutor</th><th className="border p-2">Estado</th><th className="border p-2">Rol</th><th className="border p-2">Capacidad</th><th className="border p-2">Observaciones</th><th className="border p-2"></th></tr></thead><tbody>{vinculos.length === 0 ? <tr><td colSpan={7} className="border p-4 text-center font-bold text-[#66745c]">Sin vínculos cargados.</td></tr> : vinculos.map((vinculo) => <tr key={vinculo.id}><td className="border p-1 font-black">{vinculo.hub_id}</td><td className="border p-1">{nombreOferta(vinculo.oferta_id)}</td><td className="border p-1"><select value={vinculo.estado} onChange={(e) => actualizarVinculo(vinculo.id, { estado: e.target.value as EstadoHubVinculo })} className="h-7 bg-transparent font-black">{ESTADOS_HUB_VINCULO.map((estado) => <option key={`${vinculo.id}-${estado}`} value={estado}>{estado}</option>)}</select></td><td className="border p-1">{inputTexto(vinculo.rol, (valor) => actualizarVinculo(vinculo.id, { rol: valor }), "min-w-32")}</td><td className="border p-1">{inputTexto(vinculo.capacidad, (valor) => actualizarVinculo(vinculo.id, { capacidad: valor }), "min-w-40")}</td><td className="border p-1">{inputTexto(vinculo.observaciones, (valor) => actualizarVinculo(vinculo.id, { observaciones: valor }), "min-w-56")}</td><td className="border p-1 text-center"><button onClick={() => eliminarVinculo(vinculo.id)} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div></div></div>
          <div className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Ficha editable del Hub · misma fuente que la web pública</p><h3 className="text-2xl font-black uppercase">{jornada.hub}</h3><p className="text-sm font-bold text-[#66745c]">{fichaHubActual?.zona || "Zona operativa"} · Vecinos: {fichaHubActual?.clientesActivos ?? datosHub.clientesIngresos.length} · Hs anuales: {datosHub.clientesIngresos.reduce((total, cliente) => total + Number(cliente.importe || 0), 0).toLocaleString("es-AR")}</p><p className="mt-1 text-xs font-semibold text-[#66745c]">{fichaHubActual?.descripcionPublica || "Ficha operativa local pendiente de sincronizar con la ficha pública."}</p></div>
              <div className="grid gap-2 text-xs font-bold text-[#66745c]"><span>Emails cargados en ficha: <b className="text-[#1f2a1d]">{emailsFichaCargados}</b></span><label className="flex items-center gap-2"><input type="checkbox" checked={incluirPostulantesFicha} onChange={(e) => setIncluirPostulantesFicha(e.target.checked)} /> Incluir postulantes</label></div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"><input value={asuntoFichaHub} onChange={(e) => setAsuntoFichaHub(e.target.value)} className="h-9 rounded-lg border border-[#cfd8c6] px-3 text-xs font-bold" placeholder="Asunto email" /><input value={mensajeFichaHub} onChange={(e) => setMensajeFichaHub(e.target.value)} className="h-9 rounded-lg border border-[#cfd8c6] px-3 text-xs font-bold" placeholder="Mensaje email" /><button onClick={notificarFichaHub} className="h-9 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Notificar a toda la ficha del Hub</button></div>
            {[["ABASTECEN LA DEMANDA", resolutoresActivosHub], ["PAISAJISTAS ASOCIADAS", paisajistasHub], ["VIVEROS ASOCIADOS", viverosHub], ["POSTULANTES", postulantesHub]].map(([titulo, items]) => <div key={titulo as string} className="mt-4 rounded-xl border border-[#d8dfd1] bg-white p-3"><h4 className="text-xs font-black uppercase tracking-[0.15em] text-[#66745c]">{titulo as string}</h4>{(items as HubVinculo[]).length === 0 ? <p className="mt-2 text-xs font-bold text-[#66745c]">Sin integrantes cargados.</p> : <ul className="mt-2 space-y-2">{(items as HubVinculo[]).map((vinculo) => <li key={`ficha-${vinculo.id}`} className="rounded-lg border border-[#e1e6dc] bg-[#fbfcf8] p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black">{nombreOferta(vinculo.oferta_id)} <span className="font-semibold text-[#66745c]">/ {vinculo.rol}</span></p><p className={`text-xs font-bold ${emailPrincipalVinculo(vinculo) === "Sin email cargado" ? "text-[#743c3c]" : "text-[#66745c]"}`}>Email: {emailPrincipalVinculo(vinculo)}</p><input value={vinculo.observaciones} onChange={(e) => actualizarVinculo(vinculo.id, { observaciones: e.target.value })} className="mt-1 h-7 min-w-64 rounded border border-[#d8dfd1] px-2 text-xs font-semibold" placeholder="Editar observación" /></div><div className="flex flex-wrap gap-2"><button onClick={() => abrirPerfilVinculo(vinculo)} className="rounded-lg border border-[#cfd8c6] px-2 py-1 text-[11px] font-black">Ver perfil</button><button onClick={() => eliminarVinculo(vinculo.id)} className="rounded-lg border border-[#d8b7b7] px-2 py-1 text-[11px] font-black text-[#743c3c]">Remover</button><button onClick={() => vinculo.estado === "ACTIVO" ? setEstadoVinculos("Editá rol, capacidad u observaciones directamente en la ficha o en el listado.") : actualizarVinculo(vinculo.id, { estado: "ACTIVO", fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: "" })} className="rounded-lg border border-[#cfd8c6] px-2 py-1 text-[11px] font-black">{vinculo.estado === "ACTIVO" ? "Editar" : "Aprobar como oferente"}</button><button onClick={() => notificarVinculo(vinculo)} className="rounded-lg bg-[#eef2e8] px-2 py-1 text-[11px] font-black">Notificar</button><button onClick={() => moverVinculo(vinculo.id, -1)} className="rounded-lg border border-[#cfd8c6] px-2 py-1 text-[11px] font-black">↑</button><button onClick={() => moverVinculo(vinculo.id, 1)} className="rounded-lg border border-[#cfd8c6] px-2 py-1 text-[11px] font-black">↓</button></div></div></li>)}</ul>}</div>)}
          </div>
        </section>}

        {seccionActiva === "equipos" && equipoActivo && <section className="mb-3 space-y-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">OFERTA · Equipo activo</p><h2 className="text-lg font-black">Equipos activos</h2><p className="text-xs font-semibold text-[#66745c]">Hubs de oferta separados de la demanda: integrantes, consultas al equipo, mensajes al equipo y vínculo con Hubs de demanda.</p></div>
            <button onClick={crearEquipoDesdePanel} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Crear equipo activo</button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-2 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-3">
              {equipos.map((equipo) => <button key={equipo.id} onClick={() => { setEquipoActivoId(equipo.id); setIntegrantesMensajeSeleccionados((equipo.integrantes ?? []).map((integrante) => integrante.id)); }} className={`w-full rounded-lg border p-3 text-left text-xs ${equipoActivo.id === equipo.id ? "border-[#1f2a1d] bg-white" : "border-[#cfd8c6] bg-[#fbfcf9]"}`}><span className="block font-black">{equipo.nombre}</span><span className="block font-bold text-[#66745c]">{equipo.estado} · {equipo.tipo}</span><span className="block font-bold text-[#66745c]">{(equipo.integrantes ?? []).length} integrantes · {(equipo.hubsDemandaVinculados ?? []).length} Hubs vinculados</span></button>)}
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
              <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Integrantes</p><p className="text-2xl font-black">{integrantesEquipoActivo.length}</p></div><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Mensajes enviados</p><p className="text-2xl font-black">{(equipoActivo.mensajesEnviados ?? []).length}</p></div><div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3"><p className="text-[10px] font-black uppercase text-[#66745c]">Consultas al equipo</p><p className="text-2xl font-black">{(equipoActivo.consultasEnviadas ?? []).length}</p></div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Hubs de demanda vinculados</h3><div className="mt-2 flex flex-wrap gap-2">{hubsOperativos.map((hub) => <label key={`vinculo-${hub}`} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 py-1 text-xs font-bold"><input type="checkbox" checked={(equipoActivo.hubsDemandaVinculados ?? []).includes(hub)} onChange={(e) => actualizarEquipoActivo(equipoActivo.id, { hubsDemandaVinculados: e.target.checked ? [...(equipoActivo.hubsDemandaVinculados ?? []), hub] : (equipoActivo.hubsDemandaVinculados ?? []).filter((item) => item !== hub) })} className="mr-1" />{hub}</label>)}</div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black">Integrantes</h3><button onClick={agregarIntegranteEquipo} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-xs font-black text-white">Agregar integrante</button></div><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Nombre</th><th className="border p-2">Rol</th><th className="border p-2">Email</th><th className="border p-2">WhatsApp</th><th className="border p-2">Estado</th><th className="border p-2">Observación</th><th className="border p-2"></th></tr></thead><tbody>{integrantesEquipoActivo.map((integrante) => <tr key={integrante.id}><td className="border p-1"><input value={integrante.nombre} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { nombre: e.target.value })} className="h-7 min-w-40 bg-transparent px-1" /></td><td className="border p-1"><select value={integrante.rol} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { rol: e.target.value as IntegranteEquipoActivo["rol"] })} className="h-7 bg-transparent">{ROLES_INTEGRANTE.map((rol) => <option key={rol} value={rol}>{rol}</option>)}</select></td><td className="border p-1"><input value={integrante.email} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { email: e.target.value })} className="h-7 min-w-44 bg-transparent px-1" /></td><td className="border p-1"><input value={integrante.whatsapp} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { whatsapp: e.target.value })} className="h-7 min-w-32 bg-transparent px-1" /></td><td className="border p-1"><select value={integrante.estado} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { estado: e.target.value as IntegranteEquipoActivo["estado"] })} className="h-7 bg-transparent">{ESTADOS_INTEGRANTE.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></td><td className="border p-1"><input value={integrante.observacion} onChange={(e) => actualizarIntegranteEquipo(integrante.id, { observacion: e.target.value })} className="h-7 min-w-44 bg-transparent px-1" /></td><td className="border p-1"><button onClick={() => actualizarEquipoActivo(equipoActivo.id, { integrantes: integrantesEquipoActivo.filter((item) => item.id !== integrante.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div></div>
              <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Enviar mensaje al equipo</h3><p className="text-xs font-semibold text-[#66745c]">Seleccioná integrantes; el envío se prepara individualmente para no exponer datos de otros integrantes.</p><div className="mt-2 flex flex-wrap gap-2">{integrantesEquipoActivo.map((integrante) => <label key={`mensaje-${integrante.id}`} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] px-2 py-1 text-xs font-bold"><input type="checkbox" checked={integrantesMensajeSeleccionados.includes(integrante.id)} onChange={(e) => setIntegrantesMensajeSeleccionados((actuales) => e.target.checked ? [...actuales, integrante.id] : actuales.filter((id) => id !== integrante.id))} className="mr-1" />{integrante.nombre}</label>)}</div><button onClick={() => setIntegrantesMensajeSeleccionados(integrantesEquipoActivo.map((integrante) => integrante.id))} className="mt-2 h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Seleccionar todos</button><input value={mensajeEquipo.asunto} onChange={(e) => setMensajeEquipo((actual) => ({ ...actual, asunto: e.target.value }))} placeholder="Asunto" className="mt-2 h-8 w-full rounded-lg border border-[#cfd8c6] px-2 text-sm"/><textarea value={mensajeEquipo.mensaje} onChange={(e) => setMensajeEquipo((actual) => ({ ...actual, mensaje: e.target.value }))} placeholder="Mensaje" className="mt-2 min-h-20 w-full rounded-lg border border-[#cfd8c6] p-2 text-sm"/><button onClick={enviarMensajeEquipo} className="mt-2 h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Preparar envío ({integrantesDestinoMensaje.length})</button></div><div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Crear consulta al equipo</h3><input value={preguntaEquipo} onChange={(e) => setPreguntaEquipo(e.target.value)} className="mt-2 h-8 w-full rounded-lg border border-[#cfd8c6] px-2 text-sm"/><button onClick={crearConsultaEquipo} className="mt-2 h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Crear consulta</button><div className="mt-3 space-y-2">{(equipoActivo.consultasEnviadas ?? []).map((consulta) => <div key={consulta.id} className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2 text-xs"><p className="font-black">{consulta.pregunta}</p><p>Sí: {(consulta.respuestas ?? []).filter((r) => r.opcion === "Sí").length} · No: {(consulta.respuestas ?? []).filter((r) => r.opcion === "No").length} · Puede ser: {(consulta.respuestas ?? []).filter((r) => r.opcion === "Puede ser").length} · Sin responder: {Math.max(integrantesEquipoActivo.length - (consulta.respuestas ?? []).length, 0)} · Total integrantes: {integrantesEquipoActivo.length}</p></div>)}</div></div></div>
              <div className="rounded-xl border border-[#d8dfd1] p-3"><h3 className="text-sm font-black">Solicitudes de oferta</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Nombre</th><th className="border p-2">WhatsApp</th><th className="border p-2">Email</th><th className="border p-2">Rubro</th><th className="border p-2">Equipo solicitado</th><th className="border p-2">Estado</th><th className="border p-2">Fecha</th><th className="border p-2">Acciones</th></tr></thead><tbody>{solicitudesOferta.length === 0 ? <tr><td colSpan={8} className="border p-4 text-center font-bold text-[#66745c]">Sin solicitudes de ingreso al equipo.</td></tr> : solicitudesOferta.map((solicitud) => <tr key={solicitud.id}><td className="border p-2 font-semibold">{solicitud.nombre}</td><td className="border p-2">{solicitud.whatsapp}</td><td className="border p-2">{solicitud.email}</td><td className="border p-2">{solicitud.rubroInteres}</td><td className="border p-2">{solicitud.equipoInteres}</td><td className="border p-2 font-black">{solicitud.estado}</td><td className="border p-2">{formatoFecha(solicitud.fecha.slice(0, 10))}</td><td className="border p-2"><button onClick={() => aprobarSolicitudOferta(solicitud.id)} className="mr-2 font-black text-[#2f6d32]">Aprobar/convertir</button><button onClick={() => setSolicitudesOferta((actuales) => actuales.map((item) => item.id === solicitud.id ? { ...item, estado: "rechazada" } : item))} className="font-black text-[#743c3c]">Rechazar</button></td></tr>)}</tbody></table></div></div>
            </div>
          </div>
        </section>}

        {seccionActiva === "informacion" && <section className="mb-3 rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Módulo independiente</p><h2 className="text-lg font-black">Envío por email</h2><p className="text-xs font-semibold text-[#66745c]">No modifica el reporte económico ni la jornada actual. Cada cliente recibe su propio email individual. Nunca se usan grupos ni se muestran datos de otros clientes.</p></div>
            <p className={`rounded-lg border px-3 py-2 text-xs font-black ${estadoInformacion === "error" ? "border-[#d6b7b7] bg-[#fff7f7] text-[#743c3c]" : estadoInformacion === "enviado" ? "border-[#b7d6ba] bg-[#f2fff4] text-[#2f6d32]" : "border-[#cfd8c6] bg-[#f8faf5] text-[#66745c]"}`}>{mensajeEstadoInformacion}</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={hubInformacion} onChange={(e) => e.target.value ? seleccionarHubInformacion(e.target.value as HubDisponible) : setHubInformacion("")} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none"><option value="">Seleccionar Hub</option>{hubsOperativos.map((hub) => <option key={hub} value={hub}>{hub}</option>)}</select></label>
              <div className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2 text-xs font-bold text-[#66745c]">Clientes seleccionados: <span className="text-[#1f2a1d]">{destinatariosSeleccionados.length} de {destinatariosConEmailInformacion.length}</span></div>
              <div className="flex flex-wrap gap-2"><button onClick={() => marcarTodosDestinatarios(true)} className="h-7 rounded-md bg-[#1f2a1d] px-3 text-xs font-black text-white">Marcar todos</button><button onClick={() => marcarTodosDestinatarios(false)} className="h-7 rounded-md border border-[#cfd8c6] px-3 text-xs font-black">Desmarcar todos</button></div>
            </div>
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Incluido</th><th className="border p-1">Nombre</th><th className="border p-1">Email</th></tr></thead><tbody>{destinatariosInformacion.length === 0 ? <tr><td colSpan={3} className="border p-3 text-center font-bold text-[#66745c]">Seleccioná un Hub para ver sus clientes.</td></tr> : destinatariosInformacion.map((destinatario, index) => <tr key={`destinatario-${destinatario.id}-${index}`} className={destinatario.incluido ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1 text-center"><input type="checkbox" checked={destinatario.incluido} disabled={!emailValido(destinatario.email || "")} onChange={(e) => actualizarDestinatarioInformacion(destinatario.id, e.target.checked)} /></td><td className="border border-[#e1e6dc] p-1 font-semibold">{destinatario.nombre || "Sin nombre"}</td><td className={`border border-[#e1e6dc] p-1 ${emailValido(destinatario.email || "") ? "" : "font-black text-[#743c3c]"}`}>{emailValido(destinatario.email || "") ? destinatario.email : "Sin email cargado"}</td></tr>)}</tbody></table></div>
              <div className="grid gap-2"><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Referencia interna<input value={asuntoInformacion} onChange={(e) => setAsuntoInformacion(e.target.value)} placeholder={hubInformacion ? `Email HUBYA — ${hubInformacion}` : "Email HUBYA — [Hub seleccionado]"} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Mensaje principal<textarea value={mensajeInformacion} onChange={(e) => setMensajeInformacion(e.target.value)} placeholder={hubInformacion ? `Hola, te compartimos información correspondiente al ${hubInformacion}.` : "Hola, te compartimos información correspondiente al [Hub seleccionado]."} className="min-h-24 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case outline-none" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Nota opcional<textarea value={notaInformacion} onChange={(e) => setNotaInformacion(e.target.value)} className="min-h-16 rounded-lg border border-[#cfd8c6] p-2 text-sm normal-case outline-none" /></label></div>
              <button onClick={enviarInformacion} disabled={estadoInformacion === "enviando"} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60">Enviar a seleccionados</button>
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
              <label className="grid min-w-64 gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={hubConsulta} onChange={(e) => seleccionarHubConsulta(e.target.value as HubDisponible)} className="h-9 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none">{hubsOperativos.map((hub) => <option key={`consulta-hub-${hub}`} value={hub}>{hub}</option>)}</select></label>
              <button onClick={() => { setConsultaActivaId(""); setPreguntaConsulta(`¿Vas a seguir formando parte del ${hubConsulta} el próximo año?`); setClientesConsultaSeleccionados(clientesDisponiblesConsulta.filter((cliente) => cliente.email.trim()).map((cliente) => cliente.id)); setPasoConsulta("crear"); }} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white">Nueva encuesta</button>
            </div>
            <div className="rounded-lg border border-[#cfd8c6] bg-white p-2 text-xs font-bold text-[#66745c]">Total clientes del Hub: <span className="text-[#1f2a1d]">{totalClientesHubConsulta}</span></div>
            <section>
              <p className="mb-2 text-[11px] font-black uppercase text-[#66745c]">Historial de encuestas del Hub</p>
              <div className="space-y-2">{consultasDelHubSeleccionado.length === 0 ? <p className="rounded-lg border border-[#cfd8c6] bg-white p-3 text-xs font-bold text-[#66745c]">Todavía no hay encuestas para {hubConsulta}.</p> : consultasDelHubSeleccionado.map((consulta, index) => { const conteos = (consulta.opciones ?? []).map((opcion) => `${opcion}: ${(consulta.respuestas ?? []).filter((respuesta) => respuesta.opcion === opcion).length}`).join(" · "); const sinResponderHistorial = Math.max(totalClientesHubConsulta - (consulta.respuestas ?? []).filter((respuesta) => idsClientesHubConsulta.has(respuesta.clienteId)).length, 0); return <article key={consulta.id} className="rounded-lg border border-[#cfd8c6] bg-white p-3 text-xs"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">Encuesta N°{index + 1}</h3><p className="font-semibold text-[#66745c]">{consulta.pregunta}</p><p className="mt-1 font-bold">{formatoFecha(consulta.fechaCreacion.slice(0, 10))} · {consulta.estado} · {conteos} · Sin responder: {sinResponderHistorial}</p></div><button onClick={() => { setConsultaActivaId(consulta.id); setPasoConsulta("resultados"); }} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Ver encuesta</button></div></article>; })}</div>
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
          <div className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3">
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Buscar contacto por nombre, email, WhatsApp, referencia o Hub...<input value={busquedaContactos} onChange={(e) => setBusquedaContactos(e.target.value)} placeholder="Buscar contacto por nombre, email, WhatsApp, referencia o Hub..." className="h-12 rounded-xl border border-[#cfd8c6] bg-white px-4 text-base font-semibold normal-case outline-none focus:border-[#5d7032]" /></label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-[#66745c]">Mostrando {contactosImportadosFiltrados.length} de {contactosImportados.length} contactos</p><button type="button" onClick={() => setBusquedaContactos("")} disabled={!busquedaContactos} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black text-[#1f2a1d] disabled:opacity-50">Limpiar búsqueda</button></div>
          </div>
          <div className="flex flex-wrap gap-2"><button onClick={procesarContactosATabla} className="h-9 rounded-lg bg-[#5d7032] px-4 text-xs font-black text-white">Procesar contactos</button><button onClick={guardarContactosSeleccionados} disabled={contactosImportados.length === 0} className="h-9 rounded-lg bg-[#1f2a1d] px-4 text-xs font-black text-white disabled:opacity-50">Guardar contactos seleccionados</button></div>
          {resumenGuardadoContactos && <div className="rounded-lg border border-[#b7d6ba] bg-[#f2fff4] px-3 py-2 text-xs font-black text-[#1f2a1d]">Último guardado: {resumenGuardadoContactos.clientesConHub} clientes en Hubs, {resumenGuardadoContactos.clientesSinHub} clientes sin Hub, {resumenGuardadoContactos.actores} actores/equipo, {resumenGuardadoContactos.auxiliares} auxiliares, {resumenGuardadoContactos.ignorados} ignorados.</div>}
          <div className="max-h-[62vh] overflow-auto rounded-lg border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="sticky top-0 bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-2">Incluir sí/no</th><th className="border p-2">Rol</th><th className="border p-2">Nombre</th><th className="border p-2">Referencia</th><th className="border p-2">WhatsApp</th><th className="border p-2">Email</th><th className="border p-2">Hub sugerido / Hub asignado</th><th className="border p-2">Tipo destino</th><th className="border p-2">Acción eliminar</th></tr></thead><tbody>{contactosImportados.length === 0 ? <tr><td colSpan={9} className="border p-6 text-center font-bold text-[#66745c]">Pegá una base cruda y tocá Procesar contactos para generar esta tabla de revisión.</td></tr> : contactosImportadosFiltrados.length === 0 ? <tr><td colSpan={9} className="border p-6 text-center font-bold text-[#66745c]">No hay contactos que coincidan con la búsqueda.</td></tr> : contactosImportadosFiltrados.map((contacto) => <tr key={contacto.id} className={contacto.incluir ? "bg-[#eef4ea]" : "bg-white"}><td className="border p-2 text-center"><input type="checkbox" checked={contacto.incluir} onChange={(e) => actualizarContactoImportado(contacto.id, { incluir: e.target.checked })} /></td><td className="border p-1">{inputTexto(contacto.rol, (valor) => actualizarContactoImportado(contacto.id, { rol: valor.toUpperCase() as RolContactoImportado }), "min-w-24")}</td><td className="border p-1">{inputTexto(contacto.nombre, (valor) => actualizarContactoImportado(contacto.id, { nombre: valor }), "min-w-40")}</td><td className="border p-1">{inputTexto(contacto.referencia, (valor) => actualizarContactoImportado(contacto.id, { referencia: valor }), "min-w-48")}</td><td className="border p-1">{inputTexto(contacto.whatsapp, (valor) => actualizarContactoImportado(contacto.id, { whatsapp: valor }), "min-w-32")}</td><td className="border p-1">{inputTexto(contacto.email, (valor) => actualizarContactoImportado(contacto.id, { email: valor }), "min-w-48")}</td><td className="border p-1"><select value={contacto.hub} onChange={(e) => actualizarContactoImportado(contacto.id, { hub: e.target.value as HubImportacion })} className="h-8 min-w-52 rounded border border-[#cfd8c6] bg-white px-2 outline-none"><option value="Sin Hub asignado">Sin Hub asignado</option>{hubsOperativos.map((hub) => <option key={`hub-fila-${contacto.id}-${hub}`} value={hub}>{hub}</option>)}</select></td><td className="border p-1"><select value={contacto.tipoDestino} onChange={(e) => actualizarContactoImportado(contacto.id, { tipoDestino: e.target.value as TipoDestinoImportacion })} className="h-8 min-w-36 rounded border border-[#cfd8c6] bg-white px-2 outline-none"><option value="cliente">Cliente</option><option value="actor">Actor / Equipo</option><option value="auxiliar">Auxiliar</option><option value="ignorar">Ignorar</option></select></td><td className="border p-2 text-center"><button onClick={() => eliminarContactoImportado(contacto.id)} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div>
          <section className="rounded-lg border border-[#d8dfd1] bg-[#fffdf2] px-3 py-2 text-xs font-black"><span className="mr-2 text-[#66745c]">Sin Hub asignado:</span>{isMounted ? conteoSinHub : "—"} contactos</section>
          <section className="rounded-lg border border-[#d8dfd1] bg-[#f8faf5] px-3 py-2 text-xs font-black"><span className="mr-2 text-[#66745c]">Organización actual:</span>{hubsOperativos.map((hub, index) => <span key={`organizacion-${hub}`}>{index > 0 ? " | " : ""}{hub}: {isMounted ? normalizarDatosHub(jornada.datosPorHub[hub], hub).clientesIngresos.length : "—"} clientes</span>)}<span> | Sin Hub asignado: {isMounted ? conteoSinHub : "—"} contactos</span></section>
        </section>}

        {seccionActiva === "reporte" && <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Zona A · Carga operativa</h2><span className="text-xs font-bold text-[#66745c]">Planilla compacta</span></div>
              <h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Paso 1 — Carga del reporte</h3><div className="mb-2 rounded-lg border border-[#d8dfd1] bg-[#f8faf5] p-2 text-xs"><p className="font-bold text-[#66745c]">Cargá solo lo que corresponde a este reporte. La selección de destinatarios y el envío quedan más adelante.</p></div>{confirmacionEnvioReporte && <div className="mb-2 rounded-xl border border-[#1f2a1d] bg-white p-3 text-xs shadow-sm"><h4 className="text-sm font-black">Vas a enviar este reporte a {destinatariosSeleccionadosReporte.length} personas.</h4><div className="mt-2 grid gap-3 md:grid-cols-2"><div><h5 className="font-black">Clientes del Hub</h5><ul className="mt-1 max-h-36 space-y-1 overflow-auto">{destinatariosSeleccionadosReporte.filter((d) => d.grupo === "cliente").map((cliente, index) => <li key={`confirmar-cliente-${cliente.id}-${index}`} className="font-semibold">{cliente.nombre || `Cliente ${index + 1}`} — <a className="underline" href={`mailto:${cliente.email}`}>{cliente.email}</a></li>)}{clientesSinEmailReporte.map((cliente) => <li key={`sin-email-cliente-${cliente.id}`} className="font-black text-[#743c3c]">{cliente.nombre || "Cliente sin nombre"} — Sin email cargado — no recibirá el reporte.</li>)}</ul></div><div><h5 className="font-black">Hub Operativo</h5><ul className="mt-1 max-h-36 space-y-1 overflow-auto">{destinatariosSeleccionadosReporte.filter((d) => d.grupo === "operativo").map((actor, index) => <li key={`confirmar-actor-${actor.id}-${index}`} className="font-semibold">{actor.nombre || `Integrante ${index + 1}`} — {actor.rol || "Rol operativo"} — <a className="underline" href={`mailto:${actor.email}`}>{actor.email}</a></li>)}{datosHub.actores.filter((actor) => !emailValido(actor.email || "")).map((actor) => <li key={`sin-email-actor-${actor.id}`} className="font-black text-[#743c3c]">{actor.nombre || "Integrante sin nombre"} — {actor.rol || "Rol operativo"} — Sin email cargado — no recibirá el reporte.</li>)}</ul></div></div>{clientesEmailInvalidoReporte.length > 0 && <p className="mt-1 font-black text-[#743c3c]">{clientesEmailInvalidoReporte.length} cliente{clientesEmailInvalidoReporte.length === 1 ? "" : "s"} tiene{clientesEmailInvalidoReporte.length === 1 ? "" : "n"} email inválido y no se seleccionó automáticamente.</p>}<div className="mt-3 flex flex-wrap gap-2"><button onClick={() => ejecutarEnvioReporte(destinatariosSeleccionadosReporte)} disabled={estadoEnvio === "enviando"} className="h-8 rounded-lg bg-[#1f2a1d] px-3 font-black text-white disabled:opacity-50">Confirmar envío</button><button onClick={() => setConfirmacionEnvioReporte(false)} className="h-8 rounded-lg border border-[#cfd8c6] px-3 font-black">Cancelar</button></div></div>}<div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Cliente</th><th className="border p-1">Tarifa del cliente</th><th className="border p-1">Importe</th><th className="border p-1">Estado de visita</th><th className="border p-1">Observación simple</th></tr></thead><tbody>{datosHub.clientesIngresos.map((cliente, index) => { const tieneEmailValido = emailValido(cliente.email); const seleccionadoReporte = clientesReporteSeleccionados.includes(cliente.id) && tieneEmailValido; return <tr key={`cliente-edit-${cliente.id}-${index}`} className={seleccionadoReporte ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.nombre, (valor) => actualizarCliente(cliente.id, { nombre: valor }))}</td><td className="border border-[#e1e6dc] p-1"><select value={cliente.tarifaCliente} onChange={(e) => actualizarCliente(cliente.id, { tarifaCliente: e.target.value as TarifaCliente })} className="min-w-36 rounded border bg-white px-2 py-1">{TARIFAS_CLIENTE.map((tarifa) => <option key={tarifa.value} value={tarifa.value}>{tarifa.label}</option>)}</select></td><td className="border border-[#e1e6dc] p-1">{inputNumero(cliente.importe, (valor) => actualizarCliente(cliente.id, { importe: valor }))}</td><td className={`border border-[#e1e6dc] p-1 font-black ${estadoVisitaCliente(cliente) === "Saltea la visita" ? "text-[#8a6a16]" : "text-[#2f6d32]"}`}>{estadoVisitaCliente(cliente)}</td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.trabajoRealizado || "", (valor) => actualizarCliente(cliente.id, { trabajoRealizado: valor }), "min-w-48")}</td></tr>; })}</tbody></table></div><div className="mt-2 flex flex-wrap gap-2"><button onClick={guardarJornada} className="h-7 rounded-md bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar carga</button><a href="#paso-gastos" className="h-7 rounded-md border border-[#cfd8c6] px-3 py-1 text-xs font-black">Continuar</a></div>{ultimoEnvioReporte && <div className="mt-3 rounded-xl border border-[#cfd8c6] bg-[#f8faf5] p-3 text-xs"><h4 className="text-sm font-black">{ultimoEnvioReporte.tipo === "prueba" ? "Envío de prueba" : "Envío generado"}</h4><p className="mt-1 font-semibold">Este reporte se intentó enviar a estas personas.</p><div className="mt-2 grid gap-2 md:grid-cols-4"><div><p className="font-black text-[#66745c]">Fecha y hora</p><p>{new Date(ultimoEnvioReporte.fechaHora).toLocaleString("es-AR")}</p></div><div><p className="font-black text-[#66745c]">Hub</p><p>{ultimoEnvioReporte.hub}</p></div><div><p className="font-black text-[#66745c]">Reporte</p><p>{ultimoEnvioReporte.reporte}</p></div><div><p className="font-black text-[#66745c]">Destinatarios seleccionados</p><p>{ultimoEnvioReporte.destinatariosSeleccionados}</p></div><div><p className="font-black text-[#66745c]">Enviados a proveedor</p><p>{ultimoEnvioReporte.enviadosAProveedor}</p></div><div><p className="font-black text-[#66745c]">Errores</p><p>{ultimoEnvioReporte.errores}</p></div><div><p className="font-black text-[#66745c]">Sin email</p><p>{ultimoEnvioReporte.sinEmail}</p></div><div><p className="font-black text-[#66745c]">Pendientes de respuesta</p><p>{ultimoEnvioReporte.pendientesRespuesta}</p></div><div><p className="font-black text-[#66745c]">From usado</p><p>{ultimoEnvioReporte.fromUsado || "—"}</p></div><div><p className="font-black text-[#66745c]">Reply-To usado</p><p>{ultimoEnvioReporte.replyToUsado || "—"}</p></div></div><div className="mt-3 overflow-x-auto rounded-lg border border-[#d8dfd1] bg-white"><table className="w-full border-collapse"><thead className="bg-[#f1f4ec] text-left uppercase text-[#66745c]"><tr><th className="border p-1">Nombre</th><th className="border p-1">Email</th><th className="border p-1">Estado</th><th className="border p-1">Error</th><th className="border p-1">Fecha/hora</th><th className="border p-1">Provider ID / Resend ID</th><th className="border p-1">Acción</th></tr></thead><tbody>{ultimoEnvioReporte.destinatarios.map((destinatario, index) => <tr key={`envio-reporte-${ultimoEnvioReporte.id}-${destinatario.id}-${index}`}><td className="border p-1 font-black">{destinatario.nombre}</td><td className="border p-1">{destinatario.email || "Sin email cargado"}</td><td className="border p-1 font-black">{destinatario.estado}</td><td className="border p-1 text-[#743c3c]">{destinatario.error || "—"}</td><td className="border p-1">{destinatario.fechaHora ? new Date(destinatario.fechaHora).toLocaleString("es-AR") : "—"}</td><td className="border p-1">{destinatario.providerMessageId || destinatario.resendId || "—"}</td><td className="border p-1"><button onClick={() => ejecutarEnvioReporte(datosHub.clientesIngresos.filter((cliente) => cliente.id === destinatario.id && emailValido(cliente.email)).map((cliente) => ({ ...cliente, grupo: "cliente" as const })))} disabled={estadoEnvio === "enviando" || !emailValido(destinatario.email)} className="rounded border border-[#cfd8c6] px-2 py-1 font-black disabled:opacity-50">Reenviar</button></td></tr>)}</tbody></table></div></div>}
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Paso 2 — Revisar resumen</h3>
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
                <div id="paso-gastos" className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Paso 3 — Gastos reales del día</h3><p className="mb-2 text-xs font-bold text-[#66745c]">Los gastos son valores reales del día. No cargues acá parámetros del Hub.</p>{datosHub.gastos.length === 0 && <p className="mb-2 rounded-lg bg-[#f8faf5] p-2 text-xs font-black text-[#66745c]">No se registraron gastos adicionales en este reporte.</p>}<table className="w-full border-collapse text-xs"><tbody>{datosHub.gastos.map((gasto, index) => <tr key={`gasto-${gasto.id}-${index}`}><td className="border p-1">{inputTexto(gasto.concepto, (valor) => actualizarGasto(gasto.id, { concepto: valor }), "min-w-28")}</td><td className="border p-1">{inputNumero(gasto.importe, (valor) => actualizarGasto(gasto.id, { importe: valor }))}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ gastos: datosHub.gastos.filter((fila) => fila.id !== gasto.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table><button onClick={() => actualizarDatosHub({ gastos: [...datosHub.gastos, { id: crearId(), concepto: "", importe: 0 }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar gasto</button></div>
              </div>
              <div className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Paso 4 — Estimado de distribución</h3><p className="mb-2 text-xs font-bold text-[#66745c]">Calculadora interna editable para simular cómo se puede distribuir el saldo. No es una liquidación definitiva.</p><div className="mb-2 grid gap-2 text-xs sm:grid-cols-3"><div className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2"><p className="font-black text-[#66745c]">Saldo distribuible</p><p className="font-black">{formatoMoneda(totalADistribuir)}</p></div><div className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2"><p className="font-black text-[#66745c]">Total de puntos</p><p className="font-black">{totalParticipacion.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p></div><div className="rounded-lg border border-[#cfd8c6] bg-[#f8faf5] p-2"><p className="font-black text-[#66745c]">Total estimado distribuido</p><p className="font-black">{formatoMoneda(totalDistribuido)}</p></div></div><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Nombre</th><th className="border p-1">Rol</th><th className="border p-1">Participación</th><th className="border p-1">Estimado</th><th className="border p-1"></th></tr></thead><tbody>{distribucionCalculada.map((actor, index) => <tr key={`actor-${actor.id}-${index}`}><td className="border p-1">{inputTexto(actor.nombre, (valor) => actualizarActor(actor.id, { nombre: valor }), "min-w-32")}</td><td className="border p-1">{inputTexto(actor.rol || "", (valor) => actualizarActor(actor.id, { rol: valor }), "min-w-32")}</td><td className="border p-1">{inputNumero(actor.participacion, (valor) => actualizarActor(actor.id, { participacion: valor }))}</td><td className="border p-1 text-right font-black">{formatoMoneda(actor.importeDistribuido)}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ actores: datosHub.actores.filter((item) => item.id !== actor.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div><button onClick={() => actualizarDatosHub({ actores: [...datosHub.actores, { id: crearId(), nombre: "", rol: "Integrante", activo: true, participacion: 1, ajusteManual: 0, participaDistribucion: true, recibeReportes: true }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar integrante</button></div>
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Datos operativos</h3><div className="grid gap-2 lg:grid-cols-3"><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Tiempo efectivo por operario<input value={datosHub.resumen.tiempoEfectivo} onChange={(e) => actualizarResumen({ tiempoEfectivo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Estado operativo<input value={datosHub.resumen.estadoOperativo} onChange={(e) => actualizarResumen({ estadoOperativo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Observación general<input value={datosHub.resumen.observacionGeneral} onChange={(e) => actualizarResumen({ observacionGeneral: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label></div></section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
              <h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Paso 5 — Destinatarios</h3>
              <p className="mb-2 text-xs font-bold text-[#66745c]">Elegí exactamente quién recibirá este reporte. Solo se envía a quienes están marcados.</p>
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#d8dfd1] bg-[#f8faf5] p-2 text-xs"><span className="font-black">Seleccionados: {destinatariosSeleccionadosReporte.length} personas</span><button onClick={seleccionarTodosClientesConEmailValidoReporte} className="h-7 rounded-md border border-[#cfd8c6] bg-white px-2 font-black">Seleccionar clientes</button><button onClick={seleccionarTodosActoresConEmailValidoReporte} className="h-7 rounded-md border border-[#cfd8c6] bg-white px-2 font-black">Seleccionar Hub Operativo</button><button onClick={seleccionarTodosDestinatariosConEmailValidoReporte} className="h-7 rounded-md border border-[#cfd8c6] bg-white px-2 font-black">Seleccionar todos con email válido</button><button onClick={desmarcarTodosClientesReporte} className="h-7 rounded-md border border-[#cfd8c6] bg-white px-2 font-black">Desmarcar todos</button></div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div><h4 className="mb-1 text-xs font-black">Clientes del Hub</h4><div className="max-h-48 overflow-auto rounded-lg border border-[#d8dfd1] bg-white p-2 text-xs">{datosHub.clientesIngresos.map((cliente, index) => { const tieneEmailValido = emailValido(cliente.email); const seleccionadoReporte = clientesReporteSeleccionados.includes(cliente.id) && tieneEmailValido; return <label key={`dest-cliente-${cliente.id}-${index}`} className="flex items-center justify-between gap-2 border-b border-[#eef1e9] py-1 last:border-b-0"><span className="font-bold">{cliente.nombre || `Cliente ${index + 1}`}<span className="block font-semibold text-[#66745c]">{cliente.email || "Sin email cargado"}</span></span><input type="checkbox" checked={seleccionadoReporte} disabled={!tieneEmailValido} onChange={(e) => actualizarSeleccionReporte(cliente.id, e.target.checked)} /></label>; })}</div></div>
                <div><h4 className="mb-1 text-xs font-black">Hub Operativo</h4><div className="max-h-48 overflow-auto rounded-lg border border-[#d8dfd1] bg-white p-2 text-xs">{distribucionCalculada.map((actor, index) => { const tieneEmailValido = emailValido(actor.email || ""); return <label key={`dest-actor-${actor.id}-${index}`} className="flex items-center justify-between gap-2 border-b border-[#eef1e9] py-1 last:border-b-0"><span className="font-bold">{actor.nombre || `Actor ${index + 1}`}<span className="block font-semibold text-[#66745c]">{actor.rol || "Rol operativo"} · {actor.email || "Sin email cargado"}</span></span><input type="checkbox" checked={actoresReporteSeleccionados.includes(actor.id) && tieneEmailValido} disabled={!tieneEmailValido} onChange={(e) => actualizarSeleccionActorReporte(actor.id, e.target.checked)} /></label>; })}</div></div>
              </div>
              <div className="mt-2 rounded-lg bg-[#f8faf5] p-2 text-xs"><p className="font-black">Lista exacta antes de enviar:</p><p className="font-semibold text-[#66745c]">{destinatariosSeleccionadosReporte.length === 0 ? "Todavía no hay destinatarios marcados." : destinatariosSeleccionadosReporte.map((d) => `${d.nombre || "Sin nombre"} <${d.email}>`).join(" · ")}</p></div>
            </section>
          </div>

          <aside className="space-y-3">
          <section className="border border-[#b9c5ae] bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#d8dfd1] pb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Paso 6 — Revisar distribución y enviar</p>
                <h2 className="text-lg font-black">{tituloReporteHub}</h2>
                <p className="text-xs font-bold text-[#66745c]">La imagen generada usa este informe amable, claro y confiable.</p>
                <p className={`mt-1 text-xs font-black ${estadoEnvio === "error" ? "text-[#743c3c]" : estadoEnvio === "enviado" ? "text-[#2f6d32]" : "text-[#66745c]"}`}>{mensajeEnvio}</p>
              </div>
              <div className="flex flex-wrap gap-2"><button onClick={() => guardarBorradorHub()} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black text-[#1f2a1d]">Guardar borrador</button><button onClick={enviarReporteASeleccionados} disabled={estadoEnvio === "enviando" || destinatariosSeleccionadosReporte.length === 0} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white disabled:opacity-50">Enviar reporte</button><button onClick={descargarImagenReporte} className="h-8 rounded-lg bg-[#5d7032] px-3 text-xs font-black text-white">Generar imagen</button><details className="relative"><summary className="h-8 cursor-pointer rounded-lg border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">Más opciones</summary><div className="absolute right-0 z-10 mt-2 grid min-w-44 gap-1 rounded-lg border border-[#cfd8c6] bg-white p-2 shadow-lg"><button onClick={() => copiarTexto(reporteTexto, "Reporte")} className="rounded-md px-2 py-1 text-left text-xs font-black text-[#1f2a1d]">Copiar reporte</button><button onClick={enviarPruebaReporte} disabled={estadoEnvio === "enviando"} className="rounded-md px-2 py-1 text-left text-xs font-black text-[#1f2a1d] disabled:opacity-50">Enviar prueba</button></div></details></div>
            </div>

            <div ref={reporteVisualRef} className="w-full overflow-hidden rounded-[28px] bg-[#fbfdf8]" dangerouslySetInnerHTML={{ __html: reporteHtml }} />
          </section>

          <details className="rounded-xl border border-[#1f2a1d] bg-[#1f2a1d] p-3 text-white shadow-sm"><summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Mail corto para enviar con el documento</summary><div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><select value={datosHub.clienteActivoId} onChange={(e) => actualizarDatosHub({ clienteActivoId: Number(e.target.value) })} className="h-8 rounded-lg bg-white px-2 text-sm font-semibold text-[#182018]">{datosHub.clientesIngresos.map((cliente, index) => <option key={`cliente-activo-${cliente.id}-${index}`} value={cliente.id}>{cliente.nombre || "Sin cliente"}</option>)}</select><button onClick={() => copiarTexto(emailPrivado, "Email privado")} className="h-8 rounded-lg bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar texto del mail</button></div><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white/10 p-3 text-xs leading-5">{emailPrivado}</pre></details>
          <details className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><summary className="cursor-pointer text-sm font-black text-[#1f2a1d]">Ver reportes anteriores</summary>
          <section className="mt-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Historial de reportes del Hub</p><h2 className="text-lg font-black">{jornada.hub}</h2><p className="text-xs font-bold text-[#66745c]">Bandejas separadas: borradores de trabajo e historial guardado.</p></div>
              <details className="relative"><summary className="cursor-pointer rounded-lg border border-[#cfd8c6] px-3 py-2 text-xs font-black">Más opciones</summary><div className="absolute right-0 z-10 mt-2 grid min-w-48 gap-1 rounded-lg border border-[#cfd8c6] bg-white p-2 shadow-lg"><button onClick={crearNuevoReporteHub} className="rounded-md px-2 py-1 text-left text-xs font-black">Crear nuevo reporte</button><button onClick={() => guardarResumenHub("GUARDADO")} className="rounded-md px-2 py-1 text-left text-xs font-black">Guardar definitivo</button></div></details>
            </div>
            <div className="mb-3 flex gap-2"><button onClick={() => setBandejaReportes("borradores")} className={`rounded-lg px-3 py-2 text-xs font-black ${bandejaReportes === "borradores" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-[#f8faf5]"}`}>Borradores ({borradoresDelHub.length})</button><button onClick={() => setBandejaReportes("guardados")} className={`rounded-lg px-3 py-2 text-xs font-black ${bandejaReportes === "guardados" ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-[#f8faf5]"}`}>Guardados ({resumenesDelHub.length})</button></div>
            <div className="overflow-x-auto rounded-lg border border-[#d8dfd1]">
              {bandejaReportes === "borradores" ? <table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1.5">Fecha</th><th className="border p-1.5">Nombre del reporte</th><th className="border p-1.5 text-right">Clientes</th><th className="border p-1.5 text-right">Total facturado</th><th className="border p-1.5">Estado</th><th className="border p-1.5">Última edición</th><th className="border p-1.5">Acciones</th></tr></thead><tbody>{borradoresDelHub.length === 0 ? <tr><td colSpan={7} className="border p-3 text-center font-bold text-[#66745c]">Todavía no hay borradores para {jornada.hub}.</td></tr> : borradoresDelHub.map((resumen, index) => <tr key={`borrador-${resumen.id}-${index}`}><td className="border p-1.5 font-semibold">{formatoFecha(resumen.fecha)}</td><td className="border p-1.5 font-bold">{resumen.nombre}</td><td className="border p-1.5 text-right font-black">{resumen.datos.clientesIngresos.length}</td><td className="border p-1.5 text-right font-black">{formatoMoneda(resumen.totales.totalFacturado)}</td><td className="border p-1.5 font-black text-[#8a6a16]">BORRADOR</td><td className="border p-1.5">{new Date(resumen.ultimaEdicion || resumen.guardadoEn).toLocaleString("es-AR")}</td><td className="border p-1.5"><div className="flex flex-wrap gap-1"><button onClick={() => abrirResumenHub(resumen)} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Continuar editando</button><button onClick={() => cerrarBorradorHub(resumen, "ENVIADO")} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Enviar</button><button onClick={() => cerrarBorradorHub(resumen, "GUARDADO")} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Guardar como definitivo</button><button onClick={() => eliminarResumenHub(resumen)} className="h-7 rounded-md border border-[#d6b7b7] bg-[#fff7f7] px-2 text-[11px] font-black text-[#743c3c]">Eliminar</button></div></td></tr>)}</tbody></table> : <table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1.5">Fecha</th><th className="border p-1.5">Nombre del reporte</th><th className="border p-1.5 text-right">Clientes</th><th className="border p-1.5 text-right">Facturado</th><th className="border p-1.5 text-right">Gastos</th><th className="border p-1.5 text-right">A distribuir</th><th className="border p-1.5">Estado</th><th className="border p-1.5">Envío</th><th className="border p-1.5">Acciones</th></tr></thead><tbody>{resumenesDelHub.length === 0 ? <tr><td colSpan={9} className="border p-3 text-center font-bold text-[#66745c]">Todavía no hay reportes guardados para {jornada.hub}.</td></tr> : resumenesDelHub.map((resumen, index) => <tr key={`resumen-${resumen.id}-${index}`}><td className="border p-1.5 font-semibold">{formatoFecha(resumen.fecha)}</td><td className="border p-1.5 font-bold">{resumen.nombre}</td><td className="border p-1.5 text-right font-black">{resumen.datos.clientesIngresos.length}</td><td className="border p-1.5 text-right font-black">{formatoMoneda(resumen.totales.totalFacturado)}</td><td className="border p-1.5 text-right font-black">{formatoMoneda(resumen.totales.totalGastos)}</td><td className="border p-1.5 text-right font-black">{formatoMoneda(resumen.totales.totalADistribuir)}</td><td className="border p-1.5 font-black">{resumen.estado || "GUARDADO"}</td><td className="border p-1.5">{resumen.fechaEnvio ? new Date(resumen.fechaEnvio).toLocaleString("es-AR") : "—"}</td><td className="border p-1.5"><div className="flex flex-wrap gap-1"><button onClick={() => abrirResumenHub(resumen)} className="h-7 rounded-md bg-[#1f2a1d] px-2 text-[11px] font-black text-white">Ver reporte</button><button onClick={() => guardarResumenHub("ENVIADO")} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Reenviar</button><button onClick={() => copiarTexto(resumen.reporteTexto || reporteTexto, "Reporte guardado")} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Copiar</button><button onClick={descargarImagenReporte} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Descargar imagen</button><button onClick={() => duplicarResumenHub(resumen)} className="h-7 rounded-md border border-[#cfd8c6] px-2 text-[11px] font-black">Duplicar como nuevo borrador</button></div></td></tr>)}</tbody></table>}
            </div>
          </section>
          </details>

        </aside>
        </section>}
      </section>
    </main>
  );
}
