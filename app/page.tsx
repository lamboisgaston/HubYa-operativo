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
  "Hora de trabajo",
  "Manejo de personal",
  "Traslado del equipo",
  "Uso de maquinaria",
];

function vecinosAgrupadosHub(hub: HubPublico) {
  return hub.vecinosAgrupados ?? hub.clientesActivos;
}

function estadoAtencionHub(hub: HubPublico) {
  return hub.responsableHub?.nombre ? `Atendido por ${hub.responsableHub.nombre}` : "Postulate para este hub";
}


function HubNeighborhoodIllustration() {
  const center = { x: 420, y: 268 };
  const activeUnits = [
    { id: "a01", x: 172, y: 126, label: "Vecinos", scale: 1.05, tone: "violet" },
    { id: "a02", x: 546, y: 126, label: "Casas", scale: 0.98, tone: "sky" },
    { id: "a03", x: 154, y: 354, label: "Unidades", scale: 0.95, tone: "fuchsia" },
    { id: "a04", x: 578, y: 386, label: "Vecinos", scale: 1.08, tone: "violet" },
    { id: "a05", x: 330, y: 430, label: "Casas", scale: 0.9, tone: "sky" },
  ];

  const dormantUnits = [
    { id: "d01", x: 290, y: 104, scale: 0.82 },
    { id: "d02", x: 424, y: 102, scale: 0.78 },
    { id: "d03", x: 674, y: 218, scale: 0.84 },
    { id: "d04", x: 636, y: 306, scale: 0.74 },
    { id: "d05", x: 470, y: 466, scale: 0.8 },
    { id: "d06", x: 238, y: 472, scale: 0.74 },
    { id: "d07", x: 86, y: 268, scale: 0.78 },
    { id: "d08", x: 106, y: 186, scale: 0.7 },
  ];

  const blocks = [
    "M92 244 L210 166 L330 236 L210 318 Z",
    "M310 156 L430 84 L552 154 L430 230 Z",
    "M496 244 L620 166 L716 224 L594 304 Z",
    "M124 366 L260 286 L374 358 L238 446 Z",
    "M414 374 L562 288 L690 364 L540 460 Z",
  ];

  function Unit({ x, y, active = false, scale = 1, label, tone = "violet" }: { x: number; y: number; active?: boolean; scale?: number; label?: string; tone?: "violet" | "sky" | "fuchsia" }) {
    const accent = tone === "sky" ? "#38bdf8" : tone === "fuchsia" ? "#f0abfc" : "#a78bfa";
    const glow = tone === "sky" ? "#0ea5e9" : tone === "fuchsia" ? "#d946ef" : "#8b5cf6";

    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={active ? 1 : 0.34}>
        <ellipse cx="0" cy="35" rx="52" ry="18" fill="#020617" opacity={active ? 0.72 : 0.48} />
        {active ? <ellipse cx="0" cy="22" rx="62" ry="34" fill={glow} opacity="0.14" filter="url(#hubHeroBlur)" /> : null}
        <path d="M-46 4 L0 -25 L47 4 L0 32 Z" fill={active ? "url(#hubHeroActiveRoof)" : "#273449"} stroke={active ? accent : "#516073"} strokeWidth="1.4" />
        <path d="M-46 4 L0 32 L0 72 L-46 44 Z" fill={active ? "url(#hubHeroActiveWallLeft)" : "#64748b"} />
        <path d="M47 4 L0 32 L0 72 L47 44 Z" fill={active ? "url(#hubHeroActiveWallRight)" : "#334155"} />
        <path d="M0 32 L0 72" stroke={active ? "#c4b5fd" : "#475569"} strokeWidth="1" opacity="0.7" />
        <rect x="-8" y="45" width="16" height="24" rx="3" fill={active ? "#16062c" : "#1e293b"} />
        <rect x="-32" y="33" width="11" height="11" rx="2" fill={active ? accent : "#0f172a"} opacity={active ? 0.95 : 0.9} />
        <rect x="21" y="33" width="11" height="11" rx="2" fill={active ? "#ffffff" : "#0f172a"} opacity={active ? 0.9 : 0.9} />
        <circle cx="0" cy="78" r={active ? 5 : 3} fill={active ? accent : "#64748b"} />
        {label ? (
          <g transform="translate(0 104)">
            <rect x="-48" y="-13" width="96" height="26" rx="13" fill="#030712" opacity="0.74" stroke={accent} strokeOpacity="0.42" />
            <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="10" fontWeight="900" letterSpacing="1.4">{label.toUpperCase()}</text>
          </g>
        ) : null}
      </g>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2.75rem] border border-violet-200/15 bg-[#030611] p-3 shadow-2xl shadow-violet-950/50 ring-1 ring-white/10 sm:p-5">
      <div className="absolute -inset-16 bg-[radial-gradient(circle_at_50%_42%,rgba(124,58,237,0.35),transparent_26%),radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.20),transparent_22%),radial-gradient(circle_at_84%_72%,rgba(217,70,239,0.18),transparent_24%),linear-gradient(145deg,#08111f,#05030b_58%,#020617)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(2,6,23,0.86)_88%)]" />

      <svg viewBox="0 0 760 560" role="img" aria-labelledby="hubHeroTitle hubHeroDesc" className="relative z-10 h-auto w-full">
        <title id="hubHeroTitle">Vecinos agrupados para contratar servicios con HUBYA</title>
        <desc id="hubHeroDesc">Visualización tecnológica de vecinos conectados a un hub central que coordina contratación de servicios y operación.</desc>
        <defs>
          <linearGradient id="hubHeroPlate" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#17203a" /><stop offset="52%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
          <linearGradient id="hubHeroRoad" x1="0" x2="1"><stop offset="0%" stopColor="#111827" /><stop offset="100%" stopColor="#020617" /></linearGradient>
          <linearGradient id="hubHeroLine" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f5d0fe" /><stop offset="45%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
          <linearGradient id="hubHeroActiveRoof" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f5d0fe" /><stop offset="42%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#312e81" /></linearGradient>
          <linearGradient id="hubHeroActiveWallLeft" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#c4b5fd" /></linearGradient>
          <linearGradient id="hubHeroActiveWallRight" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ddd6fe" /><stop offset="100%" stopColor="#6d28d9" /></linearGradient>
          <filter id="hubHeroGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="hubHeroBlur" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>

        <path d="M56 280 L380 66 L704 280 L380 514 Z" fill="url(#hubHeroPlate)" stroke="#7c3aed" strokeOpacity="0.45" strokeWidth="1.5" />
        <path d="M92 280 L380 91 L668 280 L380 488 Z" fill="none" stroke="#38bdf8" strokeOpacity="0.16" strokeWidth="1.2" />
        {blocks.map((block) => <path key={block} d={block} fill="#111827" opacity="0.54" stroke="#334155" strokeOpacity="0.55" />)}
        <g fill="none" strokeLinecap="round">
          <path d="M60 280 H700 M380 70 V512 M122 196 L588 438 M212 124 L680 366 M116 376 L552 124 M220 456 L652 202" stroke="url(#hubHeroRoad)" strokeWidth="25" opacity="0.92" />
          <path d="M60 280 H700 M380 70 V512 M122 196 L588 438 M212 124 L680 366 M116 376 L552 124 M220 456 L652 202" stroke="#64748b" strokeWidth="1.4" strokeDasharray="12 18" opacity="0.44" />
        </g>

        <g stroke="url(#hubHeroLine)" strokeLinecap="round" filter="url(#hubHeroGlow)">
          {activeUnits.map((unit) => <path key={unit.id} d={`M${unit.x} ${unit.y + 78} C${(unit.x + center.x) / 2} ${unit.y + 56}, ${(unit.x + center.x) / 2} ${center.y + 38}, ${center.x} ${center.y}`} fill="none" strokeWidth="3" opacity="0.9" />)}
          <circle cx={center.x} cy={center.y} r="114" fill="none" strokeWidth="1.3" strokeDasharray="4 12" opacity="0.4" />
        </g>

        {dormantUnits.map((unit) => <Unit key={unit.id} x={unit.x} y={unit.y} scale={unit.scale} />)}
        {activeUnits.map((unit) => <Unit key={unit.id} x={unit.x} y={unit.y} scale={unit.scale} active label={unit.label} tone={unit.tone as "violet" | "sky" | "fuchsia"} />)}

        <g filter="url(#hubHeroGlow)">
          <circle cx={center.x} cy={center.y} r="84" fill="#080415" stroke="#a78bfa" strokeWidth="1.6" />
          <circle cx={center.x} cy={center.y} r="62" fill="#1f0b46" stroke="#38bdf8" strokeOpacity="0.72" strokeWidth="1.4" />
          <path d="M420 202 L476 235 L476 300 L420 334 L364 300 L364 235 Z" fill="#6d28d9" stroke="#f5d0fe" strokeWidth="1.4" />
          <text x={center.x} y={center.y + 12} textAnchor="middle" fill="#ffffff" fontSize="48" fontWeight="900" fontFamily="Arial, sans-serif">H</text>
          <text x={center.x} y={center.y + 58} textAnchor="middle" fill="#ddd6fe" fontSize="13" fontWeight="900" letterSpacing="4" fontFamily="Arial, sans-serif">HUBYA</text>
        </g>

        <g filter="url(#hubHeroGlow)">
          <path d="M606 252 h78 a18 18 0 0 1 18 18 v38 h-114 v-38 a18 18 0 0 1 18-18Z" fill="#020617" stroke="#38bdf8" strokeOpacity="0.58" />
          <path d="M610 244 h50 l20 18 h-70Z" fill="#0f172a" stroke="#a78bfa" strokeOpacity="0.55" />
          <circle cx="618" cy="316" r="10" fill="#111827" stroke="#f8fafc" strokeOpacity="0.72" />
          <circle cx="674" cy="316" r="10" fill="#111827" stroke="#f8fafc" strokeOpacity="0.72" />
          <text x="645" y="287" textAnchor="middle" fill="#e0f2fe" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif">SERVICIO</text>
          <path d="M588 306 C546 308, 506 298, 476 282" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="8 10" opacity="0.78" />
        </g>

        <g fontFamily="Arial, sans-serif">
          <g transform="translate(38 36)">
            <rect width="258" height="64" rx="22" fill="#020617" opacity="0.72" stroke="#8b5cf6" strokeOpacity="0.35" />
            <text x="20" y="27" fill="#f5d0fe" fontSize="12" fontWeight="900" letterSpacing="2.3">VECINOS AGRUPADOS</text>
            <text x="20" y="48" fill="#94a3b8" fontSize="11" fontWeight="700">casas conectadas · hub central · servicios</text>
          </g>
          <g transform="translate(548 40)">
            <rect width="154" height="52" rx="20" fill="#020617" opacity="0.7" stroke="#38bdf8" strokeOpacity="0.28" />
            <text x="22" y="24" fill="#e0f2fe" fontSize="11" fontWeight="900" letterSpacing="1.7">SERVICIOS</text>
            <text x="22" y="40" fill="#c4b5fd" fontSize="9" fontWeight="800" letterSpacing="1.2">COORDINADOS</text>
          </g>
        </g>
      </svg>
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
                HUBYA agrupa vecinos, clientes o unidades de demanda para contratar servicios de forma organizada. Un hub permite que varias personas de una misma zona coordinen equipos, tareas y operación sin quedar solas frente al servicio.
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

            <HubNeighborhoodIllustration />
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
