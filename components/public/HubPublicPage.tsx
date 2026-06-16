import type { HubPublico } from "@/lib/data/hubs";
import { JoinHubForm } from "./JoinHubForm";
import { HubServiciosList } from "./HubServiciosList";

export function HubPublicPage({ hub }: { hub: HubPublico }) {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">{hub.estado}</p>
        <h1 className="mt-3 text-5xl font-black text-white">{hub.nombre}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#9ca3af]">{hub.descripcionPublica}</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Zona", hub.zona], ["Clientes activos", hub.clientesActivos], ["Rama", hub.rama], ["Equipo operativo", hub.equipoOperativo], ["Trabajos registrados", hub.trabajosRealizados ?? "Sin dato"], ["Última actividad", hub.ultimaActividad ? new Date(hub.ultimaActividad).toLocaleDateString("es-AR") : "Sin dato"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><dt className="text-xs font-black uppercase text-[#6b7280]">{k}</dt><dd className="mt-1 text-xl font-black text-white">{v}</dd></div>)}
        </dl>
        <HubServiciosList servicios={hub.servicios} />
      </section>
      <section id="sumarme" className="mx-auto max-w-3xl px-6 pb-20"><JoinHubForm hubId={hub.id} hubNombre={hub.nombre} /></section>
    </>
  );
}
