import Link from "next/link";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";
import { MembershipCheckoutButton } from "@/components/MembershipCheckoutButton";

const beneficios = [
  {
    titulo: "Tecnología HUBYA",
    texto: "Acceso a herramientas para ordenar Hubs, propuestas, comunicación y reportes.",
  },
  {
    titulo: "Organización de Hubs",
    texto: "Agrupación de demanda, oferta y personas para convertir necesidad dispersa en operación.",
  },
  {
    titulo: "Coordinación recurrente",
    texto: "Seguimiento operativo mensual para sostener comunicación, métricas y próximos pasos.",
  },
  {
    titulo: "Potencia operativa",
    texto: "P = W / t: agrupamos potencial y lo transformamos en trabajo coordinado en menos tiempo.",
  },
];

export default function MembresiaPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05030b] px-5 py-5 text-white sm:px-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(30,64,175,0.24),transparent_30%),linear-gradient(135deg,#05030b_0%,#0f1026_48%,#030712_100%)]" />

      <section className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="HUBYA web pública">
            <HubyaBrandLogo markOnly className="h-11 w-11" />
            <div>
              <p className="text-sm font-black tracking-[0.22em] text-violet-200">HUBYA</p>
              <p className="text-xs font-bold text-white/55">HUB = agrupación de potencial</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-white/70 md:flex" aria-label="Navegación pública membresía">
            <Link href="/#hubs" className="transition hover:text-violet-200">Hubs</Link>
            <Link href="/#concepto" className="transition hover:text-violet-200">Concepto</Link>
            <Link href="/#contacto" className="transition hover:text-violet-200">Contacto</Link>
          </nav>

          <Link href="/" className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-black text-violet-100 transition hover:bg-violet-400/20">
            Volver
          </Link>
        </header>

        <section className="grid items-center gap-8 py-12 lg:grid-cols-[1fr_0.78fr] lg:py-16">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-2xl shadow-black/20 sm:p-9">
            <div className="flex items-center gap-4">
              <HubyaBrandLogo markOnly className="h-16 w-16" />
              <p className="inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-violet-200">
                Membresía HUBYA
              </p>
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-tight sm:text-7xl">
              Tecnología para que el Hub <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">opere.</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/70">
              La membresía da acceso a tecnología HUBYA para organización de Hubs, propuestas, comunicación, reportes y coordinación operativa recurrente.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {beneficios.map((beneficio, index) => (
                <article key={beneficio.titulo} className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-sm font-black text-violet-200">0{index + 1}</p>
                  <h2 className="mt-3 text-xl font-black">{beneficio.titulo}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/58">{beneficio.texto}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-[#080914]/85 p-7 shadow-2xl shadow-violet-950/40 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(168,85,247,0.28),transparent_35%),radial-gradient(circle_at_82%_84%,rgba(56,189,248,0.16),transparent_30%)]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Plan mensual</p>
              <div className="mt-5 rounded-3xl border border-violet-300/20 bg-violet-500/10 p-6">
                <p className="text-6xl font-black text-violet-100">US$ 7</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/55">por mes</p>
              </div>

              <p className="mt-6 text-sm font-semibold leading-7 text-white/65">
                En HUBYA, agrupamos potencial y lo transformamos en potencia operativa: más trabajo coordinado en menos tiempo.
              </p>

              <MembershipCheckoutButton />

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Producto Stripe</p>
                <p className="mt-2 break-all text-sm font-bold text-white/70">price_1TnQP0Csi5bFeeBgKj7OsG2X</p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-semibold leading-7 text-white/58">
                  Cobrado por HUBYA LLC · Sheridan, Wyoming, United States. Contacto: contact@hubya.tech
                </p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
