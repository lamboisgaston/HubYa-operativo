export const dynamic = "force-dynamic";

import Link from "next/link";
import { HubyaLogo } from "@/components/HubyaLogo";
import { getHubs } from "@/lib/data/hubs";

const ideas = [
  {
    titulo: "Buscamos demanda",
    texto: "Detectamos personas, barrios, empresas o instituciones que necesitan resolver algo parecido.",
  },
  {
    titulo: "Buscamos oferta",
    texto: "Identificamos prestadores, equipos, proveedores o capacidades capaces de responder.",
  },
  {
    titulo: "Agrupamos potencial",
    texto: "Convertimos necesidades dispersas en Hubs con capacidad organizada.",
  },
  {
    titulo: "Generamos tecnología",
    texto: "Creamos sistemas para que los Hubs se comuniquen, se ordenen y puedan operar.",
  },
];

const paises = [
  { nombre: "Argentina", estado: "Activo", detalle: "Salta · operación inicial" },
  { nombre: "Estados Unidos", estado: "Expansión", detalle: "Sheridan, Wyoming" },
  { nombre: "Uruguay", estado: "Próximo", detalle: "Mercado regional" },
  { nombre: "Paraguay", estado: "Próximo", detalle: "Mercado regional" },
  { nombre: "Chile", estado: "Próximo", detalle: "Mercado regional" },
];

function tipoDeHub(rama: string) {
  const normalizada = rama.toLowerCase();

  if (normalizada.includes("mantenimiento") || normalizada.includes("verde")) {
    return "Mantenimiento verde";
  }

  if (normalizada.includes("plaga") || normalizada.includes("fumig")) {
    return "Control de plagas";
  }

  if (normalizada.includes("venta") || normalizada.includes("comercial")) {
    return "Ventas agrupadas";
  }

  return rama || "Hub operativo";
}

function capacidadMensual(usuarios: number) {
  return {
    docenasHuevos: usuarios * 4,
    verduras: usuarios * 2,
    horasMantenimiento: usuarios * 2,
  };
}

export default async function WebPublicaPage() {
  const hubs = (await getHubs()).filter((hub) => hub.activo !== false);
  const totalUsuarios = hubs.reduce((acc, hub) => acc + hub.clientesActivos, 0);
  const capacidadTotal = capacidadMensual(totalUsuarios);

  return (
    <main className="min-h-screen bg-[#06110D] text-white">
      <section className="px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
            <Link href="/web-publica" className="flex items-center gap-3">
              <HubyaLogo className="h-10 w-auto" />
              <div>
                <p className="text-sm font-black tracking-[0.20em] text-[#22C7E8]">HUBYA</p>
                <p className="text-xs font-bold text-white/55">Agrupación de potencial</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <a href="mailto:contact@hubya.tech" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10 sm:inline-flex">
                contact@hubya.tech
              </a>
              <Link href="/operativo" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#06110D]">
                Dashboard
              </Link>
            </div>
          </header>

          <section className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-20">
            <div>
              <p className="inline-flex rounded-full border border-[#22C7E8]/30 bg-[#22C7E8]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#22C7E8]">
                HUB = agrupación de potencial
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Agrupamos potencial.
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/68">
                Buscamos demanda, buscamos oferta, agrupamos personas y generamos tecnología para que los Hubs se comuniquen, se ordenen y puedan operar.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#hubs" className="rounded-2xl bg-[#22C7E8] px-5 py-3 text-sm font-black text-[#06110D]">
                  Ver Hubs operativos
                </a>
                <a href="#paises" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white">
                  Cambiar país
                </a>
                <a href="mailto:contact@hubya.tech" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white">
                  Contacto
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/20">
              <div className="relative mx-auto aspect-square max-w-md rounded-full border border-[#22C7E8]/20 bg-[#22C7E8]/5">
                <div className="absolute left-[18%] top-[30%] h-4 w-4 rounded-full bg-white/50" />
                <div className="absolute left-[28%] top-[68%] h-4 w-4 rounded-full bg-white/50" />
                <div className="absolute left-[70%] top-[24%] h-4 w-4 rounded-full bg-white/50" />
                <div className="absolute left-[78%] top-[66%] h-4 w-4 rounded-full bg-white/50" />

                <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] border border-[#22C7E8]/50 bg-[#06110D] shadow-2xl shadow-[#22C7E8]/20">
                  <p className="text-center text-3xl font-black text-[#22C7E8]">HUB</p>
                </div>

                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  <line x1="20" y1="32" x2="50" y2="50" stroke="rgba(34,199,232,0.55)" strokeWidth="1" />
                  <line x1="30" y1="70" x2="50" y2="50" stroke="rgba(34,199,232,0.55)" strokeWidth="1" />
                  <line x1="72" y1="26" x2="50" y2="50" stroke="rgba(34,199,232,0.55)" strokeWidth="1" />
                  <line x1="80" y1="68" x2="50" y2="50" stroke="rgba(34,199,232,0.55)" strokeWidth="1" />
                </svg>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.20em] text-[#22C7E8]">
                  Base internacional
                </p>
                <p className="mt-2 text-xl font-black">Sheridan, Wyoming · Estados Unidos</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/58">
                  HUBYA nace operativo en Salta y se proyecta como tecnología de Hubs para distintos países.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ideas.map((idea) => (
              <article key={idea.titulo} className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-2xl font-black">{idea.titulo}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/60">{idea.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="paises" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#22C7E8]">
                Países
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                HUBYA piensa en red internacional.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-white/58">
              El selector de país prepara la estructura para operar Hubs en distintas regiones.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {paises.map((pais) => (
              <article key={pais.nombre} className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#22C7E8]">{pais.estado}</p>
                <h3 className="mt-2 text-xl font-black">{pais.nombre}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">{pais.detalle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="hubs" className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#22C7E8]">
                Hubs operativos
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                {hubs.length} Hubs activos · {totalUsuarios} usuarios agrupados.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-white/58">
              La web muestra capacidad mensual agrupada. Los datos privados de cada persona quedan protegidos.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => {
              const usuarios = hub.clientesActivos;
              const capacidad = capacidadMensual(usuarios);

              return (
                <Link
                  key={hub.id}
                  href={`/hubs/${hub.slug}`}
                  className="group rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 transition hover:-translate-y-0.5 hover:border-[#22C7E8]/50 hover:bg-white/[0.08]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#22C7E8]">
                    Hub operativo
                  </p>

                  <h3 className="mt-2 text-2xl font-black">{hub.nombre}</h3>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                        Tipo de Hub
                      </p>
                      <p className="mt-1 text-lg font-black text-white">{tipoDeHub(hub.rama)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[#22C7E8]/20 bg-[#22C7E8]/10 p-3">
                        <p className="text-2xl font-black text-[#22C7E8]">{usuarios}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">
                          usuarios
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#22C7E8]/20 bg-[#22C7E8]/10 p-3">
                        <p className="text-2xl font-black text-[#22C7E8]">{capacidad.docenasHuevos}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">
                          docenas/mes
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#1E8F4D]/20 bg-[#1E8F4D]/10 p-3">
                        <p className="text-2xl font-black text-[#7EE7A8]">{capacidad.verduras}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">
                          verduras/mes
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                        Mantenimiento verde mensual
                      </p>
                      <p className="mt-1 text-3xl font-black text-[#22C7E8]">
                        {capacidad.horasMantenimiento} hs
                      </p>
                    </div>
                  </div>

                  <span className="mt-5 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06110D] transition group-hover:bg-[#22C7E8]">
                    Ver Hub →
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.7rem] border border-[#22C7E8]/20 bg-[#22C7E8]/10 p-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22C7E8]">
              Capacidad mensual total
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-4xl font-black text-[#22C7E8]">{capacidadTotal.docenasHuevos}</p>
                <p className="mt-1 text-sm font-black text-white/58">docenas de huevos mensuales</p>
              </div>
              <div>
                <p className="text-4xl font-black text-[#7EE7A8]">{capacidadTotal.verduras}</p>
                <p className="mt-1 text-sm font-black text-white/58">verduras mensuales</p>
              </div>
              <div>
                <p className="text-4xl font-black text-[#22C7E8]">{capacidadTotal.horasMantenimiento} hs</p>
                <p className="mt-1 text-sm font-black text-white/58">mantenimiento verde mensual</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-7 text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22C7E8]">
            Contacto
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            contact@hubya.tech
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/58">
            HUBYA · Salta, Argentina · Sheridan, Wyoming, United States.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="mailto:contact@hubya.tech" className="inline-flex rounded-2xl bg-[#22C7E8] px-5 py-3 text-sm font-black text-[#06110D]">
              Escribir
            </a>
            <Link href="/operativo" className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#06110D]">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
