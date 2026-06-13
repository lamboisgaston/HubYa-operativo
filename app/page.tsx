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

type Operario = {
  id: number;
  nombre: string;
  horasTrabajadas: number | "";
};

type CalculosDerivados = {
  totalFacturado: number;
  totalInsumos: number;
  subtotalDespuesDeInsumos: number;
  comisionCapataz: number;
  totalGastosAdministrativos: number;
  netoParaDistribuir: number;
  horasTotales: number;
  valorHoraOperativa: number;
  pagosOperarios: { id: number; nombre: string; horasTrabajadas: number; pagoOperario: number }[];
  distribucionIgualitaria: boolean;
};

type JornadaOperativa = {
  hub: string;
  fecha: string;
  nombreReporte: string;
  estadoOperativo: string;
  clientes: Cliente[];
  insumosOperativos: MovimientoEconomico[];
  porcentajeComisionCapataz: number | "";
  gastosAdministrativos: MovimientoEconomico[];
  operarios: Operario[];
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

const clientesIniciales: Cliente[] = [
  { id: 1, nombre: "Carolina Yovi", email: "carolina@email.com", importeCobrado: 72000 },
  { id: 2, nombre: "Gabriela Aguiar", email: "gabriela@email.com", importeCobrado: 56000 },
  { id: 3, nombre: "Fleming", email: "fleming@email.com", importeCobrado: 95000 },
];

const insumosIniciales: MovimientoEconomico[] = [
  { id: 1, concepto: "Nafta", importe: 20000 },
  { id: 2, concepto: "Maquinaria", importe: 1000 },
  { id: 3, concepto: "Tanza", importe: 10000 },
];

const gastosAdministrativosIniciales: MovimientoEconomico[] = [
  { id: 1, concepto: "JardinerosYa", importe: 15000 },
];

const operariosIniciales: Operario[] = [
  { id: 1, nombre: "Hernán Llanes", horasTrabajadas: 6 },
  { id: 2, nombre: "Armando Castillo", horasTrabajadas: 6 },
  { id: 3, nombre: "Mauricio Vallejos", horasTrabajadas: 6 },
];

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  nombreReporte: "Reporte económico operativo — Hub Tipal",
  estadoOperativo: "Jornada completada sin incidentes. Pendiente validación final de distribución.",
  clientes: clientesIniciales,
  insumosOperativos: insumosIniciales,
  porcentajeComisionCapataz: 10,
  gastosAdministrativos: gastosAdministrativosIniciales,
  operarios: operariosIniciales,
  clienteActivoId: 1,
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoHoras(valor: number) {
  return `${valor.toLocaleString("es-AR", { maximumFractionDigits: 2 })} hs`;
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

function calcularJornada(jornada: JornadaOperativa): CalculosDerivados {
  const totalFacturado = jornada.clientes.reduce(
    (total, cliente) => total + numeroSeguro(cliente.importeCobrado),
    0,
  );
  const totalInsumos = jornada.insumosOperativos.reduce(
    (total, insumo) => total + numeroSeguro(insumo.importe),
    0,
  );
  const subtotalDespuesDeInsumos = totalFacturado - totalInsumos;
  const comisionCapataz = (subtotalDespuesDeInsumos * numeroSeguro(jornada.porcentajeComisionCapataz)) / 100;
  const totalGastosAdministrativos = jornada.gastosAdministrativos.reduce(
    (total, gasto) => total + numeroSeguro(gasto.importe),
    0,
  );
  const netoParaDistribuir = subtotalDespuesDeInsumos - comisionCapataz - totalGastosAdministrativos;
  const horasTotales = jornada.operarios.reduce(
    (total, operario) => total + numeroSeguro(operario.horasTrabajadas),
    0,
  );
  const valorHoraOperativa = horasTotales > 0 ? netoParaDistribuir / horasTotales : 0;
  const pagosOperarios = jornada.operarios.map((operario) => {
    const horasTrabajadas = numeroSeguro(operario.horasTrabajadas);
    return {
      id: operario.id,
      nombre: operario.nombre,
      horasTrabajadas,
      pagoOperario: horasTrabajadas * valorHoraOperativa,
    };
  });
  const horasValidas = jornada.operarios.map((operario) => numeroSeguro(operario.horasTrabajadas));
  const distribucionIgualitaria =
    horasValidas.length > 1 && horasValidas.every((horas) => horas > 0 && horas === horasValidas[0]);

  return {
    totalFacturado,
    totalInsumos,
    subtotalDespuesDeInsumos,
    comisionCapataz,
    totalGastosAdministrativos,
    netoParaDistribuir,
    horasTotales,
    valorHoraOperativa,
    pagosOperarios,
    distribucionIgualitaria,
  };
}

function normalizarJornada(jornada: Partial<JornadaOperativa> & { gastosComunes?: MovimientoEconomico[]; distribucionOperarios?: { id?: number; nombre?: string; importeAsignado?: number; horasTrabajadas?: number }[]; tiempoEfectivoPorOperario?: string }): JornadaOperativa {
  const clientes = (jornada.clientes || []).map((cliente) => ({
    id: cliente.id || crearId(),
    nombre: cliente.nombre || "",
    email: cliente.email || "",
    importeCobrado: numeroSeguro(cliente.importeCobrado),
  }));

  const insumosOperativos = (jornada.insumosOperativos || jornada.gastosComunes || []).map((insumo) => ({
    id: insumo.id || crearId(),
    concepto: insumo.concepto || "",
    importe: numeroSeguro(insumo.importe),
  }));

  const gastosAdministrativos = (jornada.gastosAdministrativos || []).map((gasto) => ({
    id: gasto.id || crearId(),
    concepto: gasto.concepto || "",
    importe: numeroSeguro(gasto.importe),
  }));

  const operarios = (jornada.operarios || jornada.distribucionOperarios || []).map((operario) => ({
    id: operario.id || crearId(),
    nombre: operario.nombre || "",
    horasTrabajadas: numeroSeguro(operario.horasTrabajadas),
  }));

  const hubNormalizado = HUBS_DISPONIBLES.includes(jornada.hub as (typeof HUBS_DISPONIBLES)[number])
    ? String(jornada.hub)
    : jornadaInicial.hub;

  return {
    hub: hubNormalizado,
    fecha: jornada.fecha || jornadaInicial.fecha,
    nombreReporte: jornada.nombreReporte || jornadaInicial.nombreReporte,
    estadoOperativo: jornada.estadoOperativo || jornadaInicial.estadoOperativo,
    clientes,
    insumosOperativos,
    porcentajeComisionCapataz: numeroSeguro(jornada.porcentajeComisionCapataz),
    gastosAdministrativos,
    operarios,
    clienteActivoId: clientes.some((cliente) => cliente.id === jornada.clienteActivoId)
      ? Number(jornada.clienteActivoId)
      : clientes[0]?.id || 0,
    calculosDerivados: jornada.calculosDerivados,
  };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", email: "", importeCobrado: "" });
  const [nuevoInsumo, setNuevoInsumo] = useState({ concepto: "", importe: "" });
  const [nuevoGastoAdministrativo, setNuevoGastoAdministrativo] = useState({ concepto: "", importe: "" });
  const [nuevoOperario, setNuevoOperario] = useState({ nombre: "", horasTrabajadas: "" });
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");

  const clienteActivo =
    jornada.clientes.find((cliente) => cliente.id === jornada.clienteActivoId) || jornada.clientes[0];

  const calculos = useMemo(() => calcularJornada(jornada), [jornada]);
  const fechaFormateada = formatoFecha(jornada.fecha);
  const tituloReporteDiario = `Reporte diario — ${jornada.hub} — ${fechaFormateada}`;
  const alertas = useMemo(() => {
    const mensajes: string[] = [];
    if (calculos.horasTotales === 0) mensajes.push("Las horas totales son 0. Cargá horas trabajadas para distribuir el neto.");
    if (calculos.netoParaDistribuir < 0) mensajes.push("El neto para distribuir es negativo. Revisá insumos, comisión o gastos administrativos.");
    if ([...jornada.insumosOperativos, ...jornada.gastosAdministrativos].some((item) => item.importe === "")) mensajes.push("Falta importe en un insumo operativo o gasto administrativo.");
    if (jornada.operarios.some((operario) => operario.horasTrabajadas === "")) mensajes.push("Falta cargar horas en un operario.");
    return mensajes;
  }, [calculos.horasTotales, calculos.netoParaDistribuir, jornada.gastosAdministrativos, jornada.insumosOperativos, jornada.operarios]);

  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((jornadaActual) => ({ ...jornadaActual, ...cambios }));
  }

  function actualizarCliente(id: number, cambios: Partial<Cliente>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientes: jornadaActual.clientes.map((cliente) =>
        cliente.id === id ? { ...cliente, ...cambios } : cliente,
      ),
    }));
  }

  function actualizarInsumo(id: number, cambios: Partial<MovimientoEconomico>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      insumosOperativos: jornadaActual.insumosOperativos.map((insumo) =>
        insumo.id === id ? { ...insumo, ...cambios } : insumo,
      ),
    }));
  }

  function actualizarGastoAdministrativo(id: number, cambios: Partial<MovimientoEconomico>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosAdministrativos: jornadaActual.gastosAdministrativos.map((gasto) =>
        gasto.id === id ? { ...gasto, ...cambios } : gasto,
      ),
    }));
  }

  function actualizarOperario(id: number, cambios: Partial<Operario>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      operarios: jornadaActual.operarios.map((operario) =>
        operario.id === id ? { ...operario, ...cambios } : operario,
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
    setNuevoInsumo({ concepto: "", importe: "" });
    setNuevoGastoAdministrativo({ concepto: "", importe: "" });
    setNuevoOperario({ nombre: "", horasTrabajadas: "" });
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  function agregarCliente() {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.email.trim()) return;

    const cliente: Cliente = {
      id: crearId(),
      nombre: nuevoCliente.nombre,
      email: nuevoCliente.email,
      importeCobrado: Number(nuevoCliente.importeCobrado || 0),
    };

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientes: [...jornadaActual.clientes, cliente],
      clienteActivoId: cliente.id,
    }));
    setNuevoCliente({ nombre: "", email: "", importeCobrado: "" });
  }

  function agregarInsumo() {
    if (!nuevoInsumo.concepto.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      insumosOperativos: [
        ...jornadaActual.insumosOperativos,
        { id: crearId(), concepto: nuevoInsumo.concepto, importe: normalizarImporte(nuevoInsumo.importe) },
      ],
    }));
    setNuevoInsumo({ concepto: "", importe: "" });
  }

  function agregarGastoAdministrativo() {
    if (!nuevoGastoAdministrativo.concepto.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosAdministrativos: [
        ...jornadaActual.gastosAdministrativos,
        {
          id: crearId(),
          concepto: nuevoGastoAdministrativo.concepto,
          importe: normalizarImporte(nuevoGastoAdministrativo.importe),
        },
      ],
    }));
    setNuevoGastoAdministrativo({ concepto: "", importe: "" });
  }

  function agregarOperario() {
    if (!nuevoOperario.nombre.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      operarios: [
        ...jornadaActual.operarios,
        {
          id: crearId(),
          nombre: nuevoOperario.nombre,
          horasTrabajadas: normalizarImporte(nuevoOperario.horasTrabajadas),
        },
      ],
    }));
    setNuevoOperario({ nombre: "", horasTrabajadas: "" });
  }

  function eliminarCliente(id: number) {
    setJornada((jornadaActual) => {
      const clientes = jornadaActual.clientes.filter((cliente) => cliente.id !== id);
      return {
        ...jornadaActual,
        clientes,
        clienteActivoId:
          jornadaActual.clienteActivoId === id ? clientes[0]?.id || 0 : jornadaActual.clienteActivoId,
      };
    });
  }

  function eliminarInsumo(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      insumosOperativos: jornadaActual.insumosOperativos.filter((insumo) => insumo.id !== id),
    }));
  }

  function eliminarGastoAdministrativo(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosAdministrativos: jornadaActual.gastosAdministrativos.filter((gasto) => gasto.id !== id),
    }));
  }

  function eliminarOperario(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      operarios: jornadaActual.operarios.filter((operario) => operario.id !== id),
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
                  <select value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value })} className="rounded-xl border border-[#d5ddcf] bg-white px-4 py-3 outline-none">
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
                {jornada.clientes.map((cliente) => (
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
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">3. Insumos operativos</h2><strong>{formatoMoneda(calculos.totalInsumos)}</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.insumosOperativos.map((insumo) => (
                    <div key={insumo.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_130px_auto]">
                      <input value={insumo.concepto} onChange={(e) => actualizarInsumo(insumo.id, { concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input type="number" value={insumo.importe} onChange={(e) => actualizarInsumo(insumo.id, { importe: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <button onClick={() => eliminarInsumo(insumo.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_130px_auto]">
                  <input placeholder="Concepto" value={nuevoInsumo.concepto} onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <input placeholder="Importe" type="number" value={nuevoInsumo.importe} onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, importe: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <button onClick={agregarInsumo} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
                <div className="mt-4 rounded-2xl bg-[#f6f8f3] p-4 text-sm font-bold">Subtotal después de insumos: {formatoMoneda(calculos.subtotalDespuesDeInsumos)}</div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
                <h2 className="text-2xl font-bold">4. Comisión del capataz</h2>
                <label className="mt-5 grid gap-2 text-sm font-semibold">Porcentaje de comisión<input type="number" value={jornada.porcentajeComisionCapataz} onChange={(e) => actualizarJornada({ porcentajeComisionCapataz: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <div className="mt-4 rounded-2xl bg-[#f6f8f3] p-4 text-sm">
                  <div className="flex justify-between"><span>Base: subtotal después de insumos</span><strong>{formatoMoneda(calculos.subtotalDespuesDeInsumos)}</strong></div>
                  <div className="mt-2 flex justify-between text-lg"><span>Comisión calculada</span><strong>{formatoMoneda(calculos.comisionCapataz)}</strong></div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">5. Gastos administrativos</h2><strong>{formatoMoneda(calculos.totalGastosAdministrativos)}</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.gastosAdministrativos.map((gasto) => (
                    <div key={gasto.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_130px_auto]">
                      <input value={gasto.concepto} onChange={(e) => actualizarGastoAdministrativo(gasto.id, { concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input type="number" value={gasto.importe} onChange={(e) => actualizarGastoAdministrativo(gasto.id, { importe: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <button onClick={() => eliminarGastoAdministrativo(gasto.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_130px_auto]">
                  <input placeholder="Concepto" value={nuevoGastoAdministrativo.concepto} onChange={(e) => setNuevoGastoAdministrativo({ ...nuevoGastoAdministrativo, concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <input placeholder="Importe" type="number" value={nuevoGastoAdministrativo.importe} onChange={(e) => setNuevoGastoAdministrativo({ ...nuevoGastoAdministrativo, importe: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <button onClick={agregarGastoAdministrativo} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">6. Operarios y horas</h2><strong>{formatoHoras(calculos.horasTotales)}</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.operarios.map((operario) => {
                    const pago = calculos.pagosOperarios.find((pagoOperario) => pagoOperario.id === operario.id)?.pagoOperario || 0;
                    return (
                      <div key={operario.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_110px_120px_auto]">
                        <input value={operario.nombre} onChange={(e) => actualizarOperario(operario.id, { nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                        <input aria-label="Horas trabajadas" type="number" value={operario.horasTrabajadas} onChange={(e) => actualizarOperario(operario.id, { horasTrabajadas: normalizarImporte(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                        <span className="rounded-xl bg-[#f6f8f3] px-3 py-2 text-sm font-bold">{formatoMoneda(pago)}</span>
                        <button onClick={() => eliminarOperario(operario.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_130px_auto]">
                  <input placeholder="Operario o capataz" value={nuevoOperario.nombre} onChange={(e) => setNuevoOperario({ ...nuevoOperario, nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <input placeholder="Horas" type="number" value={nuevoOperario.horasTrabajadas} onChange={(e) => setNuevoOperario({ ...nuevoOperario, horasTrabajadas: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <button onClick={agregarOperario} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
                <div className="mt-4 rounded-2xl bg-[#f6f8f3] p-4 text-sm">
                  <div className="flex justify-between"><span>Neto para distribuir</span><strong>{formatoMoneda(calculos.netoParaDistribuir)}</strong></div>
                  <div className="mt-2 flex justify-between"><span>Valor hora operativa</span><strong>{formatoMoneda(calculos.valorHoraOperativa)}</strong></div>
                  {calculos.distribucionIgualitaria && <p className="mt-3 font-bold text-[#265b2b]">La distribución es proporcional e igualitaria por tiempo trabajado.</p>}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">Resumen económico</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span>Total facturado al Hub</span><strong>{formatoMoneda(calculos.totalFacturado)}</strong></div>
                <div className="flex justify-between"><span>Total insumos</span><strong>{formatoMoneda(calculos.totalInsumos)}</strong></div>
                <div className="flex justify-between"><span>Subtotal después de insumos</span><strong>{formatoMoneda(calculos.subtotalDespuesDeInsumos)}</strong></div>
                <div className="flex justify-between"><span>Comisión capataz ({numeroSeguro(jornada.porcentajeComisionCapataz)}%)</span><strong>{formatoMoneda(calculos.comisionCapataz)}</strong></div>
                <div className="flex justify-between"><span>Total gastos administrativos</span><strong>{formatoMoneda(calculos.totalGastosAdministrativos)}</strong></div>
                <div className="flex justify-between border-t border-[#e1e6dc] pt-3 text-lg"><span>Neto para distribuir al equipo</span><strong>{formatoMoneda(calculos.netoParaDistribuir)}</strong></div>
                <div className="flex justify-between"><span>Horas totales</span><strong>{formatoHoras(calculos.horasTotales)}</strong></div>
                <div className="flex justify-between"><span>Valor hora operativa</span><strong>{formatoMoneda(calculos.valorHoraOperativa)}</strong></div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#1f2a1d] p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Vista previa privada por cliente</h2>
              <label className="mt-5 grid gap-2 text-sm font-semibold">
                Cliente que verá el reporte
                <select value={jornada.clienteActivoId} onChange={(e) => actualizarJornada({ clienteActivoId: Number(e.target.value) })} className="rounded-xl border border-white/20 bg-white px-4 py-3 text-[#182018]">
                  {jornada.clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                </select>
              </label>

              <div className="mt-5 rounded-2xl bg-white/10 p-5 text-sm leading-7">
                <p className="text-lg font-bold">Reporte diario HubYa</p>
                <p>Hub correspondiente: <strong>{jornada.hub}</strong></p>
                <p>Fecha de la jornada: <strong>{fechaFormateada}</strong></p>
                <p className="mt-2 font-semibold">Este reporte corresponde únicamente a la jornada del Hub seleccionado.</p>
                <p className="mt-4">Asunto: {jornada.nombreReporte}</p>
                <p className="mt-4">HubYa opera distintos Hubs en Salta. Este reporte corresponde a {jornada.hub}.</p>
                <p className="mt-4">Hola {clienteActivo?.nombre || "cliente"},</p>
                <p className="mt-4">Compartimos la vista privada de la jornada {fechaFormateada} de {jornada.hub}. Por privacidad, los demás participantes figuran anonimizados y no se muestran emails de otros clientes.</p>

                <p className="mt-4 font-bold">Total facturado al Hub</p>
                <div className="flex justify-between gap-4"><span>Total facturado</span><span>{formatoMoneda(calculos.totalFacturado)}</span></div>

                <p className="mt-4 font-bold">Detalle de clientes</p>
                {jornada.clientes.map((cliente, index) => (
                  <div key={cliente.id} className="flex justify-between gap-4">
                    <span>{nombrePrivado(cliente, index)}</span>
                    <span>{formatoMoneda(numeroSeguro(cliente.importeCobrado))}</span>
                  </div>
                ))}
                {clienteActivo && <p className="mt-2">Tu importe cobrado: <strong>{formatoMoneda(numeroSeguro(clienteActivo.importeCobrado))}</strong></p>}

                <p className="mt-4 font-bold">Insumos operativos</p>
                {jornada.insumosOperativos.map((insumo) => (
                  <div key={insumo.id} className="flex justify-between gap-4"><span>{insumo.concepto}</span><span>{formatoMoneda(numeroSeguro(insumo.importe))}</span></div>
                ))}
                <div className="flex justify-between font-bold"><span>Total insumos</span><span>{formatoMoneda(calculos.totalInsumos)}</span></div>
                <div className="flex justify-between font-bold"><span>Subtotal después de insumos</span><span>{formatoMoneda(calculos.subtotalDespuesDeInsumos)}</span></div>

                <p className="mt-4 font-bold">Comisión del capataz</p>
                <div className="flex justify-between gap-4"><span>Porcentaje</span><span>{numeroSeguro(jornada.porcentajeComisionCapataz)}%</span></div>
                <div className="flex justify-between gap-4"><span>Importe calculado</span><span>{formatoMoneda(calculos.comisionCapataz)}</span></div>

                <p className="mt-4 font-bold">Gastos administrativos</p>
                {jornada.gastosAdministrativos.map((gasto) => (
                  <div key={gasto.id} className="flex justify-between gap-4"><span>{gasto.concepto}</span><span>{formatoMoneda(numeroSeguro(gasto.importe))}</span></div>
                ))}
                <div className="flex justify-between font-bold"><span>Total gastos administrativos</span><span>{formatoMoneda(calculos.totalGastosAdministrativos)}</span></div>

                <p className="mt-4 font-bold">Neto para distribuir al equipo</p>
                <div className="flex justify-between gap-4"><span>Neto distribuible</span><span>{formatoMoneda(calculos.netoParaDistribuir)}</span></div>

                <p className="mt-4 font-bold">Horas trabajadas por operario</p>
                {jornada.operarios.map((operario) => (
                  <div key={operario.id} className="flex justify-between gap-4"><span>{operario.nombre}</span><span>{formatoHoras(numeroSeguro(operario.horasTrabajadas))}</span></div>
                ))}
                <div className="flex justify-between font-bold"><span>Horas totales</span><span>{formatoHoras(calculos.horasTotales)}</span></div>
                <div className="flex justify-between font-bold"><span>Valor hora operativa</span><span>{formatoMoneda(calculos.valorHoraOperativa)}</span></div>
                {calculos.distribucionIgualitaria && <p className="mt-2 font-bold">Distribución proporcional e igualitaria por tiempo trabajado.</p>}

                <p className="mt-4 font-bold">Pago proporcional de cada operario</p>
                {calculos.pagosOperarios.map((operario) => (
                  <div key={operario.id} className="flex justify-between gap-4"><span>{operario.nombre}</span><span>{formatoMoneda(operario.pagoOperario)}</span></div>
                ))}

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
