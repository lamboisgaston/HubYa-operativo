export const dynamic = "force-dynamic";

import Link from "next/link";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";
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

function HubNeighborhoodIllustration() {
  const homes = [
    { id: "northwest", x: 86, y: 108, accent: "#a78bfa", hub: true, size: 1.02, label: "demanda", rotation: -7 },
    { id: "north", x: 198, y: 70, accent: "#64748b", hub: false, size: 0.86, rotation: 5 },
    { id: "northeast", x: 318, y: 105, accent: "#c084fc", hub: true, size: 0.96, label: "oferta", rotation: 8 },
    { id: "east", x: 395, y: 190, accent: "#475569", hub: false, size: 0.9, rotation: -5 },
    { id: "southeast", x: 322, y: 314, accent: "#f0abfc", hub: true, size: 1.06, label: "operación", rotation: -2 },
    { id: "south", x: 204, y: 356, accent: "#64748b", hub: false, size: 0.92, rotation: 7 },
    { id: "southwest", x: 92, y: 300, accent: "#8b5cf6", hub: true, size: 0.98, label: "capacidad", rotation: 4 },
    { id: "west", x: 48, y: 198, accent: "#475569", hub: false, size: 0.84, rotation: -7 },
    { id: "inner-west", x: 150, y: 220, accent: "#ddd6fe", hub: true, size: 0.86, label: "hub", rotation: -3 },
    { id: "inner-east", x: 304, y: 220, accent: "#334155", hub: false, size: 0.82, rotation: 3 },
    { id: "far-northwest", x: 132, y: 52, accent: "#334155", hub: false, size: 0.68, rotation: -5 },
    { id: "far-southeast", x: 382, y: 278, accent: "#475569", hub: false, size: 0.72, rotation: 5 },
  ];

  const hubHomes = homes.filter((home) => home.hub);
  const center = { x: 240, y: 218 };

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-violet-200/15 bg-[#050816]/95 p-3 shadow-2xl shadow-violet-950/45 ring-1 ring-white/5 sm:p-5">
      <div className="absolute -inset-10 bg-[radial-gradient(circle_at_46%_48%,rgba(124,58,237,0.34),transparent_29%),radial-gradient(circle_at_22%_18%,rgba(56,189,248,0.18),transparent_25%),radial-gradient(circle_at_84%_78%,rgba(217,70,239,0.16),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.72),rgba(3,7,18,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,3,11,0.72)_82%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(167,139,250,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

      <svg viewBox="0 0 480 430" role="img" aria-labelledby="hubNeighborhoodTitle hubNeighborhoodDesc" className="relative z-10 h-auto w-full drop-shadow-2xl">
        <title id="hubNeighborhoodTitle">Barrio tecnológico conectado por HUBYA</title>
        <desc id="hubNeighborhoodDesc">Un barrio en perspectiva isométrica donde algunas casas iluminadas se conectan con el núcleo operativo HUBYA y otras permanecen apagadas.</desc>
        <defs>
          <linearGradient id="districtBase" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#18203a" /><stop offset="48%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
          <linearGradient id="activeLine" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f5d0fe" /><stop offset="48%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
          <linearGradient id="activeRoof" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f5d0fe" /><stop offset="45%" stopColor="#a855f7" /><stop offset="100%" stopColor="#4c1d95" /></linearGradient>
          <linearGradient id="activeWallLeft" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#c4b5fd" /></linearGradient>
          <linearGradient id="activeWallRight" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ddd6fe" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="violetAura" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <g opacity="0.96">
          <path d="M36 226 L240 42 L444 226 L240 408 Z" fill="url(#districtBase)" stroke="#4c1d95" strokeWidth="1.4" />
          <path d="M62 226 L240 66 L418 226 L240 386 Z" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.28" />
          <path d="M36 226 H444 M240 42 V408 M96 172 L306 360 M174 102 L384 290 M96 280 L306 92 M174 352 L384 164" fill="none" stroke="#050816" strokeWidth="15" strokeLinecap="round" opacity="0.78" />
          <path d="M36 226 H444 M240 42 V408 M96 172 L306 360 M174 102 L384 290 M96 280 L306 92 M174 352 L384 164" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 14" opacity="0.48" />
          <path d="M72 228 C118 197 160 184 206 190 C282 200 312 176 392 140" fill="none" stroke="#7c3aed" strokeWidth="1.1" opacity="0.24" />
          <path d="M86 306 C144 276 193 272 242 288 C288 304 330 302 394 270" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.18" />
        </g>

        <g stroke="url(#activeLine)" strokeLinecap="round" filter="url(#softGlow)">
          {hubHomes.map((home) => (
            <path key={home.id} d={`M${home.x} ${home.y + 14} C${(home.x + center.x) / 2} ${home.y}, ${(home.x + center.x) / 2} ${center.y + 26}, ${center.x} ${center.y}`} fill="none" strokeWidth="2.5" opacity="0.86" />
          ))}
          <circle cx={center.x} cy={center.y} r="92" fill="none" strokeWidth="1" strokeDasharray="3 10" opacity="0.34" />
        </g>

        <g>
          {homes.map((home) => {
            const width = 58 * home.size;
            const height = 36 * home.size;
            const roofHeight = 25 * home.size;
            const x = home.x - width / 2;
            const y = home.y - height / 2;
            const active = home.hub;

            return (
              <g key={home.id} opacity={active ? 1 : 0.3} filter={active ? "url(#softGlow)" : undefined} transform={`rotate(${home.rotation} ${home.x} ${home.y})`}>
                <ellipse cx={home.x} cy={y + height + 13} rx={width * 0.72} ry="11" fill="#020617" opacity={active ? 0.58 : 0.44} />
                {active ? <ellipse cx={home.x} cy={home.y + 13} rx={width * 0.86} ry="21" fill={home.accent} opacity="0.12" /> : null}
                <path d={`M${home.x} ${y - roofHeight} L${x + width} ${y} L${home.x} ${y + roofHeight * 0.74} L${x} ${y} Z`} fill={active ? "url(#activeRoof)" : "#334155"} stroke={active ? "#f5d0fe" : "#64748b"} strokeWidth="1.35" />
                <path d={`M${x} ${y} L${home.x} ${y + roofHeight * 0.74} L${home.x} ${y + height} L${x} ${y + height - roofHeight * 0.74} Z`} fill={active ? "url(#activeWallLeft)" : "#94a3b8"} />
                <path d={`M${x + width} ${y} L${home.x} ${y + roofHeight * 0.74} L${home.x} ${y + height} L${x + width} ${y + height - roofHeight * 0.74} Z`} fill={active ? "url(#activeWallRight)" : "#64748b"} />
                <path d={`M${home.x} ${y + roofHeight * 0.74} L${home.x} ${y + height}`} stroke={active ? "#7c3aed" : "#475569"} strokeWidth="1" opacity="0.65" />
                <rect x={home.x - 6 * home.size} y={y + height - 20 * home.size} width={12 * home.size} height={17 * home.size} rx="2" fill={active ? "#4c1d95" : "#334155"} />
                <rect x={x + width * 0.18} y={y + height - 25 * home.size} width={8 * home.size} height={8 * home.size} rx="1.5" fill={active ? "#38bdf8" : "#1e293b"} opacity={active ? 0.95 : 0.65} />
                <rect x={x + width * 0.68} y={y + height - 25 * home.size} width={8 * home.size} height={8 * home.size} rx="1.5" fill={active ? "#f0abfc" : "#1e293b"} opacity={active ? 0.92 : 0.65} />
                <circle cx={home.x} cy={home.y + 14} r={active ? 4.8 : 2.8} fill={active ? home.accent : "#64748b"} />
                {home.label ? <text x={home.x} y={y + height + 31} textAnchor="middle" fill="#f5d0fe" fontSize="9" fontWeight="900" letterSpacing="1.3" opacity="0.84">{home.label.toUpperCase()}</text> : null}
              </g>
            );
          })}
        </g>

        <g filter="url(#violetAura)">
          <circle cx={center.x} cy={center.y} r="70" fill="#140a2e" stroke="#8b5cf6" strokeWidth="1.8" opacity="0.9" />
          <circle cx={center.x} cy={center.y} r="54" fill="#24104f" stroke="#38bdf8" strokeWidth="1.3" opacity="0.92" />
          <path d="M240 170 L282 194 L282 242 L240 266 L198 242 L198 194 Z" fill="#6d28d9" opacity="0.9" stroke="#f5d0fe" strokeWidth="1.2" />
          <text x={center.x} y={center.y + 9} textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="900" fontFamily="Arial, sans-serif">H</text>
          <text x={center.x} y={center.y + 48} textAnchor="middle" fill="#ddd6fe" fontSize="12" fontWeight="900" letterSpacing="3.2" fontFamily="Arial, sans-serif">HUBYA</text>
        </g>

        <g fontFamily="Arial, sans-serif">
          <text x="32" y="37" fill="#e9d5ff" fontSize="12" fontWeight="900" letterSpacing="2.6">AGRUPAMOS POTENCIAL</text>
          <text x="32" y="58" fill="#94a3b8" fontSize="11" fontWeight="700">casas apagadas + casas iluminadas → núcleo operativo</text>
          <g transform="translate(314 30)">
            <rect width="132" height="42" rx="16" fill="#020617" opacity="0.68" stroke="#8b5cf6" />
            <circle cx="19" cy="21" r="5" fill="#a78bfa" />
            <circle cx="19" cy="21" r="12" fill="#a78bfa" opacity="0.13" />
            <text x="34" y="25" fill="#f5d0fe" fontSize="10" fontWeight="900" letterSpacing="1.7">HUB ACTIVO</text>
          </g>
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

            <HubNeighborhoodIllustration />
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
                  <div className="absolute -right-8 -top-8 opacity-[0.09] transition group-hover:opacity-[0.16]">
                    <HubyaBrandLogo markOnly className="h-32 w-32" />
                  </div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Hub público</p>
                      <h3 className="mt-2 text-2xl font-black">{hub.nombre}</h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${estadoClasses(perfil.estado)}`}>{perfil.estado}</span>
                  </div>

                  <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
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
