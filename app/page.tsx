"use client";

import { useMemo, useState } from "react";

type ReporteCliente = {
  trabajoRealizado: string;
  trabajoPendiente: string;
  capataz: number;
  ayudante: number;
  maquinaria: number;
  traslado: number;
  combustible: number;
  informe: number;
  utilidad: number;
  totalCobrado: number;
};

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  reporte: ReporteCliente;
};

type JornadaOperativa = {
  hub: string;
  fecha: string;
  clientes: Cliente[];
  clienteActivoId: number;
};

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";

const reporteInicial: ReporteCliente = {
  trabajoRealizado: "Se realizó corte de césped, limpieza general, bordeado y soplado final.",
  trabajoPendiente:
    "No se realizó poda alta por falta de tiempo operativo. Se recomienda programarla para próxima visita.",
  capataz: 15000,
  ayudante: 10000,
  maquinaria: 3000,
  traslado: 4000,
  combustible: 2000,
  informe: 2500,
  utilidad: 8500,
  totalCobrado: 45000,
};

const clientesIniciales: Cliente[] = [
  {
    id: 1,
    nombre: "Carolina Yovi",
    email: "carolina@email.com",
    reporte: reporteInicial,
  },
  {
    id: 2,
    nombre: "Gabriela Aguiar",
    email: "gabriela@email.com",
    reporte: {
      ...reporteInicial,
      trabajoRealizado: "Se realizó mantenimiento de canteros, riego manual y retiro de residuos verdes.",
      trabajoPendiente: "Quedó pendiente reponer chips decorativos en el ingreso principal.",
      totalCobrado: 38000,
      utilidad: 6000,
    },
  },
  {
    id: 3,
    nombre: "Fleming",
    email: "fleming@email.com",
    reporte: {
      ...reporteInicial,
      trabajoRealizado: "Se realizó desmalezado, limpieza de perímetro y control visual del sistema de riego.",
      trabajoPendiente: "Quedó pendiente revisar una pérdida menor en el sector del fondo.",
      totalCobrado: 52000,
      capataz: 18000,
      ayudante: 12000,
      utilidad: 10500,
    },
  },
];

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  clientes: clientesIniciales,
  clienteActivoId: 1,
};

const camposEconomicos: Array<[keyof ReporteCliente, string]> = [
  ["capataz", "Capataz"],
  ["ayudante", "Ayudante"],
  ["maquinaria", "Maquinaria"],
  ["traslado", "Traslado"],
  ["combustible", "Combustible"],
  ["informe", "Informe"],
  ["utilidad", "Utilidad HubYa"],
];

function crearReporteVacio(totalCobrado: number): ReporteCliente {
  return {
    trabajoRealizado: "",
    trabajoPendiente: "",
    capataz: 0,
    ayudante: 0,
    maquinaria: 0,
    traslado: 0,
    combustible: 0,
    informe: 0,
    utilidad: 0,
    totalCobrado,
  };
}

function normalizarJornada(jornada: JornadaOperativa): JornadaOperativa {
  const clientes = jornada.clientes.map((cliente) => ({
    ...cliente,
    reporte: {
      ...crearReporteVacio(0),
      ...cliente.reporte,
    },
  }));

  return {
    hub: jornada.hub,
    fecha: jornada.fecha,
    clientes,
    clienteActivoId: clientes.some((cliente) => cliente.id === jornada.clienteActivoId)
      ? jornada.clienteActivoId
      : clientes[0]?.id || 0,
  };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [emailNuevo, setEmailNuevo] = useState("");
  const [totalNuevo, setTotalNuevo] = useState("");
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");

  const clienteActivo =
    jornada.clientes.find((cliente) => cliente.id === jornada.clienteActivoId) || jornada.clientes[0];
  const reporteActivo = clienteActivo?.reporte || crearReporteVacio(0);

  const totalDistribuido = useMemo(() => {
    return camposEconomicos.reduce((total, [campo]) => total + Number(reporteActivo[campo] || 0), 0);
  }, [reporteActivo]);

  function actualizarJornada(cambios: Partial<Pick<JornadaOperativa, "hub" | "fecha" | "clienteActivoId">>) {
    setJornada((jornadaActual) => ({ ...jornadaActual, ...cambios }));
  }

  function actualizarReporteActivo(cambios: Partial<ReporteCliente>) {
    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientes: jornadaActual.clientes.map((cliente) =>
        cliente.id === jornadaActual.clienteActivoId
          ? { ...cliente, reporte: { ...cliente.reporte, ...cambios } }
          : cliente,
      ),
    }));
  }

  function aplicarJornada(jornadaNueva: JornadaOperativa) {
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
    setNombreNuevo("");
    setEmailNuevo("");
    setTotalNuevo("");
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  function agregarCliente() {
    if (!nombreNuevo.trim() || !emailNuevo.trim()) return;

    const nuevoCliente: Cliente = {
      id: Date.now(),
      nombre: nombreNuevo,
      email: emailNuevo,
      reporte: crearReporteVacio(Number(totalNuevo || 0)),
    };

    setJornada((jornadaActual) => ({
      ...jornadaActual,
      clientes: [...jornadaActual.clientes, nuevoCliente],
      clienteActivoId: nuevoCliente.id,
    }));
    setNombreNuevo("");
    setEmailNuevo("");
    setTotalNuevo("");
  }

  function participantesPrivados() {
    return jornada.clientes.map((cliente, index) => {
      if (cliente.id === clienteActivo.id) {
        return cliente.nombre;
      }

      return `Cliente ${index + 1}`;
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f6f1] text-[#182018]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-[#d8ddcf] pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#66745c]">
              Plataforma Operativa
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">HubYa</h1>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={guardarJornada}
                className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm"
              >
                Guardar jornada
              </button>
              <button
                onClick={cargarJornada}
                className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-bold text-[#3c4937] shadow-sm"
              >
                Cargar jornada
              </button>
              <button
                onClick={limpiarJornada}
                className="rounded-full border border-[#d6b7b7] bg-[#fff7f7] px-4 py-2 text-sm font-bold text-[#743c3c] shadow-sm"
              >
                Limpiar
              </button>
            </div>
            <p className="max-w-xs text-right text-xs font-medium text-[#66745c]">{mensajeGuardado}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">1. Datos de la jornada</h2>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  Hub
                  <input
                    value={jornada.hub}
                    onChange={(e) => actualizarJornada({ hub: e.target.value })}
                    className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Fecha
                  <input
                    type="date"
                    value={jornada.fecha}
                    onChange={(e) => actualizarJornada({ fecha: e.target.value })}
                    className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">2. Clientes del Hub</h2>

              <div className="mt-5 space-y-3">
                {jornada.clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => actualizarJornada({ clienteActivoId: cliente.id })}
                    className={`w-full rounded-2xl border p-4 text-left ${
                      cliente.id === jornada.clienteActivoId
                        ? "border-[#1f2a1d] bg-[#eef4ea]"
                        : "border-[#d5ddcf] bg-white"
                    }`}
                  >
                    <p className="font-bold">{cliente.nombre}</p>
                    <p className="text-sm text-[#62705b]">{cliente.email}</p>
                    <p className="mt-1 text-sm font-semibold">
                      ${cliente.reporte.totalCobrado.toLocaleString("es-AR")}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 border-t border-[#e1e6dc] pt-5">
                <input
                  placeholder="Nombre del cliente"
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                />

                <input
                  placeholder="Email"
                  value={emailNuevo}
                  onChange={(e) => setEmailNuevo(e.target.value)}
                  className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                />

                <input
                  placeholder="Total cobrado"
                  type="number"
                  value={totalNuevo}
                  onChange={(e) => setTotalNuevo(e.target.value)}
                  className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                />

                <button
                  onClick={agregarCliente}
                  className="rounded-xl bg-[#1f2a1d] px-4 py-3 font-bold text-white"
                >
                  Agregar cliente
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">3. Reporte para {clienteActivo.nombre}</h2>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  Trabajo realizado
                  <textarea
                    value={reporteActivo.trabajoRealizado}
                    onChange={(e) => actualizarReporteActivo({ trabajoRealizado: e.target.value })}
                    className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Trabajo pendiente
                  <textarea
                    value={reporteActivo.trabajoPendiente}
                    onChange={(e) => actualizarReporteActivo({ trabajoPendiente: e.target.value })}
                    className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">4. Distribución económica</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {camposEconomicos.map(([campo, label]) => (
                  <label key={campo} className="grid gap-2 text-sm font-semibold">
                    {label}
                    <input
                      type="number"
                      value={reporteActivo[campo]}
                      onChange={(e) => actualizarReporteActivo({ [campo]: Number(e.target.value) })}
                      className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                    />
                  </label>
                ))}

                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  Total cobrado
                  <input
                    type="number"
                    value={reporteActivo.totalCobrado}
                    onChange={(e) => actualizarReporteActivo({ totalCobrado: Number(e.target.value) })}
                    className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f4f6f1] p-5">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total distribuido</span>
                  <span>${totalDistribuido.toLocaleString("es-AR")}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-[#61705a]">
                  <span>Total cobrado al cliente</span>
                  <span>${reporteActivo.totalCobrado.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#1f2a1d] p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Vista previa del email privado</h2>

              <div className="mt-5 rounded-2xl bg-white/10 p-5 text-sm leading-7">
                <p>Asunto: Reporte de jornada — {jornada.hub} — {jornada.fecha}</p>

                <p className="mt-4">Hola {clienteActivo.nombre},</p>

                <p className="mt-4">
                  Te enviamos el reporte correspondiente a la jornada operativa de {jornada.hub}.
                  Durante esta jornada se trabajaron varios espacios verdes del Hub. Por privacidad,
                  los demás participantes se muestran de forma anónima.
                </p>

                <p className="mt-4 font-bold">Trabajo realizado:</p>
                <p>{reporteActivo.trabajoRealizado}</p>

                <p className="mt-4 font-bold">Trabajo pendiente:</p>
                <p>{reporteActivo.trabajoPendiente}</p>

                <p className="mt-4 font-bold">Detalle económico:</p>
                <div className="mt-2 space-y-1">
                  {camposEconomicos.map(([campo, label]) => (
                    <div key={campo} className="flex justify-between">
                      <span>{label}</span>
                      <span>${reporteActivo[campo].toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 font-bold">Resumen privado del Hub:</p>
                <div className="mt-2 space-y-1">
                  {jornada.clientes.map((cliente, index) => (
                    <div key={cliente.id} className="flex justify-between">
                      <span>{participantesPrivados()[index]}</span>
                      <span>${cliente.reporte.totalCobrado.toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 font-bold">
                  Total cobrado: ${reporteActivo.totalCobrado.toLocaleString("es-AR")}
                </p>

                <p className="mt-4">Saludos,</p>
                <p>HubYa</p>
              </div>

              <button
                onClick={() => alert("En esta primera versión todavía no enviamos el mail. Primero estamos armando la carga y la vista previa.")}
                className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-bold text-[#1f2a1d]"
              >
                Enviar reporte privado
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
