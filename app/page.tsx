"use client";

import { useCallback, useMemo, useState } from "react";

type CampoNumerico = number | "";

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  tiempoTrabajado: CampoNumerico;
  valorTiempo: CampoNumerico;
  comisionCapataz: CampoNumerico;
  maquinaria: CampoNumerico;
  naftaAceite: CampoNumerico;
  transporteMovilidad: CampoNumerico;
  softwareJardinerosYa: CampoNumerico;
  otros: CampoNumerico;
  totalCliente: CampoNumerico;
  trabajoRealizado: string;
  trabajoPendiente: string;
};

type ResumenHubManual = {
  totalFacturadoHub: CampoNumerico;
  totalTiempoTrabajado: CampoNumerico;
  totalValorTiempo: CampoNumerico;
  totalComisionCapataz: CampoNumerico;
  totalMaquinaria: CampoNumerico;
  totalNaftaAceite: CampoNumerico;
  totalTransporteMovilidad: CampoNumerico;
  totalSoftwareJardinerosYa: CampoNumerico;
  totalOtros: CampoNumerico;
  observacionGeneral: string;
};

type HubDisponible = (typeof HUBS_DISPONIBLES)[number];
type ClientesPorHub = Record<HubDisponible, Cliente[]>;
type ResumenesPorHub = Record<HubDisponible, ResumenHubManual>;

type JornadaOperativa = {
  hub: HubDisponible;
  fecha: string;
  clientesPorHub: ClientesPorHub;
  resumenesPorHub: ResumenesPorHub;
  clienteActivoId: number;
};

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";

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
const observacionGeneralInicial = "Resumen cargado manualmente. Sin cálculos automáticos.";

function clienteInicial(id: number, nombre: string): Cliente {
  return {
    id,
    nombre,
    email: "",
    tiempoTrabajado: 0,
    valorTiempo: 0,
    comisionCapataz: 0,
    maquinaria: 0,
    naftaAceite: 0,
    transporteMovilidad: 0,
    softwareJardinerosYa: 0,
    otros: 0,
    totalCliente: 0,
    trabajoRealizado: trabajoRealizadoInicial,
    trabajoPendiente: trabajoPendienteInicial,
  };
}

function resumenInicial(): ResumenHubManual {
  return {
    totalFacturadoHub: 0,
    totalTiempoTrabajado: 0,
    totalValorTiempo: 0,
    totalComisionCapataz: 0,
    totalMaquinaria: 0,
    totalNaftaAceite: 0,
    totalTransporteMovilidad: 0,
    totalSoftwareJardinerosYa: 0,
    totalOtros: 0,
    observacionGeneral: observacionGeneralInicial,
  };
}

const clientesInicialesPorHub: ClientesPorHub = {
  "Hub Tipal": [clienteInicial(101, "Carolina Yovi"), clienteInicial(102, "Gabriela Aguiar"), clienteInicial(103, "Fleming")],
  "Hub Punto": [],
  "Hub Praderas": [
    clienteInicial(301, "Milagros Carrizo"),
    clienteInicial(302, "Florencia Siufi"),
    clienteInicial(303, "Celeste Recamán"),
    clienteInicial(304, "Verónica Burgos"),
    clienteInicial(305, "Andrés Jaraba"),
    clienteInicial(306, "Javier Astudillo"),
    clienteInicial(307, "María del Mar"),
  ],
  "Hub Valle Escondido": [],
  "Hub Chacras de Santa María": [],
  "Hub La Aguada": [],
  "Hub Prado": [
    clienteInicial(701, "Javier Astudillo"),
    clienteInicial(702, "Mariana Espeche"),
    clienteInicial(703, "Marisa Belmar"),
    clienteInicial(704, "Facundo Quintana"),
    clienteInicial(705, "Guido Alonso"),
  ],
  "Hub La Reserva": [],
};

const resumenesInicialesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, resumenInicial()])) as ResumenesPorHub;

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  clientesPorHub: clientesInicialesPorHub,
  resumenesPorHub: resumenesInicialesPorHub,
  clienteActivoId: 101,
};

function formatoMoneda(valor: CampoNumerico | undefined) {
  return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoValor(valor: CampoNumerico | undefined, sufijo = "") {
  return `${valor === "" || valor === undefined ? 0 : valor}${sufijo}`;
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR");
}

function crearId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizarNumero(valor: string): CampoNumerico {
  return valor === "" ? "" : Number(valor);
}

function normalizarCliente(cliente: Partial<Cliente> & { importeCobrado?: CampoNumerico; tiempoTrabajadoHoras?: CampoNumerico; adicionalMaquinaria?: CampoNumerico; adicionalNaftaAceite?: CampoNumerico; otrosVariables?: CampoNumerico }): Cliente {
  return {
    id: cliente.id || crearId(),
    nombre: cliente.nombre || "",
    email: cliente.email || "",
    tiempoTrabajado: cliente.tiempoTrabajado ?? cliente.tiempoTrabajadoHoras ?? 0,
    valorTiempo: cliente.valorTiempo ?? 0,
    comisionCapataz: cliente.comisionCapataz ?? 0,
    maquinaria: cliente.maquinaria ?? cliente.adicionalMaquinaria ?? 0,
    naftaAceite: cliente.naftaAceite ?? cliente.adicionalNaftaAceite ?? 0,
    transporteMovilidad: cliente.transporteMovilidad ?? 0,
    softwareJardinerosYa: cliente.softwareJardinerosYa ?? 0,
    otros: cliente.otros ?? cliente.otrosVariables ?? cliente.importeCobrado ?? 0,
    totalCliente: cliente.totalCliente ?? 0,
    trabajoRealizado: cliente.trabajoRealizado || trabajoRealizadoInicial,
    trabajoPendiente: cliente.trabajoPendiente || trabajoPendienteInicial,
  };
}

function normalizarResumen(resumen?: Partial<ResumenHubManual>): ResumenHubManual {
  return {
    totalFacturadoHub: resumen?.totalFacturadoHub ?? 0,
    totalTiempoTrabajado: resumen?.totalTiempoTrabajado ?? 0,
    totalValorTiempo: resumen?.totalValorTiempo ?? 0,
    totalComisionCapataz: resumen?.totalComisionCapataz ?? 0,
    totalMaquinaria: resumen?.totalMaquinaria ?? 0,
    totalNaftaAceite: resumen?.totalNaftaAceite ?? 0,
    totalTransporteMovilidad: resumen?.totalTransporteMovilidad ?? 0,
    totalSoftwareJardinerosYa: resumen?.totalSoftwareJardinerosYa ?? 0,
    totalOtros: resumen?.totalOtros ?? 0,
    observacionGeneral: resumen?.observacionGeneral || observacionGeneralInicial,
  };
}

function normalizarClientesPorHub(jornada: Partial<JornadaOperativa> & { clientes?: Cliente[] }, hub: HubDisponible): ClientesPorHub {
  const base = Object.fromEntries(HUBS_DISPONIBLES.map((hubDisponible) => [hubDisponible, clientesInicialesPorHub[hubDisponible].map((cliente) => ({ ...cliente }))])) as ClientesPorHub;

  if (jornada.clientesPorHub) {
    HUBS_DISPONIBLES.forEach((hubDisponible) => {
      base[hubDisponible] = (jornada.clientesPorHub?.[hubDisponible] || []).map(normalizarCliente);
    });
  } else if (jornada.clientes) {
    base[hub] = jornada.clientes.map(normalizarCliente);
  }

  return base;
}

function normalizarResumenesPorHub(jornada: Partial<JornadaOperativa>): ResumenesPorHub {
  return Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, normalizarResumen(jornada.resumenesPorHub?.[hub])])) as ResumenesPorHub;
}

function normalizarJornada(jornada: Partial<JornadaOperativa> & { clientes?: Cliente[] }): JornadaOperativa {
  const hubNormalizado = HUBS_DISPONIBLES.includes(jornada.hub as HubDisponible) ? (jornada.hub as HubDisponible) : jornadaInicial.hub;
  const clientesPorHub = normalizarClientesPorHub(jornada, hubNormalizado);
  const clientesDelHub = clientesPorHub[hubNormalizado];

  return {
    hub: hubNormalizado,
    fecha: jornada.fecha || jornadaInicial.fecha,
    clientesPorHub,
    resumenesPorHub: normalizarResumenesPorHub(jornada),
    clienteActivoId: clientesDelHub.some((cliente) => cliente.id === jornada.clienteActivoId) ? Number(jornada.clienteActivoId) : clientesDelHub[0]?.id || 0,
  };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", email: "" });
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");

  const clientesDelHub = useMemo(() => jornada.clientesPorHub[jornada.hub] || [], [jornada.clientesPorHub, jornada.hub]);
  const resumenHub = jornada.resumenesPorHub[jornada.hub];
  const clienteActivo = clientesDelHub.find((cliente) => cliente.id === jornada.clienteActivoId) || clientesDelHub[0];
  const fechaFormateada = formatoFecha(jornada.fecha);

  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((jornadaActual) => {
      const hubNuevo = cambios.hub || jornadaActual.hub;
      const clientesHubNuevo = jornadaActual.clientesPorHub[hubNuevo] || [];
      return {
        ...jornadaActual,
        ...cambios,
        clienteActivoId: cambios.hub && !clientesHubNuevo.some((cliente) => cliente.id === jornadaActual.clienteActivoId) ? clientesHubNuevo[0]?.id || 0 : cambios.clienteActivoId ?? jornadaActual.clienteActivoId,
      };
    });
  }

  function actualizarResumenHub(cambios: Partial<ResumenHubManual>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      resumenesPorHub: {
        ...jornadaActual.resumenesPorHub,
        [jornadaActual.hub]: { ...jornadaActual.resumenesPorHub[jornadaActual.hub], ...cambios },
      },
    }));
  }

  function actualizarCliente(id: number, cambios: Partial<Cliente>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientesPorHub: {
        ...jornadaActual.clientesPorHub,
        [jornadaActual.hub]: jornadaActual.clientesPorHub[jornadaActual.hub].map((cliente) => cliente.id === id ? { ...cliente, ...cambios } : cliente),
      },
    }));
  }

  function guardarJornada() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jornada));
    setMensajeGuardado(`Jornada guardada localmente: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function cargarJornada() {
    const jornadaGuardada = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!jornadaGuardada) {
      setMensajeGuardado("No hay una jornada guardada para cargar");
      return;
    }
    setJornada(normalizarJornada(JSON.parse(jornadaGuardada) as JornadaOperativa));
    setMensajeGuardado("Jornada cargada desde este navegador");
  }

  function limpiarJornada() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setJornada(jornadaInicial);
    setNuevoCliente({ nombre: "", email: "" });
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  function agregarCliente() {
    if (!nuevoCliente.nombre.trim()) return;
    const cliente = normalizarCliente({ id: crearId(), nombre: nuevoCliente.nombre, email: nuevoCliente.email });
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientesPorHub: { ...jornadaActual.clientesPorHub, [jornadaActual.hub]: [...jornadaActual.clientesPorHub[jornadaActual.hub], cliente] },
      clienteActivoId: cliente.id,
    }));
    setNuevoCliente({ nombre: "", email: "" });
  }

  function eliminarCliente(id: number) {
    const cliente = clientesDelHub.find((clienteActual) => clienteActual.id === id);
    if (!window.confirm(`¿Eliminar ${cliente?.nombre || "este cliente"} del ${jornada.hub}?`)) return;
    setJornada((jornadaActual) => {
      const clientes = jornadaActual.clientesPorHub[jornadaActual.hub].filter((clienteActual) => clienteActual.id !== id);
      return { ...jornadaActual, clientesPorHub: { ...jornadaActual.clientesPorHub, [jornadaActual.hub]: clientes }, clienteActivoId: jornadaActual.clienteActivoId === id ? clientes[0]?.id || 0 : jornadaActual.clienteActivoId };
    });
  }

  const nombrePrivado = useCallback((cliente: Cliente, index: number) => cliente.id === clienteActivo?.id ? cliente.nombre : `Cliente ${index + 1}`, [clienteActivo?.id]);

  const emailPrivado = useMemo(() => {
    const lineasClientes = clientesDelHub.map((cliente, index) => `- ${nombrePrivado(cliente, index)}: ${formatoMoneda(cliente.totalCliente)}`);

    return [
      "Reporte diario HubYa",
      `Hub: ${jornada.hub}`,
      `Fecha: ${fechaFormateada}`,
      `Cliente: ${clienteActivo?.nombre || "cliente"}`,
      `Importe correspondiente a su espacio verde: ${formatoMoneda(clienteActivo?.totalCliente)}`,
      "",
      `Tiempo trabajado: ${formatoValor(clienteActivo?.tiempoTrabajado, " h")}`,
      `Valor del tiempo: ${formatoMoneda(clienteActivo?.valorTiempo)}`,
      `Comisión del capataz: ${formatoMoneda(clienteActivo?.comisionCapataz)}`,
      `Maquinaria: ${formatoMoneda(clienteActivo?.maquinaria)}`,
      `Nafta / aceite: ${formatoMoneda(clienteActivo?.naftaAceite)}`,
      `Transporte / movilidad: ${formatoMoneda(clienteActivo?.transporteMovilidad)}`,
      `Software JardinerosYa: ${formatoMoneda(clienteActivo?.softwareJardinerosYa)}`,
      `Otros: ${formatoMoneda(clienteActivo?.otros)}`,
      `Total: ${formatoMoneda(clienteActivo?.totalCliente)}`,
      "",
      `Trabajo realizado: ${clienteActivo?.trabajoRealizado || ""}`,
      `Trabajo pendiente: ${clienteActivo?.trabajoPendiente || ""}`,
      "",
      "Detalle ampliado del Hub",
      "Participantes del Hub con privacidad:",
      ...lineasClientes,
      `Total facturado del Hub: ${formatoMoneda(resumenHub.totalFacturadoHub)}`,
      `Total tiempo trabajado: ${formatoValor(resumenHub.totalTiempoTrabajado, " h")}`,
      `Total valor tiempo: ${formatoMoneda(resumenHub.totalValorTiempo)}`,
      `Total comisión capataz: ${formatoMoneda(resumenHub.totalComisionCapataz)}`,
      `Total maquinaria: ${formatoMoneda(resumenHub.totalMaquinaria)}`,
      `Total nafta / aceite: ${formatoMoneda(resumenHub.totalNaftaAceite)}`,
      `Total transporte / movilidad: ${formatoMoneda(resumenHub.totalTransporteMovilidad)}`,
      `Total software JardinerosYa: ${formatoMoneda(resumenHub.totalSoftwareJardinerosYa)}`,
      `Total otros: ${formatoMoneda(resumenHub.totalOtros)}`,
      `Observación general: ${resumenHub.observacionGeneral}`,
      "",
      "Por privacidad, los demás clientes figuran anonimizados y no se muestran emails de otros clientes.",
      "",
      "Saludos,",
      "HubYa",
    ].join("\n");
  }, [clienteActivo, clientesDelHub, fechaFormateada, jornada.hub, nombrePrivado, resumenHub]);

  async function copiarEmail() {
    await navigator.clipboard.writeText(emailPrivado);
    setMensajeGuardado(`Email copiado: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  const campoNumeroCliente = (cliente: Cliente, campo: keyof Pick<Cliente, "tiempoTrabajado" | "valorTiempo" | "comisionCapataz" | "maquinaria" | "naftaAceite" | "transporteMovilidad" | "softwareJardinerosYa" | "otros" | "totalCliente">, ancho = "w-20") => (
    <input type="number" min="0" step="0.25" value={cliente[campo]} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { [campo]: normalizarNumero(e.target.value) })} className={`h-7 ${ancho} bg-transparent px-1 text-right outline-none`} />
  );

  const campoNumeroResumen = (campo: keyof Omit<ResumenHubManual, "observacionGeneral">, etiqueta: string) => (
    <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">
      {etiqueta}
      <input type="number" min="0" step="0.25" value={resumenHub[campo]} onChange={(e) => actualizarResumenHub({ [campo]: normalizarNumero(e.target.value) })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" />
    </label>
  );

  return (
    <main className="min-h-screen bg-[#eef2e8] text-[#182018]">
      <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
        <header className="sticky top-0 z-20 mb-3 rounded-2xl border border-[#cfd8c6] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-2 xl:grid-cols-[1.1fr_1fr_1fr_auto] xl:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo · planilla manual</p><h1 className="text-xl font-black leading-tight">Reporte diario — {jornada.hub} — {fechaFormateada}</h1></div>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value as HubDisponible })} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none">{HUBS_DISPONIBLES.map((hub) => <option key={hub} value={hub}>{hub}</option>)}</select></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" /></label>
            <div className="flex flex-wrap gap-1.5 xl:justify-end"><button onClick={guardarJornada} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar</button><button onClick={cargarJornada} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cargar</button><button onClick={limpiarJornada} className="h-8 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-3 text-xs font-black text-[#743c3c]">Limpiar</button></div>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado} · Todos los importes y totales se cargan manualmente.</p>
        </header>

        <section className="mb-3 rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide">Resumen manual del Hub</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
            {campoNumeroResumen("totalFacturadoHub", "Total facturado")}
            {campoNumeroResumen("totalTiempoTrabajado", "Total tiempo")}
            {campoNumeroResumen("totalValorTiempo", "Total valor tiempo")}
            {campoNumeroResumen("totalComisionCapataz", "Total comisión")}
            {campoNumeroResumen("totalMaquinaria", "Total maquinaria")}
            {campoNumeroResumen("totalNaftaAceite", "Total nafta/aceite")}
            {campoNumeroResumen("totalTransporteMovilidad", "Total transporte")}
            {campoNumeroResumen("totalSoftwareJardinerosYa", "Total software")}
            {campoNumeroResumen("totalOtros", "Total otros")}
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c] md:col-span-2 xl:col-span-1">Observación general<input value={resumenHub.observacionGeneral} onChange={(e) => actualizarResumenHub({ observacionGeneral: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm normal-case outline-none" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-sm font-black uppercase tracking-wide">Clientes del Hub</h2><span className="text-xs font-bold text-[#66745c]">{clientesDelHub.length} clientes · edición rápida en línea</span></div>
          <div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Cliente</th><th className="border p-1">Email</th><th className="border p-1">Tiempo</th><th className="border p-1">Valor tiempo</th><th className="border p-1">Comisión capataz</th><th className="border p-1">Maquinaria</th><th className="border p-1">Nafta/Aceite</th><th className="border p-1">Transporte</th><th className="border p-1">Software</th><th className="border p-1">Otros</th><th className="border p-1">Total</th><th className="border p-1">Seleccionar para email</th><th className="border p-1"></th></tr></thead><tbody>{clientesDelHub.map((cliente) => <tr key={cliente.id} className={cliente.id === jornada.clienteActivoId ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1"><input value={cliente.nombre} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { nombre: e.target.value })} className="h-7 min-w-36 bg-transparent px-1 outline-none" /></td><td className="border border-[#e1e6dc] p-1"><input value={cliente.email} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { email: e.target.value })} className="h-7 min-w-40 bg-transparent px-1 outline-none" /></td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "tiempoTrabajado", "w-16")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "valorTiempo")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "comisionCapataz")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "maquinaria")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "naftaAceite")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "transporteMovilidad")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "softwareJardinerosYa")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "otros")}</td><td className="border border-[#e1e6dc] p-1">{campoNumeroCliente(cliente, "totalCliente", "w-24")}</td><td className="border border-[#e1e6dc] p-1 text-center"><input type="radio" name="clienteActivo" checked={cliente.id === jornada.clienteActivoId} onChange={() => actualizarJornada({ clienteActivoId: cliente.id })} /></td><td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => eliminarCliente(cliente.id)} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div>
          <div className="mt-2 grid gap-1 md:grid-cols-[1fr_1fr_78px]"><input placeholder="Nombre" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><input placeholder="Email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><button onClick={agregarCliente} className="h-8 rounded-lg bg-[#1f2a1d] text-xs font-black text-white">Agregar</button></div>
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h2 className="mb-2 text-sm font-black uppercase tracking-wide">Trabajo del cliente seleccionado</h2><div className="grid gap-2 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold">Realizado<textarea value={clienteActivo?.trabajoRealizado || ""} onChange={(e) => clienteActivo && actualizarCliente(clienteActivo.id, { trabajoRealizado: e.target.value })} className="min-h-24 rounded-lg border px-2 py-1 text-sm outline-none" /></label><label className="grid gap-1 text-xs font-bold">Pendiente<textarea value={clienteActivo?.trabajoPendiente || ""} onChange={(e) => clienteActivo && actualizarCliente(clienteActivo.id, { trabajoPendiente: e.target.value })} className="min-h-24 rounded-lg border px-2 py-1 text-sm outline-none" /></label></div></div>
          <details className="rounded-2xl border border-[#1f2a1d] bg-[#1f2a1d] p-3 text-white shadow-sm"><summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Ver email privado</summary><div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><select value={jornada.clienteActivoId} onChange={(e) => actualizarJornada({ clienteActivoId: Number(e.target.value) })} className="h-8 rounded-lg bg-white px-2 text-sm font-semibold text-[#182018]">{clientesDelHub.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}</select><button onClick={copiarEmail} className="h-8 rounded-lg bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar email</button></div><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-white/10 p-3 text-xs leading-5">{emailPrivado}</pre></details>
        </section>
      </section>
    </main>
  );
}
