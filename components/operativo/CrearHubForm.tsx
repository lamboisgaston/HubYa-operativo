"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { HubCategorySelector } from "@/components/hubs/HubCategorySelector";
import { BranchSelector } from "@/components/hubs/BranchSelector";

type HubCreado = { nombre: string; slug: string };

export function CrearHubForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function crearHub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje("");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      nombre: String(data.get("nombre") || ""),
      zona: String(data.get("zona") || ""),
      descripcionPublica: String(data.get("descripcionPublica") || ""),
      branchId: String(data.get("branchId") || ""),
      categoriaId: String(data.get("categoriaId") || ""),
    };

    startTransition(() => {
      void fetch("/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body?.error || "No se pudo crear el Hub.");
          return body as HubCreado;
        })
        .then((hub) => {
          form.reset();
          setAbierto(false);
          setMensaje(`Hub creado correctamente: ${hub.nombre}`);
          router.refresh();
        })
        .catch((err) => setError(err instanceof Error ? err.message : "No se pudo crear el Hub."));
    });
  }

  return (
    <div className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setAbierto((actual) => !actual)}
          className="rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#33402f]"
        >
          Crear nuevo Hub
        </button>
        <a href="/" target="_blank" rel="noreferrer" className="rounded-2xl border border-[#b7c3ad] bg-[#f8faf5] px-5 py-3 text-sm font-black text-[#1f2a1d] transition hover:bg-[#eef4ea]">Ver web pública</a>
        <a href="/operativo/contactos" className="rounded-2xl border border-[#b7c3ad] bg-[#f8faf5] px-5 py-3 text-sm font-black text-[#1f2a1d] transition hover:bg-[#eef4ea]">Importar contactos</a>
        <a href="#base-general" className="rounded-2xl border border-[#b7c3ad] bg-[#f8faf5] px-5 py-3 text-sm font-black text-[#1f2a1d] transition hover:bg-[#eef4ea]">Base de usuarios</a>
        <a href="/operativo/reportes" className="rounded-2xl border border-[#b7c3ad] bg-[#f8faf5] px-5 py-3 text-sm font-black text-[#1f2a1d] transition hover:bg-[#eef4ea]">Reportes generales</a>
      </div>

      {mensaje && <p className="mt-4 rounded-xl bg-[#eef8e6] px-4 py-3 text-sm font-black text-[#1f5f2a]">{mensaje}</p>}
      {error && <p className="mt-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-black text-[#743c3c]">{error}</p>}

      {abierto && (
        <form onSubmit={crearHub} className="mt-5 grid gap-3 rounded-2xl bg-[#f8faf5] p-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-black text-[#66745c]">Nombre del Hub<input name="nombre" required className="rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 font-bold text-[#1f2a1d] outline-none" placeholder="Hub Las Lomas" /></label>
          <label className="grid gap-1 text-sm font-black text-[#66745c]">Ciudad / zona<input name="zona" required className="rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 font-bold text-[#1f2a1d] outline-none" placeholder="Las Lomas" /></label>
          <BranchSelector />
          <HubCategorySelector />
          <label className="grid gap-1 text-sm font-black text-[#66745c] md:col-span-2">Descripción opcional<textarea name="descripcionPublica" rows={3} className="rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 font-bold text-[#1f2a1d] outline-none" placeholder="Descripción pública del Hub" /></label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button disabled={isPending} className="rounded-xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Guardar</button>
            <button type="button" onClick={() => setAbierto(false)} className="rounded-xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
