export const dynamic = "force-dynamic";

import Link from "next/link";
import { HubyaLogo } from "@/components/HubyaLogo";
import { getHubs } from "@/lib/data/hubs";

const ideas = [
  {
    titulo: "Buscamos demanda",
    texto: "Encontramos necesidades reales que aparecen dispersas en barrios, personas, instituciones y empresas.",
  },
  {
    titulo: "Buscamos oferta",
    texto: "Mapeamos capacidades, prestadores, proveedores y equipos que pueden resolver esas necesidades.",
  },
  {
    titulo: "Agrupamos personas",
    texto: "Una casa sola tiene una necesidad. Varias casas conectadas tienen potencial agrupado.",
  },
  {
    titulo: "Generamos tecnología",
    texto: "Ordenamos comunicación, membresías, capacidad y operación para que cada Hub pueda funcionar.",
  },
];

const membresia = [
  "Acceso a una comunidad organizada por necesidad y territorio.",
  "Participación en Hubs que agrupan demanda, oferta y capacidad.",
  "Comunicación operativa para convertir intención en acción concreta.",
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

  return rama || "Hub público";
}

function capacidadMensual(usuarios: number) {
  return {
    docenasHuevos: usuarios * 4,
    verduras: usuarios * 2,
    horasMantenimiento: usuarios * 2,
  };
}

function BarrioHubGraphic() {
  const casas = [
    { x: 70, y: 88, w: 54, h: 42, roof: "62 88 97 58 132 88" },
    { x: 176, y: 58, w: 60, h: 46, roof: "166 58 206 24 246 58" },
    { x: 302, y: 92, w: 58, h: 44, roof: "292 92 331 60 370 92" },
    { x: 92, y: 260, w: 62, h: 48, roof: "82 260 123 224 164 260" },
    { x: 318, y: 262, w: 64, h: 48, roof: "308 262 350 226 392 262" },
    { x: 210, y: 330, w: 58, h: 44, roof: "200 330 239 298 278 330" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-[#080914]/80 p-3 shadow-2xl shadow-violet-950/50 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_28%)]" />
      <svg viewBox="0 0 460 430" role="img" aria-labelledby="barrioHubTitle" className="relative z-10 h-auto w-full">
        <title id="barrioHubTitle">Barrio de casas conectadas a un núcleo central HUBYA</title>
        <defs>
          <linearGradient id="hubLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d="M48 358 C112 324 154 354 214 326 C286 292 336 322 414 284" fill="none" stroke="#1e1b4b" strokeWidth="18" strokeLinecap="round" opacity="0.65" />
        <path d="M62 104 C120 138 156 118 214 166 C270 212 328 178 394 116" fill="none" stroke="#1e1b4b" strokeWidth="16" strokeLinecap="round" opacity="0.55" />

        <g stroke="url(#hubLine)" strokeWidth="3" strokeLinecap="round" opacity="0.88" filter="url(#glow)">
          <line x1="97" y1="109" x2="230" y2="206" />
          <line x1="206" y1="82" x2="230" y2="206" />
          <line x1="331" y1="114" x2="230" y2="206" />
          <line x1="123" y1="286" x2="230" y2="206" />
          <line x1="350" y1="288" x2="230" y2="206" />
          <line x1="239" y1="354" x2="230" y2="206" />
          <line x1="97" y1="109" x2="206" y2="82" opacity="0.45" />
          <line x1="331" y1="114" x2="350" y2="288" opacity="0.45" />
          <line x1="123" y1="286" x2="239" y2="354" opacity="0.45" />
        </g>

        {casas.map((casa) => (
          <g key={`${casa.x}-${casa.y}`}>
            <polygon points={casa.roof} fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
            <rect x={casa.x} y={casa.y} width={casa.w} height={casa.h} rx="8" fill="#f8fafc" opacity="0.95" />
            <rect x={casa.x + 10} y={casa.y + 16} width="12" height="12" rx="2" fill="#1e1b4b" opacity="0.85" />
            <rect x={casa.x + casa.w - 24} y={casa.y + 16} width="12" height="12" rx="2" fill="#312e81" opacity="0.85" />
            <rect x={casa.x + casa.w / 2 - 6} y={casa.y + 22} width="12" height="20" rx="3" fill="#6d28d9" />
          </g>
        ))}

        <g filter="url(#glow)">
          <circle cx="230" cy="206" r="72" fill="#111827" stroke="#a855f7" strokeWidth="3" />
          <circle cx="230" cy="206" r="54" fill="#2e1065" stroke="#38bdf8" strokeWidth="2" opacity="0.95" />
          <text x="230" y="202" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="900" fontFamily="Arial, sans-serif">H</text>
          <text x="230" y="229" textAnchor="middle" fill="#c4b5fd" fontSize="18" fontWeight="900" letterSpacing="3" fontFamily="Arial, sans-serif">HUBYA</text>
        </g>

        <g fill="#c4b5fd">
          <circle cx="97" cy="109" r="5" />
          <circle cx="206" cy="82" r="5" />
          <circle cx="331" cy="114" r="5" />
          <circle cx="123" cy="286" r="5" />
          <circle cx="350" cy="288" r="5" />
          <circle cx="239" cy="354" r="5" />
        </g>
      </svg>
    </div>
  );
}

export default async function WebPublicaPage() {
  const hubs = (await getHubs()).filter((hub) => hub.activo !== false);
  const totalUsuarios = hubs.reduce((acc, hub) => acc + hub.clientesActivos, 0);
  const capacidadTotal = capacidadMensual(totalUsuarios);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05030b] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(30,64,175,0.24),transparent_30%),linear-gradient(135deg,#05030b_0%,#0f1026_48%,#030712_100%)]" />

      <section className="px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-3" aria-label="HUBYA web pública">
              <HubyaLogo className="h-10 w-auto" />
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
              <p className="inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-violet-200">
                HUB = agrupación de potencial
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
                Agrupamos <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">potencial.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/70">
                Buscamos demanda, buscamos oferta, agrupamos personas y generamos tecnología para que los Hubs se comuniquen, se ordenen y puedan operar.
              </p>

              <div className="mt-8 grid max-w-xl gap-3 rounded-[1.5rem] border border-violet-300/20 bg-white/[0.05] p-5 shadow-xl shadow-violet-950/20 sm:grid-cols-[0.55fr_1fr] sm:items-center">
                <div className="text-center sm:text-left">
                  <p className="font-mono text-4xl font-black text-violet-100">P = W / t</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-sky-200">Potencia = trabajo / tiempo</p>
                </div>
                <p className="text-sm font-semibold leading-7 text-white/65">
                  En HUBYA, agrupamos potencial y lo transformamos en potencia operativa.
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
              </div>
            </div>

            <BarrioHubGraphic />
          </section>
        </div>
      </section>

      <section id="concepto" className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Concepto</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Lo ordenamos en Hubs. Lo convertimos en potencia operativa.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-white/65">
              Una casa sola tiene una necesidad. Varias casas conectadas tienen potencial agrupado. Cuando HUBYA las organiza con tecnología, comunicación y operación, ese potencial se vuelve potencia operativa.
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

      <section id="hubs" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Hubs</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{hubs.length} Hubs activos · {totalUsuarios} personas agrupadas.</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-white/58">La web muestra capacidad mensual agrupada. Los datos privados de cada persona quedan protegidos.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => {
              const usuarios = hub.clientesActivos;
              const capacidad = capacidadMensual(usuarios);

              return (
                <Link key={hub.id} href={`/hubs/${hub.slug}`} className="group rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/[0.08]">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Hub público</p>
                  <h3 className="mt-2 text-2xl font-black">{hub.nombre}</h3>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Tipo de Hub</p>
                      <p className="mt-1 text-lg font-black text-white">{tipoDeHub(hub.rama)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3">
                        <p className="text-2xl font-black text-violet-100">{usuarios}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">personas</p>
                      </div>
                      <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-3">
                        <p className="text-2xl font-black text-sky-100">{capacidad.docenasHuevos}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">docenas/mes</p>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-3">
                        <p className="text-2xl font-black text-fuchsia-100">{capacidad.verduras}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">verduras/mes</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Potencia mensual estimada</p>
                      <p className="mt-1 text-3xl font-black text-violet-100">{capacidad.horasMantenimiento} hs</p>
                    </div>
                  </div>

                  <span className="mt-5 inline-flex rounded-xl bg-violet-200 px-3 py-2 text-xs font-black text-[#12071f] transition group-hover:bg-white">Ver Hub →</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.7rem] border border-violet-300/20 bg-violet-500/10 p-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Capacidad mensual total</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div><p className="text-4xl font-black text-violet-100">{capacidadTotal.docenasHuevos}</p><p className="mt-1 text-sm font-black text-white/58">docenas mensuales</p></div>
              <div><p className="text-4xl font-black text-sky-100">{capacidadTotal.verduras}</p><p className="mt-1 text-sm font-black text-white/58">verduras mensuales</p></div>
              <div><p className="text-4xl font-black text-fuchsia-100">{capacidadTotal.horasMantenimiento} hs</p><p className="mt-1 text-sm font-black text-white/58">trabajo coordinado mensual</p></div>
            </div>
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

      <section id="contacto" className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-7 text-center shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Contacto</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Hablemos de tu próximo Hub.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/58">HUBYA · Salta, Argentina · Sheridan, Wyoming, United States.</p>
          <a href="mailto:contact@hubya.tech" className="mt-6 inline-flex rounded-2xl bg-violet-200 px-5 py-3 text-sm font-black text-[#12071f] transition hover:bg-white">contact@hubya.tech</a>
        </div>
      </section>
    </main>
  );
}
