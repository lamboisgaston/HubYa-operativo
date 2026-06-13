"use client";

import { useMemo, useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  total: number;
};

const clientesIniciales: Cliente[] = [
  { id: 1, nombre: "Carolina Yovi", email: "carolina@email.com", total: 45000 },
  { id: 2, nombre: "Gabriela Aguiar", email: "gabriela@email.com", total: 38000 },
  { id: 3, nombre: "Fleming", email: "fleming@email.com", total: 52000 },
];

export default function Home() {
  const [hub, setHub] = useState("Hub Tipal");
  const [fecha, setFecha] = useState("2026-06-13");
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [clienteActivoId, setClienteActivoId] = useState(1);

  const [nombreNuevo, setNombreNuevo] = useState("");
  const [emailNuevo, setEmailNuevo] = useState("");
  const [totalNuevo, setTotalNuevo] = useState("");

  const [realizado, setRealizado] = useState(
    "Se realizó corte de césped, limpieza general, bordeado y soplado final."
  );

  const [pendiente, setPendiente] = useState(
    "No se realizó poda alta por falta de tiempo operativo. Se recomienda programarla para próxima visita."
  );

  const [capataz, setCapataz] = useState(15000);
  const [ayudante, setAyudante] = useState(10000);
  const [maquinaria, setMaquinaria] = useState(3000);
  const [traslado, setTraslado] = useState(4000);
  const [combustible, setCombustible] = useState(2000);
  const [informe, setInforme] = useState(2500);
  const [utilidad, setUtilidad] = useState(8500);

  const clienteActivo = clientes.find((c) => c.id === clienteActivoId) || clientes[0];

  const totalDistribuido = useMemo(() => {
    return capataz + ayudante + maquinaria + traslado + combustible + informe + utilidad;
  }, [capataz, ayudante, maquinaria, traslado, combustible, informe, utilidad]);

  function agregarCliente() {
    if (!nombreNuevo.trim() || !emailNuevo.trim()) return;

    const nuevoCliente: Cliente = {
      id: Date.now(),
      nombre: nombreNuevo,
      email: emailNuevo,
      total: Number(totalNuevo || 0),
    };

    setClientes([...clientes, nuevoCliente]);
    setNombreNuevo("");
    setEmailNuevo("");
    setTotalNuevo("");
  }

  function participantesPrivados() {
    return clientes.map((cliente, index) => {
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

          <div className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-medium text-[#3c4937] shadow-sm">
            Jornada manual
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
                    value={hub}
                    onChange={(e) => setHub(e.target.value)}
                    className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Fecha
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">2. Clientes del Hub</h2>

              <div className="mt-5 space-y-3">
                {clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => setClienteActivoId(cliente.id)}
                    className={`w-full rounded-2xl border p-4 text-left ${
                      cliente.id === clienteActivoId
                        ? "border-[#1f2a1d] bg-[#eef4ea]"
                        : "border-[#d5ddcf] bg-white"
                    }`}
                  >
                    <p className="font-bold">{cliente.nombre}</p>
                    <p className="text-sm text-[#62705b]">{cliente.email}</p>
                    <p className="mt-1 text-sm font-semibold">${cliente.total.toLocaleString("es-AR")}</p>
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
                  Qué se hizo
                  <textarea
                    value={realizado}
                    onChange={(e) => setRealizado(e.target.value)}
                    className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Qué no se hizo / pendiente
                  <textarea
                    value={pendiente}
                    onChange={(e) => setPendiente(e.target.value)}
                    className="min-h-24 rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#dde4d6]">
              <h2 className="text-2xl font-bold">4. Distribución económica</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["Capataz", capataz, setCapataz],
                  ["Ayudante", ayudante, setAyudante],
                  ["Maquinaria", maquinaria, setMaquinaria],
                  ["Traslado", traslado, setTraslado],
                  ["Combustible", combustible, setCombustible],
                  ["Informe", informe, setInforme],
                  ["Utilidad HubYa", utilidad, setUtilidad],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="grid gap-2 text-sm font-semibold">
                    {label as string}
                    <input
                      type="number"
                      value={value as number}
                      onChange={(e) => (setter as (value: number) => void)(Number(e.target.value))}
                      className="rounded-xl border border-[#d5ddcf] px-4 py-3 outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#f4f6f1] p-5">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total distribuido</span>
                  <span>${totalDistribuido.toLocaleString("es-AR")}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-[#61705a]">
                  <span>Total cobrado al cliente</span>
                  <span>${clienteActivo.total.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#1f2a1d] p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Vista previa del email privado</h2>

              <div className="mt-5 rounded-2xl bg-white/10 p-5 text-sm leading-7">
                <p>Asunto: Reporte de jornada — {hub} — {fecha}</p>

                <p className="mt-4">Hola {clienteActivo.nombre},</p>

                <p className="mt-4">
                  Te enviamos el reporte correspondiente a la jornada operativa de {hub}.
                  Durante esta jornada se trabajaron varios espacios verdes del Hub. Por privacidad,
                  los demás participantes se muestran de forma anónima.
                </p>

                <p className="mt-4 font-bold">Trabajo realizado:</p>
                <p>{realizado}</p>

                <p className="mt-4 font-bold">Trabajo pendiente:</p>
                <p>{pendiente}</p>

                <p className="mt-4 font-bold">Detalle económico:</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between"><span>Capataz</span><span>${capataz.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Ayudante</span><span>${ayudante.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Maquinaria</span><span>${maquinaria.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Traslado</span><span>${traslado.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Combustible</span><span>${combustible.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Informe</span><span>${informe.toLocaleString("es-AR")}</span></div>
                  <div className="flex justify-between"><span>Utilidad HubYa</span><span>${utilidad.toLocaleString("es-AR")}</span></div>
                </div>

                <p className="mt-4 font-bold">Resumen privado del Hub:</p>
                <div className="mt-2 space-y-1">
                  {clientes.map((cliente, index) => (
                    <div key={cliente.id} className="flex justify-between">
                      <span>{participantesPrivados()[index]}</span>
                      <span>${cliente.total.toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 font-bold">
                  Total cobrado: ${clienteActivo.total.toLocaleString("es-AR")}
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
