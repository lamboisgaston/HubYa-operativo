"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Cliente, HubOperativo, TarifaClienteHub, TipoDestinoContacto } from "@/lib/data/hubs";

type Props = { hubs: HubOperativo[]; contactos: Cliente[] };
type ContactoEditable = Cliente & { seleccionado?: boolean; sucio?: boolean; eliminando?: boolean; nuevo?: boolean };

const tarifasCliente: Array<{ value: TarifaClienteHub; label: string }> = [
  { value: "tarifa_1", label: "Tarifa 1" },
  { value: "tarifa_2", label: "Tarifa 2" },
  { value: "tarifa_3", label: "Tarifa 3" },
  { value: "sin_tarifa", label: "Sin tarifa asignada" },
];

const tipos: Array<{ value: TipoDestinoContacto; label: string }> = [
  { value: "cliente", label: "Cliente / vecino" },
  { value: "actor", label: "Actor / equipo" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "ignorar", label: "Ignorar" },
];

function normalizar(valor: string) {
  return valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function tipoLabel(tipoDestino: TipoDestinoContacto | undefined) {
  return tipos.find((tipo) => tipo.value === tipoDestino)?.label || "Cliente / vecino";
}

function prepararFilas(contactos: Cliente[]): ContactoEditable[] {
  return contactos.map((contacto) => ({ ...contacto, seleccionado: false, sucio: false, eliminando: false, nuevo: false }));
}

function crearFilaNueva(hubId = ""): ContactoEditable {
  const timestamp = new Date().toISOString();
  return {
    id: `nuevo-contacto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre: "",
    email: "",
    whatsapp: "",
    referencia: "Alta manual",
    tarifaCliente: "sin_tarifa",
    hubId,
    tipoDestino: "cliente",
    estado: "activo",
    createdAt: timestamp,
    updatedAt: timestamp,
    seleccionado: false,
    sucio: true,
    eliminando: false,
    nuevo: true,
  };
}

function emailInvalido(email: string) {
  const limpio = email.trim();
  return Boolean(limpio) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio);
}

export function ContactosMesaTrabajo({ hubs, contactos }: Props) {
  const router = useRouter();
  const [filas, setFilas] = useState<ContactoEditable[]>(() => prepararFilas(contactos));
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFilas((actuales) => {
      const sucias = new Set(actuales.filter((fila) => fila.sucio).map((fila) => fila.id));
      if (sucias.size > 0) return actuales;
      return prepararFilas(contactos);
    });
  }, [contactos]);

  const hubPorId = useMemo(() => new Map(hubs.map((hub) => [hub.id, hub.nombre])), [hubs]);
  const filasFiltradas = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return filas;
    return filas.filter((fila) => normalizar([
      fila.nombre,
      fila.email,
      fila.whatsapp,
      fila.referencia || "",
      hubPorId.get(fila.hubId) || fila.hubId,
      tipoLabel(fila.tipoDestino),
    ].join(" ")).includes(q));
  }, [busqueda, filas, hubPorId]);

  function actualizar(id: string, cambios: Partial<ContactoEditable>) {
    setFilas((actuales) => actuales.map((fila) => fila.id === id ? { ...fila, ...cambios, sucio: cambios.seleccionado === undefined && cambios.eliminando === undefined ? true : fila.sucio } : fila));
  }

  function agregarUsuario() {
    setBusqueda("");
    setFilas((actuales) => [crearFilaNueva(), ...actuales]);
    setMensaje("Completá la fila nueva, seleccioná el Hub asignado y tocá Guardar cambios para agregar el usuario.");
  }

  async function guardar(ids?: string[]) {
    const pendientes = filas.filter((fila) => fila.sucio && (fila.nuevo || !ids || ids.includes(fila.id)));
    if (pendientes.length === 0) { setMensaje("No hay cambios pendientes para guardar."); return; }
    const sinNombre = pendientes.find((fila) => !fila.nombre.trim());
    if (sinNombre) { setMensaje("No se puede guardar usuario sin nombre."); return; }
    setMensaje("Guardando cambios en la base de datos...");
    const guardados = await Promise.all(pendientes.map((fila) => fetch(fila.nuevo ? "/api/contactos" : `/api/contactos/${fila.id}`, {
      method: fila.nuevo ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: fila.nombre, email: fila.email, whatsapp: fila.whatsapp, referencia: fila.referencia || "", tarifaCliente: fila.tarifaCliente, hubId: fila.hubId, tipoDestino: fila.tipoDestino }),
    }).then((res) => { if (!res.ok) throw new Error(`No se pudo guardar ${fila.nombre}`); return res.json() as Promise<Cliente>; }).then((contacto) => ({ temporalId: fila.id, contacto, eraNuevo: Boolean(fila.nuevo) }))));

    const guardadosPorId = new Map(guardados.map((item) => [item.temporalId, item]));
    setFilas((actuales) => actuales.map((fila) => {
      const guardado = guardadosPorId.get(fila.id);
      return guardado ? { ...fila, ...guardado.contacto, sucio: false, seleccionado: false, nuevo: false } : fila;
    }));
    const nuevos = guardados.filter((item) => item.eraNuevo);
    if (nuevos.length === 1) {
      const hub = hubPorId.get(nuevos[0].contacto.hubId);
      setMensaje(hub ? `Usuario agregado a ${hub}` : "Usuario agregado correctamente");
    } else if (nuevos.length > 1) {
      setMensaje(`${nuevos.length} usuarios agregados correctamente. Los contadores de Hubs se actualizaron.`);
    } else {
      setMensaje("Cambios guardados en la base de datos. Los contadores de Hubs se actualizaron.");
    }
    router.refresh();
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
        setMensaje("Contacto eliminado de la base activa. Los contadores de Hubs se actualizaron.");
        router.refresh();
      }).catch((error) => {
        actualizar(id, { eliminando: false });
        setMensaje(error instanceof Error ? error.message : "No se pudo eliminar el contacto.");
      });
    });
  }

  const idsSeleccionados = filas.filter((fila) => fila.seleccionado).map((fila) => fila.id);

  return (
    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Base general</p>
          <h2 className="mt-1 text-2xl font-black">Toda la base real de usuarios/contactos</h2>
          <p className="mt-1 text-sm font-bold text-[#66745c]">Mostrando {filasFiltradas.length} de {filas.length} usuarios</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={agregarUsuario} disabled={isPending} className="rounded-xl bg-[#2f6d32] px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60">Agregar usuario</button>
          <button onClick={() => guardarTransicion(idsSeleccionados.length > 0 ? idsSeleccionados : undefined)} disabled={isPending} className="rounded-xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Guardar cambios</button>
          <button onClick={() => setFilas((actuales) => actuales.map((fila) => ({ ...fila, seleccionado: true })))} className="rounded-xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Marcar todos</button>
          <button onClick={() => setFilas((actuales) => actuales.map((fila) => ({ ...fila, seleccionado: false })))} className="rounded-xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Desmarcar todos</button>
        </div>
      </div>
      <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email, WhatsApp, referencia o Hub..." className="mt-5 w-full rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-sm font-bold outline-none" />
      {mensaje && <p className="mt-3 rounded-xl bg-[#eef4ea] px-4 py-2 text-sm font-black text-[#1f2a1d]">{mensaje}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d8dfd1]">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead className="bg-[#f1f4ec] text-left text-[10px] uppercase tracking-wide text-[#66745c]"><tr>{["Marcar", "Nombre", "Email", "WhatsApp / teléfono", "Referencia", "Tarifa del cliente", "Hub asignado", "Tipo de destino", "Estado", "Acciones"].map((h) => <th key={h} className="border border-[#d8dfd1] p-2">{h}</th>)}</tr></thead>
          <tbody>{filasFiltradas.length === 0 ? <tr><td colSpan={10} className="border p-6 text-center font-bold text-[#66745c]">No hay contactos que coincidan con la búsqueda.</td></tr> : filasFiltradas.map((fila) => <tr key={fila.id} className={fila.sucio ? "bg-[#fff8df]" : "bg-white"}>
            <td className="border p-2 text-center"><input type="checkbox" checked={Boolean(fila.seleccionado)} onChange={(e) => actualizar(fila.id, { seleccionado: e.target.checked })} /></td>
            <td className="border p-1"><input value={fila.nombre} onChange={(e) => actualizar(fila.id, { nombre: e.target.value })} className="min-w-40 rounded border px-2 py-1 font-bold" /></td>
            <td className="border p-1"><input value={fila.email} onChange={(e) => actualizar(fila.id, { email: e.target.value })} className={`min-w-52 rounded border px-2 py-1 ${emailInvalido(fila.email) ? "border-[#743c3c] bg-[#fff4f4]" : ""}`} />{!fila.email.trim() && <p className="mt-1 text-[10px] font-black text-[#8a6a16]">Sin email cargado</p>}{emailInvalido(fila.email) && <p className="mt-1 text-[10px] font-black text-[#743c3c]">Email inválido</p>}</td>
            <td className="border p-1"><input value={fila.whatsapp} onChange={(e) => actualizar(fila.id, { whatsapp: e.target.value })} className="min-w-40 rounded border px-2 py-1" /></td>
            <td className="border p-1"><input value={fila.referencia || ""} onChange={(e) => actualizar(fila.id, { referencia: e.target.value })} className="min-w-48 rounded border px-2 py-1" /></td>
            <td className="border p-1"><select value={fila.tarifaCliente || "sin_tarifa"} onChange={(e) => actualizar(fila.id, { tarifaCliente: e.target.value as TarifaClienteHub })} className="min-w-40 rounded border bg-white px-2 py-1">{tarifasCliente.map((tarifa) => <option key={tarifa.value} value={tarifa.value}>{tarifa.label}</option>)}</select></td>
            <td className="border p-1"><select value={fila.hubId} onChange={(e) => actualizar(fila.id, { hubId: e.target.value })} className="min-w-48 rounded border bg-white px-2 py-1"><option value="">Sin Hub asignado</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.nombre}</option>)}</select></td>
            <td className="border p-1"><select value={fila.tipoDestino || "cliente"} onChange={(e) => actualizar(fila.id, { tipoDestino: e.target.value as TipoDestinoContacto })} className="min-w-40 rounded border bg-white px-2 py-1">{tipos.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></td>
            <td className="border p-2 font-bold capitalize text-[#66745c]">{fila.nuevo ? "Nuevo" : fila.estado}</td>
            <td className="border p-2"><div className="flex flex-wrap gap-2"><button onClick={() => guardarTransicion([fila.id])} disabled={isPending || !fila.sucio} className="font-black text-[#1f2a1d] disabled:opacity-40">Guardar</button><button onClick={() => fila.nuevo ? setFilas((actuales) => actuales.filter((item) => item.id !== fila.id)) : eliminar(fila.id)} disabled={fila.eliminando} className="font-black text-[#743c3c] disabled:opacity-40">Eliminar</button>{fila.tipoDestino === "actor" || fila.tipoDestino === "auxiliar" ? <Link href="/operativo/perfiles" className="font-black text-[#355f8f]">Ver perfil</Link> : <span className="font-bold text-[#9aa391]">Sin perfil</span>}</div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
