"use client";

import { useMemo, useState, useTransition } from "react";
import type { Cliente, HubOperativo, TipoDestinoContacto } from "@/lib/data/hubs";

type Props = { hubs: HubOperativo[]; contactos: Cliente[] };
type ContactoEditable = Cliente & { seleccionado?: boolean; sucio?: boolean; eliminando?: boolean };
const tipos: Array<{ value: TipoDestinoContacto; label: string }> = [
  { value: "cliente", label: "Cliente / vecino" },
  { value: "actor", label: "Actor / equipo" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "ignorar", label: "Ignorar" },
];

function normalizar(valor: string) {
  return valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function ContactosMesaTrabajo({ hubs, contactos }: Props) {
  const [filas, setFilas] = useState<ContactoEditable[]>(contactos.map((contacto) => ({ ...contacto, seleccionado: false, sucio: false })));
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isPending, startTransition] = useTransition();
  const hubPorId = useMemo(() => new Map(hubs.map((hub) => [hub.id, hub.nombre])), [hubs]);
  const filasFiltradas = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return filas;
    return filas.filter((fila) => normalizar([fila.nombre, fila.email, fila.whatsapp, fila.referencia || "", hubPorId.get(fila.hubId) || fila.hubId].join(" ")).includes(q));
  }, [busqueda, filas, hubPorId]);

  function actualizar(id: string, cambios: Partial<ContactoEditable>) {
    setFilas((actuales) => actuales.map((fila) => fila.id === id ? { ...fila, ...cambios, sucio: cambios.seleccionado === undefined ? true : fila.sucio } : fila));
  }

  async function guardar(ids?: string[]) {
    const pendientes = filas.filter((fila) => fila.sucio && (!ids || ids.includes(fila.id)));
    if (pendientes.length === 0) { setMensaje("No hay cambios pendientes para guardar."); return; }
    setMensaje("Guardando asignaciones...");
    await Promise.all(pendientes.map((fila) => fetch(`/api/contactos/${fila.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: fila.nombre, email: fila.email, whatsapp: fila.whatsapp, referencia: fila.referencia || "", hubId: fila.hubId, tipoDestino: fila.tipoDestino }),
    }).then((res) => { if (!res.ok) throw new Error(`No se pudo guardar ${fila.nombre}`); return res.json(); })));
    setFilas((actuales) => actuales.map((fila) => pendientes.some((pendiente) => pendiente.id === fila.id) ? { ...fila, sucio: false } : fila));
    setMensaje("Asignaciones guardadas en la base de datos.");
  }

  function guardarTransicion(ids?: string[]) {
    startTransition(() => { void guardar(ids).catch((error) => setMensaje(error instanceof Error ? error.message : "No se pudieron guardar los cambios.")); });
  }

  function eliminar(id: string) {
    const fila = filas.find((item) => item.id === id);
    if (!fila || !window.confirm(`¿Eliminar el contacto ${fila.nombre}?`)) return;
    actualizar(id, { eliminando: true });
    startTransition(() => {
      void fetch(`/api/contactos/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar el contacto.");
        setFilas((actuales) => actuales.filter((item) => item.id !== id));
        setMensaje("Contacto eliminado de la lista activa.");
      }).catch((error) => setMensaje(error instanceof Error ? error.message : "No se pudo eliminar el contacto."));
    });
  }

  return (
    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Mesa de trabajo</p>
          <h2 className="mt-1 text-2xl font-black">Usuarios/contactos para asignar a Hubs</h2>
          <p className="mt-1 text-sm font-bold text-[#66745c]">Esta lista está visible en operaciones y guarda cada cambio mediante la API de contactos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => guardarTransicion(filas.some((f) => f.seleccionado) ? filas.filter((f) => f.seleccionado).map((f) => f.id) : undefined)} disabled={isPending} className="rounded-xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Guardar asignaciones</button>
          <button onClick={() => setFilas((actuales) => actuales.map((fila) => ({ ...fila, seleccionado: true })))} className="rounded-xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Marcar todos</button>
          <button onClick={() => setFilas((actuales) => actuales.map((fila) => ({ ...fila, seleccionado: false })))} className="rounded-xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Desmarcar todos</button>
          <a href="/operativo/contactos" className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-sm font-black">Importar nuevos contactos</a>
        </div>
      </div>
      <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email, WhatsApp, referencia o Hub" className="mt-5 w-full rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-sm font-bold outline-none" />
      {mensaje && <p className="mt-3 rounded-xl bg-[#eef4ea] px-4 py-2 text-sm font-black text-[#1f2a1d]">{mensaje}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d8dfd1]">
        <table className="min-w-[1100px] w-full border-collapse text-sm">
          <thead className="bg-[#f1f4ec] text-left text-[10px] uppercase tracking-wide text-[#66745c]"><tr>{["Marcar", "Nombre", "Email", "WhatsApp", "Referencia", "Hub asignado", "Tipo de destino", "Acciones"].map((h) => <th key={h} className="border border-[#d8dfd1] p-2">{h}</th>)}</tr></thead>
          <tbody>{filasFiltradas.length === 0 ? <tr><td colSpan={8} className="border p-6 text-center font-bold text-[#66745c]">No hay contactos que coincidan con la búsqueda.</td></tr> : filasFiltradas.map((fila) => <tr key={fila.id} className={fila.sucio ? "bg-[#fff8df]" : "bg-white"}>
            <td className="border p-2 text-center"><input type="checkbox" checked={Boolean(fila.seleccionado)} onChange={(e) => actualizar(fila.id, { seleccionado: e.target.checked })} /></td>
            <td className="border p-1"><input value={fila.nombre} onChange={(e) => actualizar(fila.id, { nombre: e.target.value })} className="min-w-40 rounded border px-2 py-1 font-bold" /></td>
            <td className="border p-1"><input value={fila.email} onChange={(e) => actualizar(fila.id, { email: e.target.value })} className="min-w-48 rounded border px-2 py-1" /></td>
            <td className="border p-1"><input value={fila.whatsapp} onChange={(e) => actualizar(fila.id, { whatsapp: e.target.value })} className="min-w-36 rounded border px-2 py-1" /></td>
            <td className="border p-1"><input value={fila.referencia || ""} onChange={(e) => actualizar(fila.id, { referencia: e.target.value })} className="min-w-48 rounded border px-2 py-1" /></td>
            <td className="border p-1"><select value={fila.hubId} onChange={(e) => actualizar(fila.id, { hubId: e.target.value })} className="min-w-48 rounded border bg-white px-2 py-1"><option value="">Sin Hub asignado</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.nombre}</option>)}</select></td>
            <td className="border p-1"><select value={fila.tipoDestino || "cliente"} onChange={(e) => actualizar(fila.id, { tipoDestino: e.target.value as TipoDestinoContacto })} className="min-w-36 rounded border bg-white px-2 py-1">{tipos.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></td>
            <td className="border p-2"><div className="flex gap-2"><button onClick={() => guardarTransicion([fila.id])} disabled={isPending || !fila.sucio} className="font-black text-[#1f2a1d] disabled:opacity-40">Guardar</button><button onClick={() => eliminar(fila.id)} disabled={fila.eliminando} className="font-black text-[#743c3c]">Eliminar</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
