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

const modulosOperativos = [
  {
    nombre: "JardinerosYa",
    proceso: "Módulo para mantenimiento de espacios verdes.",
    descripcion:
      "Permite organizar trabajos, clientes, reportes, responsables y continuidad operativa en espacios verdes.",
    conexion:
      "Puede ser usado por jardineros o equipos técnicos, y también puede gestionar Hubs completos que agrupan demanda de mantenimiento.",
  },
  {
    nombre: "FumigadoresYa",
    proceso: "Módulo para control de plagas y trazabilidad sanitaria.",
    descripcion:
      "Permite organizar servicios, certificados, monitoreo, reportes, vencimientos y comunicación técnica.",
    conexion:
      "Puede ser usado por empresas o técnicos de control de plagas, y también puede conectarse con Hubs que necesitan control sanitario recurrente.",
  },
  {
    nombre: "ComerciarYa",
    proceso: "Módulo para abastecimiento y organización comercial.",
    descripcion:
      "Permite ordenar necesidades de compra, abastecimiento, proveedores y procesos comerciales agrupados.",
    conexion:
      "Puede conectarse con Hubs que buscan organizar demanda de productos o servicios de manera conjunta.",
  },
  {
    nombre: "PileterosYa",
    proceso: "Módulo para mantenimiento de piletas.",
    descripcion:
      "Permite organizar servicios recurrentes, visitas, responsables, reportes y comunicación con clientes o Hubs.",
    conexion:
      "Puede ser usado por pileteros o equipos técnicos, y también puede gestionar Hubs que necesitan mantenimiento de piletas.",
  },
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
            HUBYA: necesidades individuales en{" "}
            <span className="bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] bg-clip-text text-transparent">
              fuerza colectiva
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-semibold text-[#e5e7eb]">
            Una tecnología para que personas, vecinos, instituciones y empresas se agrupen, contraten mejor y generen
            estabilidad operativa.
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#9ca3af]">
            HUBYA transforma demandas dispersas en Hubs organizados. Cuando varias personas necesitan lo mismo, pueden
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
              HUBYA convierte necesidades individuales en fuerza colectiva.
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
              <p>HUBYA nace desde esa idea: convertir necesidades individuales en fuerza colectiva.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-[#4f46e5]/10">
            <p className="text-lg font-black text-white">
              HUBYA permite agrupar personas que necesitan servicios similares, ordenar esa demanda y coordinar quién la
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
          HUBYA agrupa demanda, organiza oferta y genera estabilidad operativa. La tecnología ayuda a detectar necesidades
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

      <section id="modulos" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Módulos operativos</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              Módulos desarrollados según el proceso
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-[#9ca3af]">
              <p>
                HUBYA organiza la demanda a través de Hubs, pero cada tipo de necesidad requiere herramientas
                específicas. Por eso desarrollamos módulos operativos adaptados a distintos procesos.
              </p>
              <p>
                <strong className="text-white">HUBYA es la tecnología madre.</strong> Los módulos son herramientas
                especializadas para resolver procesos concretos: registrar información, coordinar responsables, generar
                reportes y mejorar la continuidad operativa.
              </p>
              <p>
                Un Hub puede necesitar mantenimiento de espacios verdes, control de plagas, abastecimiento, pileta,
                paisajismo u otros servicios recurrentes. Cada proceso puede conectarse con su módulo correspondiente.
              </p>
            </div>
            <p className="mt-6 rounded-2xl border border-[#06b6d4]/30 bg-[#06b6d4]/10 p-5 text-lg font-black text-[#a5f3fc]">
              HUBYA agrupa la demanda. Sus módulos ordenan el proceso.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-[#06b6d4]/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#06b6d4]">Conexión con prestadores</p>
            <h3 className="mt-3 text-2xl font-black text-white">Un Hub reúne la necesidad. Un módulo organiza la ejecución.</h3>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[#cbd5e1]">
              <p>
                Estos módulos también pueden ser utilizados por trabajadores independientes, equipos técnicos o
                prestadores de servicios que necesitan ordenar su trabajo.
              </p>
              <p>
                Un jardinero, un fumigador, un piletero o un proveedor puede usar su módulo específico para organizar
                clientes, trabajos, reportes, agenda y comunicación. Al mismo tiempo, esos módulos pueden acoplarse a los
                Hubs.
              </p>
              <p>
                Eso significa que un Hub completo puede ser gestionado como una unidad de trabajo dentro del módulo
                correspondiente: un Hub de espacios verdes desde JardinerosYa, o un Hub de control de plagas desde
                FumigadoresYa.
              </p>
            </div>
            <div className="mt-5 grid gap-3 text-sm font-bold text-[#e5e7eb] sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Personas agrupadas que necesitan resolver una demanda.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Prestadores o equipos que organizan la oferta y ejecutan el servicio.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="ejemplos-modulos" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Ejemplos de módulos</p>
            <h2 className="mt-3 text-3xl font-black text-white">Ramas funcionales de HUBYA</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#9ca3af]">
            Cada módulo está diseñado para ordenar un tipo específico de proceso. No son proyectos separados: funcionan
            bajo la misma lógica madre de agrupar demanda, organizar oferta y generar estabilidad operativa.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {modulosOperativos.map((modulo) => (
            <article
              key={modulo.nombre}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-6 shadow-xl shadow-black/20"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#06b6d4]">Módulo HUBYA</p>
              <h3 className="mt-3 text-2xl font-black text-white">{modulo.nombre}</h3>
              <p className="mt-3 text-base font-black text-[#e5e7eb]">{modulo.proceso}</p>
              <p className="mt-4 text-sm leading-6 text-[#9ca3af]">{modulo.descripcion}</p>
              <div className="mt-5 rounded-2xl border border-[#4f46e5]/30 bg-[#4f46e5]/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c7d2fe]">Conexión con Hubs</p>
                <p className="mt-2 text-sm leading-6 text-[#c7d2fe]">{modulo.conexion}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-[#cbd5e1]">
          Otros módulos pueden desarrollarse según la necesidad de cada Hub. La función de estas herramientas es
          transformar procesos dispersos en sistemas simples, medibles y coordinados.
        </p>
      </section>

      <section id="hubs" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">Hubs activos</p>
            <h2 className="mt-3 text-3xl font-black text-white">Ejemplos de demanda organizada</h2>
          </div>
          <p className="max-w-xl text-sm text-[#9ca3af]">
            Los Hubs agrupan demanda real alrededor de una necesidad compartida. Los módulos operativos pueden acoplarse
            a esos Hubs para ordenar la ejecución sin exponer emails, teléfonos ni nombres completos de clientes.
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
