import Link from "next/link";
import type { HubPublico } from "@/lib/data/hubs";
import { HubServiciosList } from "./HubServiciosList";

export function HubCard({ hub }: { hub: HubPublico }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#06b6d4]">{hub.estado}</p>
      <h3 className="mt-2 text-2xl font-black text-white">{hub.nombre}</h3>
      <p className="mt-2 text-sm text-[#9ca3af]">{hub.descripcionPublica}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-[#6b7280]">Clientes activos</dt><dd className="font-black text-white">{hub.clientesActivos}</dd></div>
        <div><dt className="text-[#6b7280]">Rama</dt><dd className="font-black text-white">{hub.rama}</dd></div>
        <div><dt className="text-[#6b7280]">Equipo operativo</dt><dd className="font-black text-white">{hub.equipoOperativo}</dd></div>
        <div><dt className="text-[#6b7280]">Zona</dt><dd className="font-black text-white">{hub.zona}</dd></div>
        {typeof hub.trabajosRealizados === "number" && <div><dt className="text-[#6b7280]">Trabajos registrados</dt><dd className="font-black text-white">{hub.trabajosRealizados}</dd></div>}
      </dl>
      <HubServiciosList servicios={hub.servicios} compacto />
      <div className="mt-5 flex gap-3">
        <Link href={`/hubs/${hub.slug}`} className="rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] px-4 py-2 text-sm font-black text-white">Ver Hub</Link>
        <Link href={`/hubs/${hub.slug}#sumarme`} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-white">Quiero sumarme</Link>
      </div>
    </article>
  );
}
