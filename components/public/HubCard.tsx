"use client";

import { useState } from "react";
import type { HubPublico } from "@/lib/data/hubs";
import { HubServiciosList } from "./HubServiciosList";
import { JoinHubForm } from "./JoinHubForm";

function servicioPrincipal(hub: HubPublico) {
  return hub.servicios[0]?.nombre_servicio || hub.rama || "Servicio a coordinar";
}

export function HubCard({ hub }: { hub: HubPublico }) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarAlta, setMostrarAlta] = useState(false);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/20 transition hover:border-[#06b6d4]/35 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between gap-3">
        <div>
          {hub.estado && <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#06b6d4]">{hub.estado}</p>}
          <h3 className="mt-1 text-xl font-black text-white">{hub.nombre}</h3>
          {hub.zona && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">{hub.zona}</p>}
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-white">
          {hub.clientesActivos} integrantes
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Servicio principal</dt>
          <dd className="mt-1 font-black text-white">{servicioPrincipal(hub)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Estado del Hub</dt>
          <dd className="mt-1 font-black capitalize text-white">{hub.estado || "Sin estado"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={mostrarDetalle}
          onClick={() => setMostrarDetalle((actual) => !actual)}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-white transition hover:border-[#06b6d4]/50 hover:bg-white/10"
        >
          {mostrarDetalle ? "Ocultar detalles" : "Ver detalles"}
        </button>
        <button
          type="button"
          aria-expanded={mostrarAlta}
          onClick={() => setMostrarAlta((actual) => !actual)}
          className="rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#06b6d4]/10"
        >
          Sumarme a este Hub
        </button>
      </div>

      {mostrarDetalle && (
        <section className="mt-4 rounded-2xl border border-[#06b6d4]/20 bg-[#06b6d4]/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a5f3fc]">Detalle del Hub</p>
          <p className="mt-3 text-sm leading-6 text-[#d1d5db]">{hub.descripcionPublica}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#6b7280]">Próximos pasos</p>
              <p className="mt-1 text-[#e5e7eb]">Sumar demanda, revisar cobertura y coordinar el servicio operativo.</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#6b7280]">Estado operativo</p>
              <p className="mt-1 capitalize text-[#e5e7eb]">{hub.estado}</p>
            </div>
          </div>
          <HubServiciosList servicios={hub.servicios} compacto />
        </section>
      )}

      {mostrarAlta && (
        <section className="mt-4">
          <JoinHubForm hubId={hub.id} hubNombre={hub.nombre} compacto />
        </section>
      )}
    </article>
  );
}
