import Link from "next/link";
import type { HubPublico } from "@/lib/data/hubs";

const tabs = [
  ["Ficha", "ficha", "hub"],
  ["Reporte diario", "reporte", "hub"],
  ["Contactos", "contactos", "global"],
  ["Vínculos", "vinculos", "hub"],
  ["Postulantes", "postulantes", "global"],
  ["Notificaciones", "notificaciones", "hub"],
  ["Web pública", "web-publica", "public"],
] as const;

export function HubNav({ hub, active }: { hub: HubPublico; active: string }) {
  return (
    <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
      <Link href="/operativo" className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">← Mis Hubs</Link>
      <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-3xl font-black">{hub.nombre}</h1><p className="text-sm font-bold text-[#66745c]">{hub.zona} · Ficha única operativa y pública</p></div>
        <Link href={`/hubs/${hub.slug}`} className="rounded-2xl border border-[#cfd8c6] px-4 py-3 text-center text-sm font-black">Web pública</Link>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2">
        {tabs.map(([label, key, scope]) => {
          const url = scope === "hub" ? `/operativo/hubs/${hub.slug}/${key}` : scope === "public" ? `/hubs/${hub.slug}` : `/operativo/${key}`;
          return <Link key={label} href={url} className={`rounded-2xl px-4 py-3 text-sm font-black ${active === key ? "bg-[#1f2a1d] text-white" : "border border-[#cfd8c6] bg-[#f8faf5] text-[#1f2a1d]"}`}>{label}</Link>;
        })}
      </nav>
    </header>
  );
}
