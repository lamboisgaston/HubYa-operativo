import Link from "next/link";
import { getContactos, getOperativoPorRamas } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";
import { CrearHubForm } from "@/components/operativo/CrearHubForm";
import { HubyaLogo } from "@/components/HubyaLogo";
import { HubCard } from "@/components/HubCard";

export default async function OperativoPage() {
  const [ramas, contactos] = await Promise.all([getOperativoPorRamas(), getContactos()]);
  const hubs = ramas.flatMap((rama) => rama.hubs);

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-6 text-[#0B1726] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4"><HubyaLogo className="h-14 w-auto" /><h1 className="text-3xl font-black sm:text-4xl">Operativo</h1></div>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#53685C]">Primero elegí una Rama operativa. Cada Rama contiene sus Hubs, formularios, reportes, procesos, estados y métricas propias.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/operativo" className="rounded-2xl bg-[#1E8F4D] px-4 py-3 text-center text-sm font-black text-white">Ramas</Link>
            <Link href="#base-general" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Agregar usuario</Link>
            <Link href="#crear-hub" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Crear Hub</Link>
            <Link href="/operativo/comunicaciones" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Comunicaciones</Link>
            <Link href="/operativo/centro-respuestas" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Centro de respuestas</Link>
          </div>
        </header>

        <div id="crear-hub"><CrearHubForm /></div>

        <section className="grid gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1E8F4D]">Ramas operativas</p>
            <h2 className="mt-1 text-2xl font-black">HUBYA → Ramas → Hubs → usuarios, clientes, reportes y procesos</h2>
          </div>
          {ramas.map((rama) => (
            <article key={rama.slug} className="rounded-[2rem] border border-[#DDE7E2] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: rama.color }}>{rama.icon} Rama {rama.status}</p>
                  <h3 className="mt-1 text-2xl font-black text-[#0B1726]">{rama.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53685C]">{rama.description}</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: rama.color, color: rama.color }}>{rama.reportType}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#F8FAF7] p-3"><p className="text-xs font-black uppercase text-[#53685C]">Proceso</p><p className="mt-1 font-black">{rama.processType}</p></div>
                <div className="rounded-2xl bg-[#F8FAF7] p-3"><p className="text-xs font-black uppercase text-[#53685C]">Módulos</p><p className="mt-1 text-sm font-bold">{rama.enabledModules.join(" · ")}</p></div>
                <div className="rounded-2xl bg-[#F8FAF7] p-3"><p className="text-xs font-black uppercase text-[#53685C]">Métricas</p><p className="mt-1 text-sm font-bold">{rama.metrics.join(" · ")}</p></div>
              </div>
              {rama.hubs.length > 0 ? (
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {rama.hubs.map((hub) => <HubCard key={hub.id} hub={hub} operativo />)}
                </div>
              ) : <p className="mt-5 rounded-2xl border border-dashed border-[#DDE7E2] bg-[#F8FAF7] p-4 text-sm font-bold text-[#53685C]">{rama.texts.emptyState}</p>}
            </article>
          ))}
        </section>

        <div id="base-general">
          <ContactosMesaTrabajo hubs={hubs} contactos={contactos} />
        </div>
      </section>
    </main>
  );
}
