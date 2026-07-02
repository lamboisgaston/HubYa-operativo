import Link from "next/link";
import type { HubPublico } from "@/lib/data/hubs";
import { HubCategoryBadge } from "@/components/hubs/HubCategoryBadge";

export function HubNav({ hub }: { hub: HubPublico; active?: string }) {
  return (
    <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Hub seleccionado: {hub.nombre}</p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black">{hub.nombre}</h1>
          <p className="text-sm font-bold text-[#66745c]">{hub.zona}</p>
          <div className="mt-2"><HubCategoryBadge category={hub.categoriaId} /></div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link href="/operativo" className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Operativo</Link>
          <Link href={`/operativo/hubs/${hub.slug}/usuarios`} className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Clientes</Link>
          <Link href={`/operativo/hubs/${hub.slug}/comunicaciones`} className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Comunicaciones</Link>
          <Link href={`/operativo/hubs/${hub.slug}/respuestas`} className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Respuestas</Link>
          <Link href={`/operativo/hubs/${hub.slug}`} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Volver al Hub</Link>
        </nav>
      </div>
    </header>
  );
}
