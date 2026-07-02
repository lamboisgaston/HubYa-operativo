export const dynamic = "force-dynamic";

import Link from "next/link";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";
import { IngenieroWhatsappCard } from "@/components/IngenieroWhatsappCard";
import { getHubs, type HubPublico } from "@/lib/data/hubs";

const ideas = [
  {
    titulo: "Agrupamos demanda",
    texto: "HUBYA reúne vecinos, clientes o unidades de una misma zona para que la necesidad deje de estar aislada.",
  },
  {
    titulo: "Coordinamos oferta",
    texto: "El hub permite contratar servicios con una demanda más clara y equipos mejor organizados.",
  },
  {
    titulo: "Ordenamos tareas",
    texto: "El vecino no queda solo: el hub coordina personas, equipos, comunicación y seguimiento operativo.",
  },
  {
    titulo: "Mejoramos operación",
    texto: "La demanda agrupada mejora la oferta y convierte necesidades dispersas en servicios más previsibles.",
  },
];

const membresia = [
  "Acceso a una comunidad organizada por necesidad y territorio.",
  "Participación en Hubs que agrupan demanda, oferta y capacidad.",
  "Comunicación operativa para convertir intención en acción concreta.",
];

const parametrosJardinerosYa = [
  "Hora de trabajo humano o máquina",
  "Manejo de personal",
  "Traslado del equipo",
  "Maquinaria, automatización y robotización",
];

function vecinosAgrupadosHub(hub: HubPublico) {
  return hub.vecinosAgrupados ?? hub.clientesActivos;
}

function estadoAtencionHub(hub: HubPublico) {
  return hub.responsableHub?.nombre ? `Atendido por ${hub.responsableHub.nombre}` : "Postulate para este hub";
}


function SoftwareOperativosPanel() {
  const sistemas = [
    {
      nombre: "JardinerosYa.online",
      descripcion: "Software operativo para mantenimiento de espacios verdes.",
      href: "https://www.jardinerosya.online",
      etiqueta: "Espacios verdes",
    },
    {
      nombre: "FumigadoresYa.online",
      descripcion: "Software operativo para control de plagas, certificados y trazabilidad.",
      href: "https://www.fumigadoresya.online",
      etiqueta: "Control de plagas",
    },
    {
      nombre: "HUBYA Operativo",
      descripcion: "Panel para coordinar Hubs, parámetros, reportes y operación.",
      href: "/operativo",
      etiqueta: "Panel operativo",
    },
    {
      nombre: "El Ingeniero",
      descripcion: "Asistente de inteligencia artificial aplicado a la operación.",
      href: "/operativo/el-ingeniero",
      etiqueta: "IA operativa",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.75rem] border border-violet-200/15 bg-[#060716] p-6 shadow-2xl shadow-violet-950/50 ring-1 ring-white/10 sm:p-8">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-violet-200">
          Software operativos ya desarrollados
        </p>

        <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
          Sistemas específicos para operar procesos reales.
        </h2>

        <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/65">
          HUBYA ya cuenta con sistemas funcionando para organizar demanda, oferta, reglas de trabajo, reportes y operación por rubro.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {sistemas.map((sistema) => (
            <a
              key={sistema.nombre}
              href={sistema.href}
              target={sistema.href.startsWith("http") ? "_blank" : undefined}
              rel={sistema.href.startsWith("http") ? "noreferrer" : undefined}
              className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 transition hover:border-violet-200/35 hover:bg-white/[0.085]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400/15 text-lg font-black text-violet-100 ring-1 ring-violet-200/20">
                  H
                </div>
                <span className="rounded-full border border-sky-200/20 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">
                  {sistema.etiqueta}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-white">{sistema.nombre}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">{sistema.descripcion}</p>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-violet-200 group-hover:text-white">
                Ver sistema →
              </p>
            </a>
          ))}
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-emerald-200/15 bg-emerald-400/10 p-5">
          <p className="text-sm font-black text-emerald-100">No es solo una idea</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-white/65">
            HUBYA funciona como estructura madre: conecta softwares verticales, Hubs de demanda, equipos operativos y parámetros de trabajo.
          </p>
        </div>
      </div>
    </div>
  );
}


export default async function HomePage() {
  const hubs = (await getHubs()).filter((hub) => hub.activo !== false);
  return (
    <main className="min-h-screen overflow-hidden bg-[#05030b] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(30,64,175,0.24),transparent_30%),linear-gradient(135deg,#05030b_0%,#0f1026_48%,#030712_100%)]" />

      <section className="px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-3" aria-label="HUBYA web pública">
              <HubyaBrandLogo markOnly className="h-11 w-11" />
              <div>
                <p className="text-sm font-black tracking-[0.22em] text-violet-200">HUBYA</p>
                <p className="text-xs font-bold text-white/55">HUB = agrupación de potencial</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-black text-white/70 md:flex" aria-label="Navegación pública">
              <a href="#hubs" className="transition hover:text-violet-200">Hubs</a>
              <a href="#concepto" className="transition hover:text-violet-200">Concepto</a>
              <a href="#membresia" className="transition hover:text-violet-200">Membresía</a>
              <a href="#contacto" className="transition hover:text-violet-200">Contacto</a>
            </nav>

            <a href="mailto:contact@hubya.tech" className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-black text-violet-100 transition hover:bg-violet-400/20">
              Contacto
            </a>
          </header>

          <section className="grid items-center gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
            <div>
              <div className="mb-7 flex items-center gap-4 rounded-[1.75rem] border border-violet-300/20 bg-white/[0.045] p-4 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:max-w-xl">
                <HubyaBrandLogo markOnly className="h-16 w-16 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Núcleo HUBYA</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-white/62">Una red tecnológica que conecta Hubs, demanda, oferta y operación.</p>
                </div>
              </div>
              <p className="inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-violet-200">
                HUB = agrupación de potencial
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
                Agrupamos <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">potencial.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/70">
                HUBYA agrupa vecinos, clientes o unidades de demanda para contratar servicios de forma organizada. Además desarrolla software operativos específicos por rubro, como JardinerosYa.online y FumigadoresYa.online, para convertir la demanda agrupada en operación real.
              </p>

              <div className="mt-8 grid max-w-xl gap-3 rounded-[1.5rem] border border-violet-300/20 bg-white/[0.05] p-5 shadow-xl shadow-violet-950/20 sm:grid-cols-[0.55fr_1fr] sm:items-center">
                <div className="text-center sm:text-left">
                  <p className="font-mono text-4xl font-black text-violet-100">P = W / t</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-sky-200">Potencia = trabajo / tiempo</p>
                </div>
                <p className="text-sm font-semibold leading-7 text-white/65">
                  La demanda agrupada mejora la oferta: más claridad para contratar, más coordinación para ejecutar y mejor seguimiento para cada vecino.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#hubs" className="rounded-2xl bg-violet-200 px-5 py-3 text-sm font-black text-[#12071f] shadow-lg shadow-violet-950/30 transition hover:bg-white">
                  Ver Hubs
                </a>
                <Link href="/membresia" className="rounded-2xl border border-violet-300/35 bg-violet-500/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-500/20">
                  Membresía
                </Link>
                <a href="#concepto" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                  Entender el concepto
                </a>
                <a href="#ingeniero" className="rounded-2xl border border-emerald-300/35 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20">
                  Hablar con El Ingeniero
                </a>
              </div>
            </div>

            <SoftwareOperativosPanel />
          </section>
        </div>
      </section>

      <section id="concepto" className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Concepto</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Qué es un hub: vecinos conectados para contratar mejor.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-white/65">
              Un hub permite que varias personas de una misma zona se agrupen para contratar servicios, coordinar equipos y mejorar la organización operativa. Una casa sola tiene una necesidad; varias casas conectadas tienen una demanda clara y más capacidad de respuesta.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ideas.map((idea, index) => (
              <article key={idea.titulo} className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
                <p className="text-sm font-black text-violet-200">0{index + 1}</p>
                <h3 className="mt-4 text-2xl font-black">{idea.titulo}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/60">{idea.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="parametros" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] border border-violet-200/15 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">JardinerosYa</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Parámetros para ordenar el servicio</h2>
              <p className="mt-5 text-base font-semibold leading-8 text-white/68">
                JardinerosYa ayuda a que el servicio no se cobre a ojo. HUBYA no solo agrupa vecinos para contratar servicios: también ofrece referencias operativas para ordenar el valor del trabajo.
              </p>
              <p className="mt-5 rounded-[1.35rem] border border-sky-300/20 bg-sky-400/10 px-5 py-4 text-lg font-black leading-7 text-sky-100">
                “Trabajar sin parámetros es como construir una casa sin metro.”
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold leading-7 text-white/62">
                La plataforma permite orientar cuánto debería pagarse por hora de trabajo, cuánto corresponde por manejo o coordinación de personal, cuánto corresponde por traslado del equipo hasta la casa y cuánto corresponde por tiempo de uso de maquinaria.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {parametrosJardinerosYa.map((parametro, index) => (
                  <article key={parametro} className="rounded-[1.45rem] border border-white/10 bg-[#070A18]/70 p-5 shadow-xl shadow-black/10">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Referencia 0{index + 1}</p>
                    <h3 className="mt-3 text-xl font-black text-white">{parametro}</h3>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hubs" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Hubs</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Vecinos agrupados para contratar servicios.</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-white/58">Cada Hub reúne vecinos de una zona para ordenar la demanda, postular responsables y coordinar la operación sin exponer datos privados.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => {
              const vecinosAgrupados = vecinosAgrupadosHub(hub);
              const estadoAtencion = estadoAtencionHub(hub);

              return (
                <article key={hub.id} className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/[0.08]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-fuchsia-300 to-sky-300 opacity-80" />
                  <div className="absolute -right-8 -top-8 opacity-[0.09] transition group-hover:opacity-[0.16]">
                    <HubyaBrandLogo markOnly className="h-32 w-32" />
                  </div>

                  <div className="relative">
                    <h3 className="text-2xl font-black">{hub.nombre}</h3>
                    <p className="mt-5 text-lg font-black leading-7 text-white">{vecinosAgrupados} vecinos agrupados para contratar servicios</p>
                    <p className={`mt-4 inline-flex rounded-full border px-3 py-2 text-xs font-black ${hub.responsableHub?.nombre ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-sky-300/25 bg-sky-400/10 text-sky-100"}`}>{estadoAtencion}</p>
                  </div>

                  <Link href={`/hubs/${hub.slug}`} className="relative mt-6 inline-flex rounded-xl bg-violet-200 px-4 py-3 text-sm font-black text-[#12071f] transition group-hover:bg-white">Ver hub</Link>
                </article>
              );
            })}
          </div>
       </div>
      </section>

      <section id="membresia" className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Membresía</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Pertenecer a un Hub es sumar potencial a una red organizada.</h2>
          </div>
          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-6">
            <ul className="grid gap-4">
              {membresia.map((item) => (
                <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-white/68">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-200 text-xs font-black text-[#12071f]">H</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/membresia" className="mt-6 inline-flex rounded-2xl bg-violet-200 px-5 py-3 text-sm font-black text-[#12071f] transition hover:bg-white">Conocer membresía</Link>
          </div>
        </div>
      </section>

      <section id="ingeniero" className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <IngenieroWhatsappCard />
        </div>
      </section>

      <section id="contacto" className="px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-7 text-center shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Contacto</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Hablemos de tu próximo Hub.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/58">HUBYA · Salta, Argentina · Sheridan, Wyoming, United States.</p>
          <a href="mailto:contact@hubya.tech" className="mt-6 inline-flex rounded-2xl bg-violet-200 px-5 py-3 text-sm font-black text-[#12071f] transition hover:bg-white">contact@hubya.tech</a>
        </div>
      </section>

      <footer className="px-5 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© HUBYA LLC</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Enlaces legales">
            <Link href="/politica-privacidad" className="transition hover:text-violet-200">Política de privacidad</Link>
            <Link href="/terminos" className="transition hover:text-violet-200">Términos</Link>
            <Link href="/eliminacion-datos" className="transition hover:text-violet-200">Eliminación de datos</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
