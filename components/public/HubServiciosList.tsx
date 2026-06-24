import type { HubServicioPublico } from "@/lib/data/hubs";

function nombresPostulantes(servicio: HubServicioPublico) {
  return servicio.postulantes.map((postulante) => postulante.oferta_nombre).join(", ") || "Sin postulantes registrados";
}

export function HubServiciosList({ servicios, compacto = false }: { servicios: HubServicioPublico[]; compacto?: boolean }) {
  if (servicios.length === 0) {
    return <p className="mt-4 rounded-xl border border-[#DDE7E2] bg-[#F8FAF7] p-3 text-sm font-semibold text-[#53685C]">Este Hub todavía no tiene demandas/servicios cargados.</p>;
  }

  return (
    <div className={compacto ? "mt-5 grid gap-3" : "mt-8 grid gap-4"}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Demandas / Servicios del Hub</p>
      {servicios.map((servicio, index) => (
        <article key={servicio.id} className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-4">
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-xs font-black text-[#1E8F4D]">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <h4 className={compacto ? "font-black text-[#0B1726]" : "text-lg font-black text-[#0B1726]"}>{servicio.nombre_servicio}</h4>
              {!compacto && <p className="mt-1 text-sm text-[#53685C]">{servicio.descripcion}</p>}
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="rounded-xl border border-[#BFE8CF] bg-[#EAF7EF] p-3">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#1E8F4D]">Vínculo activo</dt>
                  <dd className="mt-1 font-black text-[#0B1726]">{servicio.vinculoActivo?.oferta_nombre || "Sin vínculo activo"}</dd>
                  {!compacto && servicio.vinculoActivo?.responsable && <p className="mt-1 text-xs font-semibold text-[#375243]">Responsable: {servicio.vinculoActivo.responsable}</p>}
                </div>
                <div className="rounded-xl border border-[#BFE8CF] bg-[#E8F6FF] p-3">
                  <dt className="text-[10px] font-black uppercase tracking-wide text-[#1E8F4D]">Postulantes</dt>
                  <dd className="mt-1 font-semibold text-[#0B1726]">{nombresPostulantes(servicio)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
