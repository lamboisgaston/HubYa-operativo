"use client";

import { useMemo, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  importeCobrado: number | "";
};

type MovimientoEconomico = {
  id: number;
  concepto: string;
  importe: number | "";
};

type Participante = {
  id: number;
  nombre: string;
  activo: boolean;
};

type CalculosDerivados = {
  totalFacturado: number;
  totalGastos: number;
  saldoDisponible: number;
  cantidadParticipantesActivos: number;
  pagoEquitativo: number;
  pagosParticipantes: { id: number; nombre: string; activo: boolean; pagoParticipante: number }[];
};

type HubDisponible = (typeof HUBS_DISPONIBLES)[number];

type ClientesPorHub = Record<HubDisponible, Cliente[]>;

type JornadaOperativa = {
  hub: HubDisponible;
  fecha: string;
  nombreReporte: string;
  estadoOperativo: string;
  trabajoRealizado: string;
  trabajoPendiente: string;
  clientesPorHub: ClientesPorHub;
  gastosJornada: MovimientoEconomico[];
  participantes: Participante[];
  clienteActivoId: number;
  calculosDerivados?: CalculosDerivados;
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

function clienteInicial(id: number, nombre: string): Cliente {
  return { id, nombre, email: "", importeCobrado: 0 };
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

const gastosJornadaIniciales: MovimientoEconomico[] = [
  { id: 1, concepto: "Nafta", importe: 20000 },
  { id: 2, concepto: "Maquinaria", importe: 1000 },
  { id: 3, concepto: "Tanza", importe: 10000 },
  { id: 4, concepto: "JardinerosYa", importe: 15000 },
  { id: 5, concepto: "Comisión capataz", importe: 14000 },
];

const participantesIniciales: Participante[] = [
  { id: 1, nombre: "Hernán Llanes", activo: true },
  { id: 2, nombre: "Armando Castillo", activo: true },
  { id: 3, nombre: "Mauricio Vallejos", activo: true },
];

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  nombreReporte: "Reporte económico operativo — Hub Tipal",
  estadoOperativo: "Jornada completada sin incidentes. Pendiente validación final de distribución.",
  trabajoRealizado: "Mantenimiento integral de espacios verdes, corte, bordes y limpieza general.",
  trabajoPendiente: "Validación final con cada cliente y próximos repasos programados.",
  clientesPorHub: clientesInicialesPorHub,
  gastosJornada: gastosJornadaIniciales,
  participantes: participantesIniciales,
  clienteActivoId: 101,
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}


function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) return fecha;

  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR");
}

function crearId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function numeroSeguro(valor: number | "" | undefined) {
  return Number(valor || 0);
}

function normalizarImporte(valor: string) {
  return valor === "" ? "" : Number(valor);
}

function calcularJornada(jornada: JornadaOperativa, clientes: Cliente[]): CalculosDerivados {
  const totalFacturado = clientes.reduce(
    (total, cliente) => total + numeroSeguro(cliente.importeCobrado),
    0,
  );
  const totalGastos = jornada.gastosJornada.reduce(
    (total, gasto) => total + numeroSeguro(gasto.importe),
    0,
  );
  const saldoDisponible = totalFacturado - totalGastos;
  const cantidadParticipantesActivos = jornada.participantes.filter((participante) => participante.activo).length;
  const pagoEquitativo = cantidadParticipantesActivos > 0 ? saldoDisponible / cantidadParticipantesActivos : 0;
  const pagosParticipantes = jornada.participantes.map((participante) => ({
    id: participante.id,
    nombre: participante.nombre,
    activo: participante.activo,
    pagoParticipante: participante.activo ? pagoEquitativo : 0,
  }));

  return {
    totalFacturado,
    totalGastos,
    saldoDisponible,
    cantidadParticipantesActivos,
    pagoEquitativo,
    pagosParticipantes,
  };
}

function normalizarCliente(cliente: Partial<Cliente>): Cliente {
  return {
    id: cliente.id || crearId(),
    nombre: cliente.nombre || "",
    email: cliente.email || "",
    importeCobrado: numeroSeguro(cliente.importeCobrado),
  };
}

function normalizarClientesPorHub(jornada: Partial<JornadaOperativa> & { clientes?: Cliente[] }, hub: HubDisponible): ClientesPorHub {
  const base = Object.fromEntries(
    HUBS_DISPONIBLES.map((hubDisponible) => [
      hubDisponible,
      (clientesInicialesPorHub[hubDisponible] || []).map((cliente) => ({ ...cliente })),
    ]),
  ) as ClientesPorHub;

  if (jornada.clientesPorHub) {
    HUBS_DISPONIBLES.forEach((hubDisponible) => {
      base[hubDisponible] = (jornada.clientesPorHub?.[hubDisponible] || []).map(normalizarCliente);
    });
  } else if (jornada.clientes) {
    base[hub] = jornada.clientes.map(normalizarCliente);
  }

  return base;
}

function normalizarJornada(jornada: Partial<JornadaOperativa> & { clientes?: Cliente[]; gastosComunes?: MovimientoEconomico[]; insumosOperativos?: MovimientoEconomico[]; gastosAdministrativos?: MovimientoEconomico[]; operarios?: { id?: number; nombre?: string; activo?: boolean; horasTrabajadas?: number | "" }[]; distribucionOperarios?: { id?: number; nombre?: string; activo?: boolean; importeAsignado?: number; horasTrabajadas?: number | "" }[]; porcentajeComisionCapataz?: number | ""; tiempoEfectivoPorOperario?: string }): JornadaOperativa {
  const gastosBase = jornada.gastosJornada
    || [
      ...(jornada.insumosOperativos || jornada.gastosComunes || []),
      ...(jornada.gastosAdministrativos || []),
    ];

  const gastosJornada = gastosBase.map((gasto) => ({
    id: gasto.id || crearId(),
    concepto: gasto.concepto || "",
    importe: numeroSeguro(gasto.importe),
  }));

  const comisionExistente = gastosJornada.some((gasto) => gasto.concepto.toLowerCase().includes("comisión capataz"));
  if (!jornada.gastosJornada && !comisionExistente && numeroSeguro(jornada.porcentajeComisionCapataz) > 0) {
    gastosJornada.push({ id: crearId(), concepto: "Comisión capataz", importe: 0 });
  }

  const participantes = (jornada.participantes || jornada.operarios || jornada.distribucionOperarios || []).map((participante) => ({
    id: participante.id || crearId(),
    nombre: participante.nombre || "",
    activo: participante.activo ?? numeroSeguro(participante.horasTrabajadas) > 0,
  }));

  const hubNormalizado: HubDisponible = HUBS_DISPONIBLES.includes(jornada.hub as HubDisponible)
    ? (jornada.hub as HubDisponible)
    : jornadaInicial.hub;
  const clientesPorHub = normalizarClientesPorHub(jornada, hubNormalizado);
  const clientesDelHub = clientesPorHub[hubNormalizado];

  return {
    hub: hubNormalizado,
    fecha: jornada.fecha || jornadaInicial.fecha,
    nombreReporte: jornada.nombreReporte || jornadaInicial.nombreReporte,
    estadoOperativo: jornada.estadoOperativo || jornadaInicial.estadoOperativo,
    trabajoRealizado: jornada.trabajoRealizado || jornadaInicial.trabajoRealizado,
    trabajoPendiente: jornada.trabajoPendiente || jornadaInicial.trabajoPendiente,
    clientesPorHub,
    gastosJornada,
    participantes,
    clienteActivoId: clientesDelHub.some((cliente) => cliente.id === jornada.clienteActivoId)
      ? Number(jornada.clienteActivoId)
      : clientesDelHub[0]?.id || 0,
    calculosDerivados: jornada.calculosDerivados,
  };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", email: "", importeCobrado: "" });
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", importe: "" });
  const [nuevoParticipante, setNuevoParticipante] = useState({ nombre: "", activo: true });
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");

  const clientesDelHub = useMemo(
    () => jornada.clientesPorHub[jornada.hub] || [],
    [jornada.clientesPorHub, jornada.hub],
  );
  const clienteActivo =
    clientesDelHub.find((cliente) => cliente.id === jornada.clienteActivoId) || clientesDelHub[0];

  const calculos = useMemo(() => calcularJornada(jornada, clientesDelHub), [clientesDelHub, jornada]);
  const fechaFormateada = formatoFecha(jornada.fecha);
  const tituloReporteDiario = `Reporte diario — ${jornada.hub} — ${fechaFormateada}`;
  const alertas = useMemo(() => {
    const mensajes: string[] = [];
    if (calculos.cantidadParticipantesActivos === 0) mensajes.push("No hay participantes activos para distribuir el saldo disponible.");
    if (calculos.saldoDisponible < 0) mensajes.push("El saldo disponible es negativo. Revisá el total facturado o los gastos de la jornada.");
    if (jornada.gastosJornada.some((item) => item.importe === "")) mensajes.push("Falta importe en un gasto de la jornada.");
    return mensajes;
  }, [calculos.cantidadParticipantesActivos, calculos.saldoDisponible, jornada.gastosJornada]);

  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((jornadaActual) => {
      const hubNuevo = cambios.hub || jornadaActual.hub;
      const clientesHubNuevo = jornadaActual.clientesPorHub[hubNuevo] || [];

      return {
        ...jornadaActual,
        ...cambios,
        clienteActivoId:
          cambios.hub && !clientesHubNuevo.some((cliente) => cliente.id === jornadaActual.clienteActivoId)
            ? clientesHubNuevo[0]?.id || 0
            : cambios.clienteActivoId ?? jornadaActual.clienteActivoId,
      };
    });
  }

  function actualizarCliente(id: number, cambios: Partial<Cliente>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientesPorHub: {
        ...jornadaActual.clientesPorHub,
        [jornadaActual.hub]: jornadaActual.clientesPorHub[jornadaActual.hub].map((cliente) =>
          cliente.id === id ? { ...cliente, ...cambios } : cliente,
        ),
      },
    }));
  }

  function actualizarGasto(id: number, cambios: Partial<MovimientoEconomico>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosJornada: jornadaActual.gastosJornada.map((gasto) =>
        gasto.id === id ? { ...gasto, ...cambios } : gasto,
      ),
    }));
  }

  function actualizarParticipante(id: number, cambios: Partial<Participante>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      participantes: jornadaActual.participantes.map((participante) =>
        participante.id === id ? { ...participante, ...cambios } : participante,
      ),
    }));
  }

  function aplicarJornada(jornadaNueva: Partial<JornadaOperativa>) {
    setJornada(normalizarJornada(jornadaNueva));
  }

  function guardarJornada() {
    const jornadaConCalculos: JornadaOperativa = { ...jornada, calculosDerivados: calculos };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jornadaConCalculos));
    setMensajeGuardado(`Jornada guardada localmente: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function cargarJornada() {
    const jornadaGuardada = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!jornadaGuardada) {
      setMensajeGuardado("No hay una jornada guardada para cargar");
      return;
    }

    aplicarJornada(JSON.parse(jornadaGuardada) as JornadaOperativa);
    setMensajeGuardado("Jornada cargada desde este navegador");
  }

  function limpiarJornada() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    aplicarJornada(jornadaInicial);
    setNuevoCliente({ nombre: "", email: "", importeCobrado: "" });
    setNuevoGasto({ concepto: "", importe: "" });
    setNuevoParticipante({ nombre: "", activo: true });
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  function agregarCliente() {
    if (!nuevoCliente.nombre.trim()) return;

    const cliente: Cliente = {
      id: crearId(),
      nombre: nuevoCliente.nombre,
      email: nuevoCliente.email,
      importeCobrado: Number(nuevoCliente.importeCobrado || 0),
    };

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientesPorHub: {
        ...jornadaActual.clientesPorHub,
        [jornadaActual.hub]: [...jornadaActual.clientesPorHub[jornadaActual.hub], cliente],
      },
      clienteActivoId: cliente.id,
    }));
    setNuevoCliente({ nombre: "", email: "", importeCobrado: "" });
  }

  function agregarGasto() {
    if (!nuevoGasto.concepto.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosJornada: [
        ...jornadaActual.gastosJornada,
        { id: crearId(), concepto: nuevoGasto.concepto, importe: normalizarImporte(nuevoGasto.importe) },
      ],
    }));
    setNuevoGasto({ concepto: "", importe: "" });
  }

  function agregarParticipante() {
    if (!nuevoParticipante.nombre.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      participantes: [
        ...jornadaActual.participantes,
        { id: crearId(), nombre: nuevoParticipante.nombre, activo: nuevoParticipante.activo },
      ],
    }));
    setNuevoParticipante({ nombre: "", activo: true });
  }

  function eliminarCliente(id: number) {
    const cliente = clientesDelHub.find((clienteActual) => clienteActual.id === id);
    const confirmado = window.confirm(`¿Eliminar ${cliente?.nombre || "este cliente"} del ${jornada.hub}?`);

    if (!confirmado) return;

    setJornada((jornadaActual) => {
      const clientes = jornadaActual.clientesPorHub[jornadaActual.hub].filter((clienteActual) => clienteActual.id !== id);
      return {
        ...jornadaActual,
        clientesPorHub: {
          ...jornadaActual.clientesPorHub,
          [jornadaActual.hub]: clientes,
        },
        clienteActivoId:
          jornadaActual.clienteActivoId === id ? clientes[0]?.id || 0 : jornadaActual.clienteActivoId,
      };
    });
  }

  function eliminarGasto(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosJornada: jornadaActual.gastosJornada.filter((gasto) => gasto.id !== id),
    }));
  }

  function eliminarParticipante(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      participantes: jornadaActual.participantes.filter((participante) => participante.id !== id),
    }));
  }

  function nombrePrivado(cliente: Cliente, index: number) {
    return cliente.id === clienteActivo?.id ? cliente.nombre : `Cliente ${index + 1}`;
  }

  return (
    <main className="min-h-screen bg-[#f4f6f1] text-[#182018]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-[#d8ddcf] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#66745c]">Plataforma Operativa</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">HubYa Operativo</h1>
            <p className="mt-2 text-[#66745c]">{tituloReporteDiario}</p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button onClick={guardarJornada} className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm">Guardar jornada</button>
              <button onClick={cargarJornada} className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm">Cargar jornada</button>
              <button onClick={limpiarJornada} className="rounded-full border border-[#d6b7b7] bg-[#fff7f7] px-4 py-2 text-sm font-bold text-[#743c3c] shadow-sm">Limpiar</button>
            </div>
            <p className="text-xs font-medium text-[#66745c]">{mensajeGuardado}</p>
          </div>
        </header>

        {alertas.length > 0 && (
          <div className="mb-6 rounded-3xl border border-[#f0c978] bg-[#fff8e9] p-5 text-sm font-semibold text-[#7a4a00]">
            <p className="text-base font-bold">Alertas de validación</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {alertas.map((alerta) => <li key={alerta}>{alerta}</li>)}
            </ul>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">1. Datos de la jornada</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Hub
                  <select value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value as HubDisponible })} className="rounded-xl border border-[#d5ddcf] bg-white px-4 py-3 outline-none">
                    {HUBS_DISPONIBLES.map((hub) => <option key={hub} value={hub}>{hub}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">Nombre del reporte<input value={jornada.nombreReporte} onChange={(e) => actualizarJornada({ nombreReporte: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">Estado operativo<input value={jornada.estadoOperativo} onChange={(e) => actualizarJornada({ estadoOperativo: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
              </div>
            </div>



            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">Hubs activos en Salta</h2>
              <p className="mt-2 text-sm text-[#66745c]">Seleccioná el Hub operativo de esta jornada y verificá el resto de Hubs prearmados disponibles.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {HUBS_DISPONIBLES.map((hub) => (
                  <span
                    key={hub}
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      hub === jornada.hub
                        ? "border-[#1f2a1d] bg-[#1f2a1d] text-white shadow-sm"
                        : "border-[#d5ddcf] bg-[#f6f8f3] text-[#3c4937]"
                    }`}
                  >
                    {hub}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">2. Total facturado al Hub</h2><strong>{formatoMoneda(calculos.totalFacturado)}</strong></div>
              <div className="mt-5 space-y-3">
                {clientesDelHub.map((cliente) => (
                  <div key={cliente.id} className={`rounded-2xl border p-4 ${cliente.id === jornada.clienteActivoId ? "border-[#1f2a1d] bg-[#eef4ea]" : "border-[#d5ddcf]"}`}>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
                      <input aria-label="Nombre del cliente" value={cliente.nombre} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input aria-label="Email del cliente" value={cliente.email} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { email: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input aria-label="Importe cobrado" type="number" value={cliente.importeCobrado} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { importeCobrado: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <button onClick={() => eliminarCliente(cliente.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 border-t border-[#e1e6dc] pt-5 md:grid-cols-[1fr_1fr_150px_auto]">
                <input placeholder="Nombre" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3" />
                <input placeholder="Email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3" />
                <input placeholder="Importe" type="number" value={nuevoCliente.importeCobrado} onChange={(e) => setNuevoCliente({ ...nuevoCliente, importeCobrado: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3" />
                <button onClick={agregarCliente} className="rounded-xl bg-[#1f2a1d] px-4 py-3 font-bold text-white">Agregar</button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">3. Gastos de la jornada</h2><strong>{formatoMoneda(calculos.totalGastos)}</strong></div>
                <p className="mt-2 text-sm text-[#66745c]">Cargá cada gasto con concepto e importe. Esta lista reemplaza insumos, comisión y gastos administrativos separados.</p>
                <div className="mt-5 space-y-3">
                  {jornada.gastosJornada.map((gasto) => (
                    <div key={gasto.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_130px_auto]">
                      <input aria-label="Concepto del gasto" value={gasto.concepto} onChange={(e) => actualizarGasto(gasto.id, { concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input aria-label="Importe del gasto" type="number" value={gasto.importe} onChange={(e) => actualizarGasto(gasto.id, { importe: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <button onClick={() => eliminarGasto(gasto.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_130px_auto]">
                  <input placeholder="Concepto" value={nuevoGasto.concepto} onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <input placeholder="Importe" type="number" value={nuevoGasto.importe} onChange={(e) => setNuevoGasto({ ...nuevoGasto, importe: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <button onClick={agregarGasto} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">4. Participantes que trabajaron</h2><strong>{calculos.cantidadParticipantesActivos} activos</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.participantes.map((participante) => {
                    const pago = calculos.pagosParticipantes.find((pagoParticipante) => pagoParticipante.id === participante.id)?.pagoParticipante || 0;
                    return (
                      <div key={participante.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_120px_130px_auto]">
                        <input value={participante.nombre} onChange={(e) => actualizarParticipante(participante.id, { nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                        <label className="flex items-center justify-center gap-2 rounded-xl bg-[#f6f8f3] px-3 py-2 text-sm font-bold">
                          <input type="checkbox" checked={participante.activo} onChange={(e) => actualizarParticipante(participante.id, { activo: e.target.checked })} />
                          Activo
                        </label>
                        <span className="rounded-xl bg-[#f6f8f3] px-3 py-2 text-sm font-bold">{formatoMoneda(pago)}</span>
                        <button onClick={() => eliminarParticipante(participante.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_120px_auto]">
                  <input placeholder="Participante" value={nuevoParticipante.nombre} onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-[#f6f8f3] px-3 py-2 text-sm font-bold">
                    <input type="checkbox" checked={nuevoParticipante.activo} onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, activo: e.target.checked })} />
                    Activo
                  </label>
                  <button onClick={agregarParticipante} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
                <div className="mt-4 rounded-2xl bg-[#f6f8f3] p-4 text-sm">
                  <div className="flex justify-between"><span>Saldo disponible</span><strong>{formatoMoneda(calculos.saldoDisponible)}</strong></div>
                  <div className="mt-2 flex justify-between"><span>Pago equitativo por participante activo</span><strong>{formatoMoneda(calculos.pagoEquitativo)}</strong></div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">5. Trabajo realizado y pendiente</h2>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Trabajo realizado<textarea value={jornada.trabajoRealizado} onChange={(e) => actualizarJornada({ trabajoRealizado: e.target.value })} className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold">Trabajo pendiente<textarea value={jornada.trabajoPendiente} onChange={(e) => actualizarJornada({ trabajoPendiente: e.target.value })} className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">Resumen económico</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span>Total facturado al Hub</span><strong>{formatoMoneda(calculos.totalFacturado)}</strong></div>
                <div className="flex justify-between"><span>Total gastos</span><strong>{formatoMoneda(calculos.totalGastos)}</strong></div>
                <div className="flex justify-between border-t border-[#e1e6dc] pt-3 text-lg"><span>Saldo disponible</span><strong>{formatoMoneda(calculos.saldoDisponible)}</strong></div>
                <div className="flex justify-between"><span>Participantes activos</span><strong>{calculos.cantidadParticipantesActivos}</strong></div>
                <div className="flex justify-between"><span>Pago equitativo</span><strong>{formatoMoneda(calculos.pagoEquitativo)}</strong></div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#1f2a1d] p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Vista previa privada por cliente</h2>
              <label className="mt-5 grid gap-2 text-sm font-semibold">
                Cliente que verá el reporte
                <select value={jornada.clienteActivoId} onChange={(e) => actualizarJornada({ clienteActivoId: Number(e.target.value) })} className="rounded-xl border border-white/20 bg-white px-4 py-3 text-[#182018]">
                  {clientesDelHub.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                </select>
              </label>

              <div className="mt-5 rounded-2xl bg-white/10 p-5 text-sm leading-7">
                <p className="text-lg font-bold">Reporte diario HubYa</p>
                <p>Cliente seleccionado: <strong>{clienteActivo?.nombre || "cliente"}</strong></p>
                <p>Hub: <strong>{jornada.hub}</strong></p>
                <p>Fecha: <strong>{fechaFormateada}</strong></p>
                {clienteActivo && <p>Importe correspondiente a su espacio verde: <strong>{formatoMoneda(numeroSeguro(clienteActivo.importeCobrado))}</strong></p>}
                <p><strong>Trabajo realizado:</strong> {jornada.trabajoRealizado}</p>
                <p><strong>Trabajo pendiente:</strong> {jornada.trabajoPendiente}</p>

                <p className="mt-4">Hola {clienteActivo?.nombre || "cliente"},</p>
                <p className="mt-4">Del total facturado por la jornada del Hub se descuentan los gastos operativos y administrativos. El saldo disponible se distribuye de manera equitativa entre los participantes que trabajaron.</p>
                <p className="mt-4">Por privacidad, los demás clientes figuran anonimizados y no se muestran emails de otros clientes.</p>

                <p className="mt-4 font-bold">Total facturado al Hub</p>
                <div className="flex justify-between gap-4"><span>Total facturado</span><span>{formatoMoneda(calculos.totalFacturado)}</span></div>
                {clientesDelHub.map((cliente, index) => (
                  <div key={cliente.id} className="flex justify-between gap-4">
                    <span>{nombrePrivado(cliente, index)}</span>
                    <span>{formatoMoneda(numeroSeguro(cliente.importeCobrado))}</span>
                  </div>
                ))}

                <p className="mt-4 font-bold">Gastos de la jornada</p>
                {jornada.gastosJornada.map((gasto) => (
                  <div key={gasto.id} className="flex justify-between gap-4"><span>{gasto.concepto}</span><span>{formatoMoneda(numeroSeguro(gasto.importe))}</span></div>
                ))}
                <div className="flex justify-between font-bold"><span>Total gastos</span><span>{formatoMoneda(calculos.totalGastos)}</span></div>
                <div className="flex justify-between font-bold"><span>Saldo disponible</span><span>{formatoMoneda(calculos.saldoDisponible)}</span></div>

                <p className="mt-4 font-bold">Participantes que trabajaron</p>
                {jornada.participantes.map((participante) => (
                  <div key={participante.id} className="flex justify-between gap-4"><span>{participante.nombre}</span><span>{participante.activo ? "Sí" : "No"}</span></div>
                ))}
                <div className="flex justify-between font-bold"><span>Pago equitativo por participante</span><span>{formatoMoneda(calculos.pagoEquitativo)}</span></div>
                <p className="mt-4"><strong>Estado operativo de la jornada:</strong> {jornada.estadoOperativo}</p>
                <p className="mt-4">Saludos,<br />HubYa</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
