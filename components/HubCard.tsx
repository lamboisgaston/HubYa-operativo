"use client";

import { useState } from "react";
import type { HubPublico } from "@/lib/data/hubs";
import Link from "next/link";
import { HubServiciosList } from "./public/HubServiciosList";
import { JoinHubForm } from "./public/JoinHubForm";
import { HubCategoryBadge } from "@/components/hubs/HubCategoryBadge";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

function servicioPrincipal(hub: HubPublico) {
  const config = getHubCategoryConfig(hub.categoriaId);
  return hub.servicios[0]?.nombre_servicio || config.textos.servicioPrincipalFallback || hub.rama || "Servicio a coordinar";
}

export function HubCard({ hub, operativo = false }: { hub: HubPublico; operativo?: boolean }) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarAlta, setMostrarAlta] = useState(false);

  return (
    <article className="rounded-3xl border border-[#DDE7E2] bg-white p-5 shadow-lg shadow-[#DDE7E2]/60 transition hover:-translate-y-0.5 hover:border-[#BFE8CF] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          {hub.estado && <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#1E8F4D]">{hub.estado}</p>}
          <h3 className="mt-1 text-xl font-black text-[#0B1726]">{hub.nombre}</h3>
          {hub.zona && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#53685C]">{hub.zona}</p>}
          <p className="mt-1 text-xs font-black uppercase tracking-wide" style={{ color: hub.branch.color }}>{hub.branch.icon} {hub.branch.name}</p>
          <div className="mt-2"><HubCategoryBadge category={hub.categoriaId} /></div>
        </div>
        <span className="shrink-0 rounded-full border border-[#BFE8CF] bg-[#EAF7EF] px-3 py-1 text-xs font-black text-[#1E8F4D]">
          {hub.clientesActivos} integrantes
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-[#53685C]">Servicio principal de la Rama</dt>
          <dd className="mt-1 font-black text-[#0B1726]">{servicioPrincipal(hub)}</dd>
          <p className="mt-2 text-xs font-bold text-[#53685C]">Proceso: {hub.branch.processType}</p>
        </div>
        {hub.estado && (
          <div className="rounded-2xl border border-[#DDE7E2] bg-[#E8F6FF] p-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-[#53685C]">Estado del Hub</dt>
            <dd className="mt-1 font-black capitalize text-[#0B1726]">{hub.estado}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {operativo ? (
          <Link href={`/operativo/hubs/${hub.slug}`} className="rounded-xl border border-[#DDE7E2] bg-white px-4 py-2 text-center text-sm font-black text-[#0B1726] transition hover:border-[#1E8F4D] hover:bg-[#EAF7EF]">Ver detalles</Link>
        ) : (
          <button
            type="button"
            aria-expanded={mostrarDetalle}
            onClick={() => setMostrarDetalle((actual) => !actual)}
            className="rounded-xl border border-[#DDE7E2] bg-white px-4 py-2 text-sm font-black text-[#0B1726] transition hover:border-[#1E8F4D] hover:bg-[#EAF7EF]"
          >
            {mostrarDetalle ? "Ocultar detalles" : "Ver detalles"}
          </button>
        )}
        <button
          type="button"
          aria-expanded={mostrarAlta}
          onClick={() => setMostrarAlta((actual) => !actual)}
          className="rounded-xl bg-gradient-to-r from-[#1E8F4D] to-[#22C7E8] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#BFE8CF]/60"
        >
          Sumarme a este Hub
        </button>
      </div>

      {mostrarDetalle && !operativo && (
        <section className="mt-4 rounded-2xl border border-[#BFE8CF] bg-[#EAF7EF] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E8F4D]">Detalle del Hub</p>
          <p className="mt-3 text-sm leading-6 text-[#375243]">{hub.descripcionPublica}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#53685C]">Próximos pasos</p>
              <p className="mt-1 text-[#375243]">{getHubCategoryConfig(hub.categoriaId).textos.proximoPaso}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#53685C]">Estado operativo</p>
              <p className="mt-1 capitalize text-[#375243]">{hub.estado}</p>
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
