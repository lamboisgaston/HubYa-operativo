import Link from "next/link";
import { getOperativoPorRamas } from "@/lib/data/hubs";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";

type OperativoSearchParams = Record<string, string | string[] | undefined>;

export default async function OperativoPage({ searchParams }: { searchParams?: Promise<OperativoSearchParams> | OperativoSearchParams }) {
  const params: OperativoSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const ramaParam = params.rama;
  const ramaSeleccionada = typeof ramaParam === "string" ? ramaParam : Array.isArray(ramaParam) ? ramaParam[0] : undefined;
  const ramas = (await getOperativoPorRamas()) ?? [];

  const ramaActiva = ramaSeleccionada
    ? ramas.find((rama) => rama.slug === ramaSeleccionada)
    : undefined;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_34%),#F8FAF7] px-4 py-6 text-[#0B1726] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-[2rem] border border-violet-200/70 bg-white/95 p-6 shadow-sm shadow-violet-950/5">
          <div className="flex items-center gap-4">
            <HubyaBrandLogo markOnly className="h-14 w-14" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">HUBYA Operativo</p>
              <h1 className="text-3xl font-black sm:text-4xl">Un paso por vez</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#53685C]">
            HUBYA debe sentirse como un sistema que acompaña, no como una cabina de avión.
          </p>
          <nav className="mt-5 flex flex-wrap gap-2 text-sm font-black text-[#53685C]">
            <Link href="/operativo" className={!ramaActiva ? "rounded-full bg-[#1E8F4D] px-4 py-2 text-white" : "rounded-full border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-2"}>Inicio</Link>
            <Link href="/web-publica" className="rounded-full border border-[#0B1726] bg-[#0B1726] px-4 py-2 text-white shadow-sm transition hover:bg-[#1E8F4D]">
              Ver web principal
            </Link>
            <Link href="/membresia" className="rounded-full border border-[#22C7E8] bg-[#22C7E8] px-4 py-2 text-[#06110D] shadow-sm transition hover:bg-white">
              Membresía HUBYA
            </Link>
            {ramaActiva && <span className="rounded-full bg-white px-4 py-2">→ {ramaActiva.name}</span>}
          </nav>
        </header>

        {!ramaActiva ? (
          <section className="grid gap-5">
            <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Inicio</p>
              <h2 className="mt-2 text-3xl font-black">¿Qué tipo de trabajo querés gestionar?</h2>
              <p className="mt-2 text-sm font-semibold text-[#53685C]">Elegí una Rama. Después vamos a mostrarte solamente sus Hubs.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {ramas.map((rama) => (
                <Link key={rama.slug} href={rama.slug === "ventas" ? "/operativo/ventas" : `/operativo?rama=${rama.slug}`} className="group rounded-[2rem] border border-[#DDE7E2] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" style={{ borderColor: `${rama.color}33` }}>
                  <span className="text-4xl" aria-hidden>{rama.icon}</span>
                  <h3 className="mt-5 text-2xl font-black" style={{ color: rama.color }}>{rama.name}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53685C]">{rama.description}</p>
                  <span className="mt-6 inline-flex rounded-2xl bg-[#F8FAF7] px-4 py-3 text-sm font-black text-[#0B1726] transition group-hover:bg-[#EAF7EF]">Elegir Rama →</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-5">
            <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: ramaActiva.color }}>{ramaActiva.icon} Rama elegida</p>
              <h2 className="mt-2 text-3xl font-black">Elegí un Hub de {ramaActiva.name}</h2>
              <p className="mt-2 text-sm font-semibold text-[#53685C]">Ahora solo ves los Hubs de esta Rama. Nada de métricas, reportes ni configuración hasta entrar a un Hub.</p>
            </div>
            {ramaActiva.hubs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {ramaActiva.hubs.map((hub) => (
                  <Link key={hub.id} href={ramaActiva.slug === "ventas" ? `/operativo/hubs/${hub.slug}/ventas` : `/operativo/hubs/${hub.slug}`} className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm transition hover:border-[#1E8F4D] hover:bg-[#F8FAF7]">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: ramaActiva.color }}>Hub</p>
                    <h3 className="mt-2 text-2xl font-black">{hub.nombre}</h3>
                    <p className="mt-2 text-sm font-semibold text-[#53685C]">{hub.zona}</p>
                    <span className="mt-5 inline-flex rounded-2xl bg-[#1E8F4D] px-4 py-3 text-sm font-black text-white">{ramaActiva.slug === "ventas" ? "Gestionar propuestas →" : "Entrar al Hub →"}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-[2rem] border border-dashed border-[#DDE7E2] bg-white p-6 text-sm font-bold text-[#53685C]">{ramaActiva.texts.emptyState}</p>
            )}
            <Link href="/operativo" className="justify-self-start rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-sm font-black text-[#0B1726]">← Volver a elegir Rama</Link>
          </section>
        )}
      </section>
    </main>
  );
}
