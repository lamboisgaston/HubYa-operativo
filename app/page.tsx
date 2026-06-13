"use client";

import { useCallback, useMemo, useState } from "react";

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
  activoEnJornada: boolean;
  esCapataz: boolean;
};

type CalculosDerivados = {
  totalFacturado: number;
  totalGastos: number;
  saldoOperativo: number;
  porcentajeUtilidadCapataz: number;
  utilidadCapataz: number;
  saldoDistribuible: number;
  cantidadParticipantesActivos: number;
  pagoBaseEquitativo: number;
  pagosParticipantes: { id: number; nombre: string; activoEnJornada: boolean; esCapataz: boolean; gananciaFinal: number }[];
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
  porcentajeUtilidadCapataz: number | "";
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
];

const participantesIniciales: Participante[] = [
  { id: 1, nombre: "Hernán Llanes", activoEnJornada: true, esCapataz: true },
  { id: 2, nombre: "Armando Castillo", activoEnJornada: true, esCapataz: false },
  { id: 3, nombre: "Mauricio Vallejos", activoEnJornada: true, esCapataz: false },
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
  porcentajeUtilidadCapataz: 10,
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
  const saldoOperativo = totalFacturado - totalGastos;
  const porcentajeUtilidadCapataz = numeroSeguro(jornada.porcentajeUtilidadCapataz);
  const utilidadCapataz = saldoOperativo * porcentajeUtilidadCapataz / 100;
  const saldoDistribuible = saldoOperativo - utilidadCapataz;
  const cantidadParticipantesActivos = jornada.participantes.filter((participante) => participante.activoEnJornada).length;
  const pagoBaseEquitativo = cantidadParticipantesActivos > 0 ? saldoDistribuible / cantidadParticipantesActivos : 0;
  const pagosParticipantes = jornada.participantes.map((participante) => ({
    id: participante.id,
    nombre: participante.nombre,
    activoEnJornada: participante.activoEnJornada,
    esCapataz: participante.esCapataz,
    gananciaFinal: participante.activoEnJornada ? pagoBaseEquitativo + (participante.esCapataz ? utilidadCapataz : 0) : 0,
  }));

  return {
    totalFacturado,
    totalGastos,
    saldoOperativo,
    porcentajeUtilidadCapataz,
    utilidadCapataz,
    saldoDistribuible,
    cantidadParticipantesActivos,
    pagoBaseEquitativo,
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

function normalizarJornada(jornada: Partial<JornadaOperativa> & { clientes?: Cliente[]; gastosComunes?: MovimientoEconomico[]; insumosOperativos?: MovimientoEconomico[]; gastosAdministrativos?: MovimientoEconomico[]; operarios?: { id?: number; nombre?: string; activo?: boolean; activoEnJornada?: boolean; esCapataz?: boolean; horasTrabajadas?: number | "" }[]; distribucionOperarios?: { id?: number; nombre?: string; activo?: boolean; activoEnJornada?: boolean; esCapataz?: boolean; importeAsignado?: number; horasTrabajadas?: number | "" }[]; porcentajeComisionCapataz?: number | ""; tiempoEfectivoPorOperario?: string }): JornadaOperativa {
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


  const participantes = (jornada.participantes || jornada.operarios || jornada.distribucionOperarios || []).map((participante) => {
    const participanteGuardado = participante as Partial<Participante> & { activo?: boolean; horasTrabajadas?: number | "" };

    return {
      id: participanteGuardado.id || crearId(),
      nombre: participanteGuardado.nombre || "",
      activoEnJornada: participanteGuardado.activoEnJornada ?? participanteGuardado.activo ?? numeroSeguro(participanteGuardado.horasTrabajadas) > 0,
      esCapataz: participanteGuardado.esCapataz ?? false,
    };
  });

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
    porcentajeUtilidadCapataz: jornada.porcentajeUtilidadCapataz ?? jornadaInicial.porcentajeUtilidadCapataz,
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
  const [nuevoParticipante, setNuevoParticipante] = useState({ nombre: "", activoEnJornada: true });
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
  const capatazSeleccionado = jornada.participantes.find((participante) => participante.esCapataz);
  const cantidadCapatazes = jornada.participantes.filter((participante) => participante.esCapataz).length;
  const alertas = useMemo(() => {
    const mensajes: string[] = [];
    if (calculos.cantidadParticipantesActivos === 0) mensajes.push("Debe haber al menos un participante activo para distribuir el saldo operativo.");
    if (cantidadCapatazes === 0) mensajes.push("No hay capataz seleccionado. Elegí un capataz para asignar la utilidad de coordinación.");
    if (cantidadCapatazes > 1) mensajes.push("Hay más de un capataz seleccionado. Debe quedar un solo capataz.");
    if (calculos.saldoOperativo < 0) mensajes.push("El saldo operativo es negativo. Revisá el total facturado o los gastos de la jornada.");
    if (jornada.gastosJornada.some((item) => item.importe === "")) mensajes.push("Falta importe en un gasto de la jornada.");
    return mensajes;
  }, [calculos.cantidadParticipantesActivos, calculos.saldoOperativo, cantidadCapatazes, jornada.gastosJornada]);

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

  function seleccionarCapataz(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      participantes: jornadaActual.participantes.map((participante) => ({
        ...participante,
        esCapataz: participante.id === id,
      })),
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
    setNuevoParticipante({ nombre: "", activoEnJornada: true });
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
        { id: crearId(), nombre: nuevoParticipante.nombre, activoEnJornada: nuevoParticipante.activoEnJornada, esCapataz: false },
      ],
    }));
    setNuevoParticipante({ nombre: "", activoEnJornada: true });
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

  const nombrePrivado = useCallback((cliente: Cliente, index: number) => {
    return cliente.id === clienteActivo?.id ? cliente.nombre : `Cliente ${index + 1}`;
  }, [clienteActivo?.id]);

  const emailPrivado = useMemo(() => {
    const lineasClientes = clientesDelHub.map((cliente, index) =>
      `- ${nombrePrivado(cliente, index)}: ${formatoMoneda(numeroSeguro(cliente.importeCobrado))}`,
    );
    const lineasGastos = jornada.gastosJornada.map((gasto) =>
      `- ${gasto.concepto || "Gasto sin concepto"}: ${formatoMoneda(numeroSeguro(gasto.importe))}`,
    );
    const lineasParticipantes = calculos.pagosParticipantes.map((participante) =>
      `- ${participante.nombre}${participante.esCapataz ? " · capataz" : ""}: ${formatoMoneda(participante.gananciaFinal)}`,
    );

    return [
      `Reporte diario HubYa`,
      `Cliente seleccionado: ${clienteActivo?.nombre || "cliente"}`,
      `Hub: ${jornada.hub}`,
      `Fecha: ${fechaFormateada}`,
      clienteActivo ? `Importe correspondiente a su espacio verde: ${formatoMoneda(numeroSeguro(clienteActivo.importeCobrado))}` : "",
      "",
      `Hola ${clienteActivo?.nombre || "cliente"},`,
      "",
      `Trabajo realizado: ${jornada.trabajoRealizado}`,
      `Trabajo pendiente: ${jornada.trabajoPendiente}`,
      "",
      "Por privacidad, los demás clientes figuran anonimizados y no se muestran emails de otros clientes.",
      "",
      `Total facturado: ${formatoMoneda(calculos.totalFacturado)}`,
      ...lineasClientes,
      "",
      `Gastos de la jornada: ${formatoMoneda(calculos.totalGastos)}`,
      ...lineasGastos,
      "",
      `Saldo operativo: ${formatoMoneda(calculos.saldoOperativo)}`,
      `Utilidad capataz (${calculos.porcentajeUtilidadCapataz}%): ${formatoMoneda(calculos.utilidadCapataz)}`,
      `Capataz seleccionado: ${capatazSeleccionado?.nombre || "Sin seleccionar"}`,
      `Saldo distribuible: ${formatoMoneda(calculos.saldoDistribuible)}`,
      `Pago base equitativo: ${formatoMoneda(calculos.pagoBaseEquitativo)}`,
      "",
      "Ganancia final por actor:",
      ...lineasParticipantes,
      "",
      `Estado operativo: ${jornada.estadoOperativo}`,
      "",
      "Saludos,",
      "HubYa",
    ].filter((linea) => linea !== "").join("\n");
  }, [calculos, capatazSeleccionado?.nombre, clienteActivo, clientesDelHub, fechaFormateada, jornada, nombrePrivado]);

  async function copiarEmail() {
    await navigator.clipboard.writeText(emailPrivado);
    setMensajeGuardado(`Email copiado: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  return (
    <main className="min-h-screen bg-[#eef2e8] text-[#182018]">
      <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
        <header className="sticky top-0 z-20 mb-3 rounded-2xl border border-[#cfd8c6] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-2 xl:grid-cols-[1.2fr_1fr_auto] xl:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo · planilla diaria</p>
              <h1 className="text-xl font-black leading-tight">{tituloReporteDiario}</h1>
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_145px_1.4fr]">
              <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub
                <select value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value as HubDisponible })} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none">
                  {HUBS_DISPONIBLES.map((hub) => <option key={hub} value={hub}>{hub}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Fecha
                <input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" />
              </label>
              <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Estado operativo
                <input value={jornada.estadoOperativo} onChange={(e) => actualizarJornada({ estadoOperativo: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 xl:justify-end">
              <button onClick={guardarJornada} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar</button>
              <button onClick={cargarJornada} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cargar</button>
              <button onClick={limpiarJornada} className="h-8 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-3 text-xs font-black text-[#743c3c]">Limpiar</button>
            </div>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado}</p>
        </header>

        {alertas.length > 0 && (
          <div className="mb-3 rounded-xl border border-[#f0c978] bg-[#fff8e9] px-3 py-2 text-xs font-semibold text-[#7a4a00]">
            <strong>Alertas:</strong> {alertas.join(" · ")}
          </div>
        )}

        <section className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Total facturado", formatoMoneda(calculos.totalFacturado)],
            ["Total gastos", formatoMoneda(calculos.totalGastos)],
            ["Saldo operativo", formatoMoneda(calculos.saldoOperativo)],
            ["Utilidad capataz", formatoMoneda(calculos.utilidadCapataz)],
            ["Saldo distribuible", formatoMoneda(calculos.saldoDistribuible)],
            ["Pago base", formatoMoneda(calculos.pagoBaseEquitativo)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#d8dfd1] bg-white p-2 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#66745c]">{label}</p>
              <p className="mt-1 truncate text-base font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[1.25fr_0.8fr_1.15fr]">
          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-wide">Clientes del Hub</h2>
              <span className="text-xs font-bold text-[#66745c]">{clientesDelHub.length} clientes · click marca vista previa</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Nombre</th><th className="border p-1">Email</th><th className="border p-1">Importe</th><th className="border p-1">Sel.</th><th className="border p-1"></th></tr></thead>
                <tbody>{clientesDelHub.map((cliente) => (
                  <tr key={cliente.id} className={cliente.id === jornada.clienteActivoId ? "bg-[#eef4ea]" : "bg-white"}>
                    <td className="border border-[#e1e6dc] p-1"><input value={cliente.nombre} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { nombre: e.target.value })} className="h-7 w-full bg-transparent px-1 outline-none" /></td>
                    <td className="border border-[#e1e6dc] p-1"><input value={cliente.email} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { email: e.target.value })} className="h-7 w-full bg-transparent px-1 outline-none" /></td>
                    <td className="border border-[#e1e6dc] p-1"><input type="number" value={cliente.importeCobrado} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { importeCobrado: normalizarImporte(e.target.value) })} className="h-7 w-24 bg-transparent px-1 text-right outline-none" /></td>
                    <td className="border border-[#e1e6dc] p-1 text-center"><input type="radio" name="clienteActivo" checked={cliente.id === jornada.clienteActivoId} onChange={() => actualizarJornada({ clienteActivoId: cliente.id })} /></td>
                    <td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => eliminarCliente(cliente.id)} className="font-black text-[#743c3c]">×</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="mt-2 grid gap-1 md:grid-cols-[1fr_1fr_100px_78px]"><input placeholder="Nombre" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><input placeholder="Email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><input placeholder="Importe" type="number" value={nuevoCliente.importeCobrado} onChange={(e) => setNuevoCliente({ ...nuevoCliente, importeCobrado: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><button onClick={agregarCliente} className="h-8 rounded-lg bg-[#1f2a1d] text-xs font-black text-white">Agregar</button></div>
          </div>

          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wide">Gastos de jornada</h2>
            <table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Concepto</th><th className="border p-1">Importe</th><th className="border p-1"></th></tr></thead><tbody>{jornada.gastosJornada.map((gasto) => (<tr key={gasto.id}><td className="border border-[#e1e6dc] p-1"><input value={gasto.concepto} onChange={(e) => actualizarGasto(gasto.id, { concepto: e.target.value })} className="h-7 w-full bg-transparent px-1 outline-none" /></td><td className="border border-[#e1e6dc] p-1"><input type="number" value={gasto.importe} onChange={(e) => actualizarGasto(gasto.id, { importe: normalizarImporte(e.target.value) })} className="h-7 w-24 bg-transparent px-1 text-right outline-none" /></td><td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => eliminarGasto(gasto.id)} className="font-black text-[#743c3c]">×</button></td></tr>))}</tbody></table>
            <div className="mt-2 grid grid-cols-[1fr_95px_70px] gap-1"><input placeholder="Concepto" value={nuevoGasto.concepto} onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><input placeholder="Importe" type="number" value={nuevoGasto.importe} onChange={(e) => setNuevoGasto({ ...nuevoGasto, importe: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><button onClick={agregarGasto} className="h-8 rounded-lg bg-[#1f2a1d] text-xs font-black text-white">Agregar</button></div>
          </div>

          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Equipo</h2><span className="text-xs font-bold text-[#66745c]">{calculos.cantidadParticipantesActivos} activos · {capatazSeleccionado?.nombre || "sin capataz"}</span></div>
            <table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Nombre</th><th className="border p-1">Activo</th><th className="border p-1">Capataz</th><th className="border p-1">Ganancia</th><th className="border p-1"></th></tr></thead><tbody>{jornada.participantes.map((participante) => { const pago = calculos.pagosParticipantes.find((item) => item.id === participante.id)?.gananciaFinal || 0; return (<tr key={participante.id}><td className="border border-[#e1e6dc] p-1"><input value={participante.nombre} onChange={(e) => actualizarParticipante(participante.id, { nombre: e.target.value })} className="h-7 w-full bg-transparent px-1 outline-none" /></td><td className="border border-[#e1e6dc] p-1 text-center"><input type="checkbox" checked={participante.activoEnJornada} onChange={(e) => actualizarParticipante(participante.id, { activoEnJornada: e.target.checked })} /></td><td className="border border-[#e1e6dc] p-1 text-center"><input type="radio" name="capataz" checked={participante.esCapataz} onChange={() => seleccionarCapataz(participante.id)} /></td><td className="border border-[#e1e6dc] p-1 text-right font-bold">{formatoMoneda(pago)}</td><td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => eliminarParticipante(participante.id)} className="font-black text-[#743c3c]">×</button></td></tr>); })}</tbody></table>
            <div className="mt-2 grid grid-cols-[1fr_70px_78px] gap-1"><input placeholder="Actor" value={nuevoParticipante.nombre} onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, nombre: e.target.value })} className="h-8 rounded-lg border px-2 text-sm" /><label className="flex h-8 items-center justify-center gap-1 rounded-lg border text-xs font-bold"><input type="checkbox" checked={nuevoParticipante.activoEnJornada} onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, activoEnJornada: e.target.checked })} />Activo</label><button onClick={agregarParticipante} className="h-8 rounded-lg bg-[#1f2a1d] text-xs font-black text-white">Agregar</button></div>
            <label className="mt-2 grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Utilidad capataz %<input type="number" min="0" value={jornada.porcentajeUtilidadCapataz} onChange={(e) => actualizarJornada({ porcentajeUtilidadCapataz: normalizarImporte(e.target.value) })} className="h-8 rounded-lg border px-2 text-sm" /></label>
          </div>
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wide">Trabajo realizado y pendiente</h2>
            <div className="grid gap-2 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold">Realizado<textarea value={jornada.trabajoRealizado} onChange={(e) => actualizarJornada({ trabajoRealizado: e.target.value })} className="min-h-20 rounded-lg border px-2 py-1 text-sm outline-none" /></label><label className="grid gap-1 text-xs font-bold">Pendiente<textarea value={jornada.trabajoPendiente} onChange={(e) => actualizarJornada({ trabajoPendiente: e.target.value })} className="min-h-20 rounded-lg border px-2 py-1 text-sm outline-none" /></label></div>
          </div>

          <details className="rounded-2xl border border-[#1f2a1d] bg-[#1f2a1d] p-3 text-white shadow-sm">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Ver email privado</summary>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><select value={jornada.clienteActivoId} onChange={(e) => actualizarJornada({ clienteActivoId: Number(e.target.value) })} className="h-8 rounded-lg bg-white px-2 text-sm font-semibold text-[#182018]">{clientesDelHub.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}</select><button onClick={copiarEmail} className="h-8 rounded-lg bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar email</button></div>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white/10 p-3 text-xs leading-5">{emailPrivado}</pre>
          </details>
        </section>
      </section>
    </main>
  );
}
