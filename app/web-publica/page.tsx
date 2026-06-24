export const dynamic = "force-dynamic";

import { HubCard } from "@/components/public/HubCard";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { JoinOfferForm } from "@/components/public/JoinOfferForm";
import { RequestHubForm } from "@/components/public/RequestHubForm";
import { HubyaLogo } from "@/components/HubyaLogo";
import { getHubs } from "@/lib/data/hubs";

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
    <main className="min-h-screen bg-[#F8FAF7] text-[#0B1726]">
      <PublicHeader />
      <a
        href="/"
        className="fixed right-4 top-4 z-50 rounded-xl border border-[#DDE7E2] bg-white px-4 py-2 text-xs font-black text-[#0B1726] shadow-lg backdrop-blur transition hover:bg-[#EAF7EF]"
      >
        Volver al sistema
      </a>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,199,232,0.22),transparent_70%)]" />
        <div className="relative max-w-5xl">
          <div className="mx-auto flex justify-center"><HubyaLogo stacked className="h-32 w-auto" /></div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">
            Tecnología humana para comunidades reales.
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-[#0B1726] md:text-7xl">HUBYA</h1>
          <p className="mx-auto mt-6 max-w-3xl text-2xl font-black text-[#1E8F4D]">
            Construimos ecosistemas operativos estables.
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#375243]">
            Tecnología para organizar servicios recurrentes, demanda agrupada y datos operativos en comunidades reales.
          </p>
          <p className="mx-auto mt-6 inline-flex rounded-full border border-[#BFE8CF] bg-[#EAF7EF] px-5 py-3 text-sm font-black text-[#1E8F4D]">
            La demanda agrupada genera estabilidad operativa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#hubs" className="rounded-xl bg-gradient-to-r from-[#1E8F4D] to-[#22C7E8] px-5 py-3 font-black text-[#0B1726]">
              Ver Hubs
            </a>
            <a href="#idea" className="rounded-xl border border-[#DDE7E2] px-5 py-3 font-black text-[#0B1726]">
              Conocer el sistema
            </a>
            <a href="#nuevo-hub" className="rounded-xl border border-[#DDE7E2] px-5 py-3 font-black text-[#0B1726]">
              Crear un Hub
            </a>
          </div>
        </div>
      </section>

      <section id="idea" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">La idea de fondo</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black text-[#0B1726] md:text-5xl">
              HUBYA convierte necesidades individuales en fuerza colectiva.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-[#53685C]">
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
          <div className="rounded-3xl border border-[#DDE7E2] bg-white p-6 shadow-2xl shadow-[#BFE8CF]/40">
            <p className="text-lg font-black text-[#0B1726]">
              HUBYA permite agrupar personas que necesitan servicios similares, ordenar esa demanda y coordinar quién la
              resuelve.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-[#375243]">
              {beneficiosDemandaAgrupada.map((beneficio) => (
                <li key={beneficio} className="flex gap-3 rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-3">
                  <span className="text-[#1E8F4D]">●</span>
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="servicios-coordinados" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">¿Cómo funciona?</p>
        <h2 className="mt-3 text-3xl font-black text-[#0B1726]">De necesidad compartida a operación coordinada.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#53685C]">
          HUBYA agrupa demanda, organiza oferta y genera estabilidad operativa. La tecnología ayuda a detectar necesidades
          similares, ordenar la información del Hub y coordinar equipos o prestadores capaces de resolverlas con continuidad.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Agrupamos personas, vecinos, instituciones o empresas con necesidades parecidas en un Hub común.",
            "Ordenamos esa demanda para que pueda transformarse en una contratación más clara, fuerte y eficiente.",
            "Coordinamos la oferta disponible para sostener servicios recurrentes con mejor comunicación y estabilidad.",
          ].map((text, i) => (
            <article key={text} className="rounded-2xl border border-[#DDE7E2] bg-white p-5">
              <p className="text-2xl">{["🤝", "📌", "⚙️"][i]}</p>
              <p className="mt-3 text-sm text-[#53685C]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Módulos operativos</p>
            <h2 className="mt-3 text-3xl font-black text-[#0B1726] md:text-5xl">
              Módulos desarrollados según el proceso
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-[#53685C]">
              <p>
                HUBYA organiza la demanda a través de Hubs, pero cada tipo de necesidad requiere herramientas
                específicas. Por eso desarrollamos módulos operativos adaptados a distintos procesos.
              </p>
              <p>
                <strong className="text-[#0B1726]">HUBYA es la tecnología madre.</strong> Los módulos son herramientas
                especializadas para resolver procesos concretos: registrar información, coordinar responsables, generar
                reportes y mejorar la continuidad operativa.
              </p>
              <p>
                Un Hub puede necesitar mantenimiento de espacios verdes, control de plagas, abastecimiento, pileta,
                paisajismo u otros servicios recurrentes. Cada proceso puede conectarse con su módulo correspondiente.
              </p>
            </div>
            <p className="mt-6 rounded-2xl border border-[#BFE8CF] bg-[#EAF7EF] p-5 text-lg font-black text-[#1E8F4D]">
              HUBYA agrupa la demanda. Sus módulos ordenan el proceso.
            </p>
          </div>

          <div className="rounded-3xl border border-[#DDE7E2] bg-white p-6 shadow-2xl shadow-[#BFE8CF]/40">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Conexión con prestadores</p>
            <h3 className="mt-3 text-2xl font-black text-[#0B1726]">Un Hub reúne la necesidad. Un módulo organiza la ejecución.</h3>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[#375243]">
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
            <div className="mt-5 grid gap-3 text-sm font-bold text-[#375243] sm:grid-cols-2">
              <div className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-4">Personas agrupadas que necesitan resolver una demanda.</div>
              <div className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-4">Prestadores o equipos que organizan la oferta y ejecutan el servicio.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="ejemplos-modulos" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Ejemplos de módulos</p>
            <h2 className="mt-3 text-3xl font-black text-[#0B1726]">Ramas funcionales de HUBYA</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#53685C]">
            Cada módulo está diseñado para ordenar un tipo específico de proceso. No son proyectos separados: funcionan
            bajo la misma lógica madre de agrupar demanda, organizar oferta y generar estabilidad operativa.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {modulosOperativos.map((modulo) => (
            <article
              key={modulo.nombre}
              className="rounded-3xl border border-[#DDE7E2] bg-gradient-to-br from-white/[0.07] to-[#E8F6FF] p-6 shadow-xl shadow-[#DDE7E2]/70"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Módulo HUBYA</p>
              <h3 className="mt-3 text-2xl font-black text-[#0B1726]">{modulo.nombre}</h3>
              <p className="mt-3 text-base font-black text-[#375243]">{modulo.proceso}</p>
              <p className="mt-4 text-sm leading-6 text-[#53685C]">{modulo.descripcion}</p>
              <div className="mt-5 rounded-2xl border border-[#DDE7E2] bg-[#FFF4CC] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#375243]">Conexión con Hubs</p>
                <p className="mt-2 text-sm leading-6 text-[#375243]">{modulo.conexion}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-[#DDE7E2] bg-white p-5 text-sm leading-6 text-[#375243]">
          Otros módulos pueden desarrollarse según la necesidad de cada Hub. La función de estas herramientas es
          transformar procesos dispersos en sistemas simples, medibles y coordinados.
        </p>
      </section>

      <section id="hubs" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Hubs activos</p>
            <h2 className="mt-3 text-3xl font-black text-[#0B1726]">Ejemplos de demanda organizada</h2>
          </div>
          <p className="max-w-xl text-sm text-[#53685C]">
            Tarjetas resumidas para navegar rápido: mirá el servicio principal, abrí detalles solo si los necesitás o
            sumate directamente al Hub que te interesa.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => (
            <HubCard key={hub.id} hub={hub} />
          ))}
        </div>
        <p className="mt-8 rounded-xl border border-[#DDE7E2] bg-[#FFF4CC] p-4 text-sm text-[#375243]">
          Si un Hub crece demasiado, más adelante podrá ordenarse por subhubs, sectores, días de servicio o grupos operativos.
        </p>
      </section>

      <section id="demanda" className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Sumate a la demanda</p>
        <h2 className="mt-3 text-3xl font-black text-[#0B1726]">Quiero sumarme a un Hub como cliente</h2>
        <p className="mt-3 text-sm text-[#53685C]">
          Elegí un Hub activo arriba y completá el formulario público de ingreso al Hub de demanda.
        </p>
      </section>

      <section id="oferta" className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Sumate a la oferta</p>
        <JoinOfferForm />
      </section>

      <section id="nuevo-hub" className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">Nuevo Hub</p>
        <RequestHubForm />
      </section>
      <PublicFooter />
    </main>
  );
}
