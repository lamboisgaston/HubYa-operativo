"use client";

import { useState } from "react";
import type { HubInformacionImportante } from "@/lib/data/hubs";

type Props = { hubSlug: string; informacion?: HubInformacionImportante };

const infoVacia: HubInformacionImportante = { titulo: "", texto: "", mostrarEnWebPublica: false, mostrarEnReporte: false };

export function HubInformacionImportanteEditor({ hubSlug, informacion }: Props) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<HubInformacionImportante>({ ...infoVacia, ...informacion });
  const [guardado, setGuardado] = useState(false);
  const [estado, setEstado] = useState("");

  async function guardar() {
    setEstado("Guardando información...");
    const respuesta = await fetch(`/api/hubs/${hubSlug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ informacionImportante: form }) });
    if (!respuesta.ok) {
      setEstado("No se pudo guardar la información del Hub.");
      return;
    }
    setGuardado(true);
    setEditando(false);
    setEstado("Información del Hub actualizada correctamente.");
  }

  function cancelar() {
    setForm({ ...infoVacia, ...informacion });
    setEditando(false);
    setEstado("");
  }

  return (
    <section className="rounded-[2rem] border border-[#bfd3b8] bg-[#fbfdf8] p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d7032]">Información importante del Hub</p>
          <h2 className="mt-1 text-xl font-black">Texto editable para comunicar mejor el propósito del Hub</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-[#66745c]">Este mensaje puede mostrarse en la web pública y/o en el reporte, según lo que actives.</p>
        </div>
        {!editando && <button onClick={() => setEditando(true)} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white">Editar información</button>}
      </div>

      {editando ? (
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">Título informativo<input value={form.titulo} onChange={(e) => setForm((actual) => ({ ...actual, titulo: e.target.value }))} className="h-11 rounded-xl border border-[#cfd8c6] bg-white px-3 text-sm font-semibold normal-case outline-none" /></label>
          <label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">Texto / descripción manual<textarea value={form.texto} onChange={(e) => setForm((actual) => ({ ...actual, texto: e.target.value }))} className="min-h-32 rounded-xl border border-[#cfd8c6] bg-white p-3 text-sm font-semibold normal-case outline-none" /></label>
          <div className="flex flex-wrap gap-4 text-sm font-black text-[#1f2a1d]"><label className="flex items-center gap-2"><input type="checkbox" checked={form.mostrarEnWebPublica} onChange={(e) => setForm((actual) => ({ ...actual, mostrarEnWebPublica: e.target.checked }))} /> Mostrar en web pública</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.mostrarEnReporte} onChange={(e) => setForm((actual) => ({ ...actual, mostrarEnReporte: e.target.checked }))} /> Mostrar en reporte</label></div>
          <div className="flex flex-wrap gap-2"><button onClick={guardar} className="rounded-xl bg-[#5d7032] px-4 py-2 text-sm font-black text-white">Guardar</button><button onClick={cancelar} className="rounded-xl border border-[#cfd8c6] bg-white px-4 py-2 text-sm font-black">Cancelar</button></div>
        </div>
      ) : (
        <article className="mt-5 rounded-2xl border border-[#d8dfd1] bg-white p-4">
          <h3 className="text-lg font-black">{form.titulo || "Sin título cargado"}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#4f5f47]">{form.texto || "Todavía no hay información importante cargada para este Hub."}</p>
          <p className="mt-3 text-xs font-black uppercase text-[#66745c]">Web pública: {form.mostrarEnWebPublica ? "sí" : "no"} · Reporte: {form.mostrarEnReporte ? "sí" : "no"}</p>
        </article>
      )}
      {(estado || guardado) && <p className="mt-3 rounded-xl border border-[#cfe0c8] bg-[#eef7ea] px-3 py-2 text-sm font-black text-[#2f6d32]">{estado || "Información del Hub actualizada correctamente."}</p>}
    </section>
  );
}
