export const dynamic = "force-dynamic";

import { HubCard } from "@/components/public/HubCard";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { JoinOfferForm } from "@/components/public/JoinOfferForm";
import { RequestHubForm } from "@/components/public/RequestHubForm";
import { getHubs, MODELOS_SUGERIDOS } from "@/lib/data/hubs";

const beneficiosDemandaAgrupada = [
  "más fuerza para contratar",
  "más orden",
  "mejor comunicación",
  "mayor continuidad",
  "más estabilidad para quienes contratan",
  "más estabilidad para quienes prestan el servicio",
];

export default async function WebPublicaPage() {
  const hubs = await getHubs();

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#f5f5f0]">
      <PublicHeader />
      <a
        href="/"
        className="fixed right-4 top-4 z-50 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-lg backdrop-blur transition hover:bg-white/20"
      >
        Volver al sistema
      </a>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(79,70,229,0.18),transparent_70%)]" />
        <div className="relative max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">
            Las necesidades aisladas tienen poca fuerza. Las necesidades organizadas pueden construir estabilidad.
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-7xl">
            HubYa: necesidades individuales en{" "}
            <span className="bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] bg-clip-text text-transparent">
              fuerza colectiva
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-semibold text-[#e5e7eb]">
            Una tecnología para que personas, vecinos, instituciones y empresas se agrupen, contraten mejor y generen
            estabilidad operativa.
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#9ca3af]">
            HubYa transforma demandas dispersas en Hubs organizados. Cuando varias personas necesitan lo mismo, pueden
            coordinarse mejor, contratar con más fuerza y sostener servicios más estables.
          </p>
          <p className="mx-auto mt-6 inline-flex rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-5 py-3 text-sm font-black text-[#a5f3fc]">
            La demanda agrupada genera estabilidad.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#hubs" className="rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] px-5 py-3 font-black text-white">
              Conocer los Hubs
            </a>
            <a href="#nuevo-hub" className="rounded-xl border border-white/15 px-5 py-3 font-black text-white">
              Crear un Hub
            </a>
            <a href="#servicios-coordinados" className="rounded-xl border border-white/15 px-5 py-3 font-black text-white">
              Ver servicios coordinados
            </a>
          </div>
        </div>
      </section>

      <section id="idea" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">La idea de fondo</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black text-white md:text-5xl">
              HubYa convierte necesidades individuales en fuerza colectiva.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-[#9ca3af]">
              <p>
                Vivimos rodeados de necesidades repetidas: mantenimiento, control de plagas, abastecimiento, cuidado de
                espacios, organización de tareas y servicios recurrentes.
              </p>
              <p>
                Cuando cada persona intenta resolver sola, todo queda disperso. Pero cuando esas necesidades se agrupan,
                aparece una nueva capacidad: coordinar, contratar mejor, sostener equipos y construir continuidad.
              </p>
              <p>HubYa nace desde esa idea: convertir necesidades individuales en fuerza colectiva.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-[#4f46e5]/10">
            <p className="text-lg font-black text-white">
              HubYa permite agrupar personas que necesitan servicios similares, ordenar esa demanda y coordinar quién la
              resuelve.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-[#cbd5e1]">
              {beneficiosDemandaAgrupada.map((beneficio) => (
                <li key={beneficio} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="text-[#06b6d4]">●</span>
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="servicios-coordinados" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">¿Cómo funciona?</p>
        <h2 className="mt-3 text-3xl font-black text-white">De necesidad compartida a operación coordinada.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#9ca3af]">
          HubYa agrupa demanda, organiza oferta y genera estabilidad operativa. La tecnología ayuda a detectar necesidades
          similares, ordenar la información del Hub y coordinar equipos o prestadores capaces de resolverlas con continuidad.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Agrupamos personas, vecinos, instituciones o empresas con necesidades parecidas en un Hub común.",
            "Ordenamos esa demanda para que pueda transformarse en una contratación más clara, fuerte y eficiente.",
            "Coordinamos la oferta disponible para sostener servicios recurrentes con mejor comunicación y estabilidad.",
          ].map((text, i) => (
            <article key={text} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-2xl">{["🤝", "📌", "⚙️"][i]}</p>
              <p className="mt-3 text-sm text-[#9ca3af]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="hubs" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Hubs activos</p>
            <h2 className="mt-3 text-3xl font-black text-white">Ejemplos de demanda organizada</h2>
          </div>
          <p className="max-w-xl text-sm text-[#9ca3af]">
            JardinerosYa, FumigadoresYa y otras verticales son ejemplos de cómo una necesidad repetida puede organizarse
            como Hub. No se publican emails, teléfonos ni nombres completos de clientes.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {hubs.map((hub) => (
            <HubCard key={hub.id} hub={hub} />
          ))}
        </div>
        <p className="mt-8 rounded-xl border border-[#4f46e5]/30 bg-[#4f46e5]/10 p-4 text-sm text-[#c7d2fe]">
          {MODELOS_SUGERIDOS}
        </p>
      </section>

      <section id="demanda" className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Sumate a la demanda</p>
        <h2 className="mt-3 text-3xl font-black text-white">Quiero sumarme a un Hub como cliente</h2>
        <p className="mt-3 text-sm text-[#9ca3af]">
          Elegí un Hub activo arriba y completá el formulario público de ingreso al Hub de demanda.
        </p>
      </section>

      <section id="oferta" className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Sumate a la oferta</p>
        <JoinOfferForm />
      </section>

      <section id="nuevo-hub" className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Nuevo Hub</p>
        <RequestHubForm />
      </section>
      <PublicFooter />
    </main>
  );
}
