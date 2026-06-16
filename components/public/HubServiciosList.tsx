import type { HubServicioPublico } from "@/lib/data/hubs";

function nombresPostulantes(servicio: HubServicioPublico) {
  return servicio.postulantes.map((postulante) => postulante.oferta_nombre).join(", ") || "Sin postulantes registrados";
}

export function HubServiciosList({ servicios, compacto = false }: { servicios: HubServicioPublico[]; compacto?: boolean }) {
  if (servicios.length === 0) {
    return <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-[#9ca3af]">Este Hub todavía no tiene demandas/servicios cargados.</p>;
  }

  return (
    <div className={compacto ? "mt-5 grid gap-3" : "mt-8 grid gap-4"}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#06b6d4]">Demandas / Servicios del Hub</p>
      {servicios.map((servicio, index) => (
        <article key={servicio.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4f46e5]/20 text-xs font-black text-[#c7d2fe]">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <h4 className={compacto ? "font-black text-white" : "text-lg font-black text-white"}>{servicio.nombre_servicio}</h4>
              {!compacto && <p className="mt-1 text-sm text-[#9ca3af]">{servicio.descripcion}</p>}
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-emerald-200">Vínculo activo</dt>
                  <dd className="mt-1 font-black text-white">{servicio.vinculoActivo?.oferta_nombre || "Sin vínculo activo"}</dd>
                  {!compacto && servicio.vinculoActivo?.responsable && <p className="mt-1 text-xs font-semibold text-emerald-100/80">Responsable: {servicio.vinculoActivo.responsable}</p>}
                </div>
                <div className="rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/10 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#a5f3fc]">Postulantes</dt>
                  <dd className="mt-1 font-semibold text-white">{nombresPostulantes(servicio)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
