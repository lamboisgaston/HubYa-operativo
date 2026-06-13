"use client";

import { useMemo, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  importeCobrado: number;
};

type GastoComun = {
  id: number;
  concepto: string;
  importe: number;
};

type Operario = {
  id: number;
  nombre: string;
  importeAsignado: number;
};

type JornadaOperativa = {
  hub: string;
  fecha: string;
  nombreReporte: string;
  tiempoEfectivoPorOperario: string;
  estadoOperativo: string;
  clientes: Cliente[];
  gastosComunes: GastoComun[];
  distribucionOperarios: Operario[];
  clienteActivoId: number;
};

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";

const clientesIniciales: Cliente[] = [
  { id: 1, nombre: "Carolina Yovi", email: "carolina@email.com", importeCobrado: 72000 },
  { id: 2, nombre: "Gabriela Aguiar", email: "gabriela@email.com", importeCobrado: 56000 },
  { id: 3, nombre: "Fleming", email: "fleming@email.com", importeCobrado: 95000 },
];

const gastosIniciales: GastoComun[] = [
  { id: 1, concepto: "Nafta", importe: 20000 },
  { id: 2, concepto: "Maquinaria", importe: 1000 },
  { id: 3, concepto: "JardinerosYa", importe: 15000 },
  { id: 4, concepto: "Tanza", importe: 10000 },
];

const operariosIniciales: Operario[] = [
  { id: 1, nombre: "Hernán Llanes", importeAsignado: 65000 },
  { id: 2, nombre: "Armando Castillo", importeAsignado: 65000 },
  { id: 3, nombre: "Mauricio Vallejos", importeAsignado: 47000 },
];

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  nombreReporte: "Reporte económico operativo — Hub Tipal",
  tiempoEfectivoPorOperario: "6 hs efectivas por operario",
  estadoOperativo: "Jornada completada sin incidentes. Pendiente validación final de distribución.",
  clientes: clientesIniciales,
  gastosComunes: gastosIniciales,
  distribucionOperarios: operariosIniciales,
  clienteActivoId: 1,
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function crearId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizarJornada(jornada: Partial<JornadaOperativa>): JornadaOperativa {
  const clientes = (jornada.clientes || []).map((cliente) => ({
    id: cliente.id || crearId(),
    nombre: cliente.nombre || "",
    email: cliente.email || "",
    importeCobrado: Number(cliente.importeCobrado || 0),
  }));

  const gastosComunes = (jornada.gastosComunes || []).map((gasto) => ({
    id: gasto.id || crearId(),
    concepto: gasto.concepto || "",
    importe: Number(gasto.importe || 0),
  }));

  const distribucionOperarios = (jornada.distribucionOperarios || []).map((operario) => ({
    id: operario.id || crearId(),
    nombre: operario.nombre || "",
    importeAsignado: Number(operario.importeAsignado || 0),
  }));

  return {
    hub: jornada.hub || jornadaInicial.hub,
    fecha: jornada.fecha || jornadaInicial.fecha,
    nombreReporte: jornada.nombreReporte || jornadaInicial.nombreReporte,
    tiempoEfectivoPorOperario:
      jornada.tiempoEfectivoPorOperario || jornadaInicial.tiempoEfectivoPorOperario,
    estadoOperativo: jornada.estadoOperativo || jornadaInicial.estadoOperativo,
    clientes,
    gastosComunes,
    distribucionOperarios,
    clienteActivoId: clientes.some((cliente) => cliente.id === jornada.clienteActivoId)
      ? Number(jornada.clienteActivoId)
      : clientes[0]?.id || 0,
  };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", email: "", importeCobrado: "" });
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", importe: "" });
  const [nuevoOperario, setNuevoOperario] = useState({ nombre: "", importeAsignado: "" });
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");

  const clienteActivo =
    jornada.clientes.find((cliente) => cliente.id === jornada.clienteActivoId) || jornada.clientes[0];

  const totalFacturado = useMemo(
    () => jornada.clientes.reduce((total, cliente) => total + Number(cliente.importeCobrado || 0), 0),
    [jornada.clientes],
  );
  const totalGastos = useMemo(
    () => jornada.gastosComunes.reduce((total, gasto) => total + Number(gasto.importe || 0), 0),
    [jornada.gastosComunes],
  );
  const totalADistribuir = totalFacturado - totalGastos;
  const totalDistribuido = useMemo(
    () =>
      jornada.distribucionOperarios.reduce(
        (total, operario) => total + Number(operario.importeAsignado || 0),
        0,
      ),
    [jornada.distribucionOperarios],
  );
  const diferenciaDistribucion = totalADistribuir - totalDistribuido;
  const distribucionCerrada = diferenciaDistribucion === 0;

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

  function actualizarGasto(id: number, cambios: Partial<GastoComun>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosComunes: jornadaActual.gastosComunes.map((gasto) =>
        gasto.id === id ? { ...gasto, ...cambios } : gasto,
      ),
    }));
  }

  function actualizarOperario(id: number, cambios: Partial<Operario>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      distribucionOperarios: jornadaActual.distribucionOperarios.map((operario) =>
        operario.id === id ? { ...operario, ...cambios } : operario,
      ),
    }));
  }

  function aplicarJornada(jornadaNueva: Partial<JornadaOperativa>) {
    setJornada(normalizarJornada(jornadaNueva));
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

    aplicarJornada(JSON.parse(jornadaGuardada) as JornadaOperativa);
    setMensajeGuardado("Jornada cargada desde este navegador");
  }

  function limpiarJornada() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    aplicarJornada(jornadaInicial);
    setNuevoCliente({ nombre: "", email: "", importeCobrado: "" });
    setNuevoGasto({ concepto: "", importe: "" });
    setNuevoOperario({ nombre: "", importeAsignado: "" });
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

  function agregarGasto() {
    if (!nuevoGasto.concepto.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosComunes: [
        ...jornadaActual.gastosComunes,
        { id: crearId(), concepto: nuevoGasto.concepto, importe: Number(nuevoGasto.importe || 0) },
      ],
    }));
    setNuevoGasto({ concepto: "", importe: "" });
  }

  function agregarOperario() {
    if (!nuevoOperario.nombre.trim()) return;

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      distribucionOperarios: [
        ...jornadaActual.distribucionOperarios,
        {
          id: crearId(),
          nombre: nuevoOperario.nombre,
          importeAsignado: Number(nuevoOperario.importeAsignado || 0),
        },
      ],
    }));
    setNuevoOperario({ nombre: "", importeAsignado: "" });
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

  function eliminarGasto(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      gastosComunes: jornadaActual.gastosComunes.filter((gasto) => gasto.id !== id),
    }));
  }

  function eliminarOperario(id: number) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      distribucionOperarios: jornadaActual.distribucionOperarios.filter((operario) => operario.id !== id),
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
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#66745c]">
              Plataforma Operativa
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">HubYa Operativo</h1>
            <p className="mt-2 text-[#66745c]">Reporte económico completo de la jornada del Hub.</p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button onClick={guardarJornada} className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm">
                Guardar jornada
              </button>
              <button onClick={cargarJornada} className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm">
                Cargar jornada
              </button>
              <button onClick={limpiarJornada} className="rounded-full border border-[#d6b7b7] bg-[#fff7f7] px-4 py-2 text-sm font-bold text-[#743c3c] shadow-sm">
                Limpiar
              </button>
            </div>
            <p className="text-xs font-medium text-[#66745c]">{mensajeGuardado}</p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">1. Datos de la jornada</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">Hub<input value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">Nombre del reporte<input value={jornada.nombreReporte} onChange={(e) => actualizarJornada({ nombreReporte: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold">Tiempo efectivo por operario<input value={jornada.tiempoEfectivoPorOperario} onChange={(e) => actualizarJornada({ tiempoEfectivoPorOperario: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
                <label className="grid gap-2 text-sm font-semibold">Estado operativo<input value={jornada.estadoOperativo} onChange={(e) => actualizarJornada({ estadoOperativo: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none" /></label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">2. Clientes / ingresos</h2><strong>{formatoMoneda(totalFacturado)}</strong></div>
              <div className="mt-5 space-y-3">
                {jornada.clientes.map((cliente) => (
                  <div key={cliente.id} className={`rounded-2xl border p-4 ${cliente.id === jornada.clienteActivoId ? "border-[#1f2a1d] bg-[#eef4ea]" : "border-[#d5ddcf]"}`}>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
                      <input aria-label="Nombre del cliente" value={cliente.nombre} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input aria-label="Email del cliente" value={cliente.email} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { email: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input aria-label="Importe cobrado" type="number" value={cliente.importeCobrado} onFocus={() => actualizarJornada({ clienteActivoId: cliente.id })} onChange={(e) => actualizarCliente(cliente.id, { importeCobrado: Number(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
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
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">3. Gastos comunes</h2><strong>{formatoMoneda(totalGastos)}</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.gastosComunes.map((gasto) => (
                    <div key={gasto.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_130px_auto]">
                      <input value={gasto.concepto} onChange={(e) => actualizarGasto(gasto.id, { concepto: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input type="number" value={gasto.importe} onChange={(e) => actualizarGasto(gasto.id, { importe: Number(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
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
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">4. Distribución</h2><strong>{formatoMoneda(totalDistribuido)}</strong></div>
                <div className="mt-5 space-y-3">
                  {jornada.distribucionOperarios.map((operario) => (
                    <div key={operario.id} className="grid gap-2 rounded-2xl border border-[#d5ddcf] p-3 md:grid-cols-[1fr_130px_auto]">
                      <input value={operario.nombre} onChange={(e) => actualizarOperario(operario.id, { nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <input type="number" value={operario.importeAsignado} onChange={(e) => actualizarOperario(operario.id, { importeAsignado: Number(e.target.value) })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                      <button onClick={() => eliminarOperario(operario.id)} className="rounded-xl border border-[#d6b7b7] px-3 py-2 text-sm font-bold text-[#743c3c]">Quitar</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#e1e6dc] pt-4 md:grid-cols-[1fr_130px_auto]">
                  <input placeholder="Operario" value={nuevoOperario.nombre} onChange={(e) => setNuevoOperario({ ...nuevoOperario, nombre: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <input placeholder="Importe" type="number" value={nuevoOperario.importeAsignado} onChange={(e) => setNuevoOperario({ ...nuevoOperario, importeAsignado: e.target.value })} className="rounded-xl border border-[#d5ddcf] px-3 py-2" />
                  <button onClick={agregarOperario} className="rounded-xl bg-[#1f2a1d] px-3 py-2 font-bold text-white">Agregar</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">Resumen económico</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span>Total facturado al Hub</span><strong>{formatoMoneda(totalFacturado)}</strong></div>
                <div className="flex justify-between"><span>Total gastos</span><strong>{formatoMoneda(totalGastos)}</strong></div>
                <div className="flex justify-between border-t border-[#e1e6dc] pt-3 text-lg"><span>Total a distribuir</span><strong>{formatoMoneda(totalADistribuir)}</strong></div>
                <div className="flex justify-between"><span>Total distribuido</span><strong>{formatoMoneda(totalDistribuido)}</strong></div>
              </div>
              <div className={`mt-5 rounded-2xl p-4 font-bold ${distribucionCerrada ? "bg-[#eaf6e8] text-[#265b2b]" : "bg-[#fff3df] text-[#8a5300]"}`}>
                {distribucionCerrada
                  ? "Distribución cerrada correctamente"
                  : `Atención: hay una diferencia de ${formatoMoneda(diferenciaDistribucion)}`}
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
                <p>Asunto: {jornada.nombreReporte}</p>
                <p className="mt-4">Hola {clienteActivo?.nombre || "cliente"},</p>
                <p className="mt-4">Compartimos la vista privada de la jornada {jornada.fecha} de {jornada.hub}. Por privacidad, los demás participantes figuran anonimizados.</p>

                <p className="mt-4 font-bold">Participantes e ingresos</p>
                {jornada.clientes.map((cliente, index) => (
                  <div key={cliente.id} className="flex justify-between gap-4">
                    <span>{nombrePrivado(cliente, index)}</span>
                    <span>{formatoMoneda(cliente.importeCobrado)}</span>
                  </div>
                ))}
                {clienteActivo && <p className="mt-2">Tu importe cobrado: <strong>{formatoMoneda(clienteActivo.importeCobrado)}</strong></p>}

                <p className="mt-4 font-bold">Gastos comunes</p>
                {jornada.gastosComunes.map((gasto) => (
                  <div key={gasto.id} className="flex justify-between gap-4"><span>{gasto.concepto}</span><span>{formatoMoneda(gasto.importe)}</span></div>
                ))}

                <p className="mt-4 font-bold">Distribución entre operarios</p>
                {jornada.distribucionOperarios.map((operario) => (
                  <div key={operario.id} className="flex justify-between gap-4"><span>{operario.nombre}</span><span>{formatoMoneda(operario.importeAsignado)}</span></div>
                ))}

                <div className="mt-4 space-y-1 border-t border-white/20 pt-4 font-bold">
                  <div className="flex justify-between"><span>Total facturado al Hub</span><span>{formatoMoneda(totalFacturado)}</span></div>
                  <div className="flex justify-between"><span>Total gastos</span><span>{formatoMoneda(totalGastos)}</span></div>
                  <div className="flex justify-between"><span>Total a distribuir</span><span>{formatoMoneda(totalADistribuir)}</span></div>
                </div>

                <p className="mt-4"><strong>Tiempo efectivo:</strong> {jornada.tiempoEfectivoPorOperario}</p>
                <p><strong>Estado operativo:</strong> {jornada.estadoOperativo}</p>
                <p className="mt-4">Saludos,<br />HubYa</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
