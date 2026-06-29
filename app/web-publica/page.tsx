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

const hubProfiles = [
  {
    match: "tipal",
    rubro: "Espacios verdes / coordinación operativa",
    usuarios: 24,
    potencial: "Alto",
    estado: "Operativo",
  },
  {
    match: "praderas",
    rubro: "Organización de demanda barrial",
    usuarios: 18,
    potencial: "Medio/Alto",
    estado: "Operativo",
  },
  {
    match: "prado",
    rubro: "Servicios coordinados",
    usuarios: 15,
    potencial: "Alto",
    estado: "Operativo",
  },
  {
    match: "punto",
    rubro: "Hub en formación",
    usuarios: 9,
    potencial: "Medio",
    estado: "En crecimiento",
  },
] as const;

function perfilHub(nombre: string, usuariosReales: number, rama: string) {
  const normalizado = nombre.toLowerCase();
  const perfil = hubProfiles.find((item) => normalizado.includes(item.match));

  return {
    rubro: perfil?.rubro || tipoDeHub(rama),
    usuarios: perfil?.usuarios || usuariosReales,
    potencial: perfil?.potencial || (usuariosReales >= 15 ? "Alto" : usuariosReales >= 8 ? "Medio/Alto" : "Medio"),
    estado: perfil?.estado || (usuariosReales >= 8 ? "Operativo" : "En formación"),
  };
}

function estadoClasses(estado: string) {
  if (estado === "Operativo") return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  if (estado === "En crecimiento") return "border-sky-300/25 bg-sky-400/10 text-sky-100";
  return "border-violet-300/25 bg-violet-400/10 text-violet-100";
}

function BarrioHubGraphic() {
  const casas = [
    { id: "a", x: 42, y: 92, w: 46, h: 36, roof: "34 92 65 66 96 92", hub: true, label: "Tipal" },
    { id: "b", x: 135, y: 52, w: 48, h: 38, roof: "126 52 159 25 192 52", hub: false },
    { id: "c", x: 245, y: 82, w: 52, h: 40, roof: "236 82 271 53 306 82", hub: true, label: "Prado" },
    { id: "d", x: 363, y: 70, w: 50, h: 38, roof: "354 70 388 42 422 70", hub: false },
    { id: "e", x: 78, y: 205, w: 52, h: 40, roof: "69 205 104 176 139 205", hub: true, label: "Praderas" },
    { id: "f", x: 192, y: 216, w: 48, h: 38, roof: "183 216 216 189 249 216", hub: false },
    { id: "g", x: 324, y: 211, w: 54, h: 42, roof: "314 211 351 181 388 211", hub: true, label: "Punto" },
    { id: "h", x: 44, y: 333, w: 50, h: 38, roof: "35 333 69 305 103 333", hub: false },
    { id: "i", x: 157, y: 324, w: 52, h: 40, roof: "148 324 183 295 218 324", hub: true, label: "Nuevo" },
    { id: "j", x: 286, y: 334, w: 50, h: 38, roof: "277 334 311 306 345 334", hub: false },
    { id: "k", x: 383, y: 314, w: 48, h: 38, roof: "374 314 407 287 440 314", hub: true, label: "Oferta" },
  ];

  const hubHouses = casas.filter((casa) => casa.hub);
  const center = { x: 236, y: 202 };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-[#070817]/90 p-3 shadow-2xl shadow-violet-950/50 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,85,247,0.28),transparent_31%),radial-gradient(circle_at_22%_18%,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_84%_84%,rgba(99,102,241,0.18),transparent_28%)]" />
      <svg viewBox="0 0 480 430" role="img" aria-labelledby="barrioHubTitle barrioHubDesc" className="relative z-10 h-auto w-full">
        <title id="barrioHubTitle">Barrio con casas conectadas que forman un Hub HUBYA</title>
        <desc id="barrioHubDesc">Muchas casas componen el barrio, pero solo algunas están iluminadas y conectadas al núcleo HUBYA.</desc>
        <defs>
          <linearGradient id="hubLine" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
          <linearGradient id="hubHouse" x1="0" x2="1"><stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#ddd6fe" /></linearGradient>
          <filter id="hubGlow" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g fill="none" strokeLinecap="round">
          <path d="M24 154 C102 126 178 160 246 134 C322 105 390 122 456 92" stroke="#1e1b4b" strokeWidth="17" opacity="0.62" />
          <path d="M32 286 C105 255 165 283 239 252 C318 218 376 240 452 204" stroke="#1e1b4b" strokeWidth="17" opacity="0.7" />
          <path d="M26 382 C100 356 171 385 244 356 C318 326 382 341 452 309" stroke="#111827" strokeWidth="14" opacity="0.72" />
          <path d="M118 34 C127 111 117 210 100 390" stroke="#111827" strokeWidth="12" opacity="0.62" />
          <path d="M342 38 C329 126 350 226 323 390" stroke="#111827" strokeWidth="12" opacity="0.62" />
        </g>
        <g stroke="url(#hubLine)" strokeWidth="3" strokeLinecap="round" opacity="0.92" filter="url(#hubGlow)">
          {hubHouses.map((casa) => <line key={casa.id} x1={casa.x + casa.w / 2} y1={casa.y + 20} x2={center.x} y2={center.y} />)}
          <path d="M65 110 C112 155 170 172 236 202 C280 222 328 225 351 232" fill="none" opacity="0.38" />
        </g>
        {casas.map((casa) => (
          <g key={casa.id} className={casa.hub ? undefined : "opacity-35"} filter={casa.hub ? "url(#hubGlow)" : undefined}>
            <polygon points={casa.roof} fill={casa.hub ? "#7c3aed" : "#334155"} stroke={casa.hub ? "#ddd6fe" : "#64748b"} strokeWidth="2" />
            <rect x={casa.x} y={casa.y} width={casa.w} height={casa.h} rx="8" fill={casa.hub ? "url(#hubHouse)" : "#94a3b8"} />
            <rect x={casa.x + 8} y={casa.y + 13} width="10" height="10" rx="2" fill={casa.hub ? "#312e81" : "#475569"} />
            <rect x={casa.x + casa.w - 20} y={casa.y + 13} width="10" height="10" rx="2" fill={casa.hub ? "#1d4ed8" : "#475569"} />
            <rect x={casa.x + casa.w / 2 - 5} y={casa.y + 20} width="10" height="18" rx="3" fill={casa.hub ? "#6d28d9" : "#475569"} />
            {casa.hub ? <circle cx={casa.x + casa.w / 2} cy={casa.y + 20} r="5" fill="#c4b5fd" /> : null}
          </g>
        ))}
        <g filter="url(#hubGlow)">
          <circle cx={center.x} cy={center.y} r="70" fill="#0f1026" stroke="#a855f7" strokeWidth="3" />
          <circle cx={center.x} cy={center.y} r="50" fill="#2e1065" stroke="#38bdf8" strokeWidth="2" />
          <text x={center.x} y="199" textAnchor="middle" fill="#ffffff" fontSize="40" fontWeight="900" fontFamily="Arial, sans-serif">H</text>
          <text x={center.x} y="226" textAnchor="middle" fill="#ddd6fe" fontSize="17" fontWeight="900" letterSpacing="3" fontFamily="Arial, sans-serif">HUBYA</text>
        </g>
        <g fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#e9d5ff">
          <text x="292" y="34">casas fuera del Hub</text>
          <text x="38" y="405">casas conectadas = potencial agrupado</text>
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
              const perfil = perfilHub(hub.nombre, hub.clientesActivos, hub.rama);
              const capacidad = capacidadMensual(perfil.usuarios);

              return (
                <Link key={hub.id} href={`/hubs/${hub.slug}`} className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/[0.08]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-fuchsia-300 to-sky-300 opacity-80" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Hub público</p>
                      <h3 className="mt-2 text-2xl font-black">{hub.nombre}</h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${estadoClasses(perfil.estado)}`}>{perfil.estado}</span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Rubro</p>
                    <p className="mt-1 text-base font-black text-white">{perfil.rubro}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
                      <p className="text-3xl font-black text-violet-100">{perfil.usuarios}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">usuarios</p>
                    </div>
                    <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4">
                      <p className="text-xl font-black text-sky-100">{perfil.potencial}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">potencial</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
                      <p className="text-2xl font-black text-fuchsia-100">{capacidad.horasMantenimiento} hs</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">trabajo / mes</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-2xl font-black text-white">P↑</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/48">potencia operativa</p>
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
